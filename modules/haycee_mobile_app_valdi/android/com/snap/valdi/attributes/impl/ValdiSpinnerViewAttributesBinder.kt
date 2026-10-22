package com.snap.valdi.attributes.impl

import android.content.Context
import com.snap.valdi.attributes.AttributesBinder
import com.snap.valdi.attributes.AttributesBindingContext
import com.snap.valdi.attributes.RegisterAttributesBinder
import com.snap.valdi.attributes.impl.animations.ValdiAnimator
import com.snap.valdi.views.ValdiSpinnerView

/** Binds the official Valdi spinner color attribute for the backported class. */
@RegisterAttributesBinder
class ValdiSpinnerViewAttributesBinder(private val context: Context) : AttributesBinder<ValdiSpinnerView> {

    override val viewClass: Class<ValdiSpinnerView> = ValdiSpinnerView::class.java

    private fun applyColor(view: ValdiSpinnerView, color: Int, animator: ValdiAnimator?) {
        view.setColor(color)
    }

    private fun resetColor(view: ValdiSpinnerView, animator: ValdiAnimator?) {
        view.resetColor()
    }

    override fun bindAttributes(attributesBindingContext: AttributesBindingContext<ValdiSpinnerView>) {
        attributesBindingContext.bindColorAttribute("color", false, this::applyColor, this::resetColor)
    }
}
