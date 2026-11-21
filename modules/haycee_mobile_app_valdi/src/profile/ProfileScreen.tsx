import { StatefulComponent } from 'valdi_core/src/Component';
import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { SwipeTabItem, SwipeTabs } from '../design-system/components/SwipeTabs';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { montserrat, fontSize } from '../design-system/tokens/typography';
import { ProfileCover } from './components/ProfileCover';
import { ProfileAccountMenu } from './components/ProfileAccountMenu';
import type { ProfileAccountMenuItem } from './components/ProfileAccountMenu';
import { ProfileIdentitySection } from './components/ProfileIdentitySection';
import { ProfileScreenHeader } from './components/ProfileScreenHeader';
import { formatFcfa } from '../design-system/utils/money';

export interface ProfileScreenViewModel {
  displayName?: string;
  username?: string;
  coverImageUrl?: string;
  coverColor?: string;
  avatarUrl?: string;
  bio?: string;
  followerCount?: string;
  followingCount?: string;
  walletBalance?: number;
  unreadNotificationCount?: number;
  onSupportTap?: () => void;
  onShareTap?: () => void;
  onSettingsTap?: () => void;
  onWalletTap?: () => void;
  onOrdersTap?: () => void;
  onLiveSupportTap?: () => void;
  onNotificationsTap?: () => void;
  onPaymentTap?: () => void;
  onShippingTap?: () => void;
}

interface ProfileScreenState {
  headerBackgroundVisible: boolean;
  stickyIdentityVisible: boolean;
}

const PROFILE_TABS: SwipeTabItem[] = [
  { id: 'account', label: 'Mon compte', pageTitle: 'Mon compte', pageMessage: '' },
  { id: 'videos', label: 'Vidéos', pageTitle: 'Vidéos', pageMessage: '' },
  { id: 'saved', label: 'Favoris', pageTitle: 'Favoris', pageMessage: '' },
];

const PROFILE_EMPTY_MESSAGES: Record<string, string> = {
  videos: 'Aucune vidéo pour le moment',
  saved: 'Aucun favori pour le moment',
};

/** Signed-in user's profile tab, structured like the seller profile above its swipe tabs. */
export class ProfileScreen extends StatefulComponent<ProfileScreenViewModel, ProfileScreenState> {
  state: ProfileScreenState = { headerBackgroundVisible: false, stickyIdentityVisible: false };
  private headerHeight = 0;
  private profileSurfaceOffsetY = 0;
  private displayNameOffsetY = 0;
  private displayNameHeight = 0;

  onCreate(): void {
    this.state = { headerBackgroundVisible: false, stickyIdentityVisible: false };
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

  private handleScroll = (event: ScrollEvent): void => {
    const headerHeight = this.headerHeight
      || Device.getDisplayTopInset()
        + layout.profile.header.topPadding
        + layout.profile.header.actionSize
        + layout.profile.header.bottomPadding;
    const headerBackgroundVisible = this.profileSurfaceOffsetY > 0
      && event.y >= Math.max(0, this.profileSurfaceOffsetY - headerHeight - spacing.lg);
    const identityThreshold = this.profileSurfaceOffsetY
      + this.displayNameOffsetY
      + this.displayNameHeight
      - headerHeight;
    const stickyIdentityVisible = this.profileSurfaceOffsetY > 0
      && this.displayNameHeight > 0
      && event.y >= Math.max(0, identityThreshold);

    if (
      headerBackgroundVisible !== this.state.headerBackgroundVisible
      || stickyIdentityVisible !== this.state.stickyIdentityVisible
    ) {
      this.setState({ headerBackgroundVisible, stickyIdentityVisible });
    }
  };

  private accountMenuItems(): ProfileAccountMenuItem[] {
    return [
      {
        id: 'wallet',
        title: 'Wallet',
        detail: `(${formatFcfa(this.viewModel.walletBalance ?? 0)})`,
        icon: navigationIcons.money03,
        onTap: this.viewModel.onWalletTap,
      },
      { id: 'orders', title: 'Mes commandes', icon: navigationIcons.package, onTap: this.viewModel.onOrdersTap },
      { id: 'live-support', title: 'Assistance Live', icon: navigationIcons.bubbleChat, onTap: this.viewModel.onLiveSupportTap },
      {
        id: 'notifications',
        title: 'Centre de notifications',
        icon: navigationIcons.notification01,
        unreadCount: this.viewModel.unreadNotificationCount ?? 1,
        onTap: this.viewModel.onNotificationsTap,
      },
      { id: 'payment', title: 'Paiement', icon: navigationIcons.identityCard, onTap: this.viewModel.onPaymentTap },
      { id: 'shipping', title: 'Livraison', icon: navigationIcons.deliveryTruck02, onTap: this.viewModel.onShippingTap },
    ];
  }

  private renderAvatar(): void {
    <view style={styles.avatarRing}>
      <view style={styles.avatarFrame}>
        <view style={styles.avatarFallback}>
          <image src={navigationIcons.profileUser} tint={colors.textSecondary} width={42} height={42} objectFit="contain" />
        </view>
        {this.viewModel.avatarUrl ? (
          <image src={this.viewModel.avatarUrl} style={styles.avatarImage} objectFit="cover" />
        ) : null}
      </view>
    </view>;
  }

  private renderProfilePage = (tab: SwipeTabItem, isActive: boolean, isPrepared: boolean): void => {
    if (!isActive || !isPrepared) return;
    if (tab.id === 'account') {
      <ProfileAccountMenu items={this.accountMenuItems()} />;
      return;
    }
    <view style={styles.emptyPage}>
      <image src={navigationIcons.profileUser} tint={colors.textTertiary} width={26} height={26} objectFit="contain" />
      <label value={PROFILE_EMPTY_MESSAGES[tab.id] ?? tab.pageTitle} style={styles.emptyMessage} numberOfLines={2} />
    </view>;
  };

  onRender(): void {
    const displayName = this.viewModel.displayName ?? 'Mon profil';

    <view style={styles.root}>
      <scroll
        {...noBounceScrollAttributes}
        style={styles.scroll}
        onScroll={this.handleScroll}
        showsVerticalScrollIndicator={false}
      >
        <ProfileCover
          imageUrl={this.viewModel.coverImageUrl}
          backgroundColor={this.viewModel.coverColor ?? colors.backgroundDarkSecondary}
        />
        <view style={styles.profileSurface} onLayout={this.handleProfileSurfaceLayout}>
          <view style={styles.profileHeader}>
            {this.renderAvatar()}
          </view>
          <ProfileIdentitySection
            displayName={displayName}
            username={this.viewModel.username ?? '@utilisateur'}
            stats={[
              { value: this.viewModel.followerCount ?? '0', label: 'Abonnés' },
              { value: this.viewModel.followingCount ?? '0', label: 'Abonnements' },
            ]}
            bio={this.viewModel.bio ?? 'Ajoutez une bio pour vous présenter.'}
            onDisplayNameLayout={this.handleDisplayNameLayout}
          />
          <view style={styles.tabs}>
            <SwipeTabs
              tabs={PROFILE_TABS}
              showPages={true}
              tabHeight={52}
              strongLabels={true}
              showHairline={true}
              textCase="none"
              indicatorColor={colors.textPrimary}
              activeIndicatorWidthRatio={0.55}
              renderPage={this.renderProfilePage}
            />
          </view>
        </view>
      </scroll>
      <ProfileScreenHeader
        displayName={displayName}
        avatarUrl={this.viewModel.avatarUrl}
        headerBackgroundVisible={this.state.headerBackgroundVisible}
        stickyIdentityVisible={this.state.stickyIdentityVisible}
        onHeaderLayout={this.handleHeaderLayout}
        onSupportTap={this.viewModel.onSupportTap}
        onShareTap={this.viewModel.onShareTap}
        onSettingsTap={this.viewModel.onSettingsTap}
      />
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  profileSurface: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    marginTop: -spacing.md,
    paddingBottom: spacing.xxxxl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    zIndex: 1,
  }),
  profileHeader: new Style<View>({
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: layout.profile.avatarRingSize,
    marginTop: -layout.profile.overlap,
  }),
  avatarRing: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.full,
    height: layout.profile.avatarRingSize,
    justifyContent: 'center',
    width: layout.profile.avatarRingSize,
  }),
  avatarFrame: new Style<View>({
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: layout.profile.avatarImageSize,
    position: 'relative',
    width: layout.profile.avatarImageSize,
  }),
  avatarFallback: new Style<View>({
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  }),
  avatarImage: new Style<View>({
    borderRadius: radius.full,
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  }),
  tabs: new Style<Layout>({ marginLeft: -spacing.lg, marginRight: -spacing.lg, marginTop: spacing.xxl }),
  emptyPage: new Style<View>({ alignItems: 'center', justifyContent: 'center', minHeight: 220, padding: spacing.xl }),
  emptyMessage: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.semiBold(fontSize.product),
    marginTop: spacing.md,
    textAlign: 'center',
  }),
};
