# VerticalSnapFeed

`VerticalSnapFeed` is the app-wide primitive for a full-screen, vertically paged
content feed (short videos, Spotlight-like posts, or other one-item-per-screen
content). It lives in `src/design-system/components/VerticalSnapFeed.tsx` and is
exported by `src/design-system/index.ts`.

Engagement controls are intentionally separate in
`src/design-system/components/VerticalFeedActionRail.tsx`. The feed owns page
measurement, snap/edge behavior and page lifecycle; the action rail owns the
right-side SVG controls and their accessible labels/counts. A feature screen
builds action items from its data and callbacks, then supplies the rail through
`renderActions`. This keeps paging independent from likes, comments, saving,
sharing or future actions, while keeping one consistent rail across video feeds.

Playback chrome is reusable and separate from both paging and the action rail in
`src/design-system/components/VideoPlaybackControls.tsx`. A page owns its single
active native `<video>` element, uses `onVideoLoaded` and `onProgressUpdated` as
the duration/progress source of truth, and forwards the latest normalized seek
request to `seekToTime`. A seek made before duration metadata arrives is retained
as a fraction and converted once native duration becomes available. During a
drag, the timeline previews locally and commits the final position on release;
the displayed thumb then follows native progress until the seek lands. Taps also
seek directly to their touched position. The control ignores a duplicate tap
callback for the same touch release so one gesture cannot issue two native seeks.
The displayed position stays on native progress while a seek is pending, then
follows the requested position once native progress reports that it has landed
within the shared millisecond tolerance. The center tap toggles the native
`playbackRate` between `0` and `1` and briefly animates the matching play/pause SVG.

Seller video demo records keep their Cloudinary asset IDs, MP4 URLs, poster URLs
and poster fit in `src/sellers/data/SellerVideoMedia.ts` and
`src/sellers/data/SellerStorefrontData.ts`; screen components only consume this
media data. The seller profile grid renders each poster before navigation and
keeps its color panel behind it as a loading or unavailable-image fallback.
When a fixture has no matching media asset, its data record can omit the URLs
and the color panel remains usable.

The pinned Valdi `VideoView` API does not publish a buffering callback or a
continuous-scrubbing mode. The shared overlay therefore treats a missing progress
heartbeat as a loading hint and times out seek feedback; it does not claim that
this hint is the native decoder's exact buffer state. Valdi accepts seek requests
in milliseconds and reports native progress, but exact seek latency and frame
accuracy remain media/container and native-player dependent. Do not claim adjacent
page rendering preloads video bytes: `VerticalSnapFeed` mounts a native player only
for the active page. A true next-video preload manager requires a verified native
loader/player integration on each target platform.

## Contract

- Each `pageIds` entry represents one stable, full-viewport page. Keep IDs stable
  across pagination updates so the component can preserve the current item.
- `initialIndex` selects the item opened from a grid. The index is clamped to the
  available range.
- `renderPage(index, isActive, width, height)` renders domain content. Mount a
  native player only for the active page; render posters for adjacent pages so
  viewport preparation does not create multiple decoders. The seller video
  screen uses Valdi's native `<video>` only when its active item has a real
  `videoUrl`; poster-only demo records remain posters.
- `renderActions(index, isActive)` optionally returns page-local overlays. The
  seller video feed composes the shared rail with like, comments, save and share
  items; feature-specific callbacks can be supplied without changing the feed.
- `onActiveIndexChange` reports settled page changes.
- `hasMore` and `onLoadMore` provide an optional near-end pagination hook. The
  component requests once per settled page, triggers in the final two loaded
  pages, and blocks overlapping requests. The owner remains responsible for
  cursor state, errors, cancellation and updating `pageIds`.
- Zero or one page disables scrolling. Drag settlement is restricted to the
  current page or one adjacent page, and the first/last offsets are clamped.

## Valdi implementation

The feed uses native Valdi `<scroll horizontal={false} pagingEnabled={true}>`,
`onDragEnding` to return a bounded `ScrollOffset`, and `onScrollEnd` to report the
settled page. It measures its viewport and sets `staticContentHeight` and
`contentOffsetY` through `ScrollViewInteractive`, as documented in the pinned
Valdi reference. The shared `noBounceScrollAttributes` disables edge bounce.
Stable keyed page children and viewport extensions let Valdi prepare nearby
content without introducing a custom gesture system.

Verified reference: Valdi beta-0.2.1 source commit
`f26bee4dc170b6c929f71d4dd07d44e033f47176`, recorded in
`docs/valdi-reference/SOURCE_MANIFEST.json`. Relevant reference sections:

- `docs/api/api-reference-elements.md`: `ScrollView` paging, drag callbacks,
  bounce, viewport extensions, and `ScrollViewInteractive` offsets/content size.
- `docs/api/performance-view-recycling.md` and
  `docs/api/api-reference-elements.md`: viewport rendering and lazy content.
- `docs/api/api-reference-elements.md`: native `VideoView` and its playback
  attributes/callbacks.
- `docs/docs/core-video.md`: the native player example, `seekToTime`, duration and
  progress callbacks. The Android host implementation stores a pending seek if
  its player object is not attached yet; the iOS view forwards the requested time
  to its configured player. These implementation details do not guarantee a
  platform-independent buffering/scrubbing contract.

No custom `GestureHandler`, `ScrollViewHandler`, `globalThis.__valdiMedia`, or
networking service is required by this component. Add backend cursor loading and
media prefetch only through verified application APIs when the real data layer
is available.
