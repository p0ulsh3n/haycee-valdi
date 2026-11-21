# Haycee color tokens

Use the semantic tokens in `modules/haycee_mobile_app_valdi/src/design-system/tokens/colors.ts` for app UI. Keep the lime brand color centralized so one palette edit updates the CTA and every brand surface.

## Brand roles

- `palette.brandPrimary`, `colors.buttonPrimary` and `colors.backgroundBrand` share the brand surface color, currently `#F0FF85`.
- `palette.brandSecondary` and `colors.backgroundBrandSecondary` define the blue brand accent `#4094B0`. It is the third brand color alongside CTA lime and black; it remains a palette option and does not change the global `DSButton` variants.
- `colors.textBrand` and `colors.iconBrand` are black for legibility on that light surface. Do not use white text or icons on the lime brand fill.
- `colors.interactivePrimary` is black for readable links, icons and text accents on white. It replaces the previous violet foreground accent.
- `colors.interactivePrimaryPressed` is a neutral dark gray. Brand surfaces and selected controls use the same CTA lime; do not add a second green or olive shade.
- `colors.livePanelLavender` and the other Live panel colors remain separate, muted decorative surfaces; changing the CTA palette does not recolor those panels.
- `colors.walletAccentOnDark` reuses the bright brand surface for labels over black.

Keep semantic status colors (success, pending, danger), product photos and actual product-variant swatches independent from the brand palette. A data swatch named “Mauve” describes product data, not an app accent.

## Contrast when changing the brand color

Change a brand palette token once. CTA surfaces use `buttonPrimary` or `backgroundBrand`; secondary brand surfaces can use `backgroundBrandSecondary`. Text and icon consumers use `textBrand` / `iconBrand` on lime, and must choose a contrast-appropriate foreground on secondary surfaces. Update this guide and the component catalog whenever palette roles or contrast treatment change.
