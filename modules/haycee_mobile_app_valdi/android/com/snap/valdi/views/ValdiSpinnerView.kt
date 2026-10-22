package com.snap.valdi.views

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.PorterDuff
import android.os.Build
import android.widget.ProgressBar
import androidx.annotation.Keep

/**
 * Native Android spinner for the beta-0.0.3 runtime.
 *
 * The pinned runtime registers the official `spinner` JSX element under this
 * class name, but the class itself is absent from that beta artifact. Keeping
 * the official class name lets the existing Valdi native-element mapping use
 * this real Android ProgressBar without a Valdi-rendered fallback.
 */
@Keep
class ValdiSpinnerView(context: Context) :
    ProgressBar(context, null, android.R.attr.progressBarStyleSmall),
    ValdiRecyclableView {

    var spinnerColor: Int = Color.WHITE
        set(value) {
            field = value
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                indeterminateTintList = ColorStateList.valueOf(value)
            } else {
                indeterminateDrawable?.mutate()?.setColorFilter(value, PorterDuff.Mode.SRC_IN)
            }
        }

    init {
        isIndeterminate = true
        resetColor()
    }

    fun setColor(color: Int) {
        spinnerColor = color
    }

    fun resetColor() {
        spinnerColor = Color.WHITE
    }
}
