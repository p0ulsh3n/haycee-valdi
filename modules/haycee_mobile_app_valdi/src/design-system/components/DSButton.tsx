import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { fontSize, montserrat, transformText, typography, TextCase } from '../tokens/typography';
import { AsyncActionButton } from './AsyncActionButton';

/** The four shared button appearances used across the app. */
export type DSButtonVariant = 'cta' | 'black' | 'neutral' | 'outline';
export type DSButtonSize = 'standard' | 'compact' | 'fullWidth';

export interface DSButtonViewModel {
  title: string;
  onTap: () => void | Promise<unknown>;
  variant?: DSButtonVariant;
  /** Compact matches seller actions; fullWidth is intended for paired sheet actions. */
  size?: DSButtonSize;
  /** Optional horizontal spacing when a button sits in a row. */
  marginLeft?: number;
  marginRight?: number;
  /** Optional height override for a shared variant in a denser surface. */
  height?: number;
  disabled?: boolean;
  /** Shows a native spinner while keeping the original label's layout width. */
  loading?: boolean;
  /** Optional leading icon asset, rendered with the same tint as the label. */
  icon?: string | Asset;
  iconSize?: number;
  iconTint?: string;
  accessibilityLabel?: string;
  /** Defaults to `upper`; use `lower` or `none` when needed. */
  textCase?: TextCase;
}

const semanticButtonColors = {
  cta: { backgroundColor: colors.buttonPrimary },
  black: { backgroundColor: colors.buttonSecondary },
  neutral: { backgroundColor: colors.buttonNeutral },
  outline: {
    backgroundColor: colors.backgroundPrimary,
    borderColor: colors.borderDefault,
    borderWidth: 1,
  },
} as const;

const semanticLabelColors = {
  cta: colors.textInverted,
  black: colors.textInverted,
  neutral: colors.textPrimary,
  outline: colors.textPrimary,
} as const;

const semanticButtonStyle = (variant: keyof typeof semanticButtonColors, size: DSButtonSize): Style<View> => {
  const geometry = size === 'compact'
    ? { height: 36, width: 96 }
    : size === 'fullWidth'
      ? { alignSelf: 'stretch' as const, flexGrow: 1, flexShrink: 1, height: 46 }
      : { minHeight: 48, minWidth: 220 };
  return new Style<View>({
    alignItems: 'center',
    borderRadius: radius.full,
    justifyContent: 'center',
    paddingLeft: size === 'compact' ? spacing.md : size === 'fullWidth' ? spacing.sm : spacing.lg,
    paddingRight: size === 'compact' ? spacing.md : size === 'fullWidth' ? spacing.sm : spacing.lg,
    ...geometry,
    ...semanticButtonColors[variant],
  });
};

// Styles are instantiated once and reused across renders, following Valdi's Style guidance.
const semanticButtonStyles = {
  cta: {
    standard: semanticButtonStyle('cta', 'standard'),
    compact: semanticButtonStyle('cta', 'compact'),
    fullWidth: semanticButtonStyle('cta', 'fullWidth'),
  },
  black: {
    standard: semanticButtonStyle('black', 'standard'),
    compact: semanticButtonStyle('black', 'compact'),
    fullWidth: semanticButtonStyle('black', 'fullWidth'),
  },
  neutral: {
    standard: semanticButtonStyle('neutral', 'standard'),
    compact: semanticButtonStyle('neutral', 'compact'),
    fullWidth: semanticButtonStyle('neutral', 'fullWidth'),
  },
  outline: {
    standard: semanticButtonStyle('outline', 'standard'),
    compact: semanticButtonStyle('outline', 'compact'),
    fullWidth: semanticButtonStyle('outline', 'fullWidth'),
  },
} as const;

const semanticLabelStyles = {
  cta: typography.buttonSmall.extend({ color: semanticLabelColors.cta }),
  black: typography.buttonSmall.extend({ color: semanticLabelColors.black }),
  neutral: typography.buttonSmall.extend({ color: semanticLabelColors.neutral }),
  outline: new Style<Label>({
    color: semanticLabelColors.outline,
    font: montserrat.semiBold(fontSize.metadata),
  }),
} as const;

const disabledSemanticStyles = {
  standard: new Style<View>({ backgroundColor: colors.interactiveDisabled }),
  compact: new Style<View>({ backgroundColor: colors.interactiveDisabled }),
  fullWidth: new Style<View>({ backgroundColor: colors.interactiveDisabled }),
} as const;

const disabledButtonLabelStyle = typography.button.extend({ color: colors.textTertiary });

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
    const variant = this.viewModel.variant ?? 'cta';
    const size = this.viewModel.size ?? 'standard';
    const disabled = this.viewModel.disabled ?? false;
    const semanticSize = size as keyof typeof semanticButtonStyles.cta;
    const baseStyle = semanticButtonStyles[variant][semanticSize];
    const style = disabled
      ? baseStyle.extend(disabledSemanticStyles[size]) as Style<View>
      : baseStyle;
    const labelStyle = disabled ? disabledButtonLabelStyle : semanticLabelStyles[variant];
    const spacingStyle = this.viewModel.marginLeft !== undefined || this.viewModel.marginRight !== undefined
      ? style.extend({ marginLeft: this.viewModel.marginLeft, marginRight: this.viewModel.marginRight }) as Style<View>
      : style;
    const sizedStyle = this.viewModel.height !== undefined
      ? spacingStyle.extend({ height: this.viewModel.height }) as Style<View>
      : spacingStyle;
    const iconTint = this.viewModel.iconTint
      ?? (disabled
        ? colors.textTertiary
        : variant === 'cta' || variant === 'black'
          ? colors.textInverted
          : colors.textPrimary);
    <AsyncActionButton
      title={transformText(this.viewModel.title, this.viewModel.textCase)}
      onTap={this.viewModel.onTap}
      buttonStyle={sizedStyle}
      labelStyle={labelStyle}
      contentStyle={buttonContentStyle}
      iconStyle={buttonIconStyle}
      icon={this.viewModel.icon}
      iconSize={this.viewModel.iconSize ?? 18}
      iconTint={iconTint}
      accessibilityLabel={this.viewModel.accessibilityLabel}
      spinnerColor={iconTint}
      disabled={disabled}
      loading={this.viewModel.loading}
    />;
  }
}
