# Quantity stepper

Use the public `QuantityStepper` from `src/design-system` for every plus/count/minus quantity control. It owns the fixed button and count geometry, bold `add01` / `remove01` icons, accessibility labels, and disabled interaction treatment. A fixed-width count slot prevents the buttons from moving when the value gains digits.

## Surface options

- `compact` with `grouped` preserves the Marketplace cart capsule.
- `compact` with `white` is for compact controls on white Live cart rows.
- `product` with `outlined` is for the product detail page.
- `standard` with `soft` is for product and Live purchase sheets.

Pass `decreaseDisabled` and `increaseDisabled` from the domain's real lower and stock limits. Quantity taps remain intentionally repeatable; the component does not debounce them. Set `itemLabel` for descriptive accessibility labels and `marginLeft` only when the parent row needs separation.
