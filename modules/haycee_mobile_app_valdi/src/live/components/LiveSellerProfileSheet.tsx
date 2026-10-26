import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { bottomSheetSurfaceStyle } from '../../design-system/components/BottomSheet';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import type { LiveFeedItem } from '../data/LiveFeedData';

export interface LiveSellerProfileSheetViewModel {
  item: LiveFeedItem;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onOpenStore: () => void;
}

interface LiveSellerProfileSheetState {
  isFollowing: boolean;
}

/** Light seller profile sheet shown from the Live seller identity. */
@NavigationPage(module)
export class LiveSellerProfileSheet extends NavigationPageStatefulComponent<LiveSellerProfileSheetViewModel, LiveSellerProfileSheetState> {
  state: LiveSellerProfileSheetState = { isFollowing: false };

  onCreate(): void {
    this.state = { isFollowing: this.viewModel.isFollowing };
  }

  private close = (): void => this.navigationController.dismiss(true);

  private openStore = (): void => {
    this.close();
    this.viewModel.onOpenStore();
  };

  private toggleFollow = (): void => {
    const isFollowing = !this.state.isFollowing;
    this.setState({ isFollowing });
    this.viewModel.onToggleFollow();
  };

  onRender(): void {
    const { item } = this.viewModel;
    const isFollowing = this.state.isFollowing;
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const initials = item.hostName
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
    const sheetStyle = bottomSheetSurfaceStyle.extend({
      backgroundColor: colors.backgroundPrimary,
      flexDirection: 'column',
      height: '58%',
      paddingBottom: bottomInset + spacing.xl,
      paddingLeft: spacing.xl,
      paddingRight: spacing.xl,
      paddingTop: spacing.md,
    });

    <layout style={styles.root}>
      <view style={sheetStyle}>
        <view style={styles.topRow}>
          <view style={styles.closeButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Fermer le profil vendeur">
            <image src={navigationIcons.cancel01} tint={colors.textPrimary} width={18} height={18} objectFit="contain" />
          </view>
        </view>
        <scroll style={styles.content} {...noBounceScrollAttributes} showsVerticalScrollIndicator={false}>
          <view style={styles.profileContent}>
            {item.vendorAvatarUrl ? (
              <image src={item.vendorAvatarUrl} style={styles.avatar} objectFit="cover" />
            ) : (
              <view style={styles.avatar}>
                <label value={initials} style={styles.avatarInitials} numberOfLines={1} />
              </view>
            )}
            <layout style={styles.nameRow}>
              <label value={item.hostName} style={styles.displayName} numberOfLines={1} />
              {item.vendorVerified ? <image src={navigationIcons.idVerified} tint={colors.interactivePrimary} width={22} height={22} objectFit="contain" /> : null}
            </layout>
            <layout style={styles.badgeRow}>
              {item.vendorCountry ? (
                <view style={styles.badge}>
                  <image src={navigationIcons.location04} tint={colors.textSecondary} width={15} height={15} objectFit="contain" />
                  <label value={item.vendorCity ? `${item.vendorCountry}, ${item.vendorCity}` : item.vendorCountry} style={styles.badgeLabel} numberOfLines={1} />
                </view>
              ) : null}
              {item.vendorReviewSummary || item.vendorRating ? (
                <view style={styles.badge}>
                  <image src={navigationIcons.star} tint={colors.interactivePrimary} width={16} height={16} objectFit="contain" />
                  <label value={`Avis ${item.vendorReviewSummary ?? item.vendorRating}`} style={styles.badgeLabel} numberOfLines={1} />
                </view>
              ) : null}
            </layout>
            {item.vendorDispatchTime ? (
              <view style={styles.badge}>
                <image src={navigationIcons.deliveryTruck02} tint={colors.textSecondary} width={16} height={16} objectFit="contain" />
                <label value={item.vendorDispatchTime} style={styles.badgeLabel} numberOfLines={1} />
              </view>
            ) : null}
            {item.vendorDeliveryTime ? (
              <view style={styles.badge}>
                <image src={navigationIcons.sellerDeliveryPlane} tint={colors.textSecondary} width={16} height={16} objectFit="contain" />
                <label value={item.vendorDeliveryTime} style={styles.badgeLabel} numberOfLines={1} />
              </view>
            ) : null}
            {item.vendorSalesCount !== undefined || item.vendorFollowersCount !== undefined ? (
              <layout style={styles.statsRow}>
                {item.vendorSalesCount !== undefined ? (
                  <layout style={styles.statItem}>
                    <label value={formatVendorCount(item.vendorSalesCount)} style={styles.statValue} numberOfLines={1} />
                    <label value="ventes" style={styles.statLabel} numberOfLines={1} />
                  </layout>
                ) : null}
                {item.vendorSalesCount !== undefined && item.vendorFollowersCount !== undefined ? (
                  <label value="·" style={styles.statSeparator} numberOfLines={1} />
                ) : null}
                {item.vendorFollowersCount !== undefined ? (
                  <layout style={styles.statItem}>
                    <label value={formatVendorCount(item.vendorFollowersCount)} style={styles.statValue} numberOfLines={1} />
                    <label value="abonnés" style={styles.statLabel} numberOfLines={1} />
                  </layout>
                ) : null}
              </layout>
            ) : null}
            {item.vendorBio ? <label value={item.vendorBio} style={styles.tagline} numberOfLines={4} /> : null}
          </view>
        </scroll>
        <layout style={styles.actions}>
          <view style={styles.actionButton} onTap={this.openStore} accessibilityCategory="button">
            <label value="Voir la Boutique" style={styles.actionLabel} numberOfLines={1} />
          </view>
          <view style={styles.actionButton} onTap={this.toggleFollow} accessibilityCategory="button">
            <label value={isFollowing ? 'Se désabonner' : 'Suivre'} style={styles.actionLabel} numberOfLines={1} />
          </view>
        </layout>
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  topRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end', minHeight: 36 }),
  closeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, height: 36, justifyContent: 'center', width: 36 }),
  content: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  profileContent: new Style<View>({ alignItems: 'center', paddingBottom: spacing.sm, paddingTop: spacing.xs }),
  avatar: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderColor: colors.borderDefault, borderRadius: radius.full, borderWidth: 1, height: 104, justifyContent: 'center', width: 104 }),
  avatarInitials: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.display) }),
  nameRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md, maxWidth: '100%' }),
  displayName: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.display), marginRight: spacing.xs }),
  badgeRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.md }),
  badge: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.xs, marginLeft: spacing.xs, marginRight: spacing.xs, paddingBottom: spacing.xs, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.xs }),
  badgeLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata), marginLeft: spacing.xs }),
  statsRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md }),
  statItem: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginLeft: spacing.xs, marginRight: spacing.xs }),
  statValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.body) }),
  statLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.regular(fontSize.body), marginLeft: spacing.xs }),
  statSeparator: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.body), marginLeft: spacing.xs, marginRight: spacing.xs }),
  tagline: new Style<Label>({ color: colors.textPrimary, font: montserrat.regular(fontSize.body), marginBottom: spacing.xl, marginTop: spacing.md, textAlign: 'center' }),
  actions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', width: '100%' }),
  actionButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexGrow: 1, flexShrink: 1, height: 58, justifyContent: 'center', marginLeft: spacing.xs, marginRight: spacing.xs, paddingLeft: spacing.md, paddingRight: spacing.md }),
  actionLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.label), textAlign: 'center' }),
};

const formatVendorCount = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return Math.max(0, count).toString();
};
