import { ElementRef } from 'valdi_core/src/ElementRef';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ScrollDragEndingEvent, ScrollEndEvent, ScrollOffset } from 'valdi_tsx/src/GestureEvents';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { Layout, ScrollViewInteractive, View } from 'valdi_tsx/src/NativeTemplateElements';
import { noBounceScrollAttributes } from '../tokens/scrollBehavior';
import { colors } from '../tokens/colors';

export interface VerticalSnapFeedViewModel {
  /** Stable IDs; also used as native page keys. */
  pageIds: string[];
  initialIndex?: number;
  /** Render one full-viewport page. Keep this callback stable in the owning screen. */
  renderPage: (index: number, isActive: boolean, width: number, height: number) => void;
  /** Optional page-scoped overlay slot, such as the shared engagement action rail. */
  renderActions?: (index: number, isActive: boolean) => void;
  /** Bump when external page-action state changes and the overlay callback output must refresh. */
  actionOverlayRevision?: number;
  onActiveIndexChange?: (index: number) => void;
  /** Called once per settled page when the feed reaches its final two loaded pages. */
  hasMore?: boolean;
  onLoadMore?: () => void | Promise<unknown>;
}

interface VerticalSnapFeedState {
  activeIndex: number;
  viewportWidth: number;
  viewportHeight: number;
}

/** Native, vertically paged feed with bounded edges and viewport-sized pages. */
export class VerticalSnapFeed extends StatefulComponent<VerticalSnapFeedViewModel, VerticalSnapFeedState> {
  state: VerticalSnapFeedState = {
    activeIndex: 0,
    viewportWidth: 0,
    viewportHeight: 0,
  };

  private readonly scrollRef = new ElementRef<ScrollViewInteractive>();
  private configuredHeight = 0;
  private configuredPageCount = -1;
  private requestInFlight = false;
  private lastLoadMoreIndex = -1;

  onCreate(): void {
    this.state = {
      activeIndex: this.clampIndex(this.viewModel.initialIndex ?? 0),
      viewportWidth: 0,
      viewportHeight: 0,
    };
  }

  onViewModelUpdate(previous?: VerticalSnapFeedViewModel): void {
    if (previous?.pageIds !== this.viewModel.pageIds) {
      const previousActiveId = previous?.pageIds[this.state.activeIndex];
      const retainedIndex = previousActiveId ? this.viewModel.pageIds.indexOf(previousActiveId) : -1;
      const nextIndex = retainedIndex >= 0
        ? retainedIndex
        : this.clampIndex(this.viewModel.initialIndex ?? this.state.activeIndex);
      this.configuredPageCount = -1;
      this.lastLoadMoreIndex = -1;
      if (nextIndex !== this.state.activeIndex) {
        this.setState({ activeIndex: nextIndex });
      }
      this.configureScroll(this.state.viewportHeight, nextIndex);
      this.requestMoreIfNeeded(nextIndex);
    }
  }

  private clampIndex(index: number): number {
    return Math.max(0, Math.min(Math.max(0, this.viewModel.pageIds.length - 1), index));
  }

  private configureScroll(height: number, activeIndex: number): void {
    const scroll = this.scrollRef.single();
    if (!scroll || height <= 0) return;

    const pageCount = this.viewModel.pageIds.length;
    if (this.configuredHeight === height && this.configuredPageCount === pageCount) return;

    this.configuredHeight = height;
    this.configuredPageCount = pageCount;
    scroll.setAttribute('staticContentHeight', Math.max(height, height * pageCount));
    scroll.setAttribute('contentOffsetAnimated', false);
    scroll.setAttribute('contentOffsetY', this.clampIndex(activeIndex) * height);
  }

  private handleLayout = (frame: ElementFrame): void => {
    const width = Math.max(1, Math.round(frame.width));
    const height = Math.max(1, Math.round(frame.height));
    if (width !== this.state.viewportWidth || height !== this.state.viewportHeight) {
      this.setState({ viewportWidth: width, viewportHeight: height });
    }
    this.configureScroll(height, this.state.activeIndex);
    this.requestMoreIfNeeded(this.state.activeIndex);
  };

  private handleDragEnding = (event: ScrollDragEndingEvent): ScrollOffset => {
    const height = this.state.viewportHeight;
    const pageCount = this.viewModel.pageIds.length;
    if (height <= 0 || pageCount <= 1) return { x: event.x, y: event.y };

    const currentOffset = this.state.activeIndex * height;
    const movement = event.y - currentOffset;
    const direction = Math.abs(movement) >= height * 0.18
      ? Math.sign(movement)
      : Math.sign(event.velocityY);
    const targetIndex = this.clampIndex(this.state.activeIndex + direction);

    // Keep each gesture to the adjacent page and clamp both ends before native settling.
    return { x: event.x, y: targetIndex * height };
  };

  private requestMoreIfNeeded(index: number): void {
    const pageCount = this.viewModel.pageIds.length;
    const onLoadMore = this.viewModel.onLoadMore;
    if (
      !this.viewModel.hasMore
      || !onLoadMore
      || this.requestInFlight
      || pageCount === 0
      || index < pageCount - 2
      || this.lastLoadMoreIndex === index
    ) {
      return;
    }

    this.lastLoadMoreIndex = index;
    this.requestInFlight = true;
    try {
      const result = onLoadMore();
      if (result && typeof result.then === 'function') {
        result.then(
          () => { this.requestInFlight = false; },
          () => {
            this.requestInFlight = false;
            this.lastLoadMoreIndex = -1;
          },
        );
      } else {
        this.requestInFlight = false;
      }
    } catch (_error) {
      this.requestInFlight = false;
      this.lastLoadMoreIndex = -1;
    }
  }

  private handleScrollEnd = (event: ScrollEndEvent): void => {
    const height = this.state.viewportHeight;
    if (height <= 0 || this.viewModel.pageIds.length === 0) return;

    const index = this.clampIndex(Math.round(event.y / height));
    if (index !== this.state.activeIndex) {
      this.setState({ activeIndex: index });
      this.viewModel.onActiveIndexChange?.(index);
    }
    this.requestMoreIfNeeded(index);
  };

  onRender(): void {
    const { pageIds, renderPage, renderActions } = this.viewModel;
    const { activeIndex, viewportWidth, viewportHeight } = this.state;
    const width = Math.max(1, viewportWidth);
    const height = Math.max(1, viewportHeight);

    <view style={styles.root}>
      <scroll
        ref={this.scrollRef}
        style={styles.scroll}
        {...noBounceScrollAttributes}
        horizontal={false}
        pagingEnabled={true}
        scrollEnabled={pageIds.length > 1}
        showsVerticalScrollIndicator={false}
        viewportExtensionTop={height}
        viewportExtensionBottom={height}
        onLayout={this.handleLayout}
        onDragEnding={this.handleDragEnding}
        onScrollEnd={this.handleScrollEnd}
      >
        {pageIds.map((pageId, index) => (
          <view key={pageId} style={styles.page} width={width} height={height} lazy={true}>
            {renderPage(index, index === activeIndex, width, height)}
            {renderActions ? renderActions(index, index === activeIndex) : null}
          </view>
        ))}
      </scroll>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundDark, flexGrow: 1, flexShrink: 1, height: '100%', width: '100%' }),
  scroll: new Style<ScrollViewInteractive>({ flexGrow: 1, flexShrink: 1, height: '100%', width: '100%' }),
  page: new Style<Layout>({ flexDirection: 'column', position: 'relative' }),
};
