import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

export interface HomeSubcategoryRowViewModel {
  label: string;
  panelColor: string;
  onTap?: () => void;
}

/** Single subcategory row with a temporary color artwork tile instead of a photo. */
export class HomeSubcategoryRow extends Component<HomeSubcategoryRowViewModel> {
  onRender(): void {
    const { label, panelColor, onTap } = this.viewModel;

    <view style={styles.row} onTap={onTap} accessibilityCategory="button" accessibilityLabel={label}>
      <view style={styles.artworkShell}>
        <view style={styles.artwork.extend({ backgroundColor: panelColor })} />
      </view>
      <label value={label} style={styles.label} numberOfLines={0} />
    </view>;
  }
}

const styles = {
  row: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: layout.home.categoryDirectory.subcategoryRowGap,
    minHeight: layout.home.categoryDirectory.subcategoryThumbHeight,
    width: '100%',
  }),
  artworkShell: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    flexShrink: 0,
    height: layout.home.categoryDirectory.subcategoryThumbHeight,
    justifyContent: 'center',
    padding: spacing.xs,
    width: layout.home.categoryDirectory.subcategoryThumbWidth,
  }),
  artwork: new Style<View>({
    borderRadius: radius.sm,
    flexGrow: 1,
    width: '100%',
  }),
  label: new Style<Label>({
    color: colors.textPrimary,
    flexGrow: 1,
    flexShrink: 1,
    font: montserrat.regular(fontSize.product),
    marginLeft: layout.home.categoryDirectory.subcategoryLabelGap,
    width: 0,
  }),
};
