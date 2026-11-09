import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { BlurView, Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { ProductStockCountPill } from '../../design-system/components/ProductStockCountPill';
import { ProductVariantStockPreview } from '../../design-system/components/ProductVariantStockPreview';
import { formatFcfa } from '../../design-system/utils/money';
import type { LiveViewerProduct } from '../data/LiveViewerData';

export interface LiveProductCardViewModel {
  product: LiveViewerProduct;
  width: number;
  onMore: () => void;
}

/** Reference-sized glass preview; full product details and purchase actions live in the products sheet. */
export class LiveProductCard extends Component<LiveProductCardViewModel> {
  onRender(): void {
    const { product, width, onMore } = this.viewModel;
    const imageSize = layout.live.viewer.productImageHeight;
    const variantStocks = product.variantStocks ?? [];
    const stockCount = variantStocks.length > 0
      ? variantStocks.reduce((count, variant) => count + Math.max(0, variant.remaining), 0)
      : Math.max(0, product.stockLeft);
    const imageAspectRatio = product.imageAspectRatio !== undefined && product.imageAspectRatio < 0.875 ? 0.75 : 1;
    const imageWidth = imageSize * imageAspectRatio;

    <view style={styles.card} width={width} height={layout.live.viewer.productCardHeight}>
      <blur style={styles.glassPanel} blurStyle="dark">
        <view style={styles.glassTint}>
          <layout style={styles.contentRow}>
            <view
              style={styles.productImage.extend({
                backgroundColor: product.color,
                height: imageSize,
                width: imageWidth,
              })}
            >
              {product.imageUrl ? (
                <image
                  src={product.imageUrl}
                  width={imageWidth}
                  height={imageSize}
                  objectFit="cover"
                />
              ) : null}
            </view>

            <layout style={styles.productCopy}>
              <layout style={styles.titleStockRow}>
                <label
                  value={product.title}
                  style={styles.title}
                  numberOfLines={2}
                  textOverflow="ellipsis"
                />
                <ProductStockCountPill
                  count={stockCount}
                  surfaceColor={colors.liveControlSurface}
                  textColor={colors.backgroundDark}
                />
              </layout>
              <label value={formatFcfa(product.price)} style={styles.price} numberOfLines={1} />
              {variantStocks.length > 0 ? (
                <view style={styles.variantStocks}>
                  <ProductVariantStockPreview
                    items={variantStocks}
                    textColor={colors.textInverted}
                    mutedColor={colors.textOnDarkSecondary}
                  />
                </view>
              ) : null}
              <layout style={styles.shippingRow}>
                <image
                  src={navigationIcons.deliveryTruck02}
                  tint={colors.textInverted}
                  width={layout.live.viewer.shippingIconSize}
                  height={layout.live.viewer.shippingIconSize}
                  objectFit="contain"
                />
                <label
                  value={`${product.shippingLabel} · ${formatFcfa(product.shippingAmount)}`}
                  style={styles.shippingLabel}
                  numberOfLines={1}
                />
                <label value="|" style={styles.separator} numberOfLines={1} />
                <view
                  style={styles.moreAction}
                  onTap={onMore}
                  accessibilityCategory="button"
                  accessibilityLabel={`Voir tous les produits du live, dont ${product.title}`}
                >
                  <label value="Voir plus" style={styles.moreLabel} numberOfLines={1} />
                </view>
              </layout>
            </layout>
          </layout>
        </view>
      </blur>
    </view>;
  }
}

const styles = {
  card: new Style<View>({ width: '100%' }),
  glassPanel: new Style<BlurView>({
    borderRadius: radius.md,
    height: layout.live.viewer.productGlassHeight,
    width: '100%',
  }),
  glassTint: new Style<View>({
    backgroundColor: colors.liveActionSurface,
    borderRadius: radius.md,
    height: '100%',
    padding: spacing.sm,
    width: '100%',
  }),
  contentRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  }),
  productImage: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.xs,
    justifyContent: 'center',
    flexShrink: 0,
  }),
  productCopy: new Style<Layout>({
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    marginLeft: spacing.md,
    minWidth: 0,
  }),
  titleStockRow: new Style<Layout>({
    alignItems: 'flex-start',
    flexDirection: 'row',
    minWidth: 0,
  }),
  variantStocks: new Style<View>({ marginTop: spacing.xs, minWidth: 0, width: '100%' }),
  title: new Style<Label>({
    color: colors.textInverted,
    flexGrow: 1,
    flexShrink: 1,
    font: montserrat.semiBold(fontSize.product),
    lineHeight: 1.12,
    minWidth: 0,
  }),
  price: new Style<Label>({
    color: colors.textInverted,
    flexShrink: 0,
    font: montserrat.extraBold(fontSize.body),
    marginTop: spacing.xs,
  }),
  shippingRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.xs,
    minWidth: 0,
  }),
  shippingLabel: new Style<Label>({
    color: colors.textInverted,
    flexShrink: 1,
    font: montserrat.regular(fontSize.tiny),
    marginLeft: spacing.xs,
  }),
  separator: new Style<Label>({
    color: colors.textOnDarkSecondary,
    font: montserrat.regular(fontSize.tiny),
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  }),
  moreAction: new Style<View>({ flexShrink: 0 }),
  moreLabel: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.semiBold(fontSize.tiny),
    textDecoration: 'underline',
  }),
};
