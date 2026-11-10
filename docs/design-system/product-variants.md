# Product variants

`ProductVariantSelectionSheet` is the Marketplace product-domain sheet used when a buyer taps
Add or Buy on an item that has selectable variants. It composes the shared white `BottomSheet`
surface, `TabChips`, `Hairline`, `DSButton`, money formatter and navigation/idempotency guards.
The sheet keeps its header reserved at the top and a compact fixed height; long option lists scroll
inside the content area. Its product preview uses the shared `ImageCarousel` in `strip` mode:
`imageUrls` take precedence over `imageUrl`, gallery colors remain the demo fallback, and every
image is laid out horizontally. The first decoded image selects a shared square (1:1) or portrait
(3:4) frame for the strip; each image uses `contain`, so none is cropped. Product title and price
sit below the complete gallery, and the fixed CTA remains at the sheet bottom.

## Data contract

- `variantGroups` provides API-driven axes such as size, color, shade or model. Each option has a
  stable `id`, user-facing `label`, and optional swatch/inventory metadata.
- `variantCombinations` maps a concrete set of group/option IDs to its own available stock. An
  omitted combination is unavailable when a combination list is supplied; zero-stock options
  cannot be selected.
- If `variantGroups` is absent, legacy `sizes` and `colors` are adapted to groups. New API adapters
  should map directly to `variantGroups` so labels, ordering, option IDs and inventory remain
  server-controlled.
- With no combination inventory, the sheet bounds quantity by selected option inventory when
  present, otherwise by product stock. No demo-only sizes or colors are injected by the sheet.

## Action contract

The caller passes `intent: 'add-to-cart' | 'buy-now'` and owns the resulting operation. The sheet
returns the product, quantity, selected group/option IDs and the matched combination ID. It guards
duplicate submission and dismissal locally; a real backend mutation still needs its own idempotency
key and authoritative stock validation.

The demo catalog includes one varied product to exercise sold-out and in-stock combinations. Remove
or replace that fixture when the product API supplies the real variant data.
