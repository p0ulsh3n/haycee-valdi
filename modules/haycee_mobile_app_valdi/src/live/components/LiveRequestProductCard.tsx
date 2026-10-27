import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ImageView, Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { getMasonryImageAspectRatio } from '../../design-system/components/MasonryFeed';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { formatFcfa } from '../../design-system/utils/money';
import type { LiveViewerProduct } from '../data/LiveViewerData';

export interface LiveRequestProductCardViewModel {
  product: LiveViewerProduct;
  columnWidth: number;
  requestCount: number;
  requested: boolean;
  onRequest: (product: LiveViewerProduct) => void;
}

/** Request action and product details rendered inside the Live two-column grid. */
export class LiveRequestProductCard extends Component<LiveRequestProductCardViewModel> {
  private handleRequest = (): void => {
    if (!this.viewModel.requested) {
      this.viewModel.onRequest(this.viewModel.product);
    }
  };

  onRender(): void {
    const { product, columnWidth, requestCount, requested } = this.viewModel;
    const totalRequestCount = requestCount + (requested ? 1 : 0);
    const imageAspectRatio = product.imageAspectRatio && product.imageAspectRatio > 0
      ? 1 / product.imageAspectRatio
      : undefined;
    const imageHeight = Math.round(
      columnWidth * getMasonryImageAspectRatio({ id: product.id, masonryAspectRatio: imageAspectRatio }),
    );

    <view style={styles.card} width={columnWidth}>
      <view
        style={styles.imageFrame.extend({ backgroundColor: product.color })}
        width={columnWidth}
        height={imageHeight}
      >
        {product.imageUrl ? (
          <image src={product.imageUrl} style={styles.image} width={columnWidth} height={imageHeight} objectFit="cover" />
        ) : null}
        {totalRequestCount > 0 ? (
          <view
            style={requested ? styles.requestCountBadge : styles.existingRequestBadge}
            accessibilityCategory="button"
            accessibilityLabel={`${totalRequestCount} demande${totalRequestCount > 1 ? 's' : ''} pour ${product.title}`}
          >
            <label value={`${totalRequestCount}`} style={styles.requestCount} numberOfLines={1} />
            <image src={navigationIcons.userHandUp01} tint={colors.textInverted} width={18} height={18} objectFit="contain" />
          </view>
        ) : null}
        {!requested ? (
          <view
            style={styles.requestButton}
            onTap={this.handleRequest}
            accessibilityCategory="button"
            accessibilityLabel={`Demander ${product.title}`}
          >
            <label value="Demander" style={styles.requestLabel} numberOfLines={1} />
            <image src={navigationIcons.userHandUp01} tint={colors.textInverted} width={19} height={19} objectFit="contain" />
          </view>
        ) : null}
      </view>
      <label value={product.title} style={styles.title} numberOfLines={1} />
      <label value={formatFcfa(product.price)} style={styles.price} numberOfLines={1} />
    </view>;
  }
}

const styles = {
  card: new Style<View>({
    flexDirection: 'column',
    marginBottom: spacing.md,
  }),
  imageFrame: new Style<View>({
    borderRadius: radius.md,
    position: 'relative',
  }),
  image: new Style<ImageView>({
    borderRadius: radius.md,
  }),
  requestButton: new Style<View>({
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#AFAFAF',
    borderRadius: radius.full,
    bottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.sm,
    position: 'absolute',
    width: '76%',
  }),
  requestCountBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(38, 38, 40, 0.94)',
    borderRadius: radius.full,
    bottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.xs,
    position: 'absolute',
    right: spacing.sm,
  }),
  existingRequestBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(38, 38, 40, 0.94)',
    borderRadius: radius.full,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.xs,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  }),
  requestLabel: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.semiBold(fontSize.body),
    marginRight: spacing.xs,
  }),
  requestCount: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(fontSize.body),
    marginRight: spacing.xs,
  }),
  title: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.semiBold(fontSize.metadata),
    marginTop: spacing.sm,
  }),
  price: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(fontSize.body),
    marginTop: spacing.xs,
  }),
};
