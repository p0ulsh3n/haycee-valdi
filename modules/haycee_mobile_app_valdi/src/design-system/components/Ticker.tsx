import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import type { CancellableAnimation } from 'valdi_core/src/CancellableAnimation';
import { StatefulComponent } from 'valdi_core/src/Component';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ImageView, Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { typography } from '../tokens/typography';

export type TickerMode = 'marquee' | 'rotate';
export type TickerOrientation = 'horizontal' | 'vertical';
export type TickerRotateTransition = 'slide' | 'fade' | 'fade-slide';
/** Forward moves left/up; reverse moves right/down. */
export type TickerDirection = 'forward' | 'reverse';

export interface TickerViewModel {
  /** Text entries, in the order they should be shown. */
  items: string[];
  /** Optional Valdi image assets displayed with the matching rotating text item. */
  leadingIcons?: Asset[];
  /** Leading icon size in points. Defaults to 16. */
  leadingIconSize?: number;
  /** Optional tint for leading icons. */
  leadingIconTint?: string;
  /** Gap between each leading icon and its text. Defaults to 8 points. */
  leadingIconGap?: number;
  /** `marquee` continuously scrolls `items[0]`; `rotate` slides between all items. */
  mode?: TickerMode;
  /** Marquee always uses horizontal motion; rotate defaults to vertical motion. */
  orientation?: TickerOrientation;
  /** Forward means left for horizontal and up for vertical. Defaults to forward. */
  direction?: TickerDirection;
  /** Stops scheduling new motion when false. Defaults to true. */
  active?: boolean;
  /** Repeats after the last entry. Defaults to true. */
  repeat?: boolean;
  /** First item index to display in `rotate` mode. Defaults to the first item. */
  startIndex?: number;
  /** Initial delay; in rotate mode, also the pause between items. Defaults to 2200 ms. */
  holdDurationMs?: number;
  /** Slide transition duration, in milliseconds. Defaults to 280. */
  transitionDurationMs?: number;
  /** Curve used for item transitions in `rotate` mode. Defaults to EaseInOut. */
  transitionCurve?: AnimationCurve;
  /** Transition used between items in `rotate` mode. Defaults to slide. */
  rotateTransition?: TickerRotateTransition;
  /** Fade/slide exit duration in milliseconds; falls back to `transitionDurationMs`. */
  exitDurationMs?: number;
  /** Fade/slide enter duration in milliseconds; falls back to `transitionDurationMs`. */
  enterDurationMs?: number;
  /** Translation distance for fade-slide transitions, in points. Defaults to 10. */
  transitionDistance?: number;
  /** Marquee speed in points per second. Defaults to 32. */
  marqueeSpeed?: number;
  /** Duration in milliseconds for one full marquee cycle. Overrides `marqueeSpeed`. */
  marqueeDurationMs?: number;
  /** Space between repeated marquee copies. Defaults to 32 points. */
  marqueeGap?: number;
  /** Pause between complete marquee passes. Defaults to 0 for continuous motion. */
  loopDelayMs?: number;
  /** Optional single accessibility announcement for the ticker. */
  accessibilityLabel?: string;
  /** Viewport style. Set a height when using vertical orientation. */
  style?: Style<ScrollView>;
  /** Optional label style; the component supplies a design-system body style by default. */
  textStyle?: Style<Label>;
  /** Number of visible text lines. Defaults to one. */
  numberOfLines?: number;
  /** Called inside the rotate animation transaction, alongside the track movement. */
  onItemWillChange?: (index: number, item: string) => void;
  /** Called after a rotate transition settles on an item. */
  onItemChange?: (index: number, item: string) => void;
  /** Called when a horizontal marquee pass starts or finishes. */
  onMarqueeCycleStart?: () => void;
  onMarqueeCycleEnd?: () => void;
}

interface TickerState {
  viewportWidth: number;
  viewportHeight: number;
  itemWidth: number;
}

/**
 * Shared native ticker for long horizontal text and directional item transitions.
 * Its ScrollView is a non-interactive clipping viewport; motion runs on one native
 * track transform rather than re-rendering state on every animation frame.
 */
export class Ticker extends StatefulComponent<TickerViewModel, TickerState> {
  state: TickerState = { viewportWidth: 0, viewportHeight: 0, itemWidth: 0 };

  private readonly trackRef = new ElementRef<View>();
  private activeAnimation?: CancellableAnimation;
  private motionToken = 0;
  private timer?: number;
  private currentPageIndex = 0;
  private configurationKey = '';
  private orderedItemsCacheKey = '';
  private orderedItemsCache: string[] = [];
  private cachedTextStyle?: Style<Label>;
  private cachedTextStyleSource?: Style<Label>;
  private cachedTextStyleMode?: TickerMode;
  private cachedTextStyleHasLeadingIcon?: boolean;
  private cachedPageStyle?: Style<View>;
  private cachedPageStyleWidth = -1;
  private cachedPageStyleHeight = -1;
  private cachedMarqueeGapStyle?: Style<Layout>;
  private cachedMarqueeGapWidth = -1;

  onCreate(): void {
    this.configurationKey = this.getConfigurationKey();
    this.currentPageIndex = this.getInitialPageIndex();
    this.registerDisposable(() => this.clearTimer());
  }

  onViewModelUpdate(previous?: Readonly<TickerViewModel>): void {
    const nextConfigurationKey = this.getConfigurationKey();
    if (nextConfigurationKey !== this.configurationKey) {
      this.configurationKey = nextConfigurationKey;
      this.motionToken += 1;
      this.clearTimer();
      this.cancelAnimation();
      this.currentPageIndex = this.getInitialPageIndex();
      this.orderedItemsCacheKey = '';
      this.resetTrackPosition();
      this.scheduleNext(this.motionToken);
      return;
    }

    if (previous && (previous.active !== false) !== this.isActive()) {
      this.motionToken += 1;
      this.clearTimer();
      if (this.isActive()) {
        this.scheduleNext(this.motionToken);
      } else {
        this.cancelAnimation();
        this.animateToCurrentPosition();
      }
    }
  }

  onDestroy(): void {
    this.motionToken += 1;
    this.clearTimer();
    this.cancelAnimation();
  }

  private handleViewportLayout = (frame: ElementFrame): void => {
    const viewportWidth = Math.max(0, frame.width);
    const viewportHeight = Math.max(0, frame.height);
    if (Math.abs(viewportWidth - this.state.viewportWidth) < 1 && Math.abs(viewportHeight - this.state.viewportHeight) < 1) return;

    this.setState({ viewportWidth, viewportHeight, itemWidth: this.state.itemWidth });
    this.restartAfterMeasurement();
  };

  private handleItemLayout = (frame: ElementFrame): void => {
    const itemWidth = Math.max(0, frame.width);
    if (Math.abs(itemWidth - this.state.itemWidth) < 1) return;

    this.setState({
      viewportWidth: this.state.viewportWidth,
      viewportHeight: this.state.viewportHeight,
      itemWidth,
    });
    this.restartAfterMeasurement();
  };

  private restartAfterMeasurement(): void {
    this.motionToken += 1;
    this.clearTimer();
    this.resetTrackPosition();
    this.scheduleNext(this.motionToken);
  }

  private getMode(): TickerMode {
    return this.viewModel.mode ?? 'rotate';
  }

  private getOrientation(): TickerOrientation {
    return this.getMode() === 'marquee'
      ? 'horizontal'
      : this.viewModel.orientation ?? 'vertical';
  }

  private getDirection(): TickerDirection {
    return this.viewModel.direction ?? 'forward';
  }

  private isActive(): boolean {
    return this.viewModel.active !== false;
  }

  private shouldRepeat(): boolean {
    return this.viewModel.repeat !== false;
  }

  private getItems(): string[] {
    return this.viewModel.items ?? [];
  }

  private getOrderedItems(): string[] {
    if (this.orderedItemsCacheKey === this.configurationKey) return this.orderedItemsCache;
    const items = this.getItems();
    const ordered = this.getDirection() === 'reverse' ? items.slice().reverse() : items.slice();
    if (this.shouldRepeat() && ordered.length > 1) ordered.push(ordered[0]);
    this.orderedItemsCache = ordered;
    this.orderedItemsCacheKey = this.configurationKey;
    return this.orderedItemsCache;
  }

  private getOrderedLeadingIcons(): Asset[] {
    const icons = this.viewModel.leadingIcons ?? [];
    if (icons.length === 0) return [];
    const ordered = this.getDirection() === 'reverse' ? icons.slice().reverse() : icons.slice();
    if (this.shouldRepeat() && ordered.length > 1) ordered.push(ordered[0]);
    return ordered;
  }

  private getInitialPageIndex(): number {
    const items = this.getItems();
    if (items.length === 0) return 0;
    const requestedIndex = Number.isFinite(this.viewModel.startIndex) ? this.viewModel.startIndex ?? 0 : 0;
    const index = Math.max(0, Math.min(items.length - 1, Math.floor(requestedIndex)));
    return this.getDirection() === 'reverse' ? items.length - 1 - index : index;
  }

  private getPageSize(): number {
    return this.getOrientation() === 'horizontal' ? this.state.viewportWidth : this.state.viewportHeight;
  }

  private getMarqueeDistance(): number {
    return this.state.itemWidth + this.getMarqueeGap();
  }

  private getMarqueeStartOffset(): number {
    return this.getDirection() === 'reverse' && this.state.itemWidth > this.state.viewportWidth + 1
      ? -this.getMarqueeDistance()
      : 0;
  }

  private setMarqueeTrackOffset(offset = this.getMarqueeStartOffset()): void {
    const track = this.trackRef.single();
    track?.setAttribute('translationX', offset);
  }

  private getMarqueeGap(): number {
    const gap = this.viewModel.marqueeGap ?? 32;
    return Number.isFinite(gap) ? Math.max(0, gap) : 32;
  }

  private getConfigurationKey(): string {
    return JSON.stringify({
      items: this.getItems(),
      mode: this.getMode(),
      orientation: this.getOrientation(),
      direction: this.getDirection(),
      repeat: this.shouldRepeat(),
      startIndex: this.viewModel.startIndex ?? 0,
      holdDurationMs: this.viewModel.holdDurationMs ?? 2200,
      transitionDurationMs: this.viewModel.transitionDurationMs ?? 280,
      transitionCurve: this.viewModel.transitionCurve ?? AnimationCurve.EaseInOut,
      rotateTransition: this.viewModel.rotateTransition ?? 'slide',
      exitDurationMs: this.viewModel.exitDurationMs ?? 0,
      enterDurationMs: this.viewModel.enterDurationMs ?? 0,
      transitionDistance: this.viewModel.transitionDistance ?? 10,
      marqueeSpeed: this.viewModel.marqueeSpeed ?? 32,
      marqueeDurationMs: this.viewModel.marqueeDurationMs ?? 0,
      marqueeGap: this.viewModel.marqueeGap ?? 32,
      loopDelayMs: this.viewModel.loopDelayMs ?? 0,
    });
  }

  private getResolvedTextStyle(): Style<Label> {
    const sourceStyle = this.viewModel.textStyle;
    const mode = this.getMode();
    const hasLeadingIcon = (this.viewModel.leadingIcons?.length ?? 0) > 0;
    if (
      this.cachedTextStyle &&
      this.cachedTextStyleSource === sourceStyle &&
      this.cachedTextStyleMode === mode &&
      this.cachedTextStyleHasLeadingIcon === hasLeadingIcon
    ) {
      return this.cachedTextStyle;
    }

    const baseStyle: Style<Label> = mode === 'marquee'
      ? styles.marqueeText as Style<Label>
      : hasLeadingIcon
        ? styles.rotateTextWithLeadingIcon as Style<Label>
        : styles.rotateText as Style<Label>;
    const invariantStyle: Style<Label> = mode === 'marquee'
      ? styles.marqueeTextInvariant as Style<Label>
      : styles.rotateTextInvariant as Style<Label>;
    this.cachedTextStyle = sourceStyle
      ? Style.merge(baseStyle, sourceStyle, invariantStyle) as Style<Label>
      : baseStyle;
    this.cachedTextStyleSource = sourceStyle;
    this.cachedTextStyleMode = mode;
    this.cachedTextStyleHasLeadingIcon = hasLeadingIcon;
    return this.cachedTextStyle;
  }

  private getPageStyle(): Style<View> {
    const width = this.state.viewportWidth;
    const height = this.state.viewportHeight;
    if (!this.cachedPageStyle || width !== this.cachedPageStyleWidth || height !== this.cachedPageStyleHeight) {
      this.cachedPageStyle = styles.page.extend({ width, height });
      this.cachedPageStyleWidth = width;
      this.cachedPageStyleHeight = height;
    }
    return this.cachedPageStyle;
  }

  private getMarqueeGapStyle(): Style<Layout> {
    const width = this.getMarqueeGap();
    if (!this.cachedMarqueeGapStyle || width !== this.cachedMarqueeGapWidth) {
      this.cachedMarqueeGapStyle = styles.marqueeGap.extend({ width });
      this.cachedMarqueeGapWidth = width;
    }
    return this.cachedMarqueeGapStyle;
  }

  private scheduleNext(token: number, delayMs = this.viewModel.holdDurationMs ?? 2200): void {
    if (!this.isActive() || token !== this.motionToken || this.state.viewportWidth <= 0) return;

    if (this.getMode() === 'marquee') {
      if (this.getOrientation() !== 'horizontal' || this.getItems().length === 0 || this.state.itemWidth <= this.state.viewportWidth + 1) return;
    } else if (this.state.viewportHeight <= 0 || this.getItems().length < 2 || this.getPageSize() <= 0) {
      return;
    }

    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (!this.isDestroyed() && token === this.motionToken && this.isActive()) {
        if (this.getMode() === 'marquee') void this.runMarquee(token);
        else void this.advanceItem(token);
      }
    }, Number.isFinite(delayMs) ? Math.max(0, delayMs) : 0);
  }

  private async runMarquee(token: number): Promise<void> {
    const track = this.trackRef.single();
    const distance = this.getMarqueeDistance();
    if (!track || distance <= 0) return;

    const reverse = this.getDirection() === 'reverse';
    const start = this.getMarqueeStartOffset();
    const destination = reverse ? 0 : -distance;

    const configuredSpeed = this.viewModel.marqueeSpeed ?? 32;
    const speed = Number.isFinite(configuredSpeed) ? Math.max(1, configuredSpeed) : 32;
    const configuredDuration = this.viewModel.marqueeDurationMs;
    const travelDurationMs = Number.isFinite(configuredDuration) && configuredDuration !== undefined && configuredDuration > 0
      ? configuredDuration
      : Math.max(1400, (distance / speed) * 1000);
    this.viewModel.onMarqueeCycleStart?.();
    try {
      const completed = await this.runAnimation(
        {
          duration: travelDurationMs / 1000,
          curve: AnimationCurve.Linear,
          beginFromCurrentState: true,
        },
        () => track.setAttribute('translationX', destination),
      );
      if (!completed) return;
    } catch {
      return;
    }

    if (this.isDestroyed() || token !== this.motionToken || !this.isActive()) return;
    this.viewModel.onMarqueeCycleEnd?.();
    if (!this.shouldRepeat()) return;
    track.setAttribute('translationX', start);
    const loopDelayMs = this.viewModel.loopDelayMs ?? 0;
    this.scheduleNext(token, Number.isFinite(loopDelayMs) ? Math.max(0, loopDelayMs) : 0);
  }

  private async advanceItem(token: number): Promise<void> {
    const track = this.trackRef.single();
    const items = this.getItems();
    const pageSize = this.getPageSize();
    if (!track || items.length < 2 || pageSize <= 0) return;

    const reverse = this.getDirection() === 'reverse';
    const hasLoopClone = this.shouldRepeat() && this.getItems().length > 1 && items.length > this.getItems().length;
    if (hasLoopClone && !reverse && this.currentPageIndex === items.length - 1) {
      // A hot reload may preserve the old sentinel page; it is visually the first item.
      this.currentPageIndex = 0;
      this.setTrackOffset(0);
    }
    const lastRealPage = hasLoopClone && !reverse ? items.length - 2 : items.length - 1;
    let targetIndex = this.currentPageIndex + (reverse ? -1 : 1);

    if (reverse && this.currentPageIndex === 0 && this.shouldRepeat()) {
      // The duplicate of the last item is visually identical; move to it before sliding down/right.
      this.currentPageIndex = items.length;
      this.setTrackOffset(-this.currentPageIndex * pageSize);
      targetIndex = items.length - 1;
    } else if (!reverse && hasLoopClone && this.currentPageIndex === lastRealPage) {
      targetIndex = items.length - 1;
    } else if (!reverse && this.currentPageIndex === lastRealPage && this.shouldRepeat()) {
      targetIndex = items.length;
    } else if (targetIndex < 0 || targetIndex > lastRealPage) {
      return;
    }

    const trackAttribute = this.getOrientation() === 'horizontal' ? 'translationX' : 'translationY';
    const destination = -targetIndex * pageSize;
    const targetIsLoopClone = hasLoopClone && !reverse && targetIndex === items.length - 1;
    const targetItemIndex = reverse ? items.length - 1 - targetIndex : targetIsLoopClone ? 0 : targetIndex % items.length;
    try {
      const curve = this.viewModel.transitionCurve ?? AnimationCurve.EaseInOut;
      const rotateTransition = this.viewModel.rotateTransition ?? 'slide';
      if (rotateTransition === 'slide') {
        const completed = await this.runAnimation(
          {
            duration: this.getTransitionDuration(this.viewModel.transitionDurationMs, 280) / 1000,
            curve,
            beginFromCurrentState: true,
          },
          () => {
            track.setAttribute(trackAttribute, destination);
            // Let observers update coupled layout in the same animation transaction,
            // after the ticker has begun moving toward its next page.
            this.viewModel.onItemWillChange?.(targetItemIndex, items[targetItemIndex]);
          },
        );
        if (!completed) return;
      } else {
        const configuredDistance = this.viewModel.transitionDistance ?? 10;
        const distance = this.viewModel.rotateTransition === 'fade-slide' && Number.isFinite(configuredDistance)
          ? Math.max(0, configuredDistance)
          : 0;
        const directionSign = this.getDirection() === 'forward' ? -1 : 1;
        const currentOffset = -this.currentPageIndex * pageSize;
        const exitDuration = this.getTransitionDuration(
          this.viewModel.exitDurationMs,
          this.viewModel.transitionDurationMs ?? 280,
        );
        const enterDuration = this.getTransitionDuration(
          this.viewModel.enterDurationMs,
          this.viewModel.transitionDurationMs ?? 280,
        );
        const exited = await this.runAnimation(
          { duration: exitDuration / 1000, curve, beginFromCurrentState: true },
          () => {
            this.viewModel.onItemWillChange?.(targetItemIndex, items[targetItemIndex]);
            track.setAttribute(trackAttribute, currentOffset + directionSign * distance);
            track.setAttribute('opacity', 0);
          },
        );
        if (!exited || this.isDestroyed() || token !== this.motionToken || !this.isActive()) return;

        // Match the original search ticker: the next label starts on the same side
        // the previous label exited from, then fades and settles into place.
        track.setAttribute(trackAttribute, destination + directionSign * distance);
        const entered = await this.runAnimation(
          { duration: enterDuration / 1000, curve, beginFromCurrentState: true },
          () => {
            track.setAttribute(trackAttribute, destination);
            track.setAttribute('opacity', 1);
          },
        );
        if (!entered) return;
      }
    } catch {
      return;
    }

    if (this.isDestroyed() || token !== this.motionToken || !this.isActive()) return;

    if (!reverse && (targetIndex === items.length || targetIsLoopClone)) {
      this.currentPageIndex = 0;
      this.setTrackOffset(0);
      this.viewModel.onItemChange?.(0, items[0]);
    } else {
      this.currentPageIndex = targetIndex;
      const itemIndex = reverse ? items.length - 1 - targetIndex : targetIndex;
      this.viewModel.onItemChange?.(itemIndex, items[itemIndex]);
    }

    if (!this.shouldRepeat() && (reverse ? this.currentPageIndex === 0 : this.currentPageIndex === lastRealPage)) return;
    this.scheduleNext(token);
  }

  private setTrackOffset(offset: number): void {
    const track = this.trackRef.single();
    if (!track) return;
    track.setAttribute(this.getOrientation() === 'horizontal' ? 'translationX' : 'translationY', offset);
  }

  private getTransitionDuration(durationMs: number | undefined, fallbackMs: number): number {
    const duration = Number.isFinite(durationMs) ? durationMs ?? fallbackMs : fallbackMs;
    return Math.max(1, duration);
  }

  private resetTrackPosition(): void {
    if (this.getMode() === 'marquee') {
      this.setMarqueeTrackOffset();
      return;
    }

    this.setTrackOffset(-this.currentPageIndex * this.getPageSize());
    this.trackRef.single()?.setAttribute('opacity', 1);
  }

  private animateToCurrentPosition(): void {
    if (this.getMode() === 'marquee') {
      this.setMarqueeTrackOffset();
      return;
    }
    const track = this.trackRef.single();
    if (!track) return;
    const offset = -this.currentPageIndex * this.getPageSize();
    const attribute = this.getOrientation() === 'horizontal' ? 'translationX' : 'translationY';
    this.animate(
      { duration: 0.16, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
      () => {
        track.setAttribute(attribute, offset);
        track.setAttribute('opacity', 1);
      },
    );
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private async runAnimation(
    options: { duration: number; curve: AnimationCurve; beginFromCurrentState: boolean },
    animations: () => void,
  ): Promise<boolean> {
    const animation = this.createAnimation(options, animations);
    this.activeAnimation = animation;
    try {
      // Valdi resolves start() with `true` when cancelled and `false` on success.
      return !(await animation.start());
    } finally {
      if (this.activeAnimation === animation) this.activeAnimation = undefined;
    }
  }

  private cancelAnimation(): void {
    this.activeAnimation?.cancel();
    this.activeAnimation = undefined;
  }

  onRender(): void {
    const items = this.getItems();
    const mode = this.getMode();
    const orientation = this.getOrientation();
    const isHorizontal = orientation === 'horizontal';
    const requestedLines = this.viewModel.numberOfLines ?? 1;
    const numberOfLines = Number.isFinite(requestedLines) ? Math.max(1, Math.floor(requestedLines)) : 1;
    const textStyle = this.getResolvedTextStyle();
    const leadingIcons = this.getOrderedLeadingIcons();
    const hasMarqueeOverflow = this.state.itemWidth > this.state.viewportWidth + 1;

      <scroll
      style={this.viewModel.style ?? styles.viewport}
      horizontal={isHorizontal}
      scrollEnabled={false}
      accessibilityLabel={this.viewModel.accessibilityLabel}
      accessibilityNavigation={this.viewModel.accessibilityLabel ? 'leaf' : undefined}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      onLayout={this.handleViewportLayout}
    >
      {mode === 'marquee' ? (
        <view ref={this.trackRef} style={styles.marqueeTrack}>
          {items.length > 0 ? (
            <label
              value={items[0]}
              style={textStyle}
              numberOfLines={numberOfLines}
              textOverflow="clip"
              onLayout={this.handleItemLayout}
            />
          ) : null}
          {items.length > 0 && hasMarqueeOverflow ? <layout style={this.getMarqueeGapStyle()} /> : null}
          {items.length > 0 && hasMarqueeOverflow ? (
            <label
              value={items[0]}
              style={textStyle}
              numberOfLines={numberOfLines}
              textOverflow="clip"
              accessibilityNavigation="ignored"
            />
          ) : null}
        </view>
      ) : (
        <view
          ref={this.trackRef}
          style={isHorizontal ? styles.rotateTrackHorizontal : styles.rotateTrackVertical}
        >
          {this.getOrderedItems().map((item, index) => (
            <view
              key={`ticker-page-${index}`}
              style={this.getPageStyle()}
            >
              {leadingIcons[index] ? (
                <layout style={styles.pageWithLeadingIcon}>
                  <image
                    src={leadingIcons[index]}
                    tint={this.viewModel.leadingIconTint}
                    style={styles.leadingIcon.extend({
                      height: this.viewModel.leadingIconSize ?? 16,
                      marginRight: this.viewModel.leadingIconGap ?? 8,
                      width: this.viewModel.leadingIconSize ?? 16,
                    })}
                    objectFit="contain"
                  />
                  <label value={item} style={textStyle} numberOfLines={numberOfLines} textOverflow="clip" />
                </layout>
              ) : (
                <label value={item} style={textStyle} numberOfLines={numberOfLines} textOverflow="clip" />
              )}
            </view>
          ))}
        </view>
      )}
    </scroll>;
  }
}

const styles = {
  viewport: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1, width: '100%' }),
  marqueeTrack: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0 }),
  marqueeGap: new Style<Layout>({ flexShrink: 0 }),
  rotateTrackHorizontal: new Style<View>({ flexDirection: 'row', flexShrink: 0 }),
  rotateTrackVertical: new Style<View>({ flexDirection: 'column', flexShrink: 0 }),
  page: new Style<View>({ alignItems: 'center', flexShrink: 0, justifyContent: 'center' }),
  pageWithLeadingIcon: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minWidth: 0, width: '100%' }),
  leadingIcon: new Style<ImageView>({ flexShrink: 0 }),
  marqueeText: typography.body.extend({ flexShrink: 0 }),
  marqueeTextInvariant: new Style<Label>({ flexGrow: 0, flexShrink: 0 }),
  rotateText: typography.body.extend({ textAlign: 'center', width: '100%' }),
  rotateTextWithLeadingIcon: typography.body.extend({ flexGrow: 1, flexShrink: 1, textAlign: 'left' }),
  rotateTextInvariant: new Style<Label>({ flexGrow: 0, flexShrink: 0 }),
};
