import { Device } from 'valdi_core/src/Device';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Label, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { MasonryFeed, getMasonryImageAspectRatio } from '../../design-system/components/MasonryFeed';
import type { MasonryItem } from '../../design-system/components/MasonryFeed';
import { MasonryProductCard } from '../../design-system/components/MasonryProductCard';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { colors } from '../../design-system/tokens/colors';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import type { HomeProduct } from '../../home/components/HomeProductRail';
import { filterAndSortSearchProducts } from '../SearchData';
import type { SearchSort } from '../SearchData';

interface SearchResultsViewModel {
  query: string;
  products: HomeProduct[];
  selectedCategoryId: string;
  selectedSort: SearchSort;
  onProductTap: (product: HomeProduct, recommendations: HomeProduct[]) => void;
  onQuickAdd: (product: HomeProduct) => void;
}

/** Product search results filtered by the parent search screen and global Masonry. */
export class SearchResults extends Component<SearchResultsViewModel> {
  private currentVisibleProducts: HomeProduct[] = [];

  private visibleProducts(): HomeProduct[] {
    return filterAndSortSearchProducts(
      this.viewModel.products,
      this.viewModel.query,
      this.viewModel.selectedCategoryId,
      this.viewModel.selectedSort,
    );
  }

  private estimateItemHeight = (item: MasonryItem, columnWidth: number): number => (
    Math.round(columnWidth * getMasonryImageAspectRatio(item)) + 100
  );

  private renderItem = (item: MasonryItem, columnWidth: number): void => {
    const product = item as HomeProduct;
    const recommendations = this.currentVisibleProducts.filter(candidate => candidate.id !== product.id).slice(0, 8);
    <MasonryProductCard
      product={product}
      columnWidth={columnWidth}
      onTap={createReusableCallback(() => this.viewModel.onProductTap(product, recommendations))}
      onQuickAdd={createReusableCallback(() => this.viewModel.onQuickAdd(product))}
    />;
  };

  private renderEmptyState(): void {
    <view style={styles.emptyState}>
      <image src={navigationIcons.search02} tint={colors.textTertiary} width={30} height={30} objectFit="contain" />
      <label value="Aucun produit trouvé" style={styles.emptyTitle} numberOfLines={1} />
      <label value="Essaie un autre mot ou retire un filtre." style={styles.emptyMessage} numberOfLines={2} />
    </view>;
  }

  onRender(): void {
    const products = this.visibleProducts();
    this.currentVisibleProducts = products;

    <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
      {products.length > 0 ? (
        <MasonryFeed
          items={products}
          hasMore={false}
          renderItem={this.renderItem}
          estimateItemHeight={this.estimateItemHeight}
          endLabel="Tu es à jour"
        />
      ) : this.renderEmptyState()}
      <view style={styles.bottomSpace.extend({
        height: layout.navigation.bottomTabContentPadding + Math.max(0, Device.getDisplayBottomInset()),
      })} />
    </scroll>;
  }
}

const styles = {
  scroll: new Style<ScrollView>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  emptyState: new Style<View>({ alignItems: 'center', flexGrow: 1, justifyContent: 'center', minHeight: 240, paddingLeft: spacing.xl, paddingRight: spacing.xl }),
  emptyTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.section), marginTop: spacing.md }),
  emptyMessage: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.body), marginTop: spacing.sm, textAlign: 'center' }),
  bottomSpace: new Style<View>({ flexShrink: 0, height: spacing.xl }),
};
