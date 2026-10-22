import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';
import { typography, transformText } from '../../design-system/tokens/typography';

export interface HomeSectionHeaderViewModel {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionTap?: () => void;
}

export class HomeSectionHeader extends Component<HomeSectionHeaderViewModel> {
  onRender(): void {
    <layout style={styles.root}>
      <layout style={styles.copy}>
        <label style={typography.homeSectionLabel} value={transformText(this.viewModel.title, 'capitalize')} />
        {this.viewModel.subtitle ? (
          <label style={styles.subtitle} value={this.viewModel.subtitle} numberOfLines={1} />
        ) : null}
      </layout>
      {this.viewModel.actionLabel ? (
        <view style={styles.action} onTap={this.viewModel.onActionTap} accessibilityCategory="button">
          <label style={styles.actionLabel} value={transformText(this.viewModel.actionLabel, 'capitalize')} />
        </view>
      ) : null}
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: layout.home.sectionHeader.verticalPadding,
    paddingLeft: layout.home.sectionHeader.horizontalPadding,
    paddingRight: layout.home.sectionHeader.horizontalPadding,
    paddingTop: layout.home.sectionHeader.verticalPadding,
  }),
  copy: new Style<Layout>({
    flexGrow: 1,
    minWidth: 0,
  }),
  subtitle: typography.homeSectionSubtitle.extend({
    color: colors.textSecondary,
    marginTop: 2,
  }),
  action: new Style<View>({
    alignItems: 'flex-end',
    paddingLeft: 12,
  }),
  actionLabel: typography.homeSectionAction.extend({
    color: colors.textPrimary,
  }),
};
