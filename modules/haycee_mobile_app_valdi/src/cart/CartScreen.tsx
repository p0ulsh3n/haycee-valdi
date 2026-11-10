import { Device } from 'valdi_core/src/Device';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { MasonryFeed, getMasonryImageAspectRatio } from '../design-system/components/MasonryFeed';
import type { MasonryItem } from '../design-system/components/MasonryFeed';
import { MasonryProductCard } from '../design-system/components/MasonryProductCard';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { colors } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import type { HomeProduct } from '../home/components/HomeProductRail';
import { homeCategoryDefinitions } from '../home/data/HomeCategoryData';

export interface CartScreenViewModel {
  onProductTap?: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd?: (product: HomeProduct) => void;
  selectedAddress?: string;
  onSelectAddress?: () => void;
}

const CART_RECOMMENDATIONS: HomeProduct[] = homeCategoryDefinitions
  .filter(category => category.id !== 'all')
  .flatMap(category => [...category.flashProducts, ...category.trendingProducts, ...category.dealsProducts]);

/** Empty cart landing page followed by the shared two-column recommendation feed. */
export class CartScreen extends Component<CartScreenViewModel> {
  private estimateItemHeight = (item: MasonryItem, columnWidth: number): number => (
    Math.round(columnWidth * getMasonryImageAspectRatio(item)) + 100
  );

  private renderProduct = (item: MasonryItem, columnWidth: number): void => {
    const product = item as HomeProduct;
    const recommendations = CART_RECOMMENDATIONS.filter(candidate => candidate.id !== product.id).slice(0, 8);
    <MasonryProductCard
      product={product}
      columnWidth={columnWidth}
      onTap={this.viewModel.onProductTap
        ? createReusableCallback(() => this.viewModel.onProductTap?.(product, recommendations))
        : undefined}
      onQuickAdd={this.viewModel.onQuickAdd
        ? createReusableCallback(() => this.viewModel.onQuickAdd?.(product))
        : undefined}
    />;
  };

  private renderAddressSelector(topInset: number): void {
    <view
      style={styles.addressSelector.extend({ paddingTop: topInset + spacing.sm })}
      onTap={this.viewModel.onSelectAddress}
      accessibilityCategory="button"
      accessibilityLabel={this.viewModel.selectedAddress ?? 'Sélectionner une adresse'}
    >
      <label value={this.viewModel.selectedAddress ?? 'Sélectionner une adresse'} style={styles.addressLabel} numberOfLines={1} textOverflow="ellipsis" />
      <image style={styles.addressChevron} src={navigationIcons.arrowDown01Round} tint={colors.textSecondary} width={20} height={20} objectFit="contain" />
    </view>;
  }

  private renderEmptyState(): void {
    <view style={styles.emptyCard}>
      <view style={styles.emptyCopy}>
        <label value="Votre panier est vide" style={styles.emptyTitle} numberOfLines={2} />
        <label
          value="Ajoutez des articles pour les acheter ou les garder pour plus tard"
          style={styles.emptyMessage}
          numberOfLines={3}
        />
      </view>
      <image src={navigationIcons.shoppingCart02} tint={colors.textTertiary} width={52} height={52} objectFit="contain" />
    </view>;
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());

    <view style={styles.root}>
      {this.renderAddressSelector(topInset)}
      <scroll
        {...noBounceScrollAttributes}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {this.renderEmptyState()}
        <label value="Vous pourriez aimer" style={styles.recommendationTitle} numberOfLines={1} />
        <MasonryFeed
          items={CART_RECOMMENDATIONS}
          hasMore={false}
          renderItem={this.renderProduct}
          estimateItemHeight={this.estimateItemHeight}
          endLabel="Fin de la sélection"
        />
        <view height={layout.navigation.bottomTabContentPadding + bottomInset} />
      </scroll>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  scroll: new Style<ScrollView>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  addressSelector: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, flexDirection: 'row', height: 64, paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg }),
  addressLabel: new Style<Label>({ color: colors.textPrimary, flexShrink: 1, font: montserrat.semiBold(fontSize.product) }),
  addressChevron: new Style<View>({ flexShrink: 0, marginLeft: spacing.xs }),
  emptyCard: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.xl, flexDirection: 'row', justifyContent: 'space-between', marginLeft: spacing.lg, marginRight: spacing.lg, marginTop: spacing.xs, padding: spacing.lg }),
  emptyCopy: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginRight: spacing.md }),
  emptyTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section) }),
  emptyMessage: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.product), marginTop: spacing.xs }),
  recommendationTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section), marginBottom: spacing.md, marginLeft: spacing.lg, marginRight: spacing.lg, marginTop: spacing.xl }),
};
