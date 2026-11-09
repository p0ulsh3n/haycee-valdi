import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { layout, spacing } from '../tokens/spacing';
import { formatIntegerWithDotSeparator } from '../utils/money';
import { fontSize, montserrat, transformText } from '../tokens/typography';

export interface ProductStockCountPillViewModel {
  count: number;
  surfaceColor?: string;
  textColor?: string;
}

/** Compact total inventory count, reusable in product cards and product details. */
export class ProductStockCountPill extends Component<ProductStockCountPillViewModel> {
  onRender(): void {
    const count = Math.max(0, Math.floor(Number.isFinite(this.viewModel.count) ? this.viewModel.count : 0));

    <view
      style={styles.pill.extend({
        backgroundColor: this.viewModel.surfaceColor ?? colors.backgroundSecondary,
      })}
      accessibilityLabel={`Stock : ${count}`}
    >
      <label
        value={transformText(`STOCK : ${formatIntegerWithDotSeparator(count)}`, 'upper')}
        style={styles.label.extend({ color: this.viewModel.textColor ?? colors.textPrimary })}
        numberOfLines={1}
      />
    </view>;
  }
}

const styles = {
  pill: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.xxs,
    flexShrink: 0,
    height: layout.product.stockCountPill.height,
    justifyContent: 'center',
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
  }),
  label: new Style<Label>({
    font: montserrat.semiBold(fontSize.nano),
  }),
};
