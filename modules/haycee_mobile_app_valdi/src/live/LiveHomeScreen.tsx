import { Component } from 'valdi_core/src/Component';
import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import { SwipeTabs } from '../design-system/components/SwipeTabs';
import type { SwipeTabItem } from '../design-system/components/SwipeTabs';
import { colors } from '../design-system/tokens/colors';
import { layout, spacing } from '../design-system/tokens/spacing';
import { LiveCategoryFeed } from './components/LiveCategoryFeed';
import { liveFeedTabs } from './data/LiveFeedData';

const swipeTabs: SwipeTabItem[] = liveFeedTabs.map(tab => ({
  id: tab.id,
  label: tab.label,
  pageTitle: tab.label,
  pageMessage: '',
}));

/** Main Live destination: Shellby category pager and a color-panel preview feed. */
export class LiveHomeScreen extends Component<{}> {
  private renderPage = (tab: SwipeTabItem, _isActive: boolean, isPrepared: boolean): void => {
    <LiveCategoryFeed categoryId={tab.id} isPrepared={isPrepared} />;
  };

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    <view style={styles.root.extend({ paddingTop: topInset + spacing.xs })}>
      <SwipeTabs
        tabs={swipeTabs}
        showPages={true}
        tabHeight={layout.live.categoryTabsHeight}
        tabItemWidth={layout.live.categoryTabWidth}
        strongLabels={true}
        textCase="upper"
        indicatorColor={colors.textPrimary}
        activeIndicatorWidthRatio={0.55}
        renderPage={this.renderPage}
      />
    </view>;
  }
}

const styles = {
  root: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexGrow: 1,
    flexShrink: 1,
  }),
};
