import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { TransientFeedback } from '../design-system/components/SnackBar';
import type { HomeProduct } from '../home/components/HomeProductRail';
import { MarketplaceCollectionScreen } from './MarketplaceCollectionScreen';

interface FlashSaleScreenViewModel {
  onProductTap?: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd?: (product: HomeProduct) => void;
}

/** Full Flash Sale catalogue opened from the Home rail's “Voir tout” action. */
@NavigationPage(module)
export class FlashSaleScreen extends NavigationPageStatefulComponent<FlashSaleScreenViewModel, {}> {
  state = {};

  private handleBack = (): void => {
    this.navigationController.pop();
  };

  private handleCartTap = (): void => {
    TransientFeedback.show({ message: 'Le panier est disponible dans la navigation.' });
  };

  onRender(): void {
    <MarketplaceCollectionScreen
      kind="flash"
      onBack={this.handleBack}
      onCartTap={this.handleCartTap}
      onProductTap={this.viewModel.onProductTap}
      onQuickAdd={this.viewModel.onQuickAdd}
    />;
  }
}
