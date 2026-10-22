import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import { SwipeTabItem, SwipeTabs } from '../../design-system/components/SwipeTabs';
import { colors } from '../../design-system/tokens/colors';
import { layout } from '../../design-system/tokens/spacing';
import { homeCategoryDefinitions } from '../data/HomeCategoryData';

export interface HomeCategoryTabsViewModel {
  selectedKey: string;
  onSelect?: (key: string) => void;
  renderPage?: (tabId: string, isActive: boolean, isPrepared: boolean) => void;
}

const categoryTabs: SwipeTabItem[] = homeCategoryDefinitions.map(category => ({
  id: category.id,
  label: category.label,
  pageTitle: category.label,
  pageMessage: '',
}));

/** Home category rail backed by the shared Snap-style SwipeTabs component. */
export class HomeCategoryTabs extends Component<HomeCategoryTabsViewModel> {
  private renderPage = (tab: SwipeTabItem, isActive: boolean, isPrepared: boolean): void => {
    this.viewModel.renderPage?.(tab.id, isActive, isPrepared);
  };

  private handleIndexChange = (index: number): void => {
    const tab = categoryTabs[index];
    if (tab) {
      this.viewModel.onSelect?.(tab.id);
    }
  };

  onRender(): void {
    const selectedIndex = Math.max(
      0,
      categoryTabs.findIndex(tab => tab.id === this.viewModel.selectedKey),
    );

    <view style={styles.root}>
      <SwipeTabs
        tabs={categoryTabs}
        initialIndex={selectedIndex}
        showPages={true}
        tabHeight={layout.home.categoryTabs.height}
        tabItemWidth={96}
        strongLabels={true}
        textCase="upper"
        indicatorColor={colors.textPrimary}
        activeIndicatorWidthRatio={0.55}
        renderPage={this.renderPage}
        onIndexChange={this.handleIndexChange}
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
