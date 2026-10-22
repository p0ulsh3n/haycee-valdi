import { Asset } from 'valdi_tsx/src/Asset';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';
import { metropolis } from '../../design-system/tokens/typography';

export interface HomeIconButtonViewModel {
  icon?: Asset;
  glyph?: string;
  label: string;
  leadingMargin?: number;
  onTap?: () => void;
}

/** Reusable 44pt action target used by the Home header. */
export class HomeIconButton extends Component<HomeIconButtonViewModel> {
  onRender(): void {
    <view
      style={styles.button.extend({ marginLeft: this.viewModel.leadingMargin ?? 0 })}
      onTap={this.viewModel.onTap}
      accessibilityCategory="button"
    >
      {this.viewModel.icon ? (
        <image
          src={this.viewModel.icon}
          tint={colors.iconDefault}
          width={24}
          height={24}
          objectFit="contain"
        />
      ) : (
        <label style={styles.glyph} value={this.viewModel.glyph ?? ''} />
      )}
    </view>;
  }
}

const styles = {
  button: new Style<View>({
    alignItems: 'center',
    height: layout.home.header.actionTarget,
    justifyContent: 'center',
    width: layout.home.header.actionTarget,
  }),
  glyph: new Style<Label>({
    color: colors.iconDefault,
    font: metropolis.regular(24),
    lineHeight: 1,
  }),
};
