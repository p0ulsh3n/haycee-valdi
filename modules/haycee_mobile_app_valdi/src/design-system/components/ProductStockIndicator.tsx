import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { layout, spacing } from '../tokens/spacing';
import { fontSize, montserrat } from '../tokens/typography';

export interface ProductStockIndicatorViewModel {
  remaining: number;
  total?: number;
  lowStockThreshold?: number;
  normalColor?: string;
}

/** Shared inventory progress and availability hint; the bar needs a valid starting total. */
export class ProductStockIndicator extends Component<ProductStockIndicatorViewModel> {
  onRender(): void {
    const { remaining, total } = this.viewModel;
    const safeRemaining = Math.max(0, Math.floor(remaining));
    const lowStockThreshold = Math.max(1, Math.floor(this.viewModel.lowStockThreshold ?? 5));
    const hasTotal = total !== undefined && Number.isFinite(total) && total > 0;
    const totalValue = total ?? 0;
    const soldPercent = hasTotal ? Math.min(100, Math.max(0, ((totalValue - safeRemaining) / totalValue) * 100)) : 0;
    const label = safeRemaining === 0
      ? 'RUPTURE DE STOCK'
      : safeRemaining === 1
        ? 'DERNIÈRE PIÈCE'
        : safeRemaining <= lowStockThreshold
          ? `PLUS QUE ${safeRemaining} EN STOCK`
          : `${safeRemaining} EN STOCK`;
    const labelColor = safeRemaining === 0
      ? colors.offerDanger
      : safeRemaining <= lowStockThreshold
        ? colors.offerWarning
        : this.viewModel.normalColor ?? colors.offerWarning;

    <layout style={styles.container}>
      {hasTotal ? (
        <view style={styles.track}>
          <view style={styles.fill.extend({ width: `${soldPercent}%` })} />
        </view>
      ) : null}
      <label value={label} style={styles.label.extend({ color: labelColor })} numberOfLines={1} textOverflow="ellipsis" />
    </layout>;
  }
}

const styles = {
  container: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1, minWidth: 0 }),
  track: new Style<View>({
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    flexGrow: 1,
    flexShrink: 1,
    height: layout.product.stockIndicator.progressHeight,
    marginRight: spacing.sm,
    minWidth: layout.product.stockIndicator.progressMinWidth,
  }),
  fill: new Style<View>({
    background: colors.stockProgressGradient,
    borderRadius: radius.full,
    height: layout.product.stockIndicator.progressHeight,
  }),
  label: new Style<Label>({ flexShrink: 1, font: montserrat.extraBold(fontSize.nano) }),
};
