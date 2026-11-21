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
import type { ProductVariantSelectionIntent, SelectedProductVariant } from './products/ProductVariantSelectionSheet';
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
import { CartCheckoutScreen } from './cart/CartCheckoutScreen';
import type { MarketplaceCartItem } from './cart/data/CartData';
import { addMarketplaceCartItem, removeMarketplaceCartItem, updateMarketplaceCartQuantity } from './cart/data/CartData';
import { WalletScreen } from './profile/WalletScreen';
import { WalletWithdrawalScreen } from './profile/WalletWithdrawalScreen';
import { ProfileAccountDestinationScreen } from './profile/ProfileAccountDestinationScreen';
import type { ProfileAccountDestinationKind } from './profile/ProfileAccountDestinationScreen';
import { ProfileSettingsScreen } from './profile/ProfileSettingsScreen';
import { ProfileSettingsDestinationScreen } from './profile/ProfileSettingsDestinationScreen';
import type { SettingsDestinationKind, ProfileSettingsValues } from './profile/data/ProfileSettingsData';
import { DEFAULT_PROFILE_SETTINGS } from './profile/data/ProfileSettingsData';
import { WALLET_OVERVIEW } from './profile/data/WalletDemoData';
import { getBottomSheetNavigationOptions } from './design-system/components/BottomSheet';
import { AlertDialog } from './design-system/components/AlertDialog';
import { colors } from './design-system/tokens/colors';
import { runNavigationAction } from './design-system/utils/NavigationActionGate';
import { formatFcfa } from './design-system/utils/money';

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
  cartItems: MarketplaceCartItem[];
  profileSettings: ProfileSettingsValues;
}

/** Application root: Home is the first page and bottom tabs stay visible. */
export class App extends StatefulComponent<AppViewModel, AppState, AppComponentContext> {
  private navigationController?: NavigationController;

  state: AppState = { selectedHomeCategoryKey: 'all', cartItems: [], profileSettings: { ...DEFAULT_PROFILE_SETTINGS } };

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

  private handleOpenWallet = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(
        WalletScreen,
        { onWithdrawTap: this.handleOpenWalletWithdrawal },
        {},
        { animated: true },
      );
    });
  };

  private handleOpenWalletWithdrawal = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(
        WalletWithdrawalScreen,
        {
          onSubmit: amount => {
            TransientFeedback.show({
              message: `Demande de retrait de ${formatFcfa(amount)} simulée. Aucun transfert n’a été effectué.`,
              duration: 2400,
            });
          },
        },
        {},
        { animated: true },
      );
    });
  };

  private handleOpenProfileDestination = (kind: ProfileAccountDestinationKind): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(
        ProfileAccountDestinationScreen,
        {
          kind,
          selectedAddress: this.state.selectedPickupAddress,
          onAddressChange: this.handleSavePickupAddress,
        },
        {},
        { animated: true, pageBackgroundColor: colors.backgroundPrimary },
      );
    });
  };

  private handleProfileSettingsTap = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(
        ProfileSettingsScreen,
        {
          values: this.state.profileSettings,
          onNavigate: this.handleOpenSettingsDestination,
          onLogout: this.handleRequestLogout,
        },
        {},
        { animated: true, pageBackgroundColor: colors.backgroundPrimary },
      );
    });
  };

  private handleOpenSettingsDestination = (kind: SettingsDestinationKind, onValuesUpdated: (values: ProfileSettingsValues) => void): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(
        ProfileSettingsDestinationScreen,
        {
          kind,
          values: this.state.profileSettings,
          onSave: values => {
            this.handleSaveProfileSettings(values);
            onValuesUpdated(values);
          },
        },
        {},
        { animated: true, pageBackgroundColor: colors.backgroundPrimary },
      );
    });
  };

  private handleSaveProfileSettings = (profileSettings: ProfileSettingsValues): void => {
    this.setState({ ...this.state, profileSettings });
  };

  private handleRequestLogout = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.present(
        AlertDialog,
        {
          title: 'Se déconnecter de Haycee ?',
          message: 'La connexion au service de compte n’est pas encore disponible dans cette version.',
          confirmLabel: 'Se déconnecter',
          cancelLabel: 'Rester connecté',
          confirmStyle: 'danger',
          textCase: 'none',
          showOverlay: true,
          onConfirm: () => TransientFeedback.show({ message: 'La déconnexion sera activée avec le service de compte.' }),
        },
        {},
        { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions({ transparentPageBackground: true }) },
      );
    });
  };

  private handleProductTap = (product: HomeProduct, recommendations?: HomeProduct[]): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(ProductDetailScreen, { product, recommendations, onAddToCart: this.handleAddToCart }, {});
    });
  };

  private handleAddToCart = (
    product: MasonryProduct,
    quantity: number,
    selections: SelectedProductVariant[] = [],
    combinationId?: string,
  ): void => {
    const nextItems = addMarketplaceCartItem(this.state.cartItems, product, quantity, selections, combinationId);
    if (nextItems === this.state.cartItems) {
      TransientFeedback.show({ message: 'La quantité disponible pour cet article est déjà dans le panier.' });
      return;
    }
    this.setState({ cartItems: nextItems });
    TransientFeedback.show({
      message: `${product.title} ajouté au panier`,
      icon: navigationIcons.shoppingCartCheck02,
      duration: 2200,
    });
  };

  private handleCartQuantityChange = (itemId: string, delta: number): void => {
    this.setState({ cartItems: updateMarketplaceCartQuantity(this.state.cartItems, itemId, delta) });
  };

  private handleCartItemRemove = (itemId: string): void => {
    this.setState({ cartItems: removeMarketplaceCartItem(this.state.cartItems, itemId) });
  };

  private handleCartStoreTap = (product: MasonryProduct): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(SellerProfileScreen, { product }, {});
    });
  };

  private handleCartCheckout = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController?.push(
        CartCheckoutScreen,
        {
          items: this.state.cartItems,
          selectedAddress: this.state.selectedPickupAddress,
          onAddressSaved: this.handleSavePickupAddress,
          onStoreTap: this.handleCartStoreTap,
          onOrderCompleted: () => this.setState({ ...this.state, cartItems: [] }),
          onViewOrders: () => {
            this.navigationController?.push(
              ProfileAccountDestinationScreen,
              { kind: 'orders', selectedAddress: this.state.selectedPickupAddress, onAddressChange: this.handleSavePickupAddress },
              {},
              { animated: true, pageBackgroundColor: colors.backgroundPrimary },
            );
          },
        },
        {},
        { animated: true, pageBackgroundColor: colors.backgroundPrimary },
      );
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
          onAddToCart: this.handleAddToCart,
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
    this.handleAddToCart(product, 1);
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
            cartItems={this.state.cartItems}
            onCartQuantityChange={this.handleCartQuantityChange}
            onCartItemRemove={this.handleCartItemRemove}
            onCartStoreTap={this.handleCartStoreTap}
            onCartCheckout={this.handleCartCheckout}
            selectedPickupAddress={this.state.selectedPickupAddress}
            onSelectAddress={this.handleOpenAddressPicker}
            onProfileSupportTap={() => TransientFeedback.show({ message: 'Service client' })}
            onProfileShareTap={() => TransientFeedback.show({ message: 'Partager mon profil' })}
            onProfileSettingsTap={this.handleProfileSettingsTap}
            onProfileWalletTap={this.handleOpenWallet}
            profileWalletBalance={WALLET_OVERVIEW.availableBalance}
            profileUnreadNotificationCount={0}
            profileDisplayName={this.state.profileSettings.displayName.trim() || undefined}
            onProfileOrdersTap={() => this.handleOpenProfileDestination('orders')}
            onProfileLiveSupportTap={() => this.handleOpenProfileDestination('live-support')}
            onProfileNotificationsTap={() => this.handleOpenProfileDestination('notifications')}
            onProfilePaymentTap={() => this.handleOpenProfileDestination('payment')}
            onProfileShippingTap={() => this.handleOpenProfileDestination('shipping')}
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
