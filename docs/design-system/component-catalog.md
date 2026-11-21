# Haycee Valdi design-system catalog

This is the working inventory for app-wide design tokens, reusable UI primitives and shared UI behavior. Source code remains authoritative; when a reusable primitive is added, renamed, removed or changes its contract, update this catalog and the design-system export surface in the same change.

## Core tokens

Source: `modules/haycee_mobile_app_valdi/src/design-system/tokens/`.

| Token module | Shared responsibility | Rule |
| --- | --- | --- |
| `colors.ts` | Palette plus semantic background (including elevated dark surfaces), text, interactive, pending/success/danger order statuses, border, icon, product, stock-progress, messaging and Live colors. Brand colors include CTA lime `#F0FF85`, blue `#4094B0`, and black. Decorative Live panel colors remain independent from the brand palette. Includes the Wallet's lime caption, shared 16%-alpha dark Live overlay, role badges, unread count and Live shipping gradient | Prefer a semantic token. Add a named token before using a new app-wide color. |
| `typography.ts` | Montserrat Regular, SemiBold, ExtraBold, Black; font sizes, line heights, named typography styles, `TextCase`, `transformText` | Do not load another font face or invent per-screen typography for a repeated role. Default text case is uppercase; set casing deliberately. |
| `spacing.ts` | 4-point spacing scale and nested screen/layout measurements, including the fixed button/count widths for quantity steppers; profile cover/avatar overlap, account rows, order color-panel, detail-timeline and seller-avatar dimensions; wallet form/card geometry and full-width balance/KPI sizing; settings header, sections, inputs and switch geometry; cart item, seller-avatar, shipping and checkout dimensions; snap-point sheet controls and gesture thresholds; PDP detail-section divider, seller-avatar follow control, avatar visual overlap and seller action width; product-sheet, Live order-sheet, Live exit-follow and vertical-feed action-rail geometry | Reuse scale and named layout measurements. Add repeated layout values here instead of scattering them. |
| `radius.ts` | Shared corner-radius scale | Reuse a semantic radius. Add a token for a repeated design role. |
| `scrollBehavior.ts` | `noBounceScrollAttributes` app scroll contract | Spread it on shared/native scroll containers unless the interaction explicitly requires another verified behavior. |

Order tracking status color usage is documented in [status colors](status-colors.md).
Brand surface and contrast-token usage is documented in [colors](colors.md).

## Shared utilities

Source: `modules/haycee_mobile_app_valdi/src/design-system/utils/`.

- `money.ts`: `formatFcfa`, `formatIntegerWithDotSeparator`, `formatPriceLabel`, `normalizeWholeAmountInput`, and `MONEY_GROUP_SEPARATOR`; use for all displayed and entered prices.
- `date.ts`: `formatFrenchLongDate`; formats validated ISO calendar dates as French long dates without timezone drift.
- `counts.ts`: `formatCompactCount`; use for compact social and engagement counts (`K`, `M`, `B`).
- `NavigationActionGate.ts`: `runNavigationAction`; use for user-triggered navigation presentation/pushes to prevent duplicate routes.
- `identity.ts` and `sellerBio.ts`: shared identity/name and seller-bio rules; inspect these before adding another formatter or constraint.

## Reusable components

All of these live under `modules/haycee_mobile_app_valdi/src/design-system/components/`. `src/design-system/index.ts` is the public barrel: use its exports for public components. A component in this directory that is not yet barrel-exported is still a design-system implementation; inspect its current callers and contract before importing it directly or promoting it to the public API.

### Actions and feedback

| Component | Use |
| --- | --- |
| `DSButton` | All labeled actions, with exactly `cta`, `black`, `neutral`, `outline`; supports contextual semantic surface/label tints, shared radius-token overrides, interaction blocking without a disabled appearance, optional icons, fixed leading-icon alignment for changing labels, and a small label baseline adjustment for optical alignment. Selection rules live in `.codex/skills/haycee-valdi-buttons/SKILL.md` and `docs/design-system/buttons.md`. |
| `QuantityStepper` | Shared plus/count/minus control for product detail, cart and purchase sheets. A fixed-width count slot keeps the controls stationary as the quantity changes; compact/standard/product sizes and outlined/soft/grouped/white appearances preserve each surface's layout. Uses the bold shared `add01` / `remove01` SVGs and stock/minimum guards supplied by the caller. See [quantity stepper](quantity-stepper.md). |
| `DSSwitch` | Shared accessible on/off preference control; takes an explicit selected value, disabled state and idempotent setter callback. |
| `DSInlineLink` | Compact underlined text navigation inside content rows, with semantic color and accessibility label options. |
| `AsyncActionButton` | Shared single-flight button primitive used by higher-level controls. Prefer `DSButton` for product-facing labeled actions. |
| `ActionSheet` | Short action/choice list. |
| `AlertDialog` | Confirmation or blocking alert with explicit actions. |
| `SnackBar` / `TransientFeedback` | Brief, non-blocking confirmation or status feedback. |
| `InAppBanner` | Persistent in-app notification/banner presentation. |
| `Tooltip` | Anchored, contextual explanation with simple or caller-rendered content. |

### Sheets and modal content

| Component | Use |
| --- | --- |
| `BottomSheet` | Standard sheet surface, presentation options, optional feature-owned `renderContent` body, fixed footer and horizontal content pager. Opt into a fixed initial detent with `snapPointPercent` for a sheet that can drag downward, dismiss, or expand to 100% from its header; this is off by default. Respect `BOTTOM_SHEET_DEFAULTS`; use the navigation-options helper when the page underneath must show through. |
| `MediaActionSheetContent` | Shared implementation for media-led sheets; normally use the public wrappers instead of composing this internal content directly. |
| `FeatureDiscoverySheet` | Contextual feature education/discovery, with optional image, animation or video. |
| `UpsellSheet` | Offer, upgrade or plan-presentation flow. |
| `LegalUpdateSheet` | Versioned legal/policy update, links, change summary, effective date, optional explicit confirmation and required-acceptance flow. It does not store acceptance or supply legal copy; the caller owns those contracts. |

Detailed media-sheet API and presentation guidance: `docs/design-system/media-action-sheets.md`.
Detent behavior and `snapPointPercent` usage: `docs/design-system/bottom-sheets.md`.
Live chat follow/unread behavior and the pinned Valdi scroll anchor API: `docs/design-system/live-chat.md`.

### Navigation, tabs and selection

| Component | Use |
| --- | --- |
| `BottomTabsNavigation` | App-level bottom navigation. |
| `SwipeTabs` | Synchronized horizontal swipe/pager tabs with the shared active indicator and optional hairline/loading states. |
| `TabChips` | Compact selectable category/filter or product-variant chips; distinct from page-swiping tabs. Supports contextual colors, disabled options and optional color swatches. |
| `RadioSelection` | Single-choice rows, such as sorting options. Supports disabled choices for unavailable product variants; see [selection guidance](selection.md). |
| `Hairline` | Shared fine divider; use the component options instead of duplicating a line. |

### Content, products and loading

| Component | Use |
| --- | --- |
| `MasonryFeed` | Shared masonry feed layout and column/aspect-ratio helpers. |
| `MasonryProductCard` | Reusable product card for masonry contexts; the full card uses `radius.xs` and its product image uses `radius.cardImage`. Product data includes an optional `shippingMethod` (`delivery` or `expedition`) for downstream logistics presentation. |
| `CartScreen` | Groups Marketplace products under a tappable seller avatar/name with a navigation arrow, supports variant-aware quantity and removal, uses `QuantityStepper` for stable quantity controls, shows one delivery/expedition fee with a matching SVG per seller group, includes that fee once in the cart total, and retains the shared full-width `MasonryFeed` recommendation geometry beneath the cart rows. |
| `CartCheckoutScreen` / `CartOrderSuccessScreen` | Marketplace checkout and order confirmation. Checkout keeps each seller's products and one delivery/expedition charge grouped together, shows item discounts, a Wallet-only payment choice, address selection and an optional seller note; the order total includes shipping once per seller. Its total and CTA stay in the footer. The demo confirmation explicitly says that Wallet debit is not connected and no real payment occurred. See `cart-checkout.md`. |
| `LiveProductCard` | Live product strip with an optional blurred/translucent surface (enabled by default), a larger 1:1 or 3:4 thumbnail, two-line truncated title with a total-stock pill, price beneath the title, variant availability in a compact ticker, and a bottom row with a delivery truck or expedition plane, gradient shipping fees including the FCFA amount, and the shared CTA `Acheter` button aligned to one control height. |
| `LiveProductPurchaseSheet` | Live purchase configuration for an in-stock product: summary, explicit variant selection when present, sold-out variant disabling, stock-bounded quantity, shipping estimate, total, and an intent-aware footer (`Ajouter au panier` or `Acheter`). The featured Live card opens it for its selected product; auction rows in the product list keep their separate auction affordance. |
| `ProductVariantSelectionSheet` | Compact white Marketplace sheet opened by Add/Buy when a product has dynamic options; keeps its header at the top, shows all product photos in a horizontal strip with 1:1 or 3:4 frames, places title and price below the gallery, and supports dynamic options, per-combination availability and stock limits. |
| `LiveChatRoleBadge` | Compact organizer/moderator marker beside a Live chat username; role and semantic surface are supplied by the message data. |
| `LiveStreamAlerts` | Groups live join/share events into animated pills. Its `regular` density preserves the larger default presentation; `compact` reduces pill/avatar/text dimensions for alerts placed above the Live chat feed. |
| `PinnedLiveComment` | Live-domain callout above the scrolling chat for a host-pinned comment. It has no outline, uses the shared Live surface and tokens, and animates in/out independently while the regular chat remains scrollable below. |
| `NewMessagesPill` | Compact opaque near-black pill over a chat feed, with a fixed leading white icon and white unread count. It enters/exits with a short native slide/fade and returns to the newest message only when tapped. The Live feed follows incoming messages only while already near the bottom; otherwise it leaves the current scroll offset unchanged and accumulates unread messages until the reader returns to the bottom threshold. |
| `LiveViewerScreen` | Full-screen Live composition. Its local demo chat can add incoming fixture messages at varied intervals while visible; each new row enters with a short, subtle native fade/translation, the feed pauses under Live sheets/background navigation, and recent history is bounded. |
| `LiveFollowPromptSheet` | Live seller-follow prompt with a separate exit-confirmation mode. The exit confirmation has no colored illustration panel or avatar backing, and places a centered orange host pill with a white store icon over the avatar's lower edge. An unfollowed viewer sees a follow-and-exit CTA or an exit-only action when closing an active Live; the Live page exits after the sheet dismisses. |
| `ImageCarousel` | Shared image gallery/carousel. `pager` presents one swipe-paged image; `strip` exposes all images in a horizontal rail. Supports caller-provided surface, contain/cover fit, rounded previews, decoded-dimension callbacks and native no-bounce scrolling. |
| `VerticalSnapFeed` | Shared full-viewport vertical feed using native Valdi paging. Clamps each drag to the adjacent page and both ends, disables scrolling for zero/one page, renders stable keyed pages with viewport extensions, exposes active-index and guarded near-end pagination callbacks, and provides a page-scoped action overlay slot. |
| `VerticalFeedActionRail` | Data-driven, transparent engagement controls for full-screen feeds. The caller supplies SVGs, accessible names, labels/counts, active states and callbacks; the component aligns them on the right edge using shared layout/typography tokens. |
| `VideoPlaybackControls` | Shared full-screen video overlay with a native-progress-driven timeline, in-drag preview, latest-seek retention until native progress catches up, pre-metadata fractional seek queuing, center play/pause feedback and optional loading spinner. The feature page owns the native `<video>` and passes its callbacks/state. |
| `ProductCardBadge` | Shared product status/promotion badge. |
| `ProductPopularityBadge` | Shared popularity badge. |
| `ProductOfferPlacement` | Shared product-offer placement/content layout. |
| `ProductRatingSummary` | Shared rating threshold and rating/avis display. |
| `SellerRatingSummary` | Vertical seller trust ticker that alternates the localized rating/review count with a user-group icon and compact follower count. |
| `ProductStockIndicator` | Shared pill-shaped stock progress and availability label; uses the starting stock total, supports a low-stock threshold, and takes its height/minimum width from product layout tokens. |
| `ProductStockCountPill` | Reusable compact total-stock pill (`STOCK : X`) with configurable surface and text colors. |
| `ProductVariantStockPreview` | Fixed-height vertical ticker for variant-combination inventory. Cycles through all combinations one at a time, showing each combination's own available, low-stock or sold-out status. |
| `ProductCardTypes` | Shared product-card data contracts, including dynamic variant groups/options and per-combination inventory; see [product variants](product-variants.md). |
| `SkeletonView` | Reusable skeleton shape/animation. |
| `SkeletonLoadingContainer` | Screen/content loading boundary that coordinates skeleton display and interaction state. |
| `OpacityMask` | Reusable edge fade for supported content compositions. |
| `Ticker` | Reusable horizontal marquee and vertical text/content transitions; rotating pages can use a rich render callback for compact rows with icons and styled labels. |
| `DSBadge` | General semantic badge primitive when a domain-specific badge is not a closer match. |

`SkeletonDemoScreen` is a development/demo surface, not a product component to add to production screens.

### Profile composition

These profile-domain components compose the shared design system for the signed-in profile and seller storefronts.

| Component | Use |
| --- | --- |
| `ProfileCover` | Shared profile banner with optional image/color panel, seller-style shade, and an optional overlay render slot. Used by personal profiles and seller storefronts. |
| `ProfileAccountMenu` | Profile/account navigation rows with leading SVGs, optional detail and unread-count badge, trailing chevron, no row dividers, and a semantic danger tone for destructive rows. |
| `ProfileScreenHeader` | Transparent profile-cover toolbar with support, share and preferences SVG actions; transitions to a white surface with the user's avatar/name when the identity scrolls beneath it. |
| `ProfileIdentitySection` | Reusable profile name, handle, optional location, statistics and bio block, positioned above that profile's `SwipeTabs`. |
| `ProfileAccountDestinationScreen` / `ProfileOrderDetailScreen` | Profile account pages for orders, Live support, notifications, payment and shipping, plus a complete per-order detail view with the seller storefront link, items, payment and delivery. The total recap stays in a fixed footer while details scroll; the first order card opens the shared detent sheet for the delivery timeline and address. Pending states use semantic yellow, shipped/delivered states green, and cancellations red in both the detail card and tracking timeline. Uses demo order fixtures, colored panels, French long dates, the shared navigation guard and the existing pickup address selector. |
| `WalletScreen` / `WalletWithdrawalScreen` | Account wallet overview with summary cards and account KPIs, plus an amount-validated withdrawal flow with a saved payout account and fixed CTA. Current figures/accounts are demo fixtures. |
| `WalletBalanceOverview`, `WalletBalanceCard`, `WalletMetricCard`, `WalletPaymentRow` | A full-width, unboxed Wallet summary spans behind the Wallet header, presenting available and pending balances with useful `Retirer` and `Recharger` shortcuts on the standard white page surface. A lime caption highlights availability. The reusable balance card remains available for compact balance summaries elsewhere. Wallet KPI cards separate title, accent period/status, primary value and supporting caption; callers provide comparison data before showing a trend. |
| `ProfileSettingsScreen` / `ProfileSettingsDestinationScreen` | Profile gear destination and its seven options: personal information, security, notification preferences, language, appearance, privacy/legal and sign-out confirmation. Composes `ProfileAccountMenu`, `DSSwitch`, `RadioSelection`, `DSButton` and `AlertDialog`; settings use in-memory app state until persistence/authentication services are connected. |

See [profile settings](profile-settings.md) for the navigation structure and current service boundaries.

See [profile composition](profile.md) for the current tab layout and reuse contract.

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
