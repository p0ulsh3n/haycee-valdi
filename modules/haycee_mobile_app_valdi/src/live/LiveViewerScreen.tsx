import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { EditTextEvent, View } from 'valdi_tsx/src/NativeTemplateElements';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { getBottomSheetNavigationOptions } from '../design-system/components/BottomSheet';
import { colors } from '../design-system/tokens/colors';
import { formatFcfa } from '../design-system/utils/money';
import { layout, spacing } from '../design-system/tokens/spacing';
import type { MasonryProduct } from '../design-system/components/MasonryProductCard';
import { SellerProfileScreen } from '../sellers/SellerProfileScreen';
import { LiveViewerOverlay } from './components/LiveViewerOverlay';
import { JoinAlert } from './components/JoinAlert';
import { LiveProductsSheet } from './components/LiveProductsSheet';
import { LiveCartSheet } from './components/LiveCartSheet';
import { LiveRequestSheet } from './components/LiveRequestSheet';
import { LiveSellerProfileSheet } from './components/LiveSellerProfileSheet';
import { LiveWalletSheet } from './components/LiveWalletSheet';
import { LiveViewerHeader } from './components/LiveViewerHeader';
import type { LiveFeedItem } from './data/LiveFeedData';
import { createLiveViewerDemoContent } from './data/LiveViewerData';
import type { LiveViewerCartItem, LiveViewerDemoContent, LiveViewerMessage, LiveViewerProduct } from './data/LiveViewerData';

interface LiveViewerScreenViewModel {
  item: LiveFeedItem;
}

interface LiveViewerScreenState {
  isLiked: boolean;
  isFollowing: boolean;
  likeCount: number;
  commentDraft: string;
  messages: LiveViewerMessage[];
  cartItems: LiveViewerCartItem[];
  requestedProductIds: string[];
}

/**
 * Full-screen live viewer. The colored stage intentionally replaces media
 * playback; content and actions are local fixtures until product APIs exist.
 */
@NavigationPage(module)
export class LiveViewerScreen extends NavigationPageStatefulComponent<LiveViewerScreenViewModel, LiveViewerScreenState> {
  state: LiveViewerScreenState = {
    isLiked: false,
    isFollowing: true,
    likeCount: 0,
    commentDraft: '',
    messages: [],
    cartItems: [],
    requestedProductIds: [],
  };

  private demoContent?: LiveViewerDemoContent;
  private messageSequence = 0;

  onCreate(): void {
    const item = this.viewModel.item;
    this.demoContent = createLiveViewerDemoContent(item);
    this.state = {
      isLiked: false,
      isFollowing: true,
      likeCount: Math.max(0, Math.round(item.viewers * 3.4)),
      commentDraft: '',
      messages: this.demoContent.messages,
      cartItems: [],
      requestedProductIds: [],
    };
  }

  private handleBack = (): void => {
    this.navigationController.pop();
  };

  private handleLike = (): void => {
    const isLiked = !this.state.isLiked;
    this.setState({
      isLiked,
      likeCount: Math.max(0, this.state.likeCount + (isLiked ? 1 : -1)),
    });
  };

  private handleToggleFollow = (): void => {
    this.setState({ isFollowing: !this.state.isFollowing });
  };

  private handleOpenSellerProfile = (): void => {
    this.navigationController.present(
      LiveSellerProfileSheet,
      {
        item: this.viewModel.item,
        isFollowing: this.state.isFollowing,
        onToggleFollow: this.handleToggleFollow,
        onOpenStore: this.handleOpenSellerStore,
      },
      {},
      {
        animated: true,
        wrapInPlatformNavigationController: false,
        ...getBottomSheetNavigationOptions({ transparentPageBackground: true }),
      },
    );
  };

  private handleOpenSellerStore = (): void => {
    const item = this.viewModel.item;
    const sellerProducts: MasonryProduct[] = (this.demoContent?.products ?? []).map(product => ({
      id: product.id,
      title: product.title,
      price: formatFcfa(product.price),
      color: product.color,
      imageUrl: product.imageUrl,
      isLive: true,
      vendorName: item.hostName,
      vendorUsername: item.hostName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      vendorId: item.id,
      vendorAvatarUrl: item.vendorAvatarUrl,
      vendorRating: item.vendorRating,
      vendorReviewSummary: item.vendorReviewSummary,
      vendorSalesCount: item.vendorSalesCount,
      vendorFollowersCount: item.vendorFollowersCount,
      vendorBio: item.vendorBio,
      vendorCountry: item.vendorCountry,
      vendorCity: item.vendorCity,
      vendorVerified: item.vendorVerified,
      vendorIsFollowing: this.state.isFollowing,
      vendorDispatchTime: item.vendorDispatchTime,
      vendorDeliveryTime: item.vendorDeliveryTime,
    }));
    const firstProduct = sellerProducts[0];
    if (!firstProduct) return;
    this.navigationController.push(
      SellerProfileScreen,
      { product: firstProduct, sellerProducts },
      {},
      { animated: true },
    );
  };

  private handleDraftChange = (event: EditTextEvent): void => {
    this.setState({ commentDraft: event.text });
  };

  private handleSendComment = (): void => {
    const text = this.state.commentDraft.trim();
    if (!text) return;
    this.messageSequence += 1;
    const message: LiveViewerMessage = {
      id: `${this.viewModel.item.id}-local-${this.messageSequence}`,
      username: 'Vous',
      text,
    };
    this.setState({
      commentDraft: '',
      messages: [...this.state.messages.slice(-29), message],
    });
  };

  private handleProductAction = (product: LiveViewerProduct): void => {
    TransientFeedback.show({ message: `Offre de démonstration : ${product.title}` });
  };

  private handleWallet = (): void => {
    this.navigationController.present(
      LiveWalletSheet,
      {},
      {},
      {
        animated: true,
        wrapInPlatformNavigationController: false,
        ...getBottomSheetNavigationOptions({ transparentPageBackground: true }),
      },
    );
  };

  private handleProducts = (): void => {
    const products = this.demoContent?.products;
    if (!products) return;
    const sheetOptions = { transparentPageBackground: true };
    this.navigationController.present(
      LiveProductsSheet,
      {
        products,
        cartItems: this.state.cartItems,
        onCartChange: this.handleCartChange,
        onBuy: this.handleProductAction,
        onCheckout: this.handleCheckout,
      },
      {},
      { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions(sheetOptions) },
    );
  };

  private handleOpenCart = (): void => {
    const sheetOptions = { transparentPageBackground: true };
    this.navigationController.present(
      LiveCartSheet,
      {
        cartItems: this.state.cartItems,
        onCartChange: this.handleCartChange,
        onCheckout: this.handleCheckout,
      },
      {},
      { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions(sheetOptions) },
    );
  };

  private handleOpenRequestSheet = (): void => {
    const products = this.demoContent?.products;
    if (!products?.length) return;
    this.navigationController.present(
      LiveRequestSheet,
      {
        products,
        requestedProductIds: this.state.requestedProductIds,
        onRequest: this.handleRequestProduct,
      },
      {},
      {
        animated: true,
        wrapInPlatformNavigationController: false,
        ...getBottomSheetNavigationOptions({ transparentPageBackground: true }),
      },
    );
  };

  private handleRequestProduct = (product: LiveViewerProduct): void => {
    if (this.state.requestedProductIds.includes(product.id)) return;
    this.setState({ requestedProductIds: [...this.state.requestedProductIds, product.id] });
    TransientFeedback.show({ message: `Demande enregistrée pour « ${product.title} » (démo).` });
  };

  private handleCartChange = (cartItems: LiveViewerCartItem[]): void => {
    this.setState({ cartItems });
  };

  private handleCheckout = (): void => {
    TransientFeedback.show({ message: 'Le paiement du panier live sera relié au service de commande.' });
  };

  private handleShare = (): void => {
    TransientFeedback.show({ message: 'Le partage du live sera relié au service de partage.' });
  };

  onRender(): void {
    const item = this.viewModel.item;
    const content = this.demoContent;
    if (!content) return;
    const isLive = item.status === 'live';
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());

    <view style={styles.screen.extend({ backgroundColor: colors.liveBackdrop })}>
      <view style={styles.content.extend({ backgroundColor: colors.liveActionSurface, paddingBottom: bottomInset + spacing.sm, paddingTop: topInset + spacing.xs })}>
        <LiveViewerHeader
          item={item}
          isFollowing={this.state.isFollowing}
          onBack={this.handleBack}
          onShare={this.handleShare}
          onOpenProfile={this.handleOpenSellerProfile}
          onToggleFollow={this.handleToggleFollow}
        />

        <view style={styles.stageCenter} />

        {isLive ? (
          <LiveViewerOverlay
            messages={this.state.messages}
            commentDraft={this.state.commentDraft}
            likeCount={this.state.likeCount}
            isLiked={this.state.isLiked}
            products={content.products}
            onDraftChange={this.handleDraftChange}
            onSendComment={this.handleSendComment}
            onLike={this.handleLike}
            onWallet={this.handleWallet}
            onOpenCart={this.handleOpenCart}
            onOpenRequest={this.handleOpenRequestSheet}
            onOpenProducts={this.handleProducts}
            onProductAction={this.handleProductAction}
          />
        ) : null}
      </view>

      {isLive ? (
        <view style={styles.joinAlertPosition.extend({ top: topInset + 88 })}>
          <JoinAlert username="Nadia" />
        </view>
      ) : null}
    </view>;
  }
}

const styles = {
  screen: new Style<View>({
    flexGrow: 1,
    flexShrink: 1,
  }),
  content: new Style<View>({
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
  }),
  stageCenter: new Style<View>({
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingLeft: spacing.xxxl,
    paddingRight: spacing.xxxl,
  }),
  joinAlertPosition: new Style<View>({
    left: layout.live.viewer.horizontalPadding,
    position: 'absolute',
    zIndex: 4,
  }),
};
