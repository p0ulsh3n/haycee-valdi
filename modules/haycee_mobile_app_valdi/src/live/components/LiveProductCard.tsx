import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { BlurView, Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { DSButton } from '../../design-system/components/DSButton';
import { DSInlineLink } from '../../design-system/components/DSInlineLink';
import { ProductStockCountPill } from '../../design-system/components/ProductStockCountPill';
import { ProductVariantStockPreview } from '../../design-system/components/ProductVariantStockPreview';
import { formatFcfa } from '../../design-system/utils/money';
import type { LiveViewerProduct } from '../data/LiveViewerData';

export interface LiveProductCardViewModel {
  product: LiveViewerProduct;
  width: number;
  onBuy: (product: LiveViewerProduct) => void;
  onMore: () => void;
}

/** Reference-sized glass preview; full product details and purchase actions live in the products sheet. */
export class LiveProductCard extends Component<LiveProductCardViewModel> {
  onRender(): void {
    const { product, width, onBuy, onMore } = this.viewModel;
    const imageSize = layout.live.viewer.productImageHeight;
    const variantStocks = product.variantStocks ?? [];
    const stockCount = variantStocks.length > 0
      ? variantStocks.reduce((count, variant) => count + Math.max(0, variant.remaining), 0)
      : Math.max(0, product.stockLeft);
    const discountPercent = product.originalPrice !== undefined
      && Number.isFinite(product.originalPrice)
      && product.originalPrice > product.price
      ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100)
      : 0;
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
              <layout style={styles.priceRow}>
                <label value={formatFcfa(product.price)} style={styles.price} numberOfLines={1} />
                {discountPercent > 0 && product.originalPrice !== undefined ? (
                  <label
                    value={`${formatFcfa(product.originalPrice)} (-${discountPercent}%)`}
                    style={styles.discountSummary}
                    numberOfLines={1}
                    textOverflow="ellipsis"
                  />
                ) : null}
              </layout>
              {variantStocks.length > 0 ? (
                <view style={styles.variantStocks}>
                  <ProductVariantStockPreview
                    items={variantStocks}
                    textColor={colors.textInverted}
                    mutedColor={colors.textOnDarkSecondary}
                  />
                </view>
              ) : null}
            </layout>
          </layout>
          <layout style={styles.footerRow}>
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
                textOverflow="ellipsis"
              />
            </layout>
            <view style={styles.footerActionSpacing}>
              <DSInlineLink
                title="Voir plus"
                textColor={colors.textInverted}
                onTap={onMore}
                accessibilityLabel={`Voir les produits du live, dont ${product.title}`}
              />
            </view>
            <DSButton
              title="Acheter"
              textCase="none"
              variant="cta"
              size="compact"
              marginLeft={spacing.xs}
              onTap={() => onBuy(product)}
              accessibilityLabel={`Acheter ${product.title}`}
            />
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
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
    padding: spacing.sm,
    width: '100%',
  }),
  contentRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
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
  priceRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.xs,
    minWidth: 0,
  }),
  price: new Style<Label>({
    color: colors.textInverted,
    flexShrink: 0,
    font: montserrat.extraBold(fontSize.body),
  }),
  discountSummary: new Style<Label>({
    color: colors.interactivePrimary,
    flexShrink: 1,
    font: montserrat.semiBold(fontSize.tiny),
    marginLeft: spacing.xs,
    minWidth: 0,
  }),
  footerRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    marginTop: spacing.xs,
    minWidth: 0,
    width: '100%',
  }),
  shippingRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  }),
  footerActionSpacing: new Style<View>({ marginLeft: spacing.xs, marginRight: spacing.xs }),
  shippingLabel: new Style<Label>({
    color: colors.textInverted,
    flexShrink: 1,
    font: montserrat.regular(fontSize.tiny),
    marginLeft: spacing.xs,
  }),
};
