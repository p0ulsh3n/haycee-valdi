import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { formatFcfa } from '../../design-system/utils/money';
import type { LiveViewerProduct } from '../data/LiveViewerData';
import { LiveProductNameTicker } from './LiveProductNameTicker';

export interface LiveProductCardViewModel {
  product: LiveViewerProduct;
  width: number;
  active: boolean;
  onBuy: (product: LiveViewerProduct) => void;
}

/** One reusable live offer card, including its image, title ticker, and buy action. */
export class LiveProductCard extends Component<LiveProductCardViewModel> {
  onRender(): void {
    const { product, width } = this.viewModel;
    const imageHeight = layout.live.viewer.productImageHeight;
    const imageBorderWidth = layout.live.viewer.glassBorderWidth;
    const imageAspectRatio = Math.max(0.1, product.imageAspectRatio ?? 1);
    const imageWidth = imageHeight * imageAspectRatio;
    const imageContentHeight = Math.max(1, imageHeight - imageBorderWidth * 2);
    const imageContentWidth = Math.max(1, imageWidth - imageBorderWidth * 2);

    <view style={styles.card} width={width} height={layout.live.viewer.productCardHeight}>
      <layout style={styles.productRow}>
        <view
          style={styles.productImageFrame.extend({
            backgroundColor: product.color,
            height: imageHeight,
            width: imageWidth,
          })}
        >
          {product.imageUrl ? (
            <image
              src={product.imageUrl}
              width={imageContentWidth}
              height={imageContentHeight}
              objectFit="contain"
            />
          ) : (
            null
          )}
        </view>

        <layout style={styles.productCopy}>
          <LiveProductNameTicker title={product.title} active={this.viewModel.active} />
          {product.stockLeft === 0 ? (
            <label value="Rupture de stock" style={styles.stockUnavailable} numberOfLines={1} />
          ) : product.stockLeft !== undefined && product.stockLeft <= 5 ? (
            <label value={`Plus que ${product.stockLeft} en stock`} style={styles.stockLow} numberOfLines={1} />
          ) : product.stockLeft !== undefined ? (
            <label value={`${product.stockLeft} en stock`} style={styles.stockAvailable} numberOfLines={1} />
          ) : (
            <label value="En stock" style={styles.stockAvailable} numberOfLines={1} />
          )}
          <layout style={styles.priceRow}>
            <label value={formatFcfa(product.price)} style={styles.price} numberOfLines={1} />
            {product.originalPrice !== undefined && product.originalPrice > product.price ? (
              <label
                value={formatFcfa(product.originalPrice)}
                style={styles.originalPrice}
                textDecoration="strikethrough"
                numberOfLines={1}
              />
            ) : null}
          </layout>
        </layout>
      </layout>

      <layout style={styles.footer}>
        <image
          src={navigationIcons.deliveryTruck02}
          tint={colors.textOnDarkSecondary}
          width={15}
          height={15}
          objectFit="contain"
        />
        <label
          value={`${formatFcfa(product.shippingAmount)} ${product.shippingLabel}`}
          style={styles.footerLabel}
          numberOfLines={1}
        />
      </layout>

      <view
        style={styles.buyButton}
        onTap={() => this.viewModel.onBuy(product)}
        accessibilityCategory="button"
        accessibilityLabel={`Acheter ${product.title}`}
      >
        <label value="Acheter" style={styles.buyButtonLabel} numberOfLines={1} />
      </view>
    </view>;
  }
}

const styles = {
  card: new Style<View>({
    backgroundColor: colors.liveGlassSurface,
    borderRadius: radius.lg,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: spacing.sm,
  }),
  productRow: new Style<Layout>({
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexGrow: 1,
    minHeight: layout.live.viewer.productImageHeight,
  }),
  productImageFrame: new Style<View>({
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: layout.live.viewer.glassBorderWidth,
    borderRadius: radius.sm,
    justifyContent: 'center',
  }),
  productCopy: new Style<Layout>({
    alignSelf: 'flex-start',
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'flex-start',
    marginLeft: spacing.sm,
    minWidth: 0,
  }),
  stockAvailable: new Style<Label>({
    color: colors.textOnDarkSecondary,
    font: montserrat.regular(fontSize.nano),
    marginTop: spacing.xs,
  }),
  stockLow: new Style<Label>({
    color: colors.textDanger,
    font: montserrat.semiBold(fontSize.metadata),
    marginTop: spacing.xs,
  }),
  stockUnavailable: new Style<Label>({
    color: colors.textDanger,
    font: montserrat.semiBold(fontSize.nano),
    marginTop: spacing.xs,
  }),
  priceRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.xs,
  }),
  price: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(fontSize.price),
  }),
  originalPrice: new Style<Label>({
    color: colors.textOnDarkSecondary,
    font: montserrat.regular(fontSize.nano),
    marginLeft: spacing.xs,
  }),
  buyButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: radius.full,
    height: layout.live.viewer.productButtonHeight,
    justifyContent: 'center',
    marginTop: spacing.sm,
    width: '100%',
  }),
  buyButtonLabel: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(fontSize.product),
  }),
  footer: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    height: layout.live.viewer.productFooterHeight,
    marginTop: spacing.sm,
  }),
  footerLabel: new Style<Label>({
    color: colors.textOnDarkSecondary,
    font: montserrat.regular(fontSize.nano),
    marginLeft: spacing.xs,
  }),
};
