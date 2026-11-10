import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { $slot } from 'valdi_core/src/CompilerIntrinsics';
import { Layout } from 'valdi_tsx/src/NativeTemplateElements';
import { NavigationRoot } from 'valdi_navigation/src/NavigationRoot';
import { NavigationController } from 'valdi_navigation/src/NavigationController';
import { BottomTabsNavigation } from './design-system/components/BottomTabsNavigation';
import { InAppBannerComponent } from './design-system/components/InAppBanner';
import { SnackBarComponent, TransientFeedback } from './design-system/components/SnackBar';
import { layout } from './design-system/tokens/spacing';
import navigationIcons from '../res/navigation-icons';
import { ProductDetailScreen } from './products/ProductDetailScreen';
import { ProductVariantSelectionSheet, getProductVariantGroups } from './products/ProductVariantSelectionSheet';
import type { ProductVariantSelectionIntent } from './products/ProductVariantSelectionSheet';
import type { HomeCollectionKind, HomeProduct } from './home/components/HomeProductRail';
import type { MasonryProduct } from './design-system/components/MasonryProductCard';
import { ConversationScreen } from './messaging/ConversationScreen';
import { ConversationPreview } from './messaging/MessagingTypes';
import { LiveViewerScreen } from './live/LiveViewerScreen';
import { UpcomingLiveScreen } from './live/UpcomingLiveScreen';
import type { LiveFeedItem } from './live/data/LiveFeedData';
import { FlashSaleScreen } from './marketplace/FlashSaleScreen';
import { TrendingScreen } from './marketplace/TrendingScreen';
import { SearchScreen } from './search/SearchScreen';
import { SellerProfileScreen } from './sellers/SellerProfileScreen';
import { HomeCategoriesScreen } from './home/HomeCategoriesScreen';
import { AddressPickerSheet } from './cart/AddressPickerSheet';
import { getBottomSheetNavigationOptions } from './design-system/components/BottomSheet';
import { colors } from './design-system/tokens/colors';
import { runNavigationAction } from './design-system/utils/NavigationActionGate';

/**
 * @ViewModel
 * @ExportModel
 */
export interface AppViewModel {}

/**
 * @Context
 * @ExportModel
 */
export interface AppComponentContext {}

interface AppState {
  selectedHomeCategoryKey: string;
  selectedPickupAddress?: string;
}

/** Application root: Home is the first page and bottom tabs stay visible. */
export class App extends StatefulComponent<AppViewModel, AppState, AppComponentContext> {
  private navigationController?: NavigationController;

  state: AppState = { selectedHomeCategoryKey: 'all' };

  private handleOpenCategories = (selectedCategoryKey: string): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(
        HomeCategoriesScreen,
        {
          selectedCategoryKey,
          onSelectCategory: this.handleCategoryDirectorySelect,
          onProductTap: this.handleProductTap,
          onQuickAdd: this.handleQuickAdd,
        },
        {},
      );
    });
  };

  private handleCategoryDirectorySelect = (categoryKey: string): void => {
    this.setState({ selectedHomeCategoryKey: categoryKey });
  };

  private handleOpenAddressPicker = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.present(
        AddressPickerSheet,
        {
          selectedAddress: this.state.selectedPickupAddress,
          onSave: this.handleSavePickupAddress,
        },
        {},
        {
          animated: true,
          wrapInPlatformNavigationController: false,
          pageBackgroundColor: colors.backgroundPrimary,
        },
      );
    });
  };

  private handleSavePickupAddress = (address: string): void => {
    this.setState({ selectedPickupAddress: address });
  };

  private handleProductTap = (product: HomeProduct, recommendations?: HomeProduct[]): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(ProductDetailScreen, { product, recommendations }, {});
    });
  };

  private handleConversationTap = (conversation: ConversationPreview): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(ConversationScreen, { conversation }, {});
    });
  };

  private handleSearchTap = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(
        SearchScreen,
        {
          onProductTap: this.handleProductTap,
          onQuickAdd: this.handleQuickAdd,
          onSellerTap: this.handleSellerSearchTap,
        },
        {},
      );
    });
  };

  private handleSellerSearchTap = (product: HomeProduct): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(SellerProfileScreen, { product }, {});
    });
  };

  private handleOpenCollection = (kind: HomeCollectionKind): void => {
    const viewModel = {
      onProductTap: this.handleProductTap,
      onQuickAdd: this.handleQuickAdd,
    };
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(kind === 'flash' ? FlashSaleScreen : TrendingScreen, viewModel, {});
    });
  };

  private openProductVariantSheet = (product: MasonryProduct, intent: ProductVariantSelectionIntent): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.present(
        ProductVariantSelectionSheet,
        {
          product,
          intent,
          onAddToCart: selectedProduct => {
            TransientFeedback.show({
              message: `${selectedProduct.title} ajouté au panier`,
              icon: navigationIcons.shoppingCartAdd02,
              duration: 2200,
            });
          },
          onBuyNow: selectedProduct => {
            TransientFeedback.show({ message: `Passage au paiement pour ${selectedProduct.title}`, duration: 2200 });
          },
        },
        {},
        { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions({ transparentPageBackground: true }) },
      );
    });
  };

  private handleQuickAdd = (product: HomeProduct): void => {
    if (getProductVariantGroups(product).length > 0) {
      this.openProductVariantSheet(product, 'add-to-cart');
      return;
    }
    TransientFeedback.show({
      message: 'Votre article a été ajouté au panier',
      icon: navigationIcons.shoppingCartAdd02,
      duration: 2200,
    });
  };

  private handleLiveTap = (item: LiveFeedItem): void => {
    runNavigationAction(this.navigationController, () => {
      if (item.status === 'upcoming') {
        this.navigationController?.push(UpcomingLiveScreen, { item, onOpenLive: this.handleLiveTap }, {});
        return;
      }
      this.navigationController?.push(LiveViewerScreen, { item }, {});
    });
  };

  onRender(): void {
    <layout style={styles.root}>
      <NavigationRoot>
        {$slot(_navigationController => {
          this.navigationController = _navigationController;
          <BottomTabsNavigation
            onMenuTap={this.handleOpenCategories}
            selectedHomeCategoryKey={this.state.selectedHomeCategoryKey}
            onSearchTap={this.handleSearchTap}
            onWishlistTap={() => TransientFeedback.show({ message: 'Favoris Home' })}
            onNotificationsTap={() => TransientFeedback.show({ message: 'Notifications Home' })}
            onOpenCollection={this.handleOpenCollection}
            onProductTap={this.handleProductTap}
            onConversationTap={this.handleConversationTap}
            onLiveTap={this.handleLiveTap}
            onQuickAdd={this.handleQuickAdd}
            selectedPickupAddress={this.state.selectedPickupAddress}
            onSelectAddress={this.handleOpenAddressPicker}
          />;
        })}
      </NavigationRoot>
      <SnackBarComponent bottomOffset={layout.navigation.bottomTabsHeight} />
      <InAppBannerComponent />
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({
    flexGrow: 1,
  }),
};
