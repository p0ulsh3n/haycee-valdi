package com.snap.valdi.haycee_mobile_app_valdi

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle

/** Brief transparent host used only to request Android runtime permissions. */
class MediaPermissionActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val permissionKind = intent.getStringExtra(EXTRA_KIND) ?: KIND_IMAGES
        val permissions = when (permissionKind) {
            KIND_AUDIO -> arrayOf(Manifest.permission.RECORD_AUDIO)
            else -> mediaPermissions()
        }
        val needed = permissions.filter {
            Build.VERSION.SDK_INT >= 23 && checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED
        }
        if (needed.isEmpty()) {
            finishWithResult(true)
        } else {
            requestPermissions(needed.toTypedArray(), REQUEST_CODE)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != REQUEST_CODE) return
        finishWithResult(grantResults.any { it == PackageManager.PERMISSION_GRANTED })
    }

    private fun finishWithResult(granted: Boolean) {
        PermissionRequest.complete(granted)
        finish()
    }

    private fun mediaPermissions(): Array<String> = when {
        Build.VERSION.SDK_INT >= 34 -> arrayOf(
            Manifest.permission.READ_MEDIA_IMAGES,
            Manifest.permission.READ_MEDIA_VIDEO,
            Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED,
        )
        Build.VERSION.SDK_INT >= 33 -> arrayOf(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO)
        else -> arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
    }

    companion object {
        const val EXTRA_KIND = "media_permission_kind"
        const val KIND_MEDIA = "media"
        const val KIND_IMAGES = KIND_MEDIA
        const val KIND_AUDIO = "audio"
        private const val REQUEST_CODE = 4182
    }
}
