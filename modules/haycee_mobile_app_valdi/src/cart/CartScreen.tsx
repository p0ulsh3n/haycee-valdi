import { Device } from 'valdi_core/src/Device';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { DSButton, Hairline, MasonryFeed, QuantityStepper, getMasonryImageAspectRatio } from '../design-system/index';
import type { MasonryItem } from '../design-system/components/MasonryFeed';
import type { MasonryProduct } from '../design-system/components/MasonryProductCard';
import { MasonryProductCard } from '../design-system/components/MasonryProductCard';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { colors } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import type { HomeProduct } from '../home/components/HomeProductRail';
import { homeCategoryDefinitions } from '../home/data/HomeCategoryData';
import type { MarketplaceCartItem } from './data/CartData';
import { formatCartAmount, getCartQuantityTotal, getCartStoreKey, getCartTotal } from './data/CartData';

export interface CartScreenViewModel {
  cartItems: MarketplaceCartItem[];
  onChangeQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout?: () => void;
  onProductTap?: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onStoreTap?: (product: MasonryProduct) => void;
  onQuickAdd?: (product: HomeProduct) => void;
  selectedAddress?: string;
  onSelectAddress?: () => void;
}

interface CartStoreGroup {
  id: string;
  name: string;
  avatarUrl?: string;
  product: MasonryProduct;
  items: MarketplaceCartItem[];
}

const CART_RECOMMENDATIONS: HomeProduct[] = homeCategoryDefinitions
  .filter(category => category.id !== 'all')
  .flatMap(category => [...category.flashProducts, ...category.trendingProducts, ...category.dealsProducts]);

/** Shopping cart grouped by seller, followed by the shared two-column recommendations feed. */
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

  private storeGroups(): CartStoreGroup[] {
    const groups = new Map<string, CartStoreGroup>();
    this.viewModel.cartItems.forEach(item => {
      const product = item.product;
      const name = product.vendorName ?? 'Boutique Haycee';
      const key = getCartStoreKey(product);
      const group = groups.get(key);
      if (group) {
        group.items.push(item);
      } else {
        groups.set(key, { id: key, name, avatarUrl: product.vendorAvatarUrl, product, items: [item] });
      }
    });
    return Array.from(groups.values());
  }

  private renderCartItem(item: MarketplaceCartItem): void {
    const product = item.product;
    const imageUrl = product.imageUrl ?? product.imageUrls?.[0];
    const discount = product.discountLabel;

    <view key={item.id} style={styles.cartItem}>
      <view style={styles.cartImageFrame.extend({ backgroundColor: product.color })}>
        {imageUrl ? (
          <image src={imageUrl} style={styles.cartProductImage} objectFit="cover" />
        ) : (
          <image src={navigationIcons.package} tint={colors.textSecondary} width={25} height={25} objectFit="contain" />
        )}
      </view>

      <layout style={styles.cartItemCopy}>
        <layout style={styles.cartItemTitleRow}>
          <label value={product.title} style={styles.cartItemTitle} numberOfLines={2} textOverflow="ellipsis" />
          <view
            style={styles.removeButton}
            onTap={createReusableCallback(() => this.viewModel.onRemoveItem(item.id))}
            accessibilityCategory="button"
            accessibilityLabel={`Retirer ${product.title} du panier`}
          >
            <image src={navigationIcons.delete02} tint={colors.textTertiary} width={17} height={17} objectFit="contain" />
          </view>
        </layout>
        {item.selections.length > 0 ? (
          <label value={item.selections.map(selection => selection.optionLabel).join(' · ')} style={styles.variantLabel} numberOfLines={2} />
        ) : null}
        <layout style={styles.cartPriceRow.extend({ marginTop: item.selections.length > 0 ? spacing.sm : spacing.xs })}>
          <label
            value={formatCartAmount(item, item.unitAmountMinor)}
            style={product.originalPrice || discount ? styles.discountedPrice : styles.cartPrice}
            numberOfLines={1}
          />
          {product.originalPrice ? <label value={product.originalPrice} style={styles.originalPrice} numberOfLines={1} /> : null}
          {discount ? <label value={discount} style={styles.discountLabel} numberOfLines={1} /> : null}
        </layout>
        <layout style={styles.itemActions}>
          <QuantityStepper
            value={item.quantity}
            size="compact"
            appearance="grouped"
            decreaseDisabled={item.quantity <= 1}
            increaseDisabled={item.stockLimit !== undefined && item.quantity >= item.stockLimit}
            onDecrease={createReusableCallback(() => this.viewModel.onChangeQuantity(item.id, -1))}
            onIncrease={createReusableCallback(() => this.viewModel.onChangeQuantity(item.id, 1))}
            itemLabel={product.title}
          />
        </layout>
      </layout>
    </view>;
  }

  private renderStoreGroup(group: CartStoreGroup): void {
    const shippingProduct = group.product;
    const isExpedition = shippingProduct.shippingMethod === 'expedition';
    const shippingLabel = isExpedition ? 'Frais d’expédition :' : 'Frais de livraison :';
    const shippingDetail = shippingProduct.shippingFree === true
      ? 'Gratuite'
      : shippingProduct.shippingPrice ?? 'À calculer';

    <view key={group.id} style={styles.storeGroup}>
      <view
        style={styles.storeHeader}
        onTap={this.viewModel.onStoreTap ? createReusableCallback(() => this.viewModel.onStoreTap?.(group.product)) : undefined}
        accessibilityCategory="button"
        accessibilityLabel={`Ouvrir la boutique ${group.name}`}
      >
        <view style={styles.storeAvatarFrame}>
          <view style={styles.storeAvatarFallback} />
          {group.avatarUrl ? <image src={group.avatarUrl} style={styles.storeAvatar} objectFit="cover" /> : null}
        </view>
        <layout style={styles.storeNameLink}>
          <label value={group.name} style={styles.storeName} numberOfLines={1} textOverflow="ellipsis" />
          <image style={styles.storeArrow} src={navigationIcons.arrowRight01Round} tint={colors.textSecondary} width={16} height={16} objectFit="contain" />
        </layout>
        <label value={`${group.items.length} ${group.items.length === 1 ? 'article' : 'articles'}`} style={styles.storeItemCount} numberOfLines={1} />
      </view>
      <layout style={styles.storeShippingInfo}>
        <image
          src={isExpedition ? navigationIcons.sellerDeliveryPlane : navigationIcons.deliveryTruck02}
          tint={colors.textSecondary}
          width={layout.cart.shippingIconSize}
          height={layout.cart.shippingIconSize}
          objectFit="contain"
        />
        <label value={shippingLabel} style={styles.storeShippingLabel} numberOfLines={1} />
        <label value={shippingDetail} style={styles.storeShippingAmount} numberOfLines={1} textOverflow="ellipsis" />
      </layout>
      {group.items.map(item => (
        <view key={item.id}>
          {this.renderCartItem(item)}
        </view>
      ))}
    </view>;
  }

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
        <label value="Ajoutez des articles pour les acheter ou les garder pour plus tard" style={styles.emptyMessage} numberOfLines={3} />
      </view>
      <image src={navigationIcons.shoppingCart02} tint={colors.textTertiary} width={52} height={52} objectFit="contain" />
    </view>;
  }

  private renderCheckoutFooter(bottomInset: number): void {
    const itemCount = getCartQuantityTotal(this.viewModel.cartItems);
    const referencePrice = this.viewModel.cartItems[0];
    const total = getCartTotal(this.viewModel.cartItems);

    <view style={styles.checkoutFooter.extend({ paddingBottom: bottomInset + spacing.sm })}>
      <Hairline color={colors.borderDefault} />
      <layout style={styles.checkoutRow}>
        <DSButton
          title={`Commander · ${itemCount} ${itemCount === 1 ? 'article' : 'articles'}`}
          variant="cta"
          size="fullWidth"
          height={48}
          textCase="none"
          icon={navigationIcons.shoppingCart02}
          iconSize={18}
          disabled={itemCount === 0}
          onTap={this.viewModel.onCheckout ?? (() => undefined)}
          accessibilityLabel={`Continuer avec ${itemCount} articles`}
        />
        <layout style={styles.checkoutTotal}>
          <label value="TOTAL" style={styles.checkoutTotalLabel} numberOfLines={1} />
          <label value={referencePrice ? total : '0'} style={styles.checkoutTotalValue} numberOfLines={1} textOverflow="ellipsis" />
        </layout>
      </layout>
    </view>;
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const hasItems = this.viewModel.cartItems.length > 0;

    <view style={styles.root}>
      {this.renderAddressSelector(topInset)}
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <view style={styles.content}>
          <view style={styles.cartArea}>
            {hasItems ? this.storeGroups().map(group => this.renderStoreGroup(group)) : this.renderEmptyState()}
          </view>
          <label value="Vous pourriez aimer" style={styles.recommendationTitle} numberOfLines={1} />
          <MasonryFeed
            items={CART_RECOMMENDATIONS}
            hasMore={false}
            renderItem={this.renderProduct}
            estimateItemHeight={this.estimateItemHeight}
            endLabel="Fin de la sélection"
          />
          <view height={layout.navigation.bottomTabContentPadding + bottomInset + (hasItems ? 0 : spacing.md)} />
        </view>
      </scroll>
      {hasItems ? this.renderCheckoutFooter(0) : null}
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  scroll: new Style<ScrollView>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  content: new Style<View>({ flexDirection: 'column', paddingBottom: spacing.sm, paddingTop: spacing.xs, width: '100%' }),
  addressSelector: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, flexDirection: 'row', height: 64, paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg }),
  addressLabel: new Style<Label>({ color: colors.textPrimary, flexShrink: 1, font: montserrat.semiBold(fontSize.product) }),
  addressChevron: new Style<View>({ flexShrink: 0, marginLeft: spacing.xs }),
  cartArea: new Style<View>({ flexDirection: 'column', marginLeft: spacing.lg, marginRight: spacing.lg }),
  emptyCard: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.xl, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs, padding: spacing.lg, width: '100%' }),
  emptyCopy: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginRight: spacing.md }),
  emptyTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section) }),
  emptyMessage: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.product), marginTop: spacing.xs }),
  storeGroup: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', marginBottom: spacing.md, padding: spacing.sm, width: '100%' }),
  storeHeader: new Style<View>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.cart.storeAvatarSize, paddingBottom: spacing.sm, paddingLeft: spacing.xs, paddingRight: spacing.xs, paddingTop: spacing.xs, width: '100%' }),
  storeAvatarFrame: new Style<View>({ borderRadius: radius.full, flexShrink: 0, height: layout.cart.storeAvatarSize, position: 'relative', width: layout.cart.storeAvatarSize }),
  storeAvatarFallback: new Style<View>({ backgroundColor: colors.backgroundPrimary, borderRadius: radius.full, height: '100%', width: '100%' }),
  storeAvatar: new Style<View>({ borderRadius: radius.full, height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }),
  storeArrow: new Style<View>({ flexShrink: 0, marginLeft: spacing.xs }),
  storeNameLink: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm, minWidth: 0 }),
  storeName: new Style<Label>({ color: colors.textPrimary, flexShrink: 1, font: montserrat.semiBold(fontSize.product), minWidth: 0 }),
  storeItemCount: new Style<Label>({ color: colors.textTertiary, flexShrink: 0, font: montserrat.semiBold(fontSize.tiny), marginLeft: spacing.sm }),
  cartItem: new Style<View>({ alignItems: 'flex-start', backgroundColor: colors.backgroundPrimary, borderRadius: radius.sm, flexDirection: 'row', marginTop: spacing.xs, padding: spacing.sm, width: '100%' }),
  cartImageFrame: new Style<View>({ alignItems: 'center', borderRadius: radius.xs, flexShrink: 0, height: layout.cart.itemImageHeight, justifyContent: 'center', position: 'relative', width: layout.cart.itemImageWidth }),
  cartProductImage: new Style<View>({ borderRadius: radius.xs, height: '100%', width: '100%' }),
  cartItemCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm, minWidth: 0 }),
  cartItemTitleRow: new Style<Layout>({ alignItems: 'flex-start', flexDirection: 'row', width: '100%' }),
  cartItemTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.semiBold(fontSize.body), marginTop: spacing.xs }),
  removeButton: new Style<View>({ alignItems: 'center', flexShrink: 0, height: 28, justifyContent: 'center', marginLeft: spacing.xs, width: 28 }),
  variantLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.label) }),
  cartPriceRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs, width: '100%' }),
  cartPrice: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.metadata), marginRight: spacing.xs }),
  discountedPrice: new Style<Label>({ color: colors.textDanger, font: montserrat.extraBold(fontSize.metadata), marginRight: spacing.xs }),
  originalPrice: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginRight: spacing.xs, textDecoration: 'strikethrough' }),
  discountLabel: new Style<Label>({ color: colors.textDanger, font: montserrat.semiBold(fontSize.tiny) }),
  itemActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginTop: spacing.sm, width: '100%' }),
  storeShippingInfo: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginBottom: spacing.xs, marginLeft: spacing.sm, minWidth: 0 }),
  storeShippingLabel: new Style<Label>({ color: colors.textSecondary, flexShrink: 0, font: montserrat.semiBold(fontSize.label), marginLeft: spacing.xs }),
  storeShippingAmount: new Style<Label>({ color: colors.textTertiary, flexShrink: 1, font: montserrat.semiBold(fontSize.label), marginLeft: spacing.xs }),
  checkoutFooter: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexShrink: 0, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.sm, width: '100%' }),
  checkoutRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', paddingTop: spacing.sm, width: '100%' }),
  checkoutTotal: new Style<Layout>({ flexDirection: 'column', flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  checkoutTotalLabel: new Style<Label>({ color: colors.textTertiary, font: montserrat.semiBold(fontSize.nano) }),
  checkoutTotalValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.metadata), marginTop: spacing.xs }),
  recommendationTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section), marginBottom: spacing.md, marginLeft: spacing.lg, marginRight: spacing.lg, marginTop: spacing.xl }),
};
