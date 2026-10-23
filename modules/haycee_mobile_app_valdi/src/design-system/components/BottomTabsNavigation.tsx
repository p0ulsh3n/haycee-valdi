import { StatefulComponent } from 'valdi_core/src/Component';
import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Asset } from 'valdi_tsx/src/Asset';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { Hairline } from './Hairline';
import { colors } from '../tokens/colors';
import { layout, spacing } from '../tokens/spacing';
import { TextCase, transformText, typography } from '../tokens/typography';
import { HomeScreenViewModel, HomeSurface } from '../../home/HomeScreen';
import { MessagesInbox } from '../../messaging/MessagesInbox';
import { ConversationPreview } from '../../messaging/MessagingTypes';
import { LiveHomeScreen } from '../../live/LiveHomeScreen';

export interface BottomTabItem {
  id: string;
  label: string;
  pageTitle: string;
  pageMessage: string;
  icon: Asset;
  iconActive?: Asset;
  pageColor?: string;
}

export interface BottomTabsNavigationViewModel {
  tabs?: BottomTabItem[];
  initialIndex?: number;
  textCase?: TextCase;
  onIndexChange?: (index: number, tab: BottomTabItem) => void;
  onMenuTap?: HomeScreenViewModel['onMenuTap'];
  onSearchTap?: HomeScreenViewModel['onSearchTap'];
  onWishlistTap?: HomeScreenViewModel['onWishlistTap'];
  onNotificationsTap?: HomeScreenViewModel['onNotificationsTap'];
  onProductTap?: HomeScreenViewModel['onProductTap'];
  onQuickAdd?: HomeScreenViewModel['onQuickAdd'];
  onConversationTap?: (conversation: ConversationPreview) => void;
}

interface BottomTabsNavigationState {
  activeIndex: number;
}

export const defaultBottomTabs: BottomTabItem[] = [
  {
    id: 'home',
    label: 'Accueil',
    pageTitle: 'Accueil',
    pageMessage: 'Bienvenue dans votre espace Haycee.',
    icon: navigationIcons.home,
    iconActive: navigationIcons.homeBold,
  },
  {
    id: 'messages',
    label: 'Messages',
    pageTitle: 'Messages',
    pageMessage: 'Retrouvez ici vos conversations.',
    icon: navigationIcons.messages,
  },
  {
    id: 'live',
    label: 'Live',
    pageTitle: 'Live',
    pageMessage: 'Les expériences en direct apparaîtront ici.',
    icon: navigationIcons.live,
  },
  {
    id: 'cart',
    label: 'Panier',
    pageTitle: 'Panier',
    pageMessage: 'Les articles ajoutés au panier apparaîtront ici.',
    icon: navigationIcons.cart,
  },
  {
    id: 'profile',
    label: 'Profil',
    pageTitle: 'Profil',
    pageMessage: 'Gérez votre profil et vos préférences.',
    icon: navigationIcons.profile,
    iconActive: navigationIcons.profileBold,
  },
];

/** Bottom tabs built with Valdi native elements and Shellby navigation artwork. */
export class BottomTabsNavigation extends StatefulComponent<BottomTabsNavigationViewModel, BottomTabsNavigationState> {
  state: BottomTabsNavigationState = { activeIndex: 0 };

  onCreate(): void {
    const requestedIndex = this.viewModel.initialIndex ?? 0;
    this.state = {
      activeIndex: this.clampIndex(requestedIndex),
    };
  }

  onRender(): void {
    const tabs = this.getTabs();
    const activeTab = tabs[this.state.activeIndex];
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());

    <view style={styles.screen}>
      {activeTab.id === 'home' ? (
        <HomeSurface
          onMenuTap={this.viewModel.onMenuTap}
          onSearchTap={this.viewModel.onSearchTap}
          onWishlistTap={this.viewModel.onWishlistTap}
          onNotificationsTap={this.viewModel.onNotificationsTap}
          onProductTap={this.viewModel.onProductTap}
          onQuickAdd={this.viewModel.onQuickAdd}
        />
      ) : activeTab.id === 'messages' ? (
        <MessagesInbox
          onConversationTap={this.viewModel.onConversationTap}
        />
      ) : activeTab.id === 'live' ? (
        <LiveHomeScreen />
      ) : (
        <view style={styles.content} backgroundColor={activeTab.pageColor ?? colors.backgroundPrimary}>
          <label
            style={styles.pageTitle}
            value={transformText(activeTab.pageTitle, this.getTextCase())}
            accessibilityCategory="header"
            numberOfLines={0}
          />
          <label
            style={styles.pageMessage}
            value={transformText(activeTab.pageMessage, this.getTextCase())}
            numberOfLines={0}
          />
        </view>
      )}
      <view
        style={bottomInset > 0
          ? styles.bottomBar.extend({
            height: layout.navigation.bottomTabsHeight + bottomInset,
            paddingBottom: bottomInset,
          })
          : styles.bottomBar}
      >
        <Hairline color={colors.borderDefault} />
        <layout style={styles.tabs}>
          {tabs.map((tab, index) => this.renderTab(tab, index))}
        </layout>
      </view>
    </view>;
  }

  private renderTab(tab: BottomTabItem, index: number): void {
    const isActive = index === this.state.activeIndex;
    const tabColor = colors.textPrimary;

    <view
      style={styles.tab}
      onTap={createReusableCallback(() => this.handleTabTap(index))}
      accessibilityCategory="button"
      accessibilityStateSelected={isActive}
    >
      <image
        src={isActive && tab.iconActive ? tab.iconActive : tab.icon}
        tint={tabColor}
        width={24}
        height={24}
        objectFit="contain"
      />
      <label
        style={styles.tabLabel.extend({ color: tabColor })}
        value={transformText(tab.label, this.getTextCase())}
        numberOfLines={1}
      />
    </view>;
  }

  private handleTabTap(index: number): void {
    if (index === this.state.activeIndex) {
      return;
    }

    const tab = this.getTabs()[index];
    this.setState({ activeIndex: index });
    this.viewModel.onIndexChange?.(index, tab);
  }

  private getTabs(): BottomTabItem[] {
    const tabs = this.viewModel.tabs;
    return tabs && tabs.length > 0 ? tabs : defaultBottomTabs;
  }

  private getTextCase(): TextCase {
    return this.viewModel.textCase ?? 'capitalize';
  }

  private clampIndex(index: number): number {
    return Math.max(0, Math.min(index, this.getTabs().length - 1));
  }
}

const styles = {
  screen: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
  }),
  content: new Style<View>({
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  }),
  pageTitle: typography.title1.extend({
    alignSelf: 'center',
    textAlign: 'center',
  }),
  pageMessage: typography.message.extend({
    alignSelf: 'center',
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  }),
  bottomBar: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexShrink: 0,
    height: layout.navigation.bottomTabsHeight,
  }),
  tabs: new Style<Layout>({
    flexGrow: 1,
    flexDirection: 'row',
  }),
  tab: new Style<View>({
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  }),
  tabLabel: typography.bottomTabLabel.extend({
    marginTop: spacing.xs,
  }),
};
