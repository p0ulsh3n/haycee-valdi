import { Device } from 'valdi_core/src/Device';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ImageFilters } from 'valdi_core/src/utils/ImageFilter';
import navigationIcons from '../../res/navigation-icons';
import { MasonryFeed, MasonryItem } from '../design-system/components/MasonryFeed';
import { estimateMasonryProductCardHeight, MasonryProductCard, MasonryProduct } from '../design-system/components/MasonryProductCard';
import { SkeletonView } from '../design-system/components/SkeletonView';
import { SwipeTabItem, SwipeTabs, SwipeTabsProgressChannel } from '../design-system/components/SwipeTabs';
import { TabChips } from '../design-system/components/TabChips';
import { DSButton } from '../design-system/components/DSButton';
import type { LiveFeedItem } from '../live/data/LiveFeedData';
import { UpcomingLiveScreen } from '../live/UpcomingLiveScreen';
import { SellerLiveFeed } from './components/SellerLiveFeed';
import { SellerVideoGrid } from './components/SellerVideoGrid';
import { SellerVideoFeedScreen } from './SellerVideoFeedScreen';
import {
  createDemoSellerVideoPreviews,
  createDemoSellerLiveItems,
  getSellerStoreCategories,
  normalizeSellerStoreCategoryId,
} from './data/SellerStorefrontData';
import type { SellerVideoPreview } from './data/SellerStorefrontData';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { colors } from '../design-system/tokens/colors';
import { runNavigationAction } from '../design-system/utils/NavigationActionGate';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat, typography } from '../design-system/tokens/typography';
import { normalizeUsername } from '../design-system/utils/identity';
import { limitSellerBio } from '../design-system/utils/sellerBio';

export interface SellerProfileViewModel {
  product: MasonryProduct;
  sellerProducts?: MasonryProduct[];
  sellerLiveItems?: LiveFeedItem[];
  sellerVideos?: SellerVideoPreview[];
  sellerVideosHasMore?: boolean;
  onLoadMoreSellerVideos?: () => void | Promise<unknown>;
  onLikeSellerVideo?: (videoId: string, isLiked: boolean) => void;
  onSaveSellerVideo?: (videoId: string, isSaved: boolean) => void;
  onOpenSellerVideoComments?: (videoId: string) => void;
  onShareSellerVideo?: (videoId: string) => void;
  onOpenLive?: (item: LiveFeedItem) => void;
  /** Set only when the screen represents the signed-in seller's own storefront. */
  isOwnProfile?: boolean;
  /** Optional editor action supplied by the signed-in profile route. */
  onEditProfile?: () => void;
}

interface SellerProfileState {
  isFollowing: boolean;
  headerBackgroundVisible: boolean;
  activeTabIndex: number;
  stickyTabsMounted: boolean;
  selectedStoreCategoryId: string;
}

/** Seller storefront/profile page opened from a product or its seller row. */
@NavigationPage(module)
export class SellerProfileScreen extends NavigationPageStatefulComponent<
  SellerProfileViewModel,
  SellerProfileState
> {
  state: SellerProfileState = {
    isFollowing: false,
    headerBackgroundVisible: false,
    activeTabIndex: 0,
    stickyTabsMounted: false,
    selectedStoreCategoryId: 'all',
  };
  private fallbackSellerProducts: MasonryProduct[] = [];
  private fallbackSellerVideos: SellerVideoPreview[] = [];
  private readonly stickyIdentityRef = new ElementRef<View>();
  private readonly headerBackgroundRef = new ElementRef<View>();
  private profileSurfaceOffsetY = 0;
  private displayNameOffsetY = 0;
  private displayNameHeight = 0;
  private tabsOffsetY = 0;
  private headerHeight = 0;
  private stickyIdentityVisible = false;
  private stickyTabsVisible = false;
  private readonly sellerTabsProgress = new SwipeTabsProgressChannel();

  onCreate(): void {
    this.state = {
      isFollowing: this.viewModel.product.vendorIsFollowing ?? false,
      headerBackgroundVisible: false,
      activeTabIndex: 0,
      stickyTabsMounted: false,
      selectedStoreCategoryId: 'all',
    };
    this.fallbackSellerProducts = [this.viewModel.product];
    this.fallbackSellerVideos = createDemoSellerVideoPreviews(
      this.viewModel.product,
      this.sellerProducts(),
    );
  }

  onViewModelUpdate(previous?: SellerProfileViewModel): void {
    if (previous?.product !== this.viewModel.product && this.viewModel.sellerProducts === undefined) {
      this.fallbackSellerProducts = [this.viewModel.product];
    }
    if (
      this.viewModel.sellerVideos === undefined
      && (previous?.product !== this.viewModel.product || previous?.sellerProducts !== this.viewModel.sellerProducts)
    ) {
      this.fallbackSellerVideos = createDemoSellerVideoPreviews(
        this.viewModel.product,
        this.sellerProducts(),
      );
    }
  }

  private handleBack = (): void => {
    this.navigationController.pop();
  };

  private handleShare = (): void => {
    TransientFeedback.show({ message: 'Partager la boutique', duration: 1800 });
  };

  private handleFollow = (): void => {
    this.setState({ isFollowing: !this.state.isFollowing });
  };

  private handleMessage = (): void => {
    TransientFeedback.show({ message: `La conversation avec ${this.vendorDisplayName()} sera bientôt disponible.` });
  };

  private handleEditProfile = (): void => {
    if (this.viewModel.onEditProfile) {
      this.viewModel.onEditProfile();
    } else {
      TransientFeedback.show({ message: 'Modification du profil' });
    }
  };

  private vendorDisplayName(): string {
    return this.viewModel.product.vendorName ?? 'Boutique Haycee';
  }

  private vendorUsername(): string {
    const username = this.viewModel.product.vendorUsername
      ?? this.vendorDisplayName().toLocaleLowerCase().replace(/\s+/g, '');
    return normalizeUsername(username);
  }

  private vendorCountryLabel(): string | undefined {
    const product = this.viewModel.product;
    const countryCode = product.vendorCountryCode?.toUpperCase();
    if (!countryCode) return product.vendorCountry;

    const countryNames: Record<string, string> = {
      BE: 'Belgique',
      CH: 'Suisse',
      FR: 'France',
      GB: 'Royaume-Uni',
    };
    return countryNames[countryCode] ?? product.vendorCountry ?? countryCode;
  }

  private vendorCountryFlag(): string | undefined {
    const countryCode = this.viewModel.product.vendorCountryCode?.trim().toUpperCase();
    if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) return undefined;

    const regionalIndicatorBase = 0xDDE6;
    const toRegionalIndicator = (letter: string): string =>
      String.fromCharCode(0xD83C, regionalIndicatorBase + letter.charCodeAt(0) - 65);
    return toRegionalIndicator(countryCode.charAt(0)) + toRegionalIndicator(countryCode.charAt(1));
  }

  private renderHeader(topInset: number): void {
    <view style={styles.headerOverlay}>
      <view
        style={styles.header.extend({ paddingTop: topInset + spacing.lg })}
        onLayout={this.handleHeaderLayout}
      >
        <view
          ref={this.headerBackgroundRef}
          style={styles.headerBackground}
        />
        <layout style={styles.headerContent}>
          <view style={this.headerButtonStyle()} onTap={this.handleBack} accessibilityCategory="button">
            <image
              src={navigationIcons.arrowLeft01Round}
              tint={this.headerIconColor()}
              width={20}
              height={20}
              objectFit="contain"
            />
          </view>
          {this.renderStickyIdentity()}
          <layout style={styles.headerActions}>
            <view style={this.headerButtonStyle().extend({ marginRight: spacing.sm })}>
              <image
                src={this.state.isFollowing ? navigationIcons.notification01Bold : navigationIcons.notification01}
                tint={this.headerIconColor()}
                width={20}
                height={20}
                objectFit="contain"
              />
            </view>
            <view style={this.headerButtonStyle()} onTap={this.handleShare} accessibilityCategory="button">
              <image src={navigationIcons.share01} tint={this.headerIconColor()} width={20} height={20} objectFit="contain" />
            </view>
            <view style={this.headerButtonStyle().extend({ marginLeft: spacing.sm })}>
              <image src={navigationIcons.moreHorizontalCircle01} tint={this.headerIconColor()} width={20} height={20} objectFit="contain" />
            </view>
          </layout>
        </layout>
      </view>
    </view>;
  }

  private headerIconColor(): string {
    return this.state.headerBackgroundVisible ? colors.textPrimary : colors.textInverted;
  }

  private headerButtonStyle(): Style<View> {
    return styles.headerButton.extend({
      backgroundColor: this.state.headerBackgroundVisible ? colors.backgroundPrimary : colors.backgroundProfileHeader,
    });
  }

  private renderStickyIdentity(): void {
    const name = this.vendorDisplayName();
    const initial = name.charAt(0).toUpperCase();

    <view
      ref={this.stickyIdentityRef}
      style={styles.stickyIdentity.extend({
        opacity: this.stickyIdentityVisible ? 1 : 0,
        translationY: this.stickyIdentityVisible ? 0 : 6,
      })}
    >
      {this.viewModel.product.vendorAvatarUrl ? (
        <image src={this.viewModel.product.vendorAvatarUrl} style={styles.stickyAvatar} objectFit="cover" />
      ) : (
        <view style={styles.stickyAvatarFallback}>
          <label value={initial} style={styles.stickyAvatarInitial} />
        </view>
      )}
      <label value={name} style={styles.stickyName} numberOfLines={1} />
    </view>;
  }

  private stickyHeaderHeight(): number {
    return this.headerHeight || 56 + Math.max(0, Device.getDisplayTopInset()) + spacing.lg + spacing.sm;
  }

  private handleHeaderLayout = (frame: ElementFrame): void => {
    this.headerHeight = frame.height;
  };

  private handleProfileSurfaceLayout = (frame: ElementFrame): void => {
    this.profileSurfaceOffsetY = frame.y;
  };

  private handleDisplayNameLayout = (frame: ElementFrame): void => {
    this.displayNameOffsetY = frame.y;
    this.displayNameHeight = frame.height;
  };

  private handleTabsLayout = (frame: ElementFrame): void => {
    this.tabsOffsetY = frame.y;
  };

  private handleSellerTabChange = (index: number): void => {
    if (index !== this.state.activeTabIndex) {
      this.setState({ activeTabIndex: index });
    }
  };

  private handleStoreCategoryChange = (categoryId: string): void => {
    this.setState({ selectedStoreCategoryId: categoryId });
  };

  private handleOpenSellerLive = (item: LiveFeedItem): void => {
    if (this.viewModel.onOpenLive) {
      this.viewModel.onOpenLive(item);
      return;
    }

    if (item.status === 'upcoming') {
      runNavigationAction(this.navigationController, () => {
        this.navigationController.push(UpcomingLiveScreen, { item }, {}, { animated: true });
      });
      return;
    }

    TransientFeedback.show({ message: `Le live de ${item.hostName} sera bientôt disponible.` });
  };

  private updateStickyTabs = (visible: boolean): void => {
    if (visible === this.stickyTabsVisible) return;
    this.stickyTabsVisible = visible;
    this.setState({ stickyTabsMounted: visible });
  };

  private handleSellerScroll = (event: ScrollEvent): void => {
    const headerHeight = this.stickyHeaderHeight();
    const showBackground = this.profileSurfaceOffsetY > 0 && event.y >= Math.max(
      0,
      this.profileSurfaceOffsetY - headerHeight - spacing.lg,
    );
    if (showBackground !== this.state.headerBackgroundVisible) {
      this.setState({ headerBackgroundVisible: showBackground });
      const background = this.headerBackgroundRef.single();
      if (background) {
        this.animate(
          { duration: 0.2, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
          () => background.setAttribute('opacity', showBackground ? 1 : 0),
        );
      }
    }

    const stickyTabsThreshold = this.profileSurfaceOffsetY + this.tabsOffsetY - headerHeight;
    this.updateStickyTabs(
      this.profileSurfaceOffsetY > 0
        && this.tabsOffsetY > 0
        && event.y >= Math.max(0, stickyTabsThreshold),
    );

    const identityRevealOffset = this.profileSurfaceOffsetY
      + this.displayNameOffsetY
      + this.displayNameHeight
      - headerHeight;
    const showIdentity = this.profileSurfaceOffsetY > 0
      && this.displayNameHeight > 0
      && event.y >= Math.max(0, identityRevealOffset);
    if (showIdentity === this.stickyIdentityVisible) return;

    this.stickyIdentityVisible = showIdentity;
    const identity = this.stickyIdentityRef.single();
    if (!identity) return;

    this.animate(
      { duration: 0.24, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
      () => {
        identity.setAttribute('opacity', showIdentity ? 1 : 0);
        identity.setAttribute('translationY', showIdentity ? 0 : 6);
      },
    );
  };

  private sellerProducts(): MasonryProduct[] {
    return this.viewModel.sellerProducts ?? this.fallbackSellerProducts;
  }

  private sellerVideos(): SellerVideoPreview[] {
    return this.viewModel.sellerVideos ?? this.fallbackSellerVideos;
  }

  private sellerLiveItems(): LiveFeedItem[] {
    const fallbackItems = createDemoSellerLiveItems(this.viewModel.product);
    const sellerItems = this.viewModel.sellerLiveItems ?? fallbackItems;
    const soldPreview = fallbackItems.find(item => item.id.endsWith('-seller-sold-preview'));
    if (!soldPreview || sellerItems.some(item => item.id === soldPreview.id)) {
      return sellerItems;
    }
    return [...sellerItems, soldPreview];
  }

  private renderSellerProduct = (item: MasonryItem, columnWidth: number): void => {
    <MasonryProductCard product={item as MasonryProduct} columnWidth={columnWidth} />;
  };

  private estimateSellerProductHeight = (item: MasonryItem, columnWidth: number): number => (
    estimateMasonryProductCardHeight(item as MasonryProduct, columnWidth)
  );

  private renderSellerTabPage = (tab: SwipeTabItem, isActive: boolean, isPrepared: boolean): void => {
    if (!isPrepared) {
      return;
    }

    // Keep nearby tabs visually prepared without letting a hidden, long product
    // masonry determine the height of the profile's outer vertical scroll.
    if (!isActive) {
      this.renderSellerTabPreviewSkeleton();
      return;
    }

    if (tab.id === 'products') {
      const products = this.sellerProducts();
      const categories = getSellerStoreCategories(products);
      const selectedCategoryId = categories.length > 0
        && categories.some(category => category.id === this.state.selectedStoreCategoryId)
        ? this.state.selectedStoreCategoryId
        : 'all';
      const filteredProducts = selectedCategoryId === 'all'
        ? products
        : products.filter(product => product.category
          && normalizeSellerStoreCategoryId(product.category) === selectedCategoryId);

      <view style={styles.sellerProductsContent}>
        {categories.length > 0 ? (
          <TabChips
            tabs={categories}
            selectedId={selectedCategoryId}
            onSelectionChange={this.handleStoreCategoryChange}
            horizontalPadding={spacing.md}
            selectedBackgroundColor={colors.textPrimary}
            unselectedBackgroundColor={colors.backgroundSecondary}
            selectedTextColor={colors.textInverted}
            unselectedTextColor={colors.textSecondary}
            textCase="capitalize"
          />
        ) : null}
        {filteredProducts.length > 0 ? (
          <view style={styles.sellerProductGrid}>
            <MasonryFeed
              items={filteredProducts}
              hasMore={false}
              renderItem={this.renderSellerProduct}
              estimateItemHeight={this.estimateSellerProductHeight}
            />
          </view>
        ) : (
          <view style={styles.emptyStoreCategory}>
            <label value="Aucun produit dans cette catégorie" style={styles.emptyTabText} numberOfLines={2} />
          </view>
        )}
      </view>;
      return;
    }

    if (tab.id === 'live') {
      <SellerLiveFeed
        items={this.sellerLiveItems()}
        onOpenLive={this.handleOpenSellerLive}
      />;
      return;
    }

    if (tab.id === 'videos') {
      const videos = this.sellerVideos();
      if (videos.length > 0) {
        <SellerVideoGrid videos={videos} onVideoTap={this.handleOpenSellerVideo} />;
      } else {
        <view style={styles.emptyTab}>
          <label
            value="Aucune vidéo pour le moment"
            style={styles.emptyTabText}
            numberOfLines={0}
          />
        </view>;
      }
      return;
    }

    <view style={styles.emptyTab}>
      <label
        value="Les avis de cette boutique apparaîtront ici"
        style={styles.emptyTabText}
        numberOfLines={0}
      />
    </view>;
  };

  private handleOpenSellerVideo = (index: number): void => {
    const videos = this.sellerVideos();
    if (index < 0 || index >= videos.length) return;

    runNavigationAction(this.navigationController, () => {
      this.navigationController.push(
        SellerVideoFeedScreen,
        {
          vendorDisplayName: this.vendorDisplayName(),
          videos,
          initialIndex: index,
          hasMore: this.viewModel.sellerVideosHasMore,
          onLoadMore: this.viewModel.onLoadMoreSellerVideos,
          onLikeVideo: this.viewModel.onLikeSellerVideo,
          onSaveVideo: this.viewModel.onSaveSellerVideo,
          onOpenVideoComments: this.viewModel.onOpenSellerVideoComments,
          onShareVideo: this.viewModel.onShareSellerVideo,
        },
        {},
        { animated: true },
      );
    });
  };

  private renderSellerTabPreviewSkeleton(): void {
    const horizontalPadding = layout.live.feedHorizontalPadding;
    const columnGap = layout.live.cardColumnGap;
    const cardWidth = (Device.getWindowWidth() - horizontalPadding * 2 - columnGap * 2) / 2;

    <layout style={styles.sellerTabPreview.extend({
      paddingLeft: horizontalPadding,
      paddingRight: horizontalPadding,
    })}>
      {[0, 1].map(index => (
        <layout
          key={`seller-tab-preview-${index}`}
          style={styles.sellerTabPreviewCard.extend({
            marginRight: index === 0 ? columnGap : 0,
            width: cardWidth,
          })}
        >
          <SkeletonView width="100%" height={cardWidth * 0.9} borderRadius={radius.md} />
          <SkeletonView width="78%" height={14} borderRadius={4} />
          <SkeletonView width="48%" height={12} borderRadius={4} />
        </layout>
      ))}
    </layout>;
  }

  private sellerSwipeTabs(): SwipeTabItem[] {
    return [
      {
        id: 'products',
        label: 'Boutique',
        pageTitle: 'Boutique',
        pageMessage: '',
      },
      { id: 'live', label: 'Live', pageTitle: 'Live', pageMessage: '' },
      { id: 'videos', label: 'Vidéos', pageTitle: 'Vidéos', pageMessage: '' },
      { id: 'reviews', label: 'Avis', pageTitle: 'Avis', pageMessage: '' },
    ];
  }

  private renderSellerTabs(): void {
    const tabs = this.sellerSwipeTabs();
    <view style={styles.tabsContainer} onLayout={this.handleTabsLayout}>
      <SwipeTabs
        tabs={tabs}
        activeIndex={this.state.activeTabIndex}
        showPages={true}
        tabHeight={52}
        strongLabels={true}
        labelStyle={styles.sellerTabLabel}
        showHairline={true}
        textCase="capitalize"
        indicatorColor={colors.textPrimary}
        activeIndicatorWidthRatio={0.55}
        progressChannel={this.sellerTabsProgress}
        renderPage={this.renderSellerTabPage}
        onIndexChange={this.handleSellerTabChange}
      />
    </view>;
  }

  private renderStickySellerTabs(): void {
    if (!this.state.stickyTabsMounted) return;
    const tabs = this.sellerSwipeTabs();

    <view
      style={styles.stickyTabsOverlay.extend({ top: this.stickyHeaderHeight() })}
    >
      <SwipeTabs
        tabs={tabs}
        activeIndex={this.state.activeTabIndex}
        showPages={false}
        scrollableTabs={false}
        tabHeight={52}
        tabItemWidth={Device.getWindowWidth() / tabs.length}
        strongLabels={true}
        labelStyle={styles.sellerTabLabel}
        showHairline={true}
        textCase="capitalize"
        indicatorColor={colors.textPrimary}
        activeIndicatorWidthRatio={0.55}
        progressChannel={this.sellerTabsProgress}
        onIndexChange={this.handleSellerTabChange}
      />
    </view>;
  }

  private renderAvatar(initial: string): void {
    const product = this.viewModel.product;
    <view style={styles.avatarRing}>
      <view style={styles.avatarFrame}>
        <view style={styles.avatarFallback}>
          <label value={initial} style={styles.avatarInitial} />
        </view>
        {product.vendorAvatarUrl ? <image src={product.vendorAvatarUrl} style={styles.avatar} objectFit="cover" /> : null}
      </view>
      {this.viewModel.isOwnProfile ? (
        <view
          style={styles.editAvatarButton}
          onTap={this.handleEditProfile}
          accessibilityCategory="button"
          accessibilityLabel="Modifier le profil vendeur"
        >
          <image src={navigationIcons.edit02} tint={colors.textInverted} width={16} height={16} objectFit="contain" />
        </view>
      ) : null}
    </view>;
  }

  private renderCoverStats(): void {
    const product = this.viewModel.product;
    const hasDispatch = Boolean(product.vendorDispatchTime);
    const hasDelivery = Boolean(product.vendorDeliveryTime);

    if (!hasDispatch && !hasDelivery) {
      return;
    }

    <view style={styles.coverStatsOverlay}>
      <layout style={styles.coverStatsDetails}>
        {hasDispatch ? (
          <view style={styles.coverStatItem}>
            <image src={navigationIcons.deliveryTruck02} tint={colors.textInverted} width={14} height={14} objectFit="contain" />
            <label value={product.vendorDispatchTime ?? ''} style={styles.coverStatLabel} numberOfLines={1} />
          </view>
        ) : null}
        {hasDelivery ? (
          <view style={styles.coverStatItem}>
            <image src={navigationIcons.sellerDeliveryPlane} tint={colors.textInverted} width={14} height={14} objectFit="contain" />
            <label value={product.vendorDeliveryTime ?? ''} style={styles.coverStatLabel} numberOfLines={1} />
          </view>
        ) : null}
      </layout>
    </view>;
  }

  onRender(): void {
    const product = this.viewModel.product;
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const vendorDisplayName = this.vendorDisplayName();
    const vendorCountryLabel = this.vendorCountryLabel();
    const vendorCountryFlag = this.vendorCountryFlag();
    const sellerBio = product.vendorBio ? limitSellerBio(product.vendorBio) : undefined;
    const initial = vendorDisplayName.charAt(0).toUpperCase();
    const coverColor = product.galleryColors?.[0] ?? product.color;
    const coverImage = product.vendorCoverImageUrl ?? product.imageUrl ?? product.vendorAvatarUrl;
    const stats: Array<{ value: string; label: string; showReviewIcon?: boolean }> = [];

    if (product.vendorRating || product.vendorReviewSummary) {
      stats.push({ value: product.vendorReviewSummary ?? product.vendorRating ?? '', label: 'Avis', showReviewIcon: true });
    }
    if (this.viewModel.sellerProducts !== undefined) {
      stats.push({ value: formatSellerCount(this.viewModel.sellerProducts.length), label: 'Articles' });
    }
    if (product.vendorFollowersCount !== undefined) {
      stats.push({ value: formatSellerCount(product.vendorFollowersCount), label: 'Abonnés' });
    }

    <view style={styles.root}>
      <scroll
        {...noBounceScrollAttributes}
        style={styles.scroll}
        onScroll={this.handleSellerScroll}
        showsVerticalScrollIndicator={false}
      >
        <view style={styles.cover} backgroundColor={coverColor}>
          {coverImage ? (
            <image
              src={coverImage}
              style={styles.coverImage}
              objectFit="cover"
              filter={ImageFilters.blur(14)}
            />
          ) : null}
          <view style={styles.coverTint} />
          <view style={styles.coverBottomShade} />
          {this.renderCoverStats()}
        </view>
        <view style={styles.profileSurface} onLayout={this.handleProfileSurfaceLayout}>
          <view style={styles.profileHeader}>
            {this.renderAvatar(initial)}
            {!this.viewModel.isOwnProfile ? (
              <layout style={styles.profileActions}>
                <view
                  style={styles.messageButton}
                  onTap={this.handleMessage}
                  accessibilityCategory="button"
                  accessibilityLabel={`Envoyer un message à ${vendorDisplayName}`}
                >
                  <image src={navigationIcons.bubbleChat} tint={colors.textPrimary} width={19} height={19} objectFit="contain" />
                </view>
                <DSButton
                  title={this.state.isFollowing ? 'Suivi' : 'Suivre'}
                  variant={this.state.isFollowing ? 'neutral' : 'cta'}
                  size="compact"
                  textCase="none"
                  icon={this.state.isFollowing ? navigationIcons.userCheck01 : navigationIcons.userAdd01}
                  iconSize={16}
                  onTap={this.handleFollow}
                />
              </layout>
            ) : null}
          </view>
          <label
            value={vendorDisplayName}
            style={styles.displayName}
            numberOfLines={1}
            onLayout={this.handleDisplayNameLayout}
          />
          <label value={'@' + this.vendorUsername()} style={styles.vendorHandle} numberOfLines={1} />
          {vendorCountryLabel ? (
            <layout style={styles.countryRow}>
              <label value={`Ce vendeur est en ${vendorCountryLabel}`} style={styles.countryLabel} numberOfLines={1} />
              {vendorCountryFlag ? <label value={vendorCountryFlag} style={styles.countryFlag} /> : null}
            </layout>
          ) : null}
          {stats.length > 0 ? (
            <layout style={styles.statsRow}>
              {stats.map((stat, index) => (
                <layout key={`seller-stat-${stat.label}`} style={styles.statGroup}>
                  {index > 0 ? <view style={styles.statsSeparatorDot} /> : null}
                  <layout style={styles.statItem}>
                    {stat.showReviewIcon ? (
                      <view style={styles.statsReviewIcon}>
                        <image src={navigationIcons.star} tint={colors.interactivePrimary} width={14} height={14} objectFit="contain" />
                      </view>
                    ) : null}
                    <label value={stat.value} style={styles.statsNumber} numberOfLines={1} />
                    <label value={stat.label} style={styles.statsLabel} numberOfLines={1} />
                  </layout>
                </layout>
              ))}
            </layout>
          ) : null}
          {sellerBio ? <label value={sellerBio} style={styles.bio} numberOfLines={4} /> : null}
          {this.renderSellerTabs()}
        </view>
      </scroll>
      {this.renderHeader(topInset)}
      {this.renderStickySellerTabs()}
    </view>;
  }
}

const sellerProfileBodyFont = montserrat.semiBold(fontSize.body);

const styles = {
  root: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexGrow: 1,
    flexShrink: 1,
    height: '100%',
  }),
  scroll: new Style<ScrollView>({
    flexGrow: 1,
    flexShrink: 1,
  }),
  cover: new Style<View>({
    alignItems: 'center',
    height: 188,
    justifyContent: 'center',
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    position: 'relative',
  }),
  coverImage: new Style<View>({
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  }),
  coverTint: new Style<View>({
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  }),
  coverBottomShade: new Style<View>({
    background: 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.42) 100%)',
    bottom: 0,
    height: 88,
    left: 0,
    position: 'absolute',
    width: '100%',
  }),
  coverStatsOverlay: new Style<View>({
    alignSelf: 'flex-end',
    bottom: spacing.xl,
    flexDirection: 'column',
    position: 'absolute',
    right: spacing.lg,
  }),
  coverStatsDetails: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-start' }),
  coverStatItem: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1, marginRight: spacing.sm }),
  coverStatLabel: new Style<Label>({ color: colors.textInverted, flexShrink: 1, font: montserrat.extraBold(fontSize.tiny), marginLeft: spacing.xs }),
  profileSurface: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    borderRadius: 0,
    marginTop: -spacing.md,
    paddingBottom: spacing.xxxxl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    zIndex: 1,
  }),
  profileHeader: new Style<View>({
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: 104,
    justifyContent: 'space-between',
    marginTop: -spacing.xxxxl,
  }),
  profileActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  avatarRing: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.full,
    height: 104,
    justifyContent: 'center',
    position: 'relative',
    width: 104,
  }),
  avatarFrame: new Style<View>({
    borderRadius: radius.full,
    height: 96,
    position: 'relative',
    width: 96,
  }),
  avatar: new Style<View>({
    borderRadius: radius.full,
    height: 96,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 96,
  }),
  avatarFallback: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 96,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
    width: 96,
  }),
  editAvatarButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    borderRadius: radius.full,
    bottom: spacing.xs,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xs,
    width: 32,
  }),
  avatarInitial: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.black(fontSize.display),
  }),
  displayName: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.display),
    marginTop: spacing.md,
  }),
  vendorHandle: typography.body.extend({
    color: colors.textSecondary,
    font: sellerProfileBodyFont,
  }),
  countryRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginTop: spacing.xs }),
  countryLabel: typography.body.extend({ color: colors.textSecondary, font: sellerProfileBodyFont }),
  countryFlag: typography.body.extend({ font: sellerProfileBodyFont, marginLeft: spacing.xs }),
  statsRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginTop: spacing.xxl }),
  statGroup: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1 }),
  statItem: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1 }),
  statsReviewIcon: new Style<View>({ marginRight: spacing.xs }),
  statsSeparatorDot: new Style<View>({ backgroundColor: colors.textSecondary, borderRadius: radius.full, height: 3, marginLeft: spacing.sm, marginRight: spacing.sm, width: 3 }),
  statsNumber: new Style<Label>({
    color: colors.textPrimary,
    flexShrink: 1,
    font: montserrat.extraBold(fontSize.body),
  }),
  statsLabel: new Style<Label>({
    color: colors.textSecondary,
    flexShrink: 1,
    font: sellerProfileBodyFont,
    marginLeft: spacing.xs,
  }),
  messageButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 36,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 36,
  }),
  bio: typography.body.extend({ color: colors.textPrimary, font: sellerProfileBodyFont, marginTop: spacing.xxl }),
  tabsContainer: new Style<Layout>({
    marginLeft: -spacing.lg,
    marginRight: -spacing.lg,
    marginTop: spacing.xxl,
  }),
  sellerProductsContent: new Style<View>({
    paddingTop: spacing.lg,
  }),
  sellerTabLabel: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.body),
  }),
  sellerTabPreview: new Style<Layout>({
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingBottom: spacing.xl,
    paddingTop: layout.live.feedTopPadding,
    width: '100%',
  }),
  sellerTabPreviewCard: new Style<Layout>({
    alignItems: 'flex-start',
    flexDirection: 'column',
    flexGrow: 0,
    flexShrink: 0,
  }),
  sellerProductGrid: new Style<View>({
    marginTop: spacing.sm,
  }),
  emptyStoreCategory: new Style<View>({
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl,
  }),
  emptyTab: new Style<View>({
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl,
  }),
  emptyTabText: typography.caption.extend({ textAlign: 'center' }),
  headerOverlay: new Style<View>({
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  }),
  header: new Style<View>({
    alignItems: 'center',
    minHeight: 56,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.sm,
    position: 'relative',
  }),
  headerBackground: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    bottom: 0,
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  }),
  headerContent: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
    width: '100%',
    zIndex: 1,
  }),
  stickyIdentity: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: spacing.md,
    opacity: 0,
    translationY: 6,
  }),
  stickyAvatar: new Style<View>({
    borderRadius: radius.full,
    flexShrink: 0,
    height: 30,
    width: 30,
  }),
  stickyAvatarFallback: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    flexShrink: 0,
    height: 30,
    justifyContent: 'center',
    width: 30,
  }),
  stickyAvatarInitial: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.semiBold(fontSize.metadata),
  }),
  stickyName: new Style<Label>({
    color: colors.textPrimary,
    flexShrink: 1,
    font: montserrat.extraBold(fontSize.body),
    marginLeft: spacing.sm,
  }),
  headerActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  stickyTabsOverlay: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
    zIndex: 3,
  }),
  headerButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundProfileHeader,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    width: 34,
  }),
};

const formatSellerCount = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return Math.max(0, count).toString();
};
