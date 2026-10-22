import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { transformText, typography, TextCase } from '../tokens/typography';

export type DSButtonVariant = 'primary' | 'secondary' | 'danger';

export interface DSButtonViewModel {
  title: string;
  onTap: () => void;
  variant?: DSButtonVariant;
  disabled?: boolean;
  /** Optional leading icon asset, rendered with the same tint as the label. */
  icon?: string;
  iconSize?: number;
  iconTint?: string;
  /** Defaults to `upper`; use `lower` or `none` when needed. */
  textCase?: TextCase;
}

const baseButtonStyle = new Style<View>({
  alignItems: 'center',
  alignSelf: 'center',
  borderRadius: radius.md,
  justifyContent: 'center',
  minHeight: 48,
  minWidth: 220,
  paddingLeft: spacing.lg,
  paddingRight: spacing.lg,
});

const buttonStyles = {
  primary: baseButtonStyle.extend({
    backgroundColor: colors.interactivePrimary,
  }),
  secondary: baseButtonStyle.extend({
    backgroundColor: colors.backgroundSecondary,
    border: `1 solid ${colors.borderDefault}`,
  }),
  danger: baseButtonStyle.extend({
    backgroundColor: colors.interactiveDanger,
  }),
  disabled: baseButtonStyle.extend({
    backgroundColor: colors.interactiveDisabled,
  }),
} as const;

const buttonLabelStyles = {
  primary: typography.button.extend({ color: colors.textBrand }),
  secondary: typography.button.extend({ color: colors.textPrimary }),
  danger: typography.button.extend({ color: colors.textInverted }),
  disabled: typography.button.extend({ color: colors.textTertiary }),
} as const;

const buttonContentStyle = new Style<View>({
  alignItems: 'center',
  flexDirection: 'row',
});

const buttonIconStyle = new Style<View>({
  marginRight: spacing.sm,
});

/** A small, platform-native button built from Valdi template elements. */
export class DSButton extends Component<DSButtonViewModel> {
  onRender(): void {
    const variant = this.viewModel.variant ?? 'primary';
    const disabled = this.viewModel.disabled ?? false;
    const style = disabled ? buttonStyles.disabled : buttonStyles[variant];
    const labelStyle = disabled ? buttonLabelStyles.disabled : buttonLabelStyles[variant];
    const iconTint = this.viewModel.iconTint
      ?? (disabled
        ? colors.textTertiary
        : variant === 'danger'
          ? colors.textInverted
          : variant === 'primary'
            ? colors.textBrand
            : colors.textPrimary);
    const iconSize = this.viewModel.iconSize ?? 18;

    <view
      style={style}
      accessibilityCategory="button"
      accessibilityStateDisabled={disabled}
      onTap={this.viewModel.onTap}
      onTapDisabled={disabled}
    >
      <view style={buttonContentStyle}>
        {this.viewModel.icon ? (
          <view style={buttonIconStyle}>
            <image src={this.viewModel.icon} tint={iconTint} width={iconSize} height={iconSize} objectFit="contain" />
          </view>
        ) : null}
        <label
          style={labelStyle}
          value={transformText(this.viewModel.title, this.viewModel.textCase)}
          numberOfLines={1}
        />
      </view>
    </view>;
  }
}
