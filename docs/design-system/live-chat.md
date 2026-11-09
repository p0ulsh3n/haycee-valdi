# Live chat feed behavior

The Live chat follows incoming messages only while the reader is already at, or within 24 points of, the newest end. While the reader is elsewhere, do not set `contentOffsetY` in response to message arrivals; leave the native scroll offset untouched and show the shared `NewMessagesPill` with the accumulated unread count. `onScroll` tracks the reader's distance from the newest end, and `onContentSizeChange` only triggers a programmatic scroll when follow mode is active.

Tapping the pill is the only unread-state action that scrolls to the newest message. Reaching the bottom manually also clears the count and resumes follow mode. The pill uses the shared `DSButton` with the opaque near-black `liveUnreadCountSurface` token, a fixed leading white down-arrow, and white count. The product quick-access count badge uses the same token and white count. The pill is bounded to the Live viewport and uses native enter/exit slide/fade transitions.

The Live screen currently bounds demo chat history to 60 messages. If production chat needs older history while scrolling, load older pages before the retained window is exhausted; do not continually remove rows above the reader without preserving their visible anchor.
