import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../design-system/tokens/colors';
import type { HomeCollectionKind, HomeProduct } from './components/HomeProductRail';
import { HomeCategoryTabs } from './components/HomeCategoryTabs';
import { HomeContent } from './HomeContent';
import { HomeHeader } from './components/HomeHeader';

export interface HomeScreenViewModel {
  onMenuTap?: (selectedCategoryKey: string) => void;
  onSearchTap?: () => void;
  onWishlistTap?: () => void;
  onNotificationsTap?: () => void;
  onProductTap?: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd?: (product: HomeProduct) => void;
  onOpenCollection?: (kind: HomeCollectionKind) => void;
  selectedCategoryKey?: string;
}

interface HomeSurfaceState {
  selectedCategoryKey: string;
}

/** Reusable Home surface used by the root tab and by the standalone page. */
export class HomeSurface extends StatefulComponent<HomeScreenViewModel, HomeSurfaceState> {
  state: HomeSurfaceState = { selectedCategoryKey: 'all' };

  onCreate(): void {
    this.state = { selectedCategoryKey: this.viewModel.selectedCategoryKey ?? 'all' };
  }

  onViewModelUpdate(previous?: HomeScreenViewModel): void {
    const selectedCategoryKey = this.viewModel.selectedCategoryKey;
    if (selectedCategoryKey && selectedCategoryKey !== previous?.selectedCategoryKey && selectedCategoryKey !== this.state.selectedCategoryKey) {
      this.setState({ selectedCategoryKey });
    }
  }

  onRender(): void {
    <view style={styles.root}>
      <HomeHeader
        suggestions={['Rechercher une robe', 'Sneakers tendance', 'Nouveautés beauté']}
        onMenuTap={() => this.viewModel.onMenuTap?.(this.state.selectedCategoryKey)}
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
      onOpenCollection={this.viewModel.onOpenCollection}
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
      selectedCategoryKey={this.viewModel.selectedCategoryKey}
      onOpenCollection={this.viewModel.onOpenCollection}
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
