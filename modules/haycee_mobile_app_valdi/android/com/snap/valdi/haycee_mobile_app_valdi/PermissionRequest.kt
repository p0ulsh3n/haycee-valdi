package com.snap.valdi.haycee_mobile_app_valdi

import android.content.Intent
import android.os.Handler
import android.os.Looper

internal object PermissionRequest {
    private val mainHandler = Handler(Looper.getMainLooper())
    @Volatile private var callback: ((Boolean) -> Unit)? = null

    fun launch(kind: String, result: (Boolean) -> Unit) {
        val application = HayceeValdiApplication.instance
        val activity = HayceeValdiApplication.foregroundActivity?.get()
        if (application == null || activity == null || activity.isFinishing) {
            result(false)
            return
        }
        mainHandler.post {
            callback = result
            activity.startActivity(Intent(activity, MediaPermissionActivity::class.java).apply {
                putExtra(MediaPermissionActivity.EXTRA_KIND, kind)
            })
        }
    }

    fun complete(granted: Boolean) {
        val pending = callback
        callback = null
        pending?.invoke(granted)
    }
}
