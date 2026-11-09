import { Device } from 'valdi_core/src/Device';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { getBottomSheetNavigationOptions } from '../design-system/components/BottomSheet';
import { MasonryFeed, getMasonryImageAspectRatio } from '../design-system/components/MasonryFeed';
import type { MasonryItem } from '../design-system/components/MasonryFeed';
import { MasonryProductCard } from '../design-system/components/MasonryProductCard';
import { colors } from '../design-system/tokens/colors';
import { runNavigationAction } from '../design-system/utils/NavigationActionGate';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import { SearchOptionsSheet } from '../search/components/SearchOptionsSheet';
import type { SearchSheetOption } from '../search/components/SearchOptionsSheet';
import { filterAndSortSearchProducts, searchSortOptions } from '../search/SearchData';
import type { SearchSort } from '../search/SearchData';
import type { HomeProduct } from './components/HomeProductRail';

type HomeResultsFilter = 'all' | 'in_stock' | 'on_sale';

interface HomeSubcategoryResultsState {
  selectedSort: SearchSort;
  selectedFilter: HomeResultsFilter;
}

export interface HomeSubcategoryResultsScreenViewModel {
  title: string;
  products: HomeProduct[];
  onProductTap: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd: (product: HomeProduct) => void;
}

const resultFilterOptions: SearchSheetOption[] = [
  { id: 'all', label: 'Tous les articles' },
  { id: 'in_stock', label: 'En stock' },
  { id: 'on_sale', label: 'En promotion' },
];

/** Full-screen subcategory results with the shared masonry, sort and filter sheets. */
@NavigationPage(module)
export class HomeSubcategoryResultsScreen extends NavigationPageStatefulComponent<HomeSubcategoryResultsScreenViewModel, HomeSubcategoryResultsState> {
  private currentVisibleProducts: HomeProduct[] = [];

  state: HomeSubcategoryResultsState = {
    selectedSort: 'recommended',
    selectedFilter: 'all',
  };

  private close = (): void => {
    this.navigationController.pop();
  };

  private openSort = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController.present(
        SearchOptionsSheet,
        {
          title: 'Trier par',
          options: searchSortOptions,
          selectedId: this.state.selectedSort,
          onApply: (id: string) => this.setState({ selectedSort: id as SearchSort }),
        },
        {},
        { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions({ transparentPageBackground: true }) },
      );
    });
  };

  private openFilter = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController.present(
        SearchOptionsSheet,
        {
          title: 'Filtrer les articles',
          options: resultFilterOptions,
          selectedId: this.state.selectedFilter,
          onApply: (id: string) => this.setState({ selectedFilter: id as HomeResultsFilter }),
        },
        {},
        { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions({ transparentPageBackground: true }) },
      );
    });
  };

  private getVisibleProducts(): HomeProduct[] {
    const sorted = filterAndSortSearchProducts(this.viewModel.products, '', 'all', this.state.selectedSort);
    if (this.state.selectedFilter === 'in_stock') {
      return sorted.filter(product => product.stockCount === undefined || product.stockCount > 0);
    }
    if (this.state.selectedFilter === 'on_sale') {
      return sorted.filter(product => Boolean(product.discountLabel || product.originalPrice));
    }
    return sorted;
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

  private renderHeader(topInset: number): void {
    <layout style={topInset > 0 ? styles.header.extend({ paddingTop: topInset + spacing.sm }) : styles.header}>
      <view style={styles.backButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour aux sous-catégories">
        <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
      </view>
      <label value={this.viewModel.title} style={styles.title} numberOfLines={1} textOverflow="ellipsis" />
      <layout style={styles.actions}>
        <view style={styles.actionButton} onTap={this.openSort} accessibilityCategory="button" accessibilityLabel="Trier les articles">
          <image src={navigationIcons.sortByDown01} tint={colors.iconDefault} width={24} height={24} objectFit="contain" />
        </view>
        <view style={styles.actionButton} onTap={this.openFilter} accessibilityCategory="button" accessibilityLabel="Filtrer les articles">
          <image src={navigationIcons.filter} tint={colors.iconDefault} width={24} height={24} objectFit="contain" />
        </view>
      </layout>
    </layout>;
  }

  private renderEmptyState(): void {
    <view style={styles.emptyState}>
      <label value="Aucun article dans cette sélection" style={styles.emptyTitle} numberOfLines={2} />
    </view>;
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const products = this.getVisibleProducts();
    this.currentVisibleProducts = products;

    <view style={styles.root}>
      {this.renderHeader(topInset)}
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
        <view height={bottomInset + spacing.xl} />
      </scroll>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', paddingBottom: spacing.sm, paddingLeft: spacing.sm, paddingRight: spacing.sm, paddingTop: spacing.md }),
  backButton: new Style<View>({ alignItems: 'center', flexShrink: 0, height: layout.home.header.actionTarget, justifyContent: 'center', width: layout.home.header.actionTarget }),
  actionButton: new Style<View>({ alignItems: 'center', flexShrink: 0, height: 40, justifyContent: 'center', width: 40 }),
  title: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.extraBold(fontSize.product), textAlign: 'center' }),
  actions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0, justifyContent: 'flex-end', width: 80 }),
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  emptyState: new Style<View>({ alignItems: 'center', flexGrow: 1, justifyContent: 'center', minHeight: 240, paddingLeft: spacing.xl, paddingRight: spacing.xl }),
  emptyTitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.body), textAlign: 'center' }),
};
