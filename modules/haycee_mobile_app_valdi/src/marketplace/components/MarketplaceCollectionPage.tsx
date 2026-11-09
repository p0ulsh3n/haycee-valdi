import { Device } from 'valdi_core/src/Device';
import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { MasonryFeed, getMasonryImageAspectRatio } from '../../design-system/components/MasonryFeed';
import type { MasonryItem } from '../../design-system/components/MasonryFeed';
import { MasonryProductCard } from '../../design-system/components/MasonryProductCard';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { colors } from '../../design-system/tokens/colors';
import { layout, spacing } from '../../design-system/tokens/spacing';
import type { HomeProduct } from '../../home/components/HomeProductRail';
import {
  MARKETPLACE_COLLECTION_PAGE_SIZE,
  getMarketplaceCollectionProducts,
} from '../MarketplaceCollectionData';
import type { MarketplaceCollectionKind } from '../MarketplaceCollectionData';
import { FlashSaleCollectionCard } from './FlashSaleCollectionCard';

export interface MarketplaceCollectionPageViewModel {
  kind: MarketplaceCollectionKind;
  categoryId: string;
  isPrepared: boolean;
  onProductTap?: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd?: (product: HomeProduct) => void;
}

interface MarketplaceCollectionPageState {
  items: HomeProduct[];
  nextOffset: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}

/** One independently paged category page inside the shared SwipeTabs pager. */
export class MarketplaceCollectionPage extends StatefulComponent<
  MarketplaceCollectionPageViewModel,
  MarketplaceCollectionPageState
> {
  state: MarketplaceCollectionPageState = {
    items: [],
    nextOffset: 0,
    hasMore: true,
    isLoadingMore: false,
  };

  private pageRequestToken = 0;
  private isPageRequestPending = false;
  private hasStartedLoading = false;

  onCreate(): void {
    this.startLoadingIfPrepared();
  }

  onViewModelUpdate(previous?: MarketplaceCollectionPageViewModel): void {
    if (this.viewModel.isPrepared && !(previous?.isPrepared ?? false)) {
      this.startLoadingIfPrepared();
    }
  }

  private startLoadingIfPrepared(): void {
    if (this.hasStartedLoading || !this.viewModel.isPrepared) return;
    this.hasStartedLoading = true;
    this.loadFirstPage();
  }

  private loadFirstPage(): void {
    const products = getMarketplaceCollectionProducts(this.viewModel.kind, this.viewModel.categoryId);
    const items = products.slice(0, MARKETPLACE_COLLECTION_PAGE_SIZE);
    this.setState({
      items,
      nextOffset: items.length,
      hasMore: items.length < products.length,
      isLoadingMore: false,
    });
  }

  private handleLoadMore = (): void => {
    if (this.isPageRequestPending || this.state.isLoadingMore || !this.state.hasMore) return;

    const requestToken = ++this.pageRequestToken;
    this.isPageRequestPending = true;
    this.setState({
      items: this.state.items,
      nextOffset: this.state.nextOffset,
      hasMore: this.state.hasMore,
      isLoadingMore: true,
    });

    this.setTimeoutDisposable(() => {
      if (this.isDestroyed() || requestToken !== this.pageRequestToken) return;
      this.isPageRequestPending = false;
      const products = getMarketplaceCollectionProducts(this.viewModel.kind, this.viewModel.categoryId);
      const nextItems = products.slice(
        this.state.nextOffset,
        this.state.nextOffset + MARKETPLACE_COLLECTION_PAGE_SIZE,
      );
      const items = [...this.state.items, ...nextItems];
      this.setState({
        items,
        nextOffset: this.state.nextOffset + nextItems.length,
        hasMore: this.state.nextOffset + nextItems.length < products.length,
        isLoadingMore: false,
      });
    }, 520);
  };

  private estimateItemHeight = (item: MasonryItem, columnWidth: number): number => (
    Math.round(columnWidth * getMasonryImageAspectRatio(item))
    + (this.viewModel.kind === 'flash' ? 126 : 104)
  );

  private handleProductTap = (product: HomeProduct): void => {
    const recommendations = this.state.items
      .filter(item => item.id !== product.id)
      .slice(0, 8);
    this.viewModel.onProductTap?.(product, recommendations);
  };

  private renderItem = (item: MasonryItem, columnWidth: number): void => {
    const product = item as HomeProduct;
    if (this.viewModel.kind === 'flash') {
      <FlashSaleCollectionCard
        product={product}
        columnWidth={columnWidth}
        onProductTap={this.handleProductTap}
        onQuickAdd={this.viewModel.onQuickAdd}
      />;
      return;
    }

    <MasonryProductCard
      product={product}
      columnWidth={columnWidth}
      onTap={createReusableCallback(() => this.handleProductTap(product))}
      onQuickAdd={createReusableCallback(() => this.viewModel.onQuickAdd?.(product))}
    />;
  };

  onRender(): void {
    if (!this.viewModel.isPrepared) {
      <view style={styles.inactivePage} />;
      return;
    }

    <scroll
      {...noBounceScrollAttributes}
      style={styles.feedScroll}
      showsVerticalScrollIndicator={false}
    >
      <layout style={styles.feedContent}>
        <MasonryFeed
          items={this.state.items}
          isLoadingMore={this.state.isLoadingMore}
          hasMore={this.state.hasMore}
          onLoadMore={this.handleLoadMore}
          renderItem={this.renderItem}
          estimateItemHeight={this.estimateItemHeight}
          endLabel="Tu es à jour"
        />
        <view style={styles.bottomSpace.extend({
          height: layout.navigation.bottomTabContentPadding + Math.max(0, Device.getDisplayBottomInset()),
        })} />
      </layout>
    </scroll>;
  }
}

const styles = {
  inactivePage: new Style<View>({
    flexGrow: 1,
  }),
  feedContent: new Style<Layout>({
    paddingTop: spacing.md,
    width: '100%',
  }),
  feedScroll: new Style<ScrollView>({
    backgroundColor: colors.backgroundPrimary,
    flexGrow: 1,
    flexShrink: 1,
  }),
  bottomSpace: new Style<View>({
    flexShrink: 0,
    height: spacing.xl,
  }),
};
