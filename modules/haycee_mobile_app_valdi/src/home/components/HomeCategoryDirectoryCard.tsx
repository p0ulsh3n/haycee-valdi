import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

export interface HomeCategoryDirectoryCardViewModel {
  id: string;
  label: string;
  panelColor: string;
  width: number;
  marginRight?: number;
  onTap?: () => void;
}

/** Square category tile with a text-first layout and a temporary color artwork panel. */
export class HomeCategoryDirectoryCard extends Component<HomeCategoryDirectoryCardViewModel> {
  onRender(): void {
    const { label, panelColor, width, marginRight = 0, onTap } = this.viewModel;
    <view
      style={styles.card.extend({ height: width, marginRight, width })}
      onTap={onTap}
      accessibilityCategory="button"
      accessibilityLabel={label}
    >
      <label value={label} style={styles.label} numberOfLines={0} />
      <view style={styles.colorPanel.extend({ backgroundColor: panelColor })} />
    </view>;
  }
}

const styles = {
  card: new Style<View>({
    backgroundColor: colors.backgroundSecondary,
    borderRadius: layout.home.categoryDirectory.cardRadius,
    flexDirection: 'column',
    padding: layout.home.categoryDirectory.cardPadding,
    slowClipping: true,
  }),
  label: new Style<Label>({
    color: colors.textPrimary,
    flexShrink: 0,
    font: montserrat.semiBold(fontSize.product),
    lineHeight: 1.2,
    marginBottom: spacing.sm,
    width: '100%',
  }),
  colorPanel: new Style<View>({
    borderRadius: radius.sm,
    flexGrow: 1,
    minHeight: 24,
    width: '100%',
  }),
};
