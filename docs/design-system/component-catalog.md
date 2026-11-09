# Haycee Valdi design-system catalog

This is the working inventory for app-wide design tokens, reusable UI primitives and shared UI behavior. Source code remains authoritative; when a reusable primitive is added, renamed, removed or changes its contract, update this catalog and the design-system export surface in the same change.

## Core tokens

Source: `modules/haycee_mobile_app_valdi/src/design-system/tokens/`.

| Token module | Shared responsibility | Rule |
| --- | --- | --- |
| `colors.ts` | Palette plus semantic background (including elevated dark surfaces), text, interactive, border, icon, product, stock-progress, messaging and Live colors | Prefer a semantic token. Add a named token before using a new app-wide color. |
| `typography.ts` | Montserrat Regular, SemiBold, ExtraBold, Black; font sizes, line heights, named typography styles, `TextCase`, `transformText` | Do not load another font face or invent per-screen typography for a repeated role. Default text case is uppercase; set casing deliberately. |
| `spacing.ts` | 4-point spacing scale and nested screen/layout measurements | Reuse scale and named layout measurements. Add repeated layout values here instead of scattering them. |
| `radius.ts` | Shared corner-radius scale | Reuse a semantic radius. Add a token for a repeated design role. |
| `scrollBehavior.ts` | `noBounceScrollAttributes` app scroll contract | Spread it on shared/native scroll containers unless the interaction explicitly requires another verified behavior. |

## Shared utilities

Source: `modules/haycee_mobile_app_valdi/src/design-system/utils/`.

- `money.ts`: `formatFcfa`, `formatIntegerWithDotSeparator`, `formatPriceLabel`, `normalizeWholeAmountInput`, and `MONEY_GROUP_SEPARATOR`; use for all displayed and entered prices.
- `NavigationActionGate.ts`: `runNavigationAction`; use for user-triggered navigation presentation/pushes to prevent duplicate routes.
- `identity.ts` and `sellerBio.ts`: shared identity/name and seller-bio rules; inspect these before adding another formatter or constraint.

## Reusable components

All of these live under `modules/haycee_mobile_app_valdi/src/design-system/components/`. `src/design-system/index.ts` is the public barrel: use its exports for public components. A component in this directory that is not yet barrel-exported is still a design-system implementation; inspect its current callers and contract before importing it directly or promoting it to the public API.

### Actions and feedback

| Component | Use |
| --- | --- |
| `DSButton` | All labeled actions, with exactly `cta`, `black`, `neutral`, `outline`; selection rules live in `.codex/skills/haycee-valdi-buttons/SKILL.md` and `docs/design-system/buttons.md`. |
| `AsyncActionButton` | Shared single-flight button primitive used by higher-level controls. Prefer `DSButton` for product-facing labeled actions. |
| `ActionSheet` | Short action/choice list. |
| `AlertDialog` | Confirmation or blocking alert with explicit actions. |
| `SnackBar` / `TransientFeedback` | Brief, non-blocking confirmation or status feedback. |
| `InAppBanner` | Persistent in-app notification/banner presentation. |
| `Tooltip` | Anchored, contextual explanation with simple or caller-rendered content. |

### Sheets and modal content

| Component | Use |
| --- | --- |
| `BottomSheet` | Standard sheet surface, presentation options, optional fixed footer and horizontal content pager. Respect `BOTTOM_SHEET_DEFAULTS`; use the navigation-options helper when the page underneath must show through. |
| `MediaActionSheetContent` | Shared implementation for media-led sheets; normally use the public wrappers instead of composing this internal content directly. |
| `FeatureDiscoverySheet` | Contextual feature education/discovery, with optional image, animation or video. |
| `UpsellSheet` | Offer, upgrade or plan-presentation flow. |
| `LegalUpdateSheet` | Versioned legal/policy update, links, change summary, effective date, optional explicit confirmation and required-acceptance flow. It does not store acceptance or supply legal copy; the caller owns those contracts. |

Detailed media-sheet API and presentation guidance: `docs/design-system/media-action-sheets.md`.

### Navigation, tabs and selection

| Component | Use |
| --- | --- |
| `BottomTabsNavigation` | App-level bottom navigation. |
| `SwipeTabs` | Synchronized horizontal swipe/pager tabs with the shared active indicator and optional hairline/loading states. |
| `TabChips` | Compact selectable category/filter chips; distinct from page-swiping tabs. Pass color options when a context has a documented variant. |
| `RadioSelection` | Single-choice rows, such as sorting options. |
| `Hairline` | Shared fine divider; use the component options instead of duplicating a line. |

### Content, products and loading

| Component | Use |
| --- | --- |
| `MasonryFeed` | Shared masonry feed layout and column/aspect-ratio helpers. |
| `MasonryProductCard` | Reusable product card for masonry contexts. |
| `LiveProductCard` | Live glass strip with a larger 1:1 or 3:4 thumbnail, padded content, two-line truncated title with a total-stock pill, price beneath the title, shipping fee and a link to the full product sheet; variant availability is summarized in a compact ticker. |
| `ImageCarousel` | Shared image gallery/carousel and gesture paging. |
| `ProductCardBadge` | Shared product status/promotion badge. |
| `ProductPopularityBadge` | Shared popularity badge. |
| `ProductOfferPlacement` | Shared product-offer placement/content layout. |
| `ProductRatingSummary` | Shared rating threshold and rating/avis display. |
| `ProductStockIndicator` | Shared pill-shaped stock progress and availability label; uses the starting stock total, supports a low-stock threshold, and takes its height/minimum width from product layout tokens. |
| `ProductStockCountPill` | Reusable compact total-stock pill (`STOCK : X`) with configurable surface and text colors. |
| `ProductVariantStockPreview` | Fixed-height vertical ticker for variant-combination inventory. Cycles through all combinations two at a time, showing each combination's own available, low-stock or sold-out status. |
| `ProductCardTypes` | Shared product-card data contracts, not a rendered component. |
| `SkeletonView` | Reusable skeleton shape/animation. |
| `SkeletonLoadingContainer` | Screen/content loading boundary that coordinates skeleton display and interaction state. |
| `OpacityMask` | Reusable edge fade for supported content compositions. |
| `Ticker` | Reusable horizontal marquee and vertical text/content transitions; rotating pages can use a rich render callback for compact rows with icons and styled labels. |
| `DSBadge` | General semantic badge primitive when a domain-specific badge is not a closer match. |

`SkeletonDemoScreen` is a development/demo surface, not a product component to add to production screens.

## Choosing the right layer

1. **Token:** use when a value or semantic rule is repeated across components (color, font role, radius, spacing, layout measurement, animation/scroll constant).
2. **Design-system component:** use when UI behavior/geometry is reusable across features (sheet behavior, tabs, card structure, loading, feedback, selection, tooltip, ticker).
3. **Domain component:** use for a reusable feature-specific pattern such as a seller/live/product card. Compose design-system tokens and primitives; do not fork their semantics or styles.
4. **Screen composition:** keep one-off content and page arrangement in the feature screen, using the shared layers above. If the screen introduces a reusable visual rule, first promote that rule to the design system.

## Required change maintenance

- Before coding any UI, inspect this catalog, the public barrel and the matching component source/callers.
- For a missing shared pattern, establish its semantic name, defaults, variants and accessibility behavior in the design system first; then compose the screen.
- When changing public behavior, update the component types, barrel exports, this catalog and any focused guide that documents its usage.
- Keep action variants, sheet dismissal/idempotency, navigation guards, scroll behavior and typography rules in their dedicated source/skills instead of duplicating contradictory rules here.
