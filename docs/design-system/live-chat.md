# Live chat feed behavior

The Live chat follows incoming messages only while the reader is already at, or within 24 points of, the newest end. While the reader is elsewhere, do not set `contentOffsetY` in response to message arrivals; leave the native scroll offset untouched and show the shared `NewMessagesPill` with the accumulated unread count. `onScroll` tracks the reader's distance from the newest end, and `onContentSizeChange` only triggers a programmatic scroll when follow mode is active.

Tapping the pill is the only unread-state action that scrolls to the newest message. Reaching the bottom manually also clears the count and resumes follow mode. The pill uses the shared `DSButton` with the opaque near-black `liveUnreadCountSurface` token, a fixed leading white down-arrow, and white count. The product quick-access count badge uses the same token and white count. The pill is bounded to the Live viewport and uses native enter/exit slide/fade transitions.

The Live screen currently bounds demo chat history to 60 messages. If production chat needs older history while scrolling, load older pages before the retained window is exhausted; do not continually remove rows above the reader without preserving their visible anchor.

## Seller-pinned comment

`PinnedLiveComment` is a fixed callout above the regular chat viewport, not a chat row. Incoming comments continue to render and scroll below it. When the pin is present, reserve `layout.live.viewer.pinnedCommentHeight` from the scroll viewport so the callout never covers messages or the composer. The callout has no border and uses `colors.liveOverlaySurface`; its username, message typography, avatar size and avatar spacing match the regular chat rows.

Dark translucent surfaces above Live content share `colors.liveOverlaySurface` (16% alpha). Keep modal dimming scrims, white glass controls, and content-specific avatar/badge fills on their own semantic tokens.

The demo Live viewer periodically pins a host comment, holds it briefly, then clears it. The component animates entry and exit independently with Valdi's native `animate` API; production data should provide the current pinned message from the Live event stream and clear it when the seller unpins or replaces it. Animation API evidence is the pinned Valdi source `S:\valdi-official-reference\docs\docs\advanced-animations.md` at revision `f26bee4dc170b6c929f71d4dd07d44e033f47176` (see `docs/valdi-reference/SOURCE_MANIFEST.json`).
