import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../design-system/tokens/colors';
import { HomeProduct } from './components/HomeProductRail';
import { HomeCategoryTabs } from './components/HomeCategoryTabs';
import { HomeContent } from './HomeContent';
import { HomeHeader } from './components/HomeHeader';

export interface HomeScreenViewModel {
  onMenuTap?: () => void;
  onSearchTap?: () => void;
  onWishlistTap?: () => void;
  onNotificationsTap?: () => void;
  onProductTap?: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd?: (product: HomeProduct) => void;
}

interface HomeSurfaceState {
  selectedCategoryKey: string;
}

/** Reusable Home surface used by the root tab and by the standalone page. */
export class HomeSurface extends StatefulComponent<HomeScreenViewModel, HomeSurfaceState> {
  state: HomeSurfaceState = { selectedCategoryKey: 'all' };

  onRender(): void {
    <view style={styles.root}>
      <HomeHeader
        suggestions={['Rechercher une robe', 'Sneakers tendance', 'Nouveautés beauté']}
        onMenuTap={this.viewModel.onMenuTap}
        onSearchTap={this.viewModel.onSearchTap}
        onWishlistTap={this.viewModel.onWishlistTap}
        onNotificationsTap={this.viewModel.onNotificationsTap}
      />
      <HomeCategoryTabs
        selectedKey={this.state.selectedCategoryKey}
        onSelect={this.handleCategorySelect}
        renderPage={this.renderCategoryPage}
      />
    </view>;
  }

  private handleCategorySelect = (key: string): void => {
    this.setState({ selectedCategoryKey: key });
  };

  private renderCategoryPage = (
    categoryKey: string,
    isActive: boolean,
    isPrepared: boolean,
  ): void => {
    <HomeContent
      selectedCategoryKey={categoryKey}
      isActive={isActive}
      isPrepared={isPrepared}
      onProductTap={this.viewModel.onProductTap}
      onQuickAdd={this.viewModel.onQuickAdd}
    />;
  };
}

/** Shellby Home page wrapper for imperative Valdi navigation. */
@NavigationPage(module)
export class HomeScreen extends NavigationPageStatefulComponent<HomeScreenViewModel, {}> {
  state = {};

  onRender(): void {
    <HomeSurface
      onMenuTap={this.viewModel.onMenuTap}
      onSearchTap={this.viewModel.onSearchTap}
      onWishlistTap={this.viewModel.onWishlistTap}
      onNotificationsTap={this.viewModel.onNotificationsTap}
      onProductTap={this.viewModel.onProductTap}
      onQuickAdd={this.viewModel.onQuickAdd}
    />;
  }
}

const styles = {
  root: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
  }),
};
