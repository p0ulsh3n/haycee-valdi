import { Component } from 'valdi_core/src/Component';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';
import { transformText, typography } from '../../design-system/tokens/typography';

export interface HomeCategoryTabViewModel {
  label: string;
  active: boolean;
  tabWidth?: number;
  onLayout?: (frame: ElementFrame) => void;
  onTap?: () => void;
}

export class HomeCategoryTab extends Component<HomeCategoryTabViewModel> {
  onRender(): void {
    const label = transformText(this.viewModel.label, 'capitalize');
    const indicatorWidth = this.viewModel.tabWidth === undefined
      ? Math.max(24, label.length * 7)
      : Math.max(8, this.viewModel.tabWidth - layout.home.categoryTabs.tabPaddingHorizontal * 2);

    <view
      style={styles.tab}
      onLayout={this.viewModel.onLayout}
      onTap={this.viewModel.onTap}
      accessibilityCategory="button"
    >
      <label
        style={typography.homeTabLabel.extend({
          color: this.viewModel.active ? colors.textPrimary : colors.textSecondary,
        })}
        value={label}
        numberOfLines={1}
      />
      <layout style={styles.indicatorSlot}>
        {this.viewModel.active ? (
          <view style={styles.indicator.extend({ width: indicatorWidth })} />
        ) : null}
      </layout>
    </view>;
  }
}

const styles = {
  tab: new Style<View>({
    alignItems: 'center',
    height: layout.home.categoryTabs.height,
    justifyContent: 'center',
    paddingLeft: layout.home.categoryTabs.tabPaddingHorizontal,
    paddingRight: layout.home.categoryTabs.tabPaddingHorizontal,
    position: 'relative',
  }),
  indicatorSlot: new Style<Layout>({
    alignItems: 'center',
    bottom: 0,
    height: layout.home.categoryTabs.indicatorSlotHeight,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
  }),
  indicator: new Style<View>({
    backgroundColor: colors.textPrimary,
    height: layout.home.categoryTabs.indicatorHeight,
  }),
};
