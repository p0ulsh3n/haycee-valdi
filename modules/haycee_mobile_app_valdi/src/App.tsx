import { Component } from 'valdi_core/src/Component';
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
import { HomeProduct } from './home/components/HomeProductRail';
import { ConversationScreen } from './messaging/ConversationScreen';
import { ConversationPreview } from './messaging/MessagingTypes';
import { LiveViewerScreen } from './live/LiveViewerScreen';
import type { LiveFeedItem } from './live/data/LiveFeedData';

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

/** Application root: Home is the first page and bottom tabs stay visible. */
export class App extends Component<AppViewModel, AppComponentContext> {
  private navigationController?: NavigationController;

  private handleProductTap = (product: HomeProduct, recommendations?: HomeProduct[]): void => {
    this.navigationController?.push(ProductDetailScreen, { product, recommendations }, {});
  };

  private handleConversationTap = (conversation: ConversationPreview): void => {
    this.navigationController?.push(
      ConversationScreen,
      { conversation },
      {},
    );
  };

  private handleLiveTap = (item: LiveFeedItem): void => {
    this.navigationController?.push(LiveViewerScreen, { item }, {});
  };

  onRender(): void {
    <layout style={styles.root}>
      <NavigationRoot>
        {$slot(_navigationController => {
          this.navigationController = _navigationController;
          <BottomTabsNavigation
            onMenuTap={() => TransientFeedback.show({ message: 'Menu Home' })}
            onSearchTap={() => TransientFeedback.show({ message: 'Recherche Home' })}
            onWishlistTap={() => TransientFeedback.show({ message: 'Favoris Home' })}
            onNotificationsTap={() => TransientFeedback.show({ message: 'Notifications Home' })}
            onProductTap={this.handleProductTap}
            onConversationTap={this.handleConversationTap}
            onLiveTap={this.handleLiveTap}
            onQuickAdd={() => TransientFeedback.show({
              message: 'Votre article a été ajouté au panier',
              icon: navigationIcons.shoppingCartAdd02,
              duration: 2200,
            })}
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
