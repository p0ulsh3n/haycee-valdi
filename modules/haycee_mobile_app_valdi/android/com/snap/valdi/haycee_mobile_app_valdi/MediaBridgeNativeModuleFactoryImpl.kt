package com.snap.valdi.haycee_mobile_app_valdi

import android.Manifest
import android.content.ContentUris
import android.content.Context
import android.content.pm.PackageManager
import android.database.Cursor
import android.graphics.BitmapFactory
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Size
import android.view.inputmethod.InputMethodManager
import com.snap.valdi.modules.RegisterValdiModule
import com.snap.valdi.promise.Promise
import com.snap.valdi.promise.ResolvablePromise
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import kotlin.math.sqrt

@RegisterValdiModule
class MediaBridgeNativeModuleFactoryImpl : MediaBridgeNativeModuleFactory() {
    override fun onLoadModule(): MediaBridgeNativeModule = object : MediaBridgeNativeModule {
        override fun loadGallery(): Promise<String> {
            val promise = ResolvablePromise<String>()
            PermissionRequest.launch(MediaPermissionActivity.KIND_MEDIA) { granted ->
                if (!granted) {
                    promise.fulfillFailure(SecurityException("Photo and video access was not granted"))
                } else {
                    io.execute {
                        runCatching { galleryPayload(null, 0, PAGE_SIZE, includeAlbums = true) }
                            .onSuccess(promise::fulfillSuccess)
                            .onFailure(promise::fulfillFailure)
                    }
                }
            }
            return promise
        }

        override fun loadGalleryPage(albumId: String, offset: Double, limit: Double): Promise<String> {
            val promise = ResolvablePromise<String>()
            io.execute {
                runCatching { galleryPayload(albumId, offset.toInt().coerceAtLeast(0), limit.toInt().coerceIn(1, 100), includeAlbums = false) }
                    .onSuccess(promise::fulfillSuccess)
                    .onFailure(promise::fulfillFailure)
            }
            return promise
        }

        override fun loadMediaThumbnail(contentUri: String, kind: String): Promise<String> {
            val promise = ResolvablePromise<String>()
            thumbnailIo.execute {
                runCatching { createThumbnail(requireContext(), Uri.parse(contentUri), kind) }
                    .onSuccess { promise.fulfillSuccess(Uri.fromFile(it).toString()) }
                    .onFailure(promise::fulfillFailure)
            }
            return promise
        }

        override fun copyMediaToCache(contentUri: String): Promise<String> {
            val promise = ResolvablePromise<String>()
            io.execute {
                runCatching { copyContentUri(contentUri) }
                    .onSuccess(promise::fulfillSuccess)
                    .onFailure(promise::fulfillFailure)
            }
            return promise
        }

        override fun hideKeyboard(): Promise<Boolean> {
            val promise = ResolvablePromise<Boolean>()
            val activity = HayceeValdiApplication.foregroundActivity?.get()
            if (activity == null) {
                promise.fulfillSuccess(false)
                return promise
            }
            activity.runOnUiThread {
                val focusedView = activity.currentFocus
                val token = focusedView?.windowToken ?: activity.window.decorView.windowToken
                val inputMethodManager = activity.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
                if (token != null) inputMethodManager?.hideSoftInputFromWindow(token, 0)
                focusedView?.clearFocus()
                promise.fulfillSuccess(true)
            }
            return promise
        }

        override fun requestVoicePermission(): Promise<Boolean> {
            val promise = ResolvablePromise<Boolean>()
            PermissionRequest.launch(MediaPermissionActivity.KIND_AUDIO) { granted ->
                if (granted) promise.fulfillSuccess(true)
                else promise.fulfillFailure(SecurityException("Microphone access was not granted"))
            }
            return promise
        }

        override fun startVoiceRecording(): Promise<Boolean> {
            val promise = ResolvablePromise<Boolean>()
            val context = HayceeValdiApplication.instance
            if (context == null || (Build.VERSION.SDK_INT >= 23 && context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED)) {
                promise.fulfillFailure(SecurityException("Request microphone permission before recording"))
            } else runCatching { startRecorder() }
                .onSuccess { promise.fulfillSuccess(true) }
                .onFailure(promise::fulfillFailure)
            return promise
        }

        override fun finishVoiceRecording(): Promise<String> {
            val promise = ResolvablePromise<String>()
            runCatching { finishRecorder() }
                .onSuccess(promise::fulfillSuccess)
                .onFailure(promise::fulfillFailure)
            return promise
        }

        override fun cancelVoiceRecording() {
            synchronized(recorderLock) {
                runCatching { recorder?.stop() }
                runCatching { recorder?.reset() }
                runCatching { recorder?.release() }
                waveformSamplingTask?.cancel(false)
                waveformSamplingTask = null
                recorder = null
                recordingFile?.delete()
                recordingFile = null
                recordingStartedAt = 0L
                waveformSamples.clear()
            }
        }

        override fun playVoice(fileUri: String): Promise<Boolean> {
            val promise = ResolvablePromise<Boolean>()
            val context = runCatching { requireContext() }.getOrElse {
                promise.fulfillFailure(it)
                return promise
            }
            val nextPlayer = MediaPlayer()
            synchronized(playerLock) {
                runCatching { player?.release() }
                player = nextPlayer
            }
            nextPlayer.setOnPreparedListener { prepared ->
                val isCurrentPlayer = synchronized(playerLock) { player === prepared }
                if (isCurrentPlayer) {
                    runCatching { prepared.start() }
                        .onSuccess { promise.fulfillSuccess(true) }
                        .onFailure {
                            synchronized(playerLock) { if (player === prepared) player = null }
                            runCatching { prepared.release() }
                            promise.fulfillFailure(it)
                        }
                } else {
                    runCatching { prepared.release() }
                    promise.fulfillSuccess(false)
                }
            }
            nextPlayer.setOnCompletionListener { completed ->
                synchronized(playerLock) {
                    if (player === completed) player = null
                }
                runCatching { completed.release() }
            }
            nextPlayer.setOnErrorListener { failed, what, extra ->
                synchronized(playerLock) { if (player === failed) player = null }
                runCatching { failed.release() }
                promise.fulfillFailure(IllegalStateException("Voice playback failed ($what, $extra)"))
                true
            }
            runCatching {
                nextPlayer.setDataSource(context, Uri.parse(fileUri))
                nextPlayer.prepareAsync()
            }.onFailure {
                synchronized(playerLock) { if (player === nextPlayer) player = null }
                runCatching { nextPlayer.release() }
                promise.fulfillFailure(it)
            }
            return promise
        }

        override fun stopVoice() {
            synchronized(playerLock) {
                runCatching { player?.stop() }
                runCatching { player?.release() }
                player = null
            }
        }
    }

    private fun galleryPayload(albumId: String?, offset: Int, limit: Int, includeAlbums: Boolean): String {
        val context = requireContext()
        val media = queryMedia(context, albumId, offset, limit)
        val nextCount = queryMediaCount(context, albumId)
        return JSONObject().apply {
            put("albums", JSONArray().apply { if (includeAlbums) queryAlbums(context).forEach(::put) })
            put("photos", JSONArray().apply { media.forEach(::put) })
            put("hasMore", offset + media.size < nextCount)
        }.toString()
    }

    private fun queryAlbums(context: Context): List<JSONObject> {
        val bucketName = MediaStore.MediaColumns.BUCKET_DISPLAY_NAME
        val bucketId = MediaStore.MediaColumns.BUCKET_ID
        val projection = arrayOf(bucketId, bucketName)
        val result = linkedMapOf<String, JSONObject>()
        context.contentResolver.query(
            MediaStore.Files.getContentUri("external"),
            projection,
            mediaSelection(bucketId),
            mediaSelectionArgs(null),
            "${MediaStore.MediaColumns.DATE_ADDED} DESC",
        )?.use { cursor ->
            while (cursor.moveToNext()) {
                val id = cursor.stringOrEmpty(0)
                if (!result.containsKey(id)) {
                    result[id] = JSONObject().put("id", id).put("name", cursor.stringOrEmpty(1)).put("count", 0)
                }
                result[id]?.put("count", (result[id]?.optInt("count") ?: 0) + 1)
            }
        }
        val allCount = queryMediaCount(context, null)
        return listOf(JSONObject().put("id", "all").put("name", "Récents").put("count", allCount)) + result.values
    }

    private fun queryMedia(context: Context, albumId: String?, offset: Int, limit: Int): List<JSONObject> {
        val collection = MediaStore.Files.getContentUri("external")
        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.BUCKET_ID,
            MediaStore.MediaColumns.DATE_ADDED,
            MediaStore.Files.FileColumns.MEDIA_TYPE,
        )
        val result = mutableListOf<JSONObject>()
        context.contentResolver.query(collection, projection, mediaSelection(MediaStore.MediaColumns.BUCKET_ID, albumId), mediaSelectionArgs(albumId), "${MediaStore.MediaColumns.DATE_ADDED} DESC, ${MediaStore.MediaColumns._ID} DESC")?.use { cursor ->
            if (Build.VERSION.SDK_INT >= 26) cursor.moveToPosition(offset - 1)
            else repeat(offset) { if (!cursor.moveToNext()) return@use }
            var copied = 0
            while (copied < limit && cursor.moveToNext()) {
                val id = cursor.getLong(0)
                val kind = if (cursor.getInt(3) == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) "video" else "image"
                val uri = ContentUris.withAppendedId(collection, id)
                val thumbnailUri = cachedThumbnailUri(context, uri)
                result.add(JSONObject()
                    .put("id", id.toString())
                    .put("contentUri", uri.toString())
                    .put("thumbnailUri", thumbnailUri)
                    .put("albumId", cursor.stringOrEmpty(1))
                    .put("dateAdded", cursor.getLong(2))
                    .put("kind", kind))
                copied++
            }
        }
        return result
    }

    private fun mediaSelection(bucketColumn: String, albumId: String? = null): String =
        "${MediaStore.Files.FileColumns.MEDIA_TYPE} IN (?, ?)" + if (albumId.isNullOrEmpty() || albumId == "all") "" else " AND $bucketColumn = ?"

    private fun mediaSelectionArgs(albumId: String?): Array<String> =
        if (albumId.isNullOrEmpty() || albumId == "all") {
            arrayOf(MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(), MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString())
        } else {
            arrayOf(MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(), MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString(), albumId)
        }

    private fun queryMediaCount(context: Context, albumId: String?): Int {
        context.contentResolver.query(MediaStore.Files.getContentUri("external"), arrayOf(MediaStore.MediaColumns._ID), mediaSelection(MediaStore.MediaColumns.BUCKET_ID, albumId), mediaSelectionArgs(albumId), null)
            ?.use { return it.count }
        return 0
    }

    private fun cachedThumbnailUri(context: Context, source: Uri): String {
        val target = thumbnailFile(context, source)
        return if (target.isFile && target.length() > 0) Uri.fromFile(target).toString() else ""
    }

    private fun createThumbnail(context: Context, source: Uri, kind: String): File {
        val target = thumbnailFile(context, source)
        if (target.isFile && target.length() > 0) return target
        val bitmap = (if (Build.VERSION.SDK_INT >= 29) {
            runCatching { context.contentResolver.loadThumbnail(source, Size(480, 480), null) }
                .getOrElse { if (kind == "video") videoThumbnail(context, source) else imageThumbnail(context, source) }
        } else if (kind == "video") {
            videoThumbnail(context, source)
        } else {
            imageThumbnail(context, source)
        }) ?: throw IllegalStateException("Unable to create media preview")
        val preview = scaleToPreview(bitmap)
        val temporary = File(target.parentFile, "${target.name}.${System.nanoTime()}.tmp")
        try {
            FileOutputStream(temporary).use { output ->
                check(preview.compress(Bitmap.CompressFormat.PNG, 100, output)) { "Unable to encode media preview" }
                output.flush()
            }
            if (!target.exists() && !temporary.renameTo(target)) {
                throw IllegalStateException("Unable to cache media preview")
            }
            return target
        } finally {
            if (preview !== bitmap) bitmap.recycle()
            preview.recycle()
            temporary.delete()
        }
    }

    private fun thumbnailFile(context: Context, source: Uri): File {
        val dir = File(context.cacheDir, "messaging-thumbnails").apply { mkdirs() }
        val digest = MessageDigest.getInstance("SHA-256").digest(source.toString().toByteArray())
            .joinToString("") { byte -> "%02x".format(byte) }
        return File(dir, "$digest.png")
    }

    private fun scaleToPreview(bitmap: Bitmap): Bitmap {
        val largestSide = maxOf(bitmap.width, bitmap.height)
        if (largestSide <= THUMBNAIL_MAX_SIZE) return bitmap
        val scale = THUMBNAIL_MAX_SIZE.toFloat() / largestSide
        return Bitmap.createScaledBitmap(
            bitmap,
            (bitmap.width * scale).toInt().coerceAtLeast(1),
            (bitmap.height * scale).toInt().coerceAtLeast(1),
            true,
        )
    }

    private fun imageThumbnail(context: Context, source: Uri): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(source)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        val largestSide = maxOf(bounds.outWidth, bounds.outHeight)
        while (largestSide / (sample * 2) >= THUMBNAIL_MAX_SIZE) sample *= 2
        return context.contentResolver.openInputStream(source)?.use {
            BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
        }
    }

    private fun videoThumbnail(context: Context, source: Uri): Bitmap? {
        val retriever = MediaMetadataRetriever()
        return try {
            retriever.setDataSource(context, source)
            if (Build.VERSION.SDK_INT >= 27) {
                retriever.getScaledFrameAtTime(0, MediaMetadataRetriever.OPTION_CLOSEST_SYNC, THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE)
            } else {
                retriever.getFrameAtTime(0, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
            }
        } catch (error: Exception) {
            android.util.Log.w("HayceeMedia", "Unable to create video thumbnail", error)
            null
        } finally {
            runCatching { retriever.release() }
        }
    }

    private fun copyContentUri(uriString: String): String {
        val context = requireContext()
        val uri = Uri.parse(uriString)
        val mimeType = context.contentResolver.getType(uri).orEmpty()
        val extension = android.webkit.MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType)
            ?: if (mimeType.startsWith("video/")) "mp4" else "jpg"
        val destination = File(context.cacheDir, "message-media-${System.currentTimeMillis()}.$extension")
        context.contentResolver.openInputStream(uri)?.use { input ->
            FileOutputStream(destination).use { output -> input.copyTo(output) }
        } ?: throw IllegalStateException("Unable to read selected media")
        return Uri.fromFile(destination).toString()
    }

    private fun startRecorder() {
        synchronized(recorderLock) {
            check(recorder == null) { "A voice recording is already active" }
            val context = requireContext()
            val file = File(context.cacheDir, "voice-${System.currentTimeMillis()}.m4a")
            val instance = if (Build.VERSION.SDK_INT >= 31) MediaRecorder(context) else @Suppress("DEPRECATION") MediaRecorder()
            instance.setAudioSource(MediaRecorder.AudioSource.MIC)
            instance.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            instance.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            instance.setAudioSamplingRate(44100)
            instance.setAudioEncodingBitRate(96000)
            instance.setOutputFile(file.absolutePath)
            instance.prepare()
            instance.start()
            recorder = instance
            recordingFile = file
            recordingStartedAt = System.currentTimeMillis()
            waveformSamples.clear()
            waveformSamplingTask = waveformSampler.scheduleAtFixedRate({
                synchronized(recorderLock) {
                    if (recorder === instance) {
                        runCatching { instance.maxAmplitude }.onSuccess { waveformSamples.add(it) }
                    }
                }
            }, 0, WAVEFORM_SAMPLE_INTERVAL_MS, TimeUnit.MILLISECONDS)
        }
    }

    private fun finishRecorder(): String = synchronized(recorderLock) {
        val instance = recorder ?: throw IllegalStateException("No voice recording is active")
        val file = recordingFile ?: throw IllegalStateException("Recording file is unavailable")
        val duration = System.currentTimeMillis() - recordingStartedAt
        waveformSamplingTask?.cancel(false)
        waveformSamplingTask = null
        runCatching { instance.maxAmplitude }.onSuccess { waveformSamples.add(it) }
        val waveform = normalizedWaveform(waveformSamples.toList())
        try {
            instance.stop()
        } finally {
            instance.reset()
            instance.release()
            recorder = null
            recordingFile = null
            recordingStartedAt = 0L
            waveformSamples.clear()
        }
        JSONObject()
            .put("fileUri", Uri.fromFile(file).toString())
            .put("durationMillis", duration)
            .put("waveform", JSONArray().apply { waveform.forEach { put(it) } })
            .toString()
    }

    private fun normalizedWaveform(samples: List<Int>): List<Double> {
        if (samples.isEmpty()) return emptyList()
        val barPeaks = (0 until WAVEFORM_BAR_COUNT).map { barIndex ->
            if (samples.size >= WAVEFORM_BAR_COUNT) {
                val start = barIndex * samples.size / WAVEFORM_BAR_COUNT
                val end = ((barIndex + 1) * samples.size / WAVEFORM_BAR_COUNT).coerceAtLeast(start + 1)
                samples.subList(start, end.coerceAtMost(samples.size)).maxOrNull() ?: 0
            } else {
                val samplePosition = barIndex.toDouble() * (samples.size - 1) / (WAVEFORM_BAR_COUNT - 1)
                val leftIndex = samplePosition.toInt()
                val rightIndex = (leftIndex + 1).coerceAtMost(samples.lastIndex)
                val fraction = samplePosition - leftIndex
                (samples[leftIndex] * (1 - fraction) + samples[rightIndex] * fraction).toInt()
            }
        }
        val maxPeak = barPeaks.maxOrNull()?.takeIf { it > 0 } ?: return List(WAVEFORM_BAR_COUNT) { 0.0 }
        return barPeaks.map { peak -> sqrt(peak.toDouble() / maxPeak).coerceIn(0.0, 1.0) }
    }

    private fun requireContext(): Context = HayceeValdiApplication.instance
        ?: throw IllegalStateException("Android application is not ready")

    private fun Cursor.stringOrEmpty(index: Int): String = if (isNull(index)) "" else getString(index) ?: ""

    companion object {
        private const val PAGE_SIZE = 60
        private const val THUMBNAIL_MAX_SIZE = 480
        private const val WAVEFORM_SAMPLE_INTERVAL_MS = 80L
        private const val WAVEFORM_BAR_COUNT = 32
        private val io = Executors.newSingleThreadExecutor()
        private val thumbnailIo = Executors.newFixedThreadPool(3)
        private val waveformSampler = Executors.newSingleThreadScheduledExecutor()
        private val recorderLock = Any()
        private val playerLock = Any()
        private val waveformSamples = mutableListOf<Int>()
        private var waveformSamplingTask: ScheduledFuture<*>? = null
        @Volatile private var recorder: MediaRecorder? = null
        @Volatile private var player: MediaPlayer? = null
        @Volatile private var recordingFile: File? = null
        @Volatile private var recordingStartedAt = 0L
    }
}
