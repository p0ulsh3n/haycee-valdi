import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { EditTextEvent, Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { getBottomSheetNavigationOptions } from '../design-system/components/BottomSheet';
import { colors } from '../design-system/tokens/colors';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import type { MasonryProduct } from '../design-system/components/MasonryProductCard';
import { SellerProfileScreen } from '../sellers/SellerProfileScreen';
import { LiveChatFeed } from './components/LiveChatFeed';
import { LiveCommentComposer } from './components/LiveCommentComposer';
import { JoinAlert } from './components/JoinAlert';
import { LiveProductSurface } from './components/LiveProductSurface';
import { LiveProductQuickAccess } from './components/LiveProductQuickAccess';
import { LiveProductsSheet } from './components/LiveProductsSheet';
import { LiveCartSheet } from './components/LiveCartSheet';
import { LiveRequestSheet } from './components/LiveRequestSheet';
import { LiveSellerProfileSheet } from './components/LiveSellerProfileSheet';
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
      price: product.price.toFixed(2),
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
    TransientFeedback.show({ message: 'Le portefeuille sera relié au service de paiement.' });
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

  private renderActionButton(icon: Asset, label: string, shortLabel: string, onTap: () => void, isActive = false): void {
    <view
      style={isActive ? styles.actionButtonActive : styles.actionButton}
      onTap={onTap}
      accessibilityCategory="button"
      accessibilityLabel={label}
    >
      <image src={icon} tint={isActive ? colors.interactivePrimary : colors.textInverted} width={19} height={19} objectFit="contain" />
      <label value={shortLabel} style={styles.actionLabel} numberOfLines={1} />
    </view>;
  }

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
          <layout style={styles.liveInteractionArea}>
            <view style={styles.chatColumn}>
              <LiveChatFeed messages={this.state.messages} />
              <view style={styles.composerSlot}>
                <LiveCommentComposer
                  value={this.state.commentDraft}
                  onChange={this.handleDraftChange}
                  onSend={this.handleSendComment}
                />
              </view>
            </view>
            <layout style={styles.actionRailVertical}>
              {this.renderActionButton(navigationIcons.favourite, `J’aime, ${this.state.likeCount}`, 'J’aime', this.handleLike, this.state.isLiked)}
              {this.renderActionButton(navigationIcons.money03, 'Portefeuille', 'Solde', this.handleWallet)}
              {this.renderActionButton(navigationIcons.cart, 'Panier du live', 'Panier', this.handleOpenCart)}
              {content.products.length > 0 ? (
                this.renderActionButton(navigationIcons.userHandUp01, 'Demander un produit', 'Demander', this.handleOpenRequestSheet)
              ) : null}
              {content.products.length > 0 ? (
                <LiveProductQuickAccess
                  products={content.products}
                  onTap={this.handleProducts}
                />
              ) : null}
            </layout>
          </layout>
        ) : null}

        <LiveProductSurface
          products={content.products}
          onProductAction={this.handleProductAction}
        />
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
  liveInteractionArea: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: spacing.sm,
    paddingLeft: layout.live.viewer.horizontalPadding,
    paddingRight: layout.live.viewer.horizontalPadding,
    paddingTop: spacing.xs,
  }),
  chatColumn: new Style<View>({
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  }),
  composerSlot: new Style<View>({ marginTop: spacing.sm, paddingRight: spacing.xxl, width: '100%' }),
  actionRailVertical: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'column',
    flexShrink: 0,
    height: layout.live.viewer.chatHeight + layout.live.viewer.composerHeight + spacing.sm,
    justifyContent: 'flex-end',
    marginLeft: spacing.md,
    width: layout.live.viewer.productQuickAccessSize,
  }),
  actionButton: new Style<View>({
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    height: 40,
    marginBottom: spacing.sm,
    width: 44,
  }),
  actionButtonActive: new Style<View>({
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    height: 40,
    marginBottom: spacing.sm,
    width: 44,
  }),
  actionLabel: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.tiny), marginTop: 2 }),
  joinAlertPosition: new Style<View>({
    left: layout.live.viewer.horizontalPadding,
    position: 'absolute',
    zIndex: 4,
  }),
};
