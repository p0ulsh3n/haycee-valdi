import { Device } from 'valdi_core/src/Device';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ScrollDragEndingEvent, ScrollEndEvent, ScrollEvent, ScrollOffset } from 'valdi_tsx/src/GestureEvents';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { Label, ScrollViewInteractive, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { noBounceScrollAttributes } from '../tokens/scrollBehavior';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { fontSize, metropolis } from '../tokens/typography';

export interface ImageCarouselViewModel {
  imageUrls?: string[];
  fallbackColors: string[];
  initialIndex?: number;
  topInset?: number;
  width: number;
  height: number;
  showCounter?: boolean;
  onTap?: () => void;
  onIndexChange?: (index: number) => void;
}

interface ImageCarouselState {
  index: number;
  viewportWidth: number;
}

const paginationSlotWidth = 16;

/** Reusable full-width carousel with native paging and gesture-following state. */
export class ImageCarousel extends StatefulComponent<ImageCarouselViewModel, ImageCarouselState> {
  state: ImageCarouselState = {
    index: 0,
    viewportWidth: 0,
  };

  private readonly scrollRef = new ElementRef<ScrollViewInteractive>();
  private readonly paginationIndicatorRef = new ElementRef<View>();
  private positioned = false;

  onCreate(): void {
    const count = this.slideCount();
    this.state = {
      index: Math.max(0, Math.min(Math.max(0, count - 1), this.viewModel.initialIndex ?? 0)),
      viewportWidth: 0,
    };
  }

  private images(): string[] {
    return this.viewModel.imageUrls && this.viewModel.imageUrls.length > 0
      ? this.viewModel.imageUrls
      : [];
  }

  private colors(): string[] {
    return this.viewModel.fallbackColors.length > 0 ? this.viewModel.fallbackColors : ['#000000'];
  }

  private slideCount(): number {
    const images = this.images();
    return images.length > 0 ? images.length : this.colors().length;
  }

  private width = (): number => Math.max(this.state.viewportWidth || this.viewModel.width || Device.getWindowWidth(), 1);

  private handleLayout = (frame: ElementFrame): void => {
    const width = Math.max(0, Math.round(frame.width));
    if (width === this.state.viewportWidth) return;

    this.positioned = false;
    this.setState({ viewportWidth: width });
  };

  private updateIndex = (offsetX: number): void => {
    const width = this.width();
    const count = this.slideCount();
    if (width <= 0 || count <= 0) return;

    const index = Math.max(0, Math.min(count - 1, Math.round(offsetX / width)));
    if (index === this.state.index) return;

    this.setState({ index });
    this.viewModel.onIndexChange?.(index);
  };

  private updatePaginationIndicator = (offsetX: number): void => {
    const width = this.width();
    const count = this.slideCount();
    const indicator = this.paginationIndicatorRef.single();
    if (!indicator || width <= 0 || count <= 1) return;

    const progress = Math.max(0, Math.min(count - 1, offsetX / width));
    indicator.setAttribute('translationX', progress * paginationSlotWidth);
  };

  private handleScroll = (event: ScrollEvent): void => {
    // Follow the finger continuously; the discrete index still controls the
    // accessible 1/3 label while the active dot moves fractionally.
    this.updatePaginationIndicator(event.x);
    this.updateIndex(event.x);
  };

  private handleDragEnding = (event: ScrollDragEndingEvent): ScrollOffset => {
    const width = this.width();
    const count = this.slideCount();
    if (width <= 0 || count <= 0) return { x: event.x, y: event.y };

    const currentIndex = this.state.index;
    const currentOffset = currentIndex * width;
    const movement = event.x - currentOffset;
    const threshold = width * 0.2;
    const direction = Math.abs(movement) >= threshold
      ? Math.sign(movement)
      : Math.sign(event.velocityX);
    const targetIndex = Math.max(0, Math.min(count - 1, currentIndex + direction));

    // Valdi calls this synchronously before momentum starts. Returning this
    // offset prevents a fast fling from skipping directly from slide 1 to 3.
    return { x: targetIndex * width, y: event.y };
  };

  private handleScrollEnd = (event: ScrollEndEvent): void => {
    const width = this.width();
    const count = this.slideCount();
    if (width <= 0 || count <= 0) return;

    const index = Math.max(0, Math.min(count - 1, Math.round(event.x / width)));
    this.updatePaginationIndicator(index * width);
    this.updateIndex(index * width);

    const scroll = this.scrollRef.single();
    if (scroll) {
      scroll.setAttribute('contentOffsetAnimated', true);
      scroll.setAttribute('contentOffsetX', index * width);
    }
  };

  private handleScrollLayout = (_frame: ElementFrame): void => {
    if (this.positioned) return;

    const scroll = this.scrollRef.single();
    if (!scroll) return;

    const width = this.width();
    scroll.setAttribute('staticContentWidth', width * Math.max(1, this.slideCount()));
    scroll.setAttribute('contentOffsetAnimated', false);
    scroll.setAttribute('contentOffsetX', this.state.index * width);
    this.updatePaginationIndicator(this.state.index * width);
    this.positioned = true;
  };

  private renderPagination(): void {
    const count = this.slideCount();
    if (count <= 1) return;

    {this.viewModel.showCounter !== false ? (
      <view style={styles.pagination.extend({ top: (this.viewModel.topInset ?? 0) + spacing.sm })}>
        <label
          value={`${this.state.index + 1}/${count}`}
          style={styles.paginationLabel}
          numberOfLines={1}
        />
      </view>
    ) : null}

    <view style={styles.paginationDotsOuter}>
      <view style={styles.paginationDotsTrack.extend({ width: count * paginationSlotWidth })}>
        {Array.from({ length: count }).map((_item, index) => (
          <view key={'carousel-dot-' + index} style={styles.paginationDot} />
        ))}
        <view ref={this.paginationIndicatorRef} style={styles.paginationIndicator} />
      </view>
    </view>;
  }

  onRender(): void {
    const images = this.images();
    const fallbackColors = this.colors();
    const width = this.width();
    const height = Math.max(1, this.viewModel.height);

    <view style={styles.root} width={this.viewModel.width} height={height} onLayout={this.handleLayout}>
      <scroll
        {...noBounceScrollAttributes}
        ref={this.scrollRef}
        width={width}
        height={height}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        onLayout={this.handleScrollLayout}
        onScroll={this.handleScroll}
        onDragEnding={this.handleDragEnding}
        onScrollEnd={this.handleScrollEnd}
      >
        {images.length > 0 ? images.map((imageUrl, index) => (
          <view key={'carousel-image-' + index} style={styles.page} width={width} height={height} onTap={this.viewModel.onTap} accessibilityCategory="button">
            <image src={imageUrl} width={width} height={height} objectFit="contain" style={styles.image} />
          </view>
        )) : fallbackColors.map((color, index) => (
          <view key={'carousel-color-' + index} style={styles.page} width={width} height={height} onTap={this.viewModel.onTap} accessibilityCategory="button">
            <view width={width} height={height} backgroundColor={color} style={styles.fallback}>
              <label value="APERÇU PRODUIT" style={styles.fallbackLabel} />
            </view>
          </view>
        ))}
      </scroll>
      {this.renderPagination()}
    </view>;
  }
}

const styles = {
  root: new Style<View>({
    backgroundColor: colors.backgroundDark,
    position: 'relative',
  }),
  page: new Style<View>({
    alignItems: 'center',
    justifyContent: 'center',
  }),
  image: new Style<View>({
    backgroundColor: colors.backgroundDark,
  }),
  fallback: new Style<View>({
    alignItems: 'center',
    justifyContent: 'center',
  }),
  fallbackLabel: new Style<Label>({
    color: colors.textInverted,
    font: metropolis.bold(fontSize.label),
    letterSpacing: 1.5,
  }),
  pagination: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundOverlay,
    borderRadius: radius.full,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.lg,
    height: 40,
    minWidth: 40,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  }),
  paginationLabel: new Style<Label>({
    color: colors.textInverted,
    font: metropolis.bold(fontSize.metadata),
    letterSpacing: 0.2,
  }),
  paginationDotsOuter: new Style<View>({
    bottom: spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  }),
  paginationDotsTrack: new Style<View>({
    flexDirection: 'row',
    height: 6,
    position: 'relative',
  }),
  paginationDot: new Style<View>({
    backgroundColor: colors.mediaIndicatorInactive,
    borderRadius: radius.full,
    height: 6,
    marginLeft: 5,
    marginRight: 5,
    width: 6,
  }),
  paginationIndicator: new Style<View>({
    backgroundColor: colors.mediaIndicatorActive,
    borderRadius: radius.full,
    height: 6,
    left: -1,
    position: 'absolute',
    top: 0,
    width: 18,
  }),
};
