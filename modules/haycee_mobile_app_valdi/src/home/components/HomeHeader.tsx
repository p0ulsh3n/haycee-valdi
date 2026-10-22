import { Device } from 'valdi_core/src/Device';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';
import { HomeIconButton } from './HomeIconButton';
import { HomeTickerSearch } from './HomeTickerSearch';

export interface HomeHeaderViewModel {
  suggestions?: string[];
  onMenuTap?: () => void;
  onSearchTap?: () => void;
  onWishlistTap?: () => void;
  onNotificationsTap?: () => void;
}

/** Sticky Home header: actions row only. Category tabs live in HomeCategoryTabs. */
export class HomeHeader extends Component<HomeHeaderViewModel> {
  onRender(): void {
    <view
      style={styles.header.extend({
        paddingTop: Device.getDisplayTopInset() + layout.home.header.topPadding,
      })}
    >
      <layout style={styles.row}>
        <HomeIconButton glyph="☰" label="Menu" onTap={this.viewModel.onMenuTap} />
        <layout style={styles.searchSlot}>
          <HomeTickerSearch
            suggestions={this.viewModel.suggestions}
            onTap={this.viewModel.onSearchTap}
          />
        </layout>
        <layout style={styles.actions}>
          <HomeIconButton
            icon={navigationIcons.favourite}
            label="Favoris"
            onTap={this.viewModel.onWishlistTap}
          />
          <HomeIconButton
            icon={navigationIcons.notification01}
            label="Notifications"
            leadingMargin={layout.home.header.actionGap}
            onTap={this.viewModel.onNotificationsTap}
          />
        </layout>
      </layout>
    </view>;
  }
}

const styles = {
  header: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    paddingBottom: layout.home.header.bottomPadding,
    paddingLeft: layout.home.header.horizontalPadding,
    paddingRight: layout.home.header.horizontalPadding,
  }),
  row: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  }),
  searchSlot: new Style<Layout>({
    flexGrow: 1,
    marginLeft: layout.home.header.searchGap,
    marginRight: layout.home.header.searchGap,
    minWidth: 0,
  }),
  actions: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
  }),
};
