/**
 * App-wide scroll contract: no edge bounce, glow, squish, or small-content
 * overscroll on either platform. Spread this onto every native <scroll>.
 */
export const noBounceScrollAttributes = {
  bounces: false,
  bouncesFromDragAtStart: false,
  bouncesFromDragAtEnd: false,
  bouncesVerticalWithSmallContent: false,
  bouncesHorizontalWithSmallContent: false,
} as const;
