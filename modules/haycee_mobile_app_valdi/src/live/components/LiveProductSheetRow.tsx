import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ImageView, Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import type { LiveViewerProduct } from '../data/LiveViewerData';

export interface LiveProductSheetRowViewModel {
  product: LiveViewerProduct;
  index: number;
  onAdd: (product: LiveViewerProduct) => void;
  onBuy: (product: LiveViewerProduct) => void;
}

const formatPrice = (amount: number): string =>
  `${Math.max(0, Math.floor(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;

/** Dense product row matching Shellby's Live product-list sheet. */
export class LiveProductSheetRow extends Component<LiveProductSheetRowViewModel> {
  onRender(): void {
    const { product, index, onAdd, onBuy } = this.viewModel;
    const soldOut = product.stockLeft === 0;
    const lowStock = product.stockLeft !== undefined && product.stockLeft > 0 && product.stockLeft <= 5;
    const discount = product.originalPrice !== undefined && product.originalPrice > product.price
      ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100)
      : 0;
    const order = `${index + 1}`;
    const canPurchase = product.kind !== 'auction' && !soldOut;

    <layout style={styles.row}>
      <view style={styles.imageFrame.extend({ backgroundColor: product.color })}>
        {product.imageUrl ? (
          <image src={product.imageUrl} style={styles.image} objectFit="cover" />
        ) : null}
        <view style={styles.orderBadge}>
          <label value={order} style={styles.orderText} numberOfLines={1} />
        </view>
        {product.isPinned ? (
          <view style={styles.pinnedBadge}>
            <label value="ÉPINGLÉ" style={styles.pinnedText} numberOfLines={1} />
          </view>
        ) : null}
        {discount > 0 ? (
          <view style={styles.discountBadge}>
            <label value={`-${discount}%`} style={styles.discountText} numberOfLines={1} />
          </view>
        ) : null}
      </view>

      <layout style={styles.information}>
        <layout style={styles.titleAndStock}>
          <label value={product.title} style={styles.title} numberOfLines={1} textOverflow="ellipsis" />
          {product.kind === 'auction' ? (
            <label value="ENCHÈRE" style={styles.auctionStock} numberOfLines={1} />
          ) : product.stockLeft !== undefined ? (
            <label
              value={soldOut ? 'RUPTURE DE STOCK' : lowStock ? `${product.stockLeft} EN STOCK` : `${product.stockLeft} EN STOCK`}
              style={soldOut || lowStock ? styles.stockWarning : styles.stock}
              numberOfLines={1}
            />
          ) : null}
        </layout>

        <layout style={styles.priceAndActions}>
          <layout style={styles.priceBlock}>
            <label value={formatPrice(product.price)} style={styles.price} numberOfLines={1} />
            {product.originalPrice !== undefined && product.originalPrice > product.price ? (
              <label
                value={formatPrice(product.originalPrice)}
                style={styles.originalPrice}
                textDecoration="strikethrough"
                numberOfLines={1}
              />
            ) : null}
          </layout>

          {product.kind === 'auction' ? (
            <label value="Voir l’enchère" style={styles.auctionAction} numberOfLines={1} />
          ) : (
            <layout style={styles.actions}>
              <view
                style={styles.addButton}
                opacity={canPurchase ? 1 : 0.4}
                onTapDisabled={!canPurchase}
                onTap={() => onAdd(product)}
                accessibilityCategory="button"
                accessibilityLabel={`Ajouter ${product.title} au panier`}
              >
                <image src={navigationIcons.shoppingCartAdd02} tint={colors.textPrimary} width={18} height={18} objectFit="contain" />
              </view>
              <view
                style={styles.buyButton}
                opacity={canPurchase ? 1 : 0.4}
                onTapDisabled={!canPurchase}
                onTap={() => onBuy(product)}
                accessibilityCategory="button"
                accessibilityLabel={`Acheter ${product.title}`}
              >
                <label value="ACHETER" style={styles.buyText} numberOfLines={1} />
              </view>
            </layout>
          )}
        </layout>
      </layout>
    </layout>;
  }
}

const styles = {
  row: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    height: 72,
    marginBottom: 20,
    width: '100%',
  }),
  imageFrame: new Style<View>({
    borderRadius: radius.xs,
    flexShrink: 0,
    height: 72,
    overflow: 'visible',
    position: 'relative',
    width: 72,
  }),
  image: new Style<ImageView>({ height: 72, width: 72 }),
  orderBadge: new Style<View>({
    backgroundColor: colors.backgroundOverlay,
    borderRadius: radius.xs,
    left: 0,
    paddingBottom: 2,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 2,
    position: 'absolute',
    top: 0,
  }),
  orderText: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.nano) }),
  pinnedBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundOverlay,
    bottom: 0,
    left: 0,
    paddingBottom: 3,
    paddingTop: 3,
    position: 'absolute',
    right: 0,
  }),
  pinnedText: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.nano) }),
  discountBadge: new Style<View>({
    backgroundColor: colors.interactivePrimary,
    paddingBottom: 2,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 2,
    position: 'absolute',
    right: 0,
    top: 0,
  }),
  discountText: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.nano) }),
  information: new Style<Layout>({
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    height: 72,
    justifyContent: 'space-between',
    marginLeft: spacing.md,
    minWidth: 0,
  }),
  titleAndStock: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  }),
  title: new Style<Label>({
    color: colors.textPrimary,
    flexGrow: 1,
    flexShrink: 1,
    font: montserrat.regular(13),
    marginRight: spacing.md,
  }),
  stock: new Style<Label>({
    color: colors.textSecondary,
    flexShrink: 0,
    font: montserrat.extraBold(fontSize.nano),
  }),
  stockWarning: new Style<Label>({
    color: colors.textDanger,
    flexShrink: 0,
    font: montserrat.extraBold(fontSize.nano),
  }),
  auctionStock: new Style<Label>({
    color: colors.textBrand,
    flexShrink: 0,
    font: montserrat.extraBold(fontSize.nano),
  }),
  priceAndActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  priceBlock: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, minWidth: 0 }),
  price: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.product) }),
  originalPrice: new Style<Label>({
    color: colors.textTertiary,
    font: montserrat.regular(fontSize.nano),
    marginTop: 2,
  }),
  actions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginLeft: spacing.sm }),
  addButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.xs,
    height: 36,
    justifyContent: 'center',
    marginRight: 6,
    width: 36,
  }),
  buyButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: radius.xs,
    height: 36,
    justifyContent: 'center',
    paddingLeft: 14,
    paddingRight: 14,
  }),
  buyText: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.nano) }),
  auctionAction: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.nano) }),
};
