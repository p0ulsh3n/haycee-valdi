import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { layout, spacing } from '../tokens/spacing';
import { fontSize, montserrat } from '../tokens/typography';

export type QuantityStepperSize = 'compact' | 'product' | 'standard';
export type QuantityStepperAppearance = 'outlined' | 'soft' | 'grouped' | 'white';

export interface QuantityStepperViewModel {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  size?: QuantityStepperSize;
  appearance?: QuantityStepperAppearance;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
  itemLabel?: string;
  marginLeft?: number;
}

const dimensions = {
  compact: {
    button: layout.quantityStepper.compactButtonSize,
    count: layout.quantityStepper.compactCountWidth,
    icon: layout.quantityStepper.compactIconSize,
    gap: spacing.xs,
  },
  product: {
    button: layout.quantityStepper.productButtonSize,
    count: layout.quantityStepper.productCountWidth,
    icon: layout.quantityStepper.productIconSize,
    gap: spacing.xs,
  },
  standard: {
    button: layout.quantityStepper.standardButtonSize,
    count: layout.quantityStepper.standardCountWidth,
    icon: layout.quantityStepper.standardIconSize,
    gap: spacing.xs,
  },
} as const;

/** Shared, fixed-width quantity control. The counter slot never resizes with its value. */
export class QuantityStepper extends Component<QuantityStepperViewModel> {
  onRender(): void {
    const size = this.viewModel.size ?? 'standard';
    const appearance = this.viewModel.appearance ?? 'outlined';
    const metrics = dimensions[size];
    const decreaseDisabled = this.viewModel.decreaseDisabled ?? false;
    const increaseDisabled = this.viewModel.increaseDisabled ?? false;
    const itemLabel = this.viewModel.itemLabel;
    const buttonStyle = appearance === 'outlined'
      ? styles.outlinedButton
      : appearance === 'soft'
        ? styles.softButton
        : appearance === 'white'
          ? styles.whiteButton
          : styles.groupedButton;
    const baseRootStyle = appearance === 'grouped' ? styles.groupedRoot : styles.root;
    const rootStyle = this.viewModel.marginLeft !== undefined
      ? baseRootStyle.extend({ marginLeft: this.viewModel.marginLeft })
      : baseRootStyle;
    const countGap = appearance === 'grouped' ? 0 : metrics.gap;
    const countStyle = styles.countFrame.extend({
      height: metrics.button,
      marginLeft: countGap,
      marginRight: countGap,
      width: metrics.count,
    });
    const decreaseStyle = buttonStyle.extend({ height: metrics.button, width: metrics.button });
    const increaseStyle = buttonStyle.extend({ height: metrics.button, width: metrics.button });

    <view style={rootStyle}>
      <view
        style={decreaseStyle}
        opacity={decreaseDisabled ? 0.45 : 1}
        onTapDisabled={decreaseDisabled}
        onTap={this.viewModel.onDecrease}
        accessibilityCategory="button"
        accessibilityLabel={itemLabel ? `Diminuer la quantité de ${itemLabel}` : 'Diminuer la quantité'}
        accessibilityStateDisabled={decreaseDisabled}
      >
        <image src={navigationIcons.remove01} tint={colors.textPrimary} width={metrics.icon} height={metrics.icon} objectFit="contain" />
      </view>
      <view style={countStyle}>
        <label value={String(this.viewModel.value)} style={styles.countLabel} numberOfLines={1} />
      </view>
      <view
        style={increaseStyle}
        opacity={increaseDisabled ? 0.45 : 1}
        onTapDisabled={increaseDisabled}
        onTap={this.viewModel.onIncrease}
        accessibilityCategory="button"
        accessibilityLabel={itemLabel ? `Augmenter la quantité de ${itemLabel}` : 'Augmenter la quantité'}
        accessibilityStateDisabled={increaseDisabled}
      >
        <image src={navigationIcons.add01} tint={colors.textPrimary} width={metrics.icon} height={metrics.icon} objectFit="contain" />
      </view>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0 }),
  groupedRoot: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    flexDirection: 'row',
    flexShrink: 0,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
  }),
  outlinedButton: new Style<View>({
    alignItems: 'center',
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: 'center',
  }),
  softButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    flexShrink: 0,
    justifyContent: 'center',
  }),
  groupedButton: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.md,
    flexShrink: 0,
    justifyContent: 'center',
  }),
  whiteButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.md,
    flexShrink: 0,
    justifyContent: 'center',
  }),
  countFrame: new Style<View>({ alignItems: 'center', flexShrink: 0, justifyContent: 'center' }),
  countLabel: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.semiBold(fontSize.metadata),
    textAlign: 'center',
  }),
};
