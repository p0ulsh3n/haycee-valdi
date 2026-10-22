import { Device } from 'valdi_core/src/Device';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ContentSizeChangeEvent, ScrollEndEvent, ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import { Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { SkeletonView } from '../design-system/components/SkeletonView';
import { SkeletonLoadingContainer } from '../design-system/components/SkeletonLoadingContainer';
import { getMasonryImageAspectRatio, MasonryFeed, MasonryItem } from '../design-system/components/MasonryFeed';
import { MasonryProductCard } from '../design-system/components/MasonryProductCard';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { layout, spacing } from '../design-system/tokens/spacing';
import { HomeProduct, HomeProductRail } from './components/HomeProductRail';
import { HomePromoBannerCarousel } from './components/HomePromoBannerCarousel';
import { HomeSectionHeader } from './components/HomeSectionHeader';
import { getHomeCategory, HomeCategoryDefinition } from './data/HomeCategoryData';

const MASONRY_PAGE_SIZE = 16;
const MASONRY_SIMULATION_PAGES = 8;
const MASONRY_LOAD_DELAY_MS = 900;

export interface HomeContentViewModel {
  selectedCategoryKey?: string;
  isActive?: boolean;
  /** True for the active tab and its adjacent preloaded pages. */
  isPrepared?: boolean;
  onViewAllTap?: () => void;
  onProductTap?: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd?: (product: HomeProduct) => void;
  /** Optional API-backed page loader. The cursor is opaque to the caller. */
  loadMasonryPage?: (cursor: string | null) => Promise<HomeMasonryPage>;
}

export interface HomeMasonryPage {
  items: HomeProduct[];
  nextCursor: string | null;
}

interface HomeContentState {
  isLoading: boolean;
  masonryItems: HomeProduct[];
  masonryCursor: string | null;
  isMasonryLoadingMore: boolean;
  hasMasonryMore: boolean;
  masonryError?: string;
  enteringProductIds: string[];
}

/**
 * Category content page. Each pager page owns its loading state so a new
 * category can later be populated independently by an API request.
 */
export class HomeContent extends StatefulComponent<HomeContentViewModel, HomeContentState> {
  state: HomeContentState = {
    isLoading: true,
    masonryItems: [],
    masonryCursor: null,
    isMasonryLoadingMore: false,
    hasMasonryMore: true,
    enteringProductIds: [],
  };
  private hasStartedLoading = false;
  private contentHeight = 0;

  onCreate(): void {
    this.startLoadingIfPrepared();
  }

  onViewModelUpdate(previous?: HomeContentViewModel): void {
    const wasPrepared = previous?.isPrepared ?? previous?.isActive ?? false;
    if (this.isPrepared() && !wasPrepared) {
      this.startLoadingIfPrepared();
    }
  }

  private isPrepared(): boolean {
    return this.viewModel.isPrepared ?? this.viewModel.isActive ?? true;
  }

  private startLoadingIfPrepared(): void {
    if (this.hasStartedLoading || !this.isPrepared()) {
      return;
    }

    this.hasStartedLoading = true;
    this.setTimeoutDisposable(() => {
      this.requestMasonryPage(null, true);
    }, 1200);
  }

  private getMasonrySource(): HomeProduct[] {
    const category = getHomeCategory(this.viewModel.selectedCategoryKey ?? 'all');
    const baseProducts = [
      ...category.flashProducts,
      ...category.trendingProducts,
      ...category.dealsProducts,
    ];

    // Keep the local demo long enough to exercise several end-reached cycles.
    // The real API loader can replace this source without changing pagination.
    const source: HomeProduct[] = [];
    const aspectRatios = [1.08, 1.25, 1.42];

    for (let pageIndex = 0; pageIndex < MASONRY_SIMULATION_PAGES; pageIndex += 1) {
      baseProducts.forEach((product, productIndex) => {
        source.push({
          ...product,
          id: `${product.id}-masonry-${pageIndex + 1}`,
          title: pageIndex === 0 ? product.title : `${product.title} ${pageIndex + 1}`,
          masonryAspectRatio: aspectRatios[(pageIndex + productIndex) % aspectRatios.length],
        });
      });
    }

    return source;
  }

  private handleContentSizeChange = (event: ContentSizeChangeEvent): void => {
    this.contentHeight = event.height;
  };

  private handlePageScroll = (event: ScrollEvent): void => {
    // ScrollEvent.y is the documented vertical content offset. The extra
    // runway matches viewportExtensionBottom and starts the next page early.
    if (this.contentHeight > 0 && event.y + 640 >= this.contentHeight) {
      this.loadMoreMasonry();
    }
  };

  private handlePageScrollEnd = (event: ScrollEndEvent): void => {
    // Android can settle at the end without emitting one last onScroll frame.
    // The official scroll end callback closes that gap; the sentinel remains
    // the primary trigger when the bottom view becomes visible.
    this.handlePageScroll(event);
  };

  private loadMoreMasonry = (): void => {
    if (
      this.state.isLoading ||
      this.state.isMasonryLoadingMore ||
      !this.state.hasMasonryMore
    ) {
      return;
    }

    this.setState({ isMasonryLoadingMore: true });
    this.requestMasonryPage(this.state.masonryCursor, false);
  };

  private retryMasonryLoad = (): void => {
    if (this.state.masonryItems.length === 0) {
      this.setState({ isLoading: true, masonryError: undefined });
      this.requestMasonryPage(null, true);
      return;
    }

    this.loadMoreMasonry();
  };

  private requestMasonryPage(cursor: string | null, replace: boolean): void {
    const loader = this.viewModel.loadMasonryPage;
    if (loader) {
      loader(cursor)
        .then(page => this.applyMasonryPage(page, replace))
        .catch(() => this.handleMasonryError());
      return;
    }

    // Local fixture fallback: it follows the same cursor contract as the API
    // without inventing a network endpoint. Replace this callback with the
    // real repository loader when the Home API is connected.
    const source = this.getMasonrySource();
    const start = cursor ? Number(cursor) : 0;
    const items = source.slice(start, start + MASONRY_PAGE_SIZE);
    const nextIndex = start + items.length;
    const page: HomeMasonryPage = {
      items,
      nextCursor: nextIndex < source.length ? String(nextIndex) : null,
    };

    this.setTimeoutDisposable(() => {
      this.applyMasonryPage(page, replace);
    }, replace ? 0 : MASONRY_LOAD_DELAY_MS);
  }

  private applyMasonryPage(page: HomeMasonryPage, replace: boolean): void {
    if (this.isDestroyed()) {
      return;
    }

    const currentIds = new Set(this.state.masonryItems.map(product => product.id));
    const newItems = replace
      ? []
      : page.items.filter(product => !currentIds.has(product.id));
    const masonryItems = replace ? page.items : [...this.state.masonryItems, ...newItems];

    this.setState({
      isLoading: false,
      masonryItems,
      masonryCursor: page.nextCursor,
      isMasonryLoadingMore: false,
      hasMasonryMore: page.nextCursor !== null,
      masonryError: undefined,
      enteringProductIds: newItems.map(product => product.id),
    });

    if (newItems.length > 0) {
      this.setTimeoutDisposable(() => {
        this.setState({ enteringProductIds: [] });
      }, 600);
    }
  }

  private handleMasonryError = (): void => {
    if (this.isDestroyed()) {
      return;
    }

    this.setState({
      isLoading: false,
      isMasonryLoadingMore: false,
      masonryError: 'Impossible de charger les produits.',
    });
  };

  private renderPageContent = (): void => {
    const category = getHomeCategory(this.viewModel.selectedCategoryKey ?? 'all');

    if (this.state.isLoading) {
      this.renderSkeleton(category);
      return;
    }

    this.renderLoadedContent(category);
  };

  private estimateMasonryItemHeight = (item: MasonryItem, columnWidth: number): number => (
    Math.round(columnWidth * getMasonryImageAspectRatio(item)) + 94
  );

  private renderMasonryItem = (item: MasonryItem, columnWidth: number): void => {
    const product = item as HomeProduct;
    <MasonryProductCard
      key={product.id}
      product={product}
      columnWidth={columnWidth}
      animateIn={this.state.enteringProductIds.includes(product.id)}
      onTap={this.handleMasonryProductTap}
      onQuickAdd={this.viewModel.onQuickAdd}
    />;
  };

  private handleMasonryProductTap = (product: HomeProduct): void => {
    const recommendations = this.state.masonryItems
      .filter(item => item.id !== product.id)
      .slice(0, 8);
    this.viewModel.onProductTap?.(product, recommendations);
  };

  onRender(): void {
    // SwipeTabs keeps all page shells mounted for native paging, but only the
    // committed page should build the expensive skeleton/feed tree.
    if (!this.isPrepared()) {
      <layout style={styles.inactivePage} />;
      return;
    }

    <SkeletonLoadingContainer
      isLoading={this.state.isLoading}
      scrollStyle={styles.pageScroll}
      onScroll={this.handlePageScroll}
      onScrollEnd={this.handlePageScrollEnd}
      onContentSizeChange={this.handleContentSizeChange}
      viewportExtensionBottom={200}
      children={this.renderPageContent}
    />;
  }

  private renderLoadedContent(category: HomeCategoryDefinition): void {
    <view backgroundColor={colors.backgroundPrimary}>
      <HomePromoBannerCarousel banners={category.banners} />
      <HomeProductRail
        title="Ventes flash"
        subtitle={`Les offres ${category.label.toLowerCase()} à ne pas manquer`}
        variant="flash"
        products={category.flashProducts}
        onProductTap={this.viewModel.onProductTap}
      />
      <HomeProductRail
        title="Tendances"
        variant="trending"
        products={category.trendingProducts}
        actionLabel="Voir tout"
        onViewAllTap={this.viewModel.onViewAllTap}
        onProductTap={this.viewModel.onProductTap}
      />
      <HomeProductRail
        title="Bonnes affaires"
        variant="deals"
        products={category.dealsProducts}
        onProductTap={this.viewModel.onProductTap}
      />
      <layout paddingBottom={48}>
        <HomeSectionHeader
          title={`Pour toi · ${category.label}`}
          subtitle="Sélectionné pour vous"
        />
      </layout>
      <MasonryFeed
        items={this.state.masonryItems}
        isLoadingMore={this.state.isMasonryLoadingMore}
        hasMore={this.state.hasMasonryMore}
        error={this.state.masonryError}
        onLoadMore={this.loadMoreMasonry}
        onRetry={this.retryMasonryLoad}
        renderItem={this.renderMasonryItem}
        estimateItemHeight={this.estimateMasonryItemHeight}
      />
    </view>;
  }

  private renderSkeleton(category: HomeCategoryDefinition): void {
    const bannerHeight = Math.round(Device.getWindowWidth() * layout.home.hero.aspectRatio);

    <view style={styles.skeletonRoot}>
      <SkeletonView width="100%" height={bannerHeight} borderRadius={0} />
      {this.renderSkeletonHeader(142, 210, true, false)}
      {this.renderFlashSkeletonRail(category)}
      {this.renderSkeletonHeader(116, 0, false, true)}
      {this.renderTrendingSkeletonRail(category)}
      {this.renderSkeletonHeader(132, 0, false, false)}
      {this.renderDealsSkeletonRail(category)}
      {this.renderSkeletonHeader(120, 176, true, false)}
    </view>;
  }

  private renderSkeletonHeader(
    titleWidth: number,
    subtitleWidth: number,
    hasSubtitle: boolean,
    hasAction: boolean,
  ): void {
    <layout style={styles.skeletonHeader}>
      <layout style={styles.skeletonHeaderCopy}>
        <SkeletonView width={titleWidth} height={15} borderRadius={4} />
        {hasSubtitle ? (
          <layout paddingTop={2}>
            <SkeletonView width={subtitleWidth} height={13} borderRadius={4} />
          </layout>
        ) : null}
      </layout>
      {hasAction ? <SkeletonView width={50} height={13} borderRadius={4} /> : null}
    </layout>;
  }

  private renderFlashSkeletonRail(category: HomeCategoryDefinition): void {
    const rail = layout.home.productRails.flash;

    <scroll
      {...noBounceScrollAttributes}
      style={styles.skeletonScroll.extend({ height: rail.railHeight })}
      horizontal={true}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
    >
      <layout style={styles.skeletonRail.extend({
        paddingBottom: layout.home.productRails.verticalPadding,
        paddingTop: layout.home.productRails.verticalPadding,
      })}>
        {category.flashProducts.map(product => (
          <layout key={`flash-skeleton-${product.id}`} style={styles.skeletonFlashCard}>
            <SkeletonView
              width={rail.imageWidth}
              height={rail.imageHeight}
              borderRadius={rail.imageRadius}
            />
            <layout style={styles.skeletonFlashContent}>
              <SkeletonView width={60} height={20} borderRadius={4} />
            </layout>
          </layout>
        ))}
      </layout>
    </scroll>;
  }

  private renderTrendingSkeletonRail(category: HomeCategoryDefinition): void {
    const rail = layout.home.productRails.trending;

    <scroll
      {...noBounceScrollAttributes}
      style={styles.skeletonScroll.extend({ height: rail.railHeight })}
      horizontal={true}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
    >
      <layout style={styles.skeletonRail.extend({
        paddingBottom: layout.home.productRails.verticalPadding,
        paddingTop: layout.home.productRails.verticalPadding,
      })}>
        {category.trendingProducts.map(product => (
          <view key={`trending-skeleton-${product.id}`} style={styles.skeletonTrendingCard}>
            <SkeletonView width={rail.cardWidth} height={rail.cardHeight} borderRadius={rail.cardRadius} />
            <view style={styles.skeletonTrendingOverlay}>
              <SkeletonView width={92} height={12} borderRadius={4} />
              <layout paddingTop={spacing.xs}>
                <SkeletonView width={58} height={18} borderRadius={4} />
              </layout>
            </view>
          </view>
        ))}
      </layout>
    </scroll>;
  }

  private renderDealsSkeletonRail(category: HomeCategoryDefinition): void {
    const rail = layout.home.productRails.deals;

    <scroll
      {...noBounceScrollAttributes}
      style={styles.skeletonScroll.extend({ height: rail.railHeight })}
      horizontal={true}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
    >
      <layout style={styles.skeletonRail.extend({
        paddingBottom: layout.home.productRails.verticalPadding,
        paddingTop: layout.home.productRails.verticalPadding,
      })}>
        {category.dealsProducts.map(product => (
          <view key={`deals-skeleton-${product.id}`} style={styles.skeletonDealsCard}>
            <SkeletonView width={rail.imageSize} height={rail.imageSize} borderRadius={rail.cardRadius} />
            <layout style={styles.skeletonDealsContent}>
              <SkeletonView width={120} height={15} borderRadius={4} />
              <layout paddingTop={spacing.xs}>
                <SkeletonView width={58} height={18} borderRadius={4} />
              </layout>
            </layout>
          </view>
        ))}
      </layout>
    </scroll>;
  }
}

const styles = {
  inactivePage: new Style<Layout>({
    flexGrow: 1,
  }),
  pageScroll: new Style<ScrollView>({
    backgroundColor: colors.backgroundPrimary,
    flexGrow: 1,
    flexShrink: 1,
    paddingBottom: 72,
  }),
  skeletonRoot: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexGrow: 1,
  }),
  skeletonHeader: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: layout.home.sectionHeader.verticalPadding,
    paddingLeft: layout.home.sectionHeader.horizontalPadding,
    paddingRight: layout.home.sectionHeader.horizontalPadding,
    paddingTop: layout.home.sectionHeader.verticalPadding,
  }),
  skeletonHeaderCopy: new Style<Layout>({
    flexGrow: 1,
    minWidth: 0,
  }),
  skeletonScroll: new Style<ScrollView>({
  }),
  skeletonRail: new Style<Layout>({
    flexDirection: 'row',
    paddingLeft: layout.home.productRails.horizontalPadding,
    paddingRight: layout.home.productRails.horizontalPadding,
  }),
  skeletonFlashCard: new Style<Layout>({
    marginRight: layout.home.productRails.gap,
    width: layout.home.productRails.flash.cardWidth,
  }),
  skeletonFlashContent: new Style<Layout>({
    paddingBottom: layout.home.productRails.flash.contentBottomPadding,
    paddingLeft: layout.home.productRails.flash.contentHorizontalPadding,
    paddingRight: layout.home.productRails.flash.contentHorizontalPadding,
    paddingTop: 8,
  }),
  skeletonTrendingCard: new Style<View>({
    borderRadius: layout.home.productRails.trending.cardRadius,
    height: layout.home.productRails.trending.cardHeight,
    marginRight: layout.home.productRails.gap,
    position: 'relative',
    width: layout.home.productRails.trending.cardWidth,
  }),
  skeletonTrendingOverlay: new Style<View>({
    bottom: 0,
    height: 80,
    justifyContent: 'flex-end',
    left: 0,
    padding: layout.home.productRails.trending.overlayPadding,
    position: 'absolute',
    right: 0,
  }),
  skeletonDealsCard: new Style<View>({
    borderRadius: layout.home.productRails.deals.cardRadius,
    flexDirection: 'row',
    height: layout.home.productRails.deals.cardHeight,
    marginRight: layout.home.productRails.gap,
    width: layout.home.productRails.deals.cardWidth,
  }),
  skeletonDealsContent: new Style<Layout>({
    flexGrow: 1,
    justifyContent: 'center',
    padding: layout.home.productRails.deals.contentPadding,
  }),
};
