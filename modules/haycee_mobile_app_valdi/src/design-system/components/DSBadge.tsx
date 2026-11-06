import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { fontSize, montserrat, transformText } from '../tokens/typography';

export type DSBadgeVariant =
  | 'exclusive'
  | 'sold'
  | 'clearance'
  | 'promotion'
  | 'new'
  | 'limited'
  | 'neutral';

export interface DSBadgeViewModel {
  label: string;
  variant?: DSBadgeVariant;
  backgroundColor?: string;
  textColor?: string;
}

/** Compact semantic label for live, product and seller-card statuses. */
export class DSBadge extends Component<DSBadgeViewModel> {
  onRender(): void {
    const variant = this.viewModel.variant ?? 'neutral';
    const variantColors = badgeColors[variant];

    <view
      style={styles.badge.extend({
        backgroundColor: this.viewModel.backgroundColor ?? variantColors.backgroundColor,
      })}
    >
      <label
        value={transformText(this.viewModel.label, 'upper')}
        style={styles.label.extend({ color: this.viewModel.textColor ?? variantColors.textColor })}
        numberOfLines={1}
      />
    </view>;
  }
}

const badgeColors: Record<DSBadgeVariant, { backgroundColor: string; textColor: string }> = {
  exclusive: { backgroundColor: colors.liveCardBadgeExclusive, textColor: colors.textPrimary },
  sold: { backgroundColor: colors.liveCardBadgeSold, textColor: colors.textInverted },
  clearance: { backgroundColor: colors.liveCardBadgeClearance, textColor: colors.textInverted },
  promotion: { backgroundColor: colors.liveCardBadgePromotion, textColor: colors.textInverted },
  new: { backgroundColor: colors.liveCardBadgeNew, textColor: colors.textPrimary },
  limited: { backgroundColor: colors.liveCardBadgeLimited, textColor: colors.textInverted },
  neutral: { backgroundColor: colors.backgroundSecondary, textColor: colors.textPrimary },
};

const styles = {
  badge: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.xs,
    flexShrink: 0,
    justifyContent: 'center',
    paddingBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.xs,
  }),
  label: new Style<Label>({
    font: montserrat.extraBold(fontSize.nano),
  }),
};
