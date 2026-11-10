import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { INavigatorPageVisibility } from 'valdi_navigation/src/INavigator';
import { Style } from 'valdi_core/src/Style';
import { EditTextEvent, View } from 'valdi_tsx/src/NativeTemplateElements';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { getBottomSheetNavigationOptions } from '../design-system/components/BottomSheet';
import { colors } from '../design-system/tokens/colors';
import { formatFcfa } from '../design-system/utils/money';
import { normalizeUsername } from '../design-system/utils/identity';
import { runNavigationAction } from '../design-system/utils/NavigationActionGate';
import { layout, spacing } from '../design-system/tokens/spacing';
import type { MasonryProduct } from '../design-system/components/MasonryProductCard';
import { SellerProfileScreen } from '../sellers/SellerProfileScreen';
import { createDemoSellerLiveItems, createDemoSellerStoreProducts } from '../sellers/data/SellerStorefrontData';
import { LiveViewerOverlay } from './components/LiveViewerOverlay';
import { LiveReactionTrail } from './components/LiveReactionTrail';
import { UpcomingLiveScreen } from './UpcomingLiveScreen';
import { LiveStreamAlerts } from './components/LiveStreamAlerts';
import type { LiveStreamAlertEntry, LiveStreamAlertType } from './components/LiveStreamAlerts';
import { LiveProductsSheet } from './components/LiveProductsSheet';
import { LiveProductPurchaseSheet } from './components/LiveProductPurchaseSheet';
import { LiveCartSheet } from './components/LiveCartSheet';
import { LiveRequestSheet } from './components/LiveRequestSheet';
import { LiveSellerProfileSheet } from './components/LiveSellerProfileSheet';
import { LiveFollowPromptSheet } from './components/LiveFollowPromptSheet';
import { LiveWalletSheet } from './components/LiveWalletSheet';
import { LiveViewerHeader } from './components/LiveViewerHeader';
import { hasOpenLiveSheet, observeLiveSheetVisibility } from './LiveSheetVisibility';
import type { LiveFeedItem } from './data/LiveFeedData';
import { addLiveViewerCartSelection, createLiveViewerDemoContent, createLiveViewerDemoIncomingMessage } from './data/LiveViewerData';
import type { LiveViewerCartItem, LiveViewerDemoContent, LiveViewerMessage, LiveViewerProduct } from './data/LiveViewerData';

const seenFollowPromptLiveIds = new Set<string>();

interface LiveViewerScreenViewModel {
  item: LiveFeedItem;
  /** Initial viewer-specific follow state supplied by the caller when available. */
  initialIsFollowing?: boolean;
}

interface LiveViewerScreenState {
  isFollowing: boolean;
  likeCount: number;
  commentDraft: string;
  messages: LiveViewerMessage[];
  pinnedMessage?: LiveViewerMessage;
  cartItems: LiveViewerCartItem[];
  requestedProductIds: string[];
  streamAlertEntries: LiveStreamAlertEntry[];
}

/**
 * Full-screen live viewer. The colored stage intentionally replaces media
 * playback; content and actions are local fixtures until product APIs exist.
 */
@NavigationPage(module)
export class LiveViewerScreen extends NavigationPageStatefulComponent<LiveViewerScreenViewModel, LiveViewerScreenState> {
  state: LiveViewerScreenState = {
    isFollowing: false,
    likeCount: 0,
    commentDraft: '',
    messages: [],
    pinnedMessage: undefined,
    cartItems: [],
    requestedProductIds: [],
    streamAlertEntries: [],
  };

  private demoContent?: LiveViewerDemoContent;
  private messageSequence = 0;
  private pendingHeartCount = 0;
  private heartCountFlushScheduled = false;
  private streamAlertSequence = 0;
  private streamAlertDemoCycle = 0;
  private incomingDemoMessageSequence = 0;
  private incomingDemoMessageTimerScheduled = false;
  private pinnedDemoTimerScheduled = false;
  private hasShownFollowPrompt = false;
  private isPageVisible = true;
  private followPromptPending = false;
  private followPromptResumeScheduled = false;
  private unsubscribeLiveSheetVisibility?: () => void;

  onCreate(): void {
    this.navigationController.addPageVisibilityObserver(this.handlePageVisibilityChange);
    this.unsubscribeLiveSheetVisibility = observeLiveSheetVisibility(hasOpenSheet => {
      if (!hasOpenSheet) {
        this.scheduleFollowPromptResume();
        this.scheduleIncomingDemoMessage();
        this.scheduleDemoPinnedComment();
      }
    });
    const item = this.viewModel.item;
    this.demoContent = createLiveViewerDemoContent(item);
    this.state = {
      isFollowing: this.viewModel.initialIsFollowing ?? false,
      likeCount: Math.max(0, Math.round(item.viewers * 3.4)),
      commentDraft: '',
      messages: this.demoContent.messages,
      pinnedMessage: undefined,
      cartItems: [],
      requestedProductIds: [],
      streamAlertEntries: [],
    };
    if (item.status === 'live') {
      this.scheduleStreamAlertDemoCycle();
      this.scheduleIncomingDemoMessage();
      this.scheduleDemoPinnedComment();
      if (!this.state.isFollowing) {
        this.setTimeoutDisposable(this.showFollowPrompt, FOLLOW_PROMPT_DELAY_MS);
      }
    }
  }

  onDestroy(): void {
    this.navigationController.removePageVisibilityObserver(this.handlePageVisibilityChange);
    this.unsubscribeLiveSheetVisibility?.();
    this.unsubscribeLiveSheetVisibility = undefined;
  }

  private handlePageVisibilityChange = (visibility: INavigatorPageVisibility): void => {
    this.isPageVisible = visibility === INavigatorPageVisibility.VISIBLE;
    if (this.isPageVisible) {
      this.scheduleFollowPromptResume();
      this.scheduleIncomingDemoMessage();
      this.scheduleDemoPinnedComment();
    }
  };

  private scheduleIncomingDemoMessage = (): void => {
    if (
      this.isDestroyed()
      || this.viewModel.item.status !== 'live'
      || !this.demoContent?.simulateIncomingMessages
      || !this.isPageVisible
      || hasOpenLiveSheet()
      || this.incomingDemoMessageTimerScheduled
    ) return;

    this.incomingDemoMessageTimerScheduled = true;
    const delayMs = DEMO_CHAT_MESSAGE_INTERVALS_MS[
      this.incomingDemoMessageSequence % DEMO_CHAT_MESSAGE_INTERVALS_MS.length
    ];
    this.setTimeoutDisposable(() => {
      this.incomingDemoMessageTimerScheduled = false;
      if (this.isDestroyed() || !this.isPageVisible || hasOpenLiveSheet()) return;

      const message = createLiveViewerDemoIncomingMessage(
        this.viewModel.item,
        this.incomingDemoMessageSequence++,
      );
      this.setState({
        messages: [...this.state.messages.slice(-(MAX_LIVE_CHAT_MESSAGES - 1)), message],
      });
      this.scheduleIncomingDemoMessage();
    }, delayMs);
  };

  private scheduleDemoPinnedComment = (delayMs = PINNED_COMMENT_INITIAL_DELAY_MS): void => {
    if (
      this.isDestroyed()
      || this.viewModel.item.status !== 'live'
      || !this.demoContent?.simulatePinnedComments
      || !this.isPageVisible
      || hasOpenLiveSheet()
      || this.pinnedDemoTimerScheduled
    ) return;

    this.pinnedDemoTimerScheduled = true;
    this.setTimeoutDisposable(() => {
      this.pinnedDemoTimerScheduled = false;
      if (this.isDestroyed()) return;
      if (!this.isPageVisible || hasOpenLiveSheet()) {
        this.scheduleDemoPinnedComment(PINNED_COMMENT_RETRY_DELAY_MS);
        return;
      }

      const pinnedMessage = this.demoContent?.messages.find(message => message.isHost);
      if (!pinnedMessage) return;
      this.setState({ pinnedMessage });
      this.setTimeoutDisposable(() => {
        if (this.isDestroyed()) return;
        this.setState({ pinnedMessage: undefined });
        this.scheduleDemoPinnedComment(PINNED_COMMENT_REPEAT_DELAY_MS);
      }, PINNED_COMMENT_VISIBLE_MS);
    }, delayMs);
  };

  private scheduleFollowPromptResume = (): void => {
    if (
      this.isDestroyed()
      || !this.isPageVisible
      || !this.followPromptPending
      || hasOpenLiveSheet()
      || this.followPromptResumeScheduled
    ) return;
    this.followPromptResumeScheduled = true;
    this.setTimeoutDisposable(() => {
      this.followPromptResumeScheduled = false;
      if (this.isDestroyed() || !this.followPromptPending) return;
      if (!this.isPageVisible || hasOpenLiveSheet()) return;
      this.followPromptPending = false;
      this.showFollowPrompt();
    }, FOLLOW_PROMPT_RESUME_DELAY_MS);
  };

  private handleBack = (): void => {
    this.navigationController.pop();
  };

  private handleOpenLiveItem = (item: LiveFeedItem): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController.push(LiveViewerScreen, { item }, {}, { animated: true });
    });
  };

  private handleHeartEmitted = (): void => {
    this.pendingHeartCount += 1;
    if (this.heartCountFlushScheduled) return;

    this.heartCountFlushScheduled = true;
    this.setTimeoutDisposable(() => {
      this.heartCountFlushScheduled = false;
      const emittedCount = this.pendingHeartCount;
      this.pendingHeartCount = 0;
      if (emittedCount > 0 && !this.isDestroyed()) {
        this.setState({ likeCount: this.state.likeCount + emittedCount });
      }
    }, 150);
  };

  private addDemoStreamAlert = (type: LiveStreamAlertType, messageIndex: number): void => {
    const messages = this.demoContent?.messages ?? [];
    const message = messages[messageIndex % Math.max(1, messages.length)];
    const demoNames = ['Nadia', 'Mariam', 'Awa', 'Maya', 'Lina', 'Sarah'];
    const username = message?.username ?? demoNames[messageIndex % demoNames.length];
    const entry: LiveStreamAlertEntry = {
      id: `${this.viewModel.item.id}-stream-alert-${this.streamAlertSequence++}`,
      username,
      avatarUrl: message?.avatarUrl,
      type,
    };
    this.setState({ streamAlertEntries: [...this.state.streamAlertEntries.slice(-23), entry] });
  };

  private scheduleStreamAlertDemoCycle = (): void => {
    const cycleOffset = this.streamAlertDemoCycle++ * 3;
    const events: Array<{ type: LiveStreamAlertType; messageIndex: number; delayMs: number }> = [
      { type: 'join', messageIndex: cycleOffset + 1, delayMs: 250 },
      { type: 'share', messageIndex: cycleOffset + 2, delayMs: 400 },
      { type: 'join', messageIndex: cycleOffset + 3, delayMs: 750 },
      { type: 'share', messageIndex: cycleOffset + 4, delayMs: 1150 },
      { type: 'join', messageIndex: cycleOffset + 5, delayMs: 1650 },
    ];
    events.forEach(event => {
      this.setTimeoutDisposable(() => this.addDemoStreamAlert(event.type, event.messageIndex), event.delayMs);
    });
    this.setTimeoutDisposable(this.scheduleStreamAlertDemoCycle, 7000);
  };

  private handleToggleFollow = (): void => {
    this.followPromptPending = false;
    this.setState({ isFollowing: !this.state.isFollowing });
  };

  private showFollowPrompt = (): void => {
    const liveId = this.viewModel.item.id;
    if (
      this.isDestroyed()
      || this.state.isFollowing
      || this.hasShownFollowPrompt
      || seenFollowPromptLiveIds.has(liveId)
      || this.viewModel.item.status !== 'live'
    ) {
      return;
    }

    if (!this.isPageVisible || hasOpenLiveSheet()) {
      this.followPromptPending = true;
      return;
    }

    const opened = runNavigationAction(this.navigationController, () => {
      this.navigationController.present(
        LiveFollowPromptSheet,
        {
          sellerName: this.viewModel.item.hostName,
          sellerAvatarUrl: this.viewModel.item.vendorAvatarUrl,
          onFollow: this.followFromPrompt,
          showOverlay: false,
          enableGestures: true,
        },
        {},
        {
          animated: true,
          wrapInPlatformNavigationController: false,
          ...getBottomSheetNavigationOptions({ transparentPageBackground: true }),
        },
      );
    });

    if (opened) {
      this.hasShownFollowPrompt = true;
      seenFollowPromptLiveIds.add(liveId);
      return;
    }

    // A different native navigation transition may be in flight at the due time.
    this.setTimeoutDisposable(this.showFollowPrompt, 900);
  };

  private followFromPrompt = (): void => {
    this.followPromptPending = false;
    if (!this.state.isFollowing) this.setState({ isFollowing: true });
  };

  private handleOpenSellerProfile = (): void => {
    runNavigationAction(this.navigationController, () => {
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
    });
  };

  private handleOpenSellerStore = (): void => {
    const item = this.viewModel.item;
    const liveProducts: MasonryProduct[] = (this.demoContent?.products ?? []).map((product, index) => ({
      id: product.id,
      title: product.title,
      price: formatFcfa(product.price),
      color: product.color,
      imageUrl: product.imageUrl,
      category: ['mode', 'sacs', 'bijoux'][index % 3],
      isLive: true,
      vendorName: item.hostName,
      vendorUsername: normalizeUsername(item.hostName.toLowerCase().replace(/[^a-z0-9]/g, '')),
      vendorId: item.id,
      vendorAvatarUrl: item.vendorAvatarUrl,
      vendorCoverImageUrl: item.vendorCoverImageUrl,
      vendorRating: item.vendorRating,
      vendorReviewSummary: item.vendorReviewSummary,
      vendorSalesCount: item.vendorSalesCount,
      vendorFollowersCount: item.vendorFollowersCount,
      vendorBio: item.vendorBio,
      vendorCountryCode: item.vendorCountryCode,
      vendorCountry: item.vendorCountry,
      vendorCity: item.vendorCity,
      vendorVerified: item.vendorVerified,
      vendorIsFollowing: this.state.isFollowing,
      vendorDispatchTime: item.vendorDispatchTime,
      vendorDeliveryTime: item.vendorDeliveryTime,
    }));
    const sellerProducts = liveProducts.length > 0
      ? [...liveProducts, ...createDemoSellerStoreProducts(liveProducts[0])]
      : [];
    const firstProduct = sellerProducts[0];
    if (!firstProduct) return;
    const sellerLiveItems: LiveFeedItem[] = [
      {
        ...item,
        id: `${item.id}-seller-live`,
      },
      {
        ...item,
        id: `${item.id}-seller-upcoming`,
        title: `Prochain live de ${item.hostName}`,
        category: item.category,
        status: 'upcoming',
        viewers: 0,
        presentationType: 'showcase',
        panelColor: colors.livePanelLavender,
        scheduledAtLabel: 'DEMAIN · 18:00',
        badges: [{ id: 'exclusive', label: 'EXCLUSIF', variant: 'exclusive' }],
      },
      ...createDemoSellerLiveItems(firstProduct).slice(2),
    ];
    runNavigationAction(this.navigationController, () => {
      this.navigationController.push(
        SellerProfileScreen,
        {
          product: firstProduct,
          sellerProducts,
          sellerLiveItems,
          onOpenLive: (sellerLiveItem: LiveFeedItem) => {
            runNavigationAction(this.navigationController, () => {
              if (sellerLiveItem.status === 'upcoming') {
                this.navigationController.push(
                  UpcomingLiveScreen,
                  { item: sellerLiveItem, onOpenLive: this.handleOpenLiveItem },
                  {},
                  { animated: true },
                );
                return;
              }
              this.navigationController.push(LiveViewerScreen, { item: sellerLiveItem }, {}, { animated: true });
            });
          },
        },
        {},
        { animated: true },
      );
    });
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
      messages: [...this.state.messages.slice(-(MAX_LIVE_CHAT_MESSAGES - 1)), message],
    });
  };

  private handleProductAction = (product: LiveViewerProduct): void => {
    if (product.stockLeft <= 0) return;
    runNavigationAction(this.navigationController, () => {
      this.navigationController.present(
        LiveProductPurchaseSheet,
        {
          product,
          cartItems: this.state.cartItems,
          intent: 'buy-now',
          onAddToCart: (selectedProduct, quantity, variantId) => {
            const next = addLiveViewerCartSelection(this.state.cartItems, selectedProduct, quantity, variantId);
            if (next !== this.state.cartItems) {
              this.handleCartChange(next);
              TransientFeedback.show({ message: `${selectedProduct.title} ajouté au panier du live.` });
            }
          },
          onBuyNow: (selectedProduct, quantity, variantId) => {
            const next = addLiveViewerCartSelection(this.state.cartItems, selectedProduct, quantity, variantId);
            if (next !== this.state.cartItems) this.handleCartChange(next);
            this.handleCheckout();
          },
        },
        {},
        { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions({ transparentPageBackground: true }) },
      );
    });
  };

  private handleWallet = (): void => {
    runNavigationAction(this.navigationController, () => {
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
    });
  };

  private handleProducts = (): void => {
    const products = this.demoContent?.products;
    if (!products) return;
    const sheetOptions = { transparentPageBackground: true };
    runNavigationAction(this.navigationController, () => {
      this.navigationController.present(
        LiveProductsSheet,
        {
          products,
          cartItems: this.state.cartItems,
          onCartChange: this.handleCartChange,
          onCheckout: this.handleCheckout,
        },
        {},
        { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions(sheetOptions) },
      );
    });
  };

  private handleOpenCart = (): void => {
    const sheetOptions = { transparentPageBackground: true };
    runNavigationAction(this.navigationController, () => {
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
    });
  };

  private handleOpenRequestSheet = (): void => {
    const products = this.demoContent?.products;
    if (!products?.length) return;
    runNavigationAction(this.navigationController, () => {
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
    });
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
      <view style={styles.content.extend({ backgroundColor: colors.liveOverlaySurface, paddingBottom: bottomInset + spacing.sm, paddingTop: topInset + spacing.xs })}>
        <LiveViewerHeader
          item={item}
          isFollowing={this.state.isFollowing}
          likeCount={this.state.likeCount}
          onBack={this.handleBack}
          onShare={this.handleShare}
          onOpenProfile={this.handleOpenSellerProfile}
          onToggleFollow={this.handleToggleFollow}
        />

        <view style={styles.stageCenter}>
          {isLive ? (
            <LiveReactionTrail onHeartEmitted={this.handleHeartEmitted} />
          ) : null}
        </view>

        {isLive ? (
          <LiveViewerOverlay
            messages={this.state.messages}
            pinnedMessage={this.state.pinnedMessage}
            commentDraft={this.state.commentDraft}
            products={content.products}
            onBuy={this.handleProductAction}
            onDraftChange={this.handleDraftChange}
            onSendComment={this.handleSendComment}
            onWallet={this.handleWallet}
            onOpenCart={this.handleOpenCart}
            onOpenRequest={this.handleOpenRequestSheet}
            onOpenProducts={this.handleProducts}
          />
        ) : null}
      </view>

      {isLive ? (
        <view style={styles.joinAlertPosition.extend({ top: topInset + 88 })}>
          <LiveStreamAlerts entries={this.state.streamAlertEntries} />
        </view>
      ) : null}
    </view>;
  }
}

const FOLLOW_PROMPT_DELAY_MS = 30_000;
const FOLLOW_PROMPT_RESUME_DELAY_MS = 350;
const PINNED_COMMENT_INITIAL_DELAY_MS = 4500;
const PINNED_COMMENT_RETRY_DELAY_MS = 1000;
const PINNED_COMMENT_VISIBLE_MS = 8500;
const PINNED_COMMENT_REPEAT_DELAY_MS = 18_000;
const DEMO_CHAT_MESSAGE_INTERVALS_MS = [1800, 2800, 2100, 3600, 2400, 3200];
const MAX_LIVE_CHAT_MESSAGES = 60;

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
    alignItems: 'stretch',
    flexGrow: 1,
    flexShrink: 1,
  }),
  joinAlertPosition: new Style<View>({
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 4,
  }),
};
