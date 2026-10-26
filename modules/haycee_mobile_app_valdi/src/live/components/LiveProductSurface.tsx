import { Device } from 'valdi_core/src/Device';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ScrollDragEndingEvent, ScrollEndEvent, ScrollEvent, ScrollOffset } from 'valdi_tsx/src/GestureEvents';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ScrollViewInteractive, View } from 'valdi_tsx/src/NativeTemplateElements';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { layout } from '../../design-system/tokens/spacing';
import { LiveProductCard } from './LiveProductCard';
import type { LiveViewerProduct } from '../data/LiveViewerData';

export interface LiveProductSurfaceViewModel {
  products: LiveViewerProduct[];
  onProductAction: (product: LiveViewerProduct) => void;
}

interface LiveProductSurfaceState {
  activeIndex: number;
  viewportWidth: number;
}

/** Reusable live offer slot. It cycles through every product and wraps seamlessly. */
export class LiveProductSurface extends StatefulComponent<LiveProductSurfaceViewModel, LiveProductSurfaceState> {
  state: LiveProductSurfaceState = { activeIndex: 0, viewportWidth: 0 };

  private readonly scrollRef = new ElementRef<ScrollViewInteractive>();
  private positioned = false;
  private autoAdvanceToken = 0;
  private productIds = '';

  onCreate(): void {
    this.productIds = this.products().map(product => product.id).join('|');
    this.scheduleAutoAdvance();
  }

  onViewModelUpdate(previousViewModel?: Readonly<LiveProductSurfaceViewModel>): void {
    if (!previousViewModel) return;
    const nextIds = this.products().map(product => product.id).join('|');
    if (nextIds === this.productIds) return;

    this.productIds = nextIds;
    this.positioned = false;
    this.autoAdvanceToken += 1;
    const nextCount = this.products().length;
    const nextIndex = nextCount > 1 ? nextCount : 0;
    this.setState({ activeIndex: nextIndex, viewportWidth: this.state.viewportWidth });
    this.setTimeoutDisposable(() => {
      if (this.isDestroyed() || this.positioned || this.products().length === 0) return;
      const scroll = this.scrollRef.single();
      if (!scroll) return;
      const count = this.products().length;
      const step = this.stepWidth();
      scroll.setAttribute('staticContentWidth', step * count * (count > 1 ? 3 : 1));
      scroll.setAttribute('contentOffsetAnimated', false);
      scroll.setAttribute('contentOffsetX', count > 1 ? count * step : 0);
      scroll.setAttribute('contentOffsetAnimated', true);
      this.positioned = true;
      this.scheduleAutoAdvance();
    }, 0);
  }

  private products(): LiveViewerProduct[] {
    return this.viewModel.products;
  }

  private cardWidth(): number {
    const availableWidth = Math.max(1, Device.getWindowWidth() - layout.live.viewer.horizontalPadding * 2);
    return Math.max(1, Math.min(layout.live.viewer.productCardWidth, availableWidth));
  }

  private stepWidth(): number {
    return this.cardWidth() + layout.live.viewer.productCarouselGap;
  }

  private normalizePhysicalIndex(index: number, count: number): number {
    if (index < count) return index + count;
    if (index >= count * 2) return index - count;
    return index;
  }

  private handleLayout = (frame: ElementFrame): void => {
    const viewportWidth = Math.max(0, Math.round(frame.width));
    if (viewportWidth === this.state.viewportWidth) return;
    this.positioned = false;
    this.setState({ activeIndex: this.state.activeIndex, viewportWidth });
  };

  private handleScrollLayout = (_frame: ElementFrame): void => {
    if (this.positioned || this.products().length === 0) return;
    const scroll = this.scrollRef.single();
    if (!scroll) return;

    const count = this.products().length;
    const step = this.stepWidth();
    scroll.setAttribute('staticContentWidth', step * count * (count > 1 ? 3 : 1));
    scroll.setAttribute('contentOffsetAnimated', false);
    scroll.setAttribute('contentOffsetX', count > 1 ? step * count : 0);
    this.positioned = true;
    this.setState({ activeIndex: count, viewportWidth: this.state.viewportWidth });
  };

  private handleScroll = (event: ScrollEvent): void => {
    const count = this.products().length;
    if (count === 0) return;
    if (count === 1) {
      this.setState({ activeIndex: 0, viewportWidth: this.state.viewportWidth });
      return;
    }
    const index = Math.max(0, Math.min(count * 3 - 1, Math.round(event.x / this.stepWidth())));
    if (index !== this.state.activeIndex) {
      this.setState({ activeIndex: index, viewportWidth: this.state.viewportWidth });
    }
  };

  private handleDragEnding = (event: ScrollDragEndingEvent): ScrollOffset => {
    const count = this.products().length;
    const step = this.stepWidth();
    if (count === 0 || step <= 0) return { x: event.x, y: event.y };

    const currentOffset = this.state.activeIndex * step;
    const movement = event.x - currentOffset;
    const direction = Math.abs(movement) >= step * 0.2 ? Math.sign(movement) : Math.sign(event.velocityX);
    const index = Math.max(0, Math.min(count * 3 - 1, this.state.activeIndex + direction));
    this.scheduleAutoAdvance();
    return { x: index * step, y: event.y };
  };

  private handleScrollEnd = (event: ScrollEndEvent): void => {
    const count = this.products().length;
    if (count === 0) return;
    const step = this.stepWidth();
    const physicalIndex = Math.max(0, Math.min(count * 3 - 1, Math.round(event.x / step)));
    const normalizedIndex = this.normalizePhysicalIndex(physicalIndex, count);

    if (physicalIndex !== normalizedIndex) {
      const scroll = this.scrollRef.single();
      if (scroll) {
        scroll.setAttribute('contentOffsetAnimated', false);
        scroll.setAttribute('contentOffsetX', normalizedIndex * step);
        scroll.setAttribute('contentOffsetAnimated', true);
      }
    }
    this.setState({ activeIndex: normalizedIndex, viewportWidth: this.state.viewportWidth });
    this.scheduleAutoAdvance();
  };

  private scheduleAutoAdvance(): void {
    const token = ++this.autoAdvanceToken;
    if (this.products().length < 2) return;
    this.setTimeoutDisposable(() => this.advance(token), layout.live.viewer.productAutoAdvanceMilliseconds);
  }

  private advance(token: number): void {
    if (this.isDestroyed() || token !== this.autoAdvanceToken || this.products().length < 2) return;
    const count = this.products().length;
    const currentIndex = this.state.activeIndex;
    const nextPhysicalIndex = currentIndex + 1;
    const targetIndex = nextPhysicalIndex >= count * 2 ? nextPhysicalIndex - count : nextPhysicalIndex;
    const scroll = this.scrollRef.single();
    if (scroll) {
      scroll.setAttribute('contentOffsetAnimated', true);
      scroll.setAttribute('contentOffsetX', targetIndex * this.stepWidth());
    }
    this.setState({ activeIndex: targetIndex, viewportWidth: this.state.viewportWidth });
    this.scheduleAutoAdvance();
  }

  onRender(): void {
    const products = this.products();
    const count = products.length;
    const cardWidth = this.cardWidth();
    const step = this.stepWidth();
    const repeatedProducts = count > 1 ? [...products, ...products, ...products] : products;

    <view style={styles.surface} onLayout={this.handleLayout}>
      {count > 0 ? (
        <scroll
          {...noBounceScrollAttributes}
          ref={this.scrollRef}
          width={this.state.viewportWidth || cardWidth}
          height={layout.live.viewer.productCardHeight}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          onLayout={this.handleScrollLayout}
          onScroll={this.handleScroll}
          onDragEnding={this.handleDragEnding}
          onScrollEnd={this.handleScrollEnd}
        >
          {repeatedProducts.map((product, physicalIndex) => (
            <view
              key={`live-product-${physicalIndex}-${product.id}`}
              style={styles.cardSlot}
              width={step}
              height={layout.live.viewer.productCardHeight}
            >
              <LiveProductCard
                product={product}
                width={cardWidth}
                active={physicalIndex === this.state.activeIndex}
                onBuy={this.viewModel.onProductAction}
              />
            </view>
          ))}
        </scroll>
      ) : null}
    </view>;
  }
}

const styles = {
  surface: new Style<View>({
    marginLeft: layout.live.viewer.horizontalPadding,
    marginRight: layout.live.viewer.horizontalPadding,
  }),
  cardSlot: new Style<View>({
    alignItems: 'center',
    justifyContent: 'center',
  }),
};
