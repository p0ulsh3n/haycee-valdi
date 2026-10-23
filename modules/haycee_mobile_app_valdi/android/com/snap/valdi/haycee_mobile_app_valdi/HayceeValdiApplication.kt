package com.snap.valdi.haycee_mobile_app_valdi

import android.app.Activity
import android.app.Application
import android.os.Bundle
import java.lang.ref.WeakReference

class HayceeValdiApplication : Application(), Application.ActivityLifecycleCallbacks {
    override fun onCreate() {
        super.onCreate()
        registerActivityLifecycleCallbacks(this)
        instance = this
    }

    override fun onActivityResumed(activity: Activity) {
        foregroundActivity = WeakReference(activity)
    }

    override fun onActivityPaused(activity: Activity) {
        if (foregroundActivity?.get() === activity) foregroundActivity = null
    }

    override fun onActivityCreated(activity: Activity, state: Bundle?) = Unit
    override fun onActivityStarted(activity: Activity) = Unit
    override fun onActivityStopped(activity: Activity) = Unit
    override fun onActivitySaveInstanceState(activity: Activity, state: Bundle) = Unit
    override fun onActivityDestroyed(activity: Activity) = Unit

    companion object {
        @Volatile var instance: HayceeValdiApplication? = null
            private set

        @Volatile var foregroundActivity: WeakReference<Activity>? = null
            private set
    }
}
