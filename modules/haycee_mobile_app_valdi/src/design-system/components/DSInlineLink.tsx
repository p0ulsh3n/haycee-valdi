import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../tokens/colors';
import { fontSize, montserrat, transformText } from '../tokens/typography';

export interface DSInlineLinkViewModel {
  title: string;
  onTap: () => void;
  textColor?: string;
  accessibilityLabel?: string;
}

/** Compact underlined text link for secondary navigation actions within content rows. */
export class DSInlineLink extends Component<DSInlineLinkViewModel> {
  onRender(): void {
    const { title, onTap } = this.viewModel;
    <view
      style={styles.container}
      onTap={onTap}
      accessibilityCategory="button"
      accessibilityLabel={this.viewModel.accessibilityLabel ?? title}
    >
      <label
        value={transformText(title, 'none')}
        style={styles.label.extend({ color: this.viewModel.textColor ?? colors.interactivePrimary })}
        numberOfLines={1}
      />
    </view>;
  }
}

const styles = {
  container: new Style<View>({ flexShrink: 0 }),
  label: new Style<Label>({
    font: montserrat.semiBold(fontSize.tiny),
    textDecoration: 'underline',
  }),
};
