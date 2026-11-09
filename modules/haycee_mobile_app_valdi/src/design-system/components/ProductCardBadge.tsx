import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { fontSize, montserrat, transformText } from '../tokens/typography';

export interface ProductCardBadgeViewModel {
  label: string;
  backgroundColor: string;
  textColor?: string;
  icon?: Asset;
  borderRadius?: number;
}

/** Small, data-driven badge shared by product card states and promotions. */
export class ProductCardBadge extends Component<ProductCardBadgeViewModel> {
  onRender(): void {
    const { label, backgroundColor, textColor, icon, borderRadius } = this.viewModel;

    <view style={styles.badge.extend({ backgroundColor, borderRadius: borderRadius ?? radius.xs })}>
      {icon ? <image src={icon} tint={textColor ?? colors.textInverted} width={11} height={11} objectFit="contain" /> : null}
      <label
        value={transformText(label, 'upper')}
        style={styles.label.extend({
          color: textColor ?? colors.textInverted,
          marginLeft: icon ? spacing.xs : 0,
        })}
        numberOfLines={1}
        textOverflow="ellipsis"
      />
    </view>;
  }
}

const styles = {
  badge: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.xs,
    flexDirection: 'row',
    flexShrink: 0,
    paddingBottom: 2,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    paddingTop: 2,
  }),
  label: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(fontSize.nano),
  }),
};
