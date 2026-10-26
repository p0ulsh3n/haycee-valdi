import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors, palette } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { formatLiveViewerCount } from '../data/LiveFeedData';
import type { LiveFeedItem } from '../data/LiveFeedData';

export interface LiveViewerHeaderViewModel {
  item: LiveFeedItem;
  isFollowing: boolean;
  onBack: () => void;
  onShare: () => void;
  onOpenProfile: () => void;
  onToggleFollow: () => void;
}

/** Seller identity and logistics chips, with audience and close controls. */
export class LiveViewerHeader extends Component<LiveViewerHeaderViewModel> {
  onRender(): void {
    const { item } = this.viewModel;
    const initials = item.hostName
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
    <view style={styles.container}>
      <layout style={styles.identityRow}>
        <view style={styles.profileTapArea} onTap={this.viewModel.onOpenProfile} accessibilityCategory="button" accessibilityLabel={`Profil de ${item.hostName}`}>
          <view style={styles.avatar.extend({ backgroundColor: item.panelColor })}>
            <label value={initials} style={styles.avatarLabel} numberOfLines={1} />
          </view>
          <view style={styles.hostDetails}>
            <label value={item.hostName} style={styles.hostName} numberOfLines={1} />
            <layout style={styles.sellerChips}>
              {item.vendorRating ? (
                <view style={styles.sellerChip}>
                  <image src={navigationIcons.sellerRatingStarBold} tint={palette.purple} width={12} height={12} objectFit="contain" />
                  <label value={item.vendorRating} style={styles.chipLabel} numberOfLines={1} />
                </view>
              ) : null}
              {item.vendorRating && (item.vendorDispatchTime || item.vendorDeliveryTime) ? <view style={styles.sellerSeparator} /> : null}
              {item.vendorDispatchTime ? (
                <view style={styles.sellerChip}>
                  <image src={navigationIcons.deliveryTruck02Bold} tint={colors.textInverted} width={12} height={12} objectFit="contain" />
                  <label value={item.vendorDispatchTime} style={styles.chipLabel} numberOfLines={1} />
                </view>
              ) : null}
              {item.vendorDispatchTime && item.vendorDeliveryTime ? <view style={styles.sellerSeparator} /> : null}
              {item.vendorDeliveryTime ? (
                <view style={styles.sellerChip}>
                  <image src={navigationIcons.sellerDeliveryPlaneBold} tint={colors.textInverted} width={12} height={12} objectFit="contain" />
                  <label value={item.vendorDeliveryTime} style={styles.chipLabel} numberOfLines={1} />
                </view>
              ) : null}
              {item.vendorRating || item.vendorDispatchTime || item.vendorDeliveryTime ? <view style={styles.sellerSeparator} /> : null}
              <view
                style={this.viewModel.isFollowing ? styles.followButtonActive : styles.followButton}
                onTap={this.viewModel.onToggleFollow}
                accessibilityCategory="button"
                accessibilityLabel={this.viewModel.isFollowing ? 'Ne plus suivre la boutique' : 'Suivre la boutique'}
              >
                <label
                  value={this.viewModel.isFollowing ? 'Suivi' : 'Suivre'}
                  style={this.viewModel.isFollowing ? styles.followLabelActive : styles.followLabel}
                  numberOfLines={1}
                />
              </view>
            </layout>
          </view>
        </view>
        <layout style={styles.headerActions}>
          <view style={styles.viewerBadgeGradient} accessibilityLabel={`${formatLiveViewerCount(item.viewers)} spectateurs`}>
            <view style={styles.viewerBadge}>
              <view style={styles.viewerBadgeIconDisc}>
                <image src={navigationIcons.userGroup} tint={colors.textPrimary} width={14} height={14} objectFit="contain" />
              </view>
              <label value={formatLiveViewerCount(item.viewers)} style={styles.viewerCount} numberOfLines={1} />
            </view>
          </view>
          <view style={styles.closeButton} onTap={this.viewModel.onBack} accessibilityCategory="button" accessibilityLabel="Fermer le Live">
            <image src={navigationIcons.cancel01} tint={colors.textInverted} width={19} height={19} objectFit="contain" />
          </view>
        </layout>
      </layout>
      <layout style={styles.shareRow}>
        <view style={styles.shareButton} onTap={this.viewModel.onShare} accessibilityCategory="button" accessibilityLabel="Partager le Live">
          <image src={navigationIcons.share01} tint={colors.textInverted} width={18} height={18} objectFit="contain" />
        </view>
      </layout>
    </view>;
  }
}

const styles = {
  container: new Style<View>({
    flexDirection: 'column',
    paddingLeft: layout.live.viewer.horizontalPadding,
    paddingRight: layout.live.viewer.horizontalPadding,
    paddingTop: spacing.sm,
  }),
  identityRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  profileTapArea: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1, minWidth: 0 }),
  avatar: new Style<View>({
    alignItems: 'center',
    borderColor: colors.liveControlSurface,
    borderRadius: radius.full,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  }),
  avatarLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.nano) }),
  hostDetails: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm, minWidth: 0 }),
  hostName: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.product) }),
  sellerChips: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  sellerChip: new Style<View>({ alignItems: 'center', flexDirection: 'row' }),
  sellerSeparator: new Style<View>({ backgroundColor: colors.textInverted, borderRadius: radius.full, height: 3, marginLeft: spacing.xs, marginRight: spacing.xs, width: 3 }),
  chipLabel: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.nano), marginLeft: 3 }),
  headerActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginLeft: spacing.sm }),
  followButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.textInverted, borderRadius: radius.full, flexDirection: 'row', height: 20, justifyContent: 'center', marginLeft: spacing.xs, paddingLeft: spacing.sm, paddingRight: spacing.sm }),
  followButtonActive: new Style<View>({ alignItems: 'center', backgroundColor: colors.textInverted, borderRadius: radius.full, flexDirection: 'row', height: 20, justifyContent: 'center', marginLeft: spacing.xs, paddingLeft: spacing.sm, paddingRight: spacing.sm }),
  followLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.tiny) }),
  followLabelActive: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.tiny) }),
  viewerBadgeGradient: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.full,
    background: colors.liveViewerBadgeGradient,
    flexDirection: 'row',
    padding: layout.live.viewer.viewerBadgeGradientWidth,
  }),
  viewerBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveViewerBadgeSurface,
    borderRadius: radius.full,
    flexDirection: 'row',
    paddingLeft: 0,
    paddingRight: spacing.sm,
  }),
  viewerBadgeIconDisc: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.textInverted,
    borderRadius: radius.full,
    height: 24,
    justifyContent: 'center',
    marginRight: spacing.xs,
    width: 24,
  }),
  viewerCount: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.metadata), marginLeft: spacing.xs }),
  shareButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveActionSurface,
    borderRadius: radius.full,
    height: layout.live.viewer.headerButtonSize,
    justifyContent: 'center',
    width: layout.live.viewer.headerButtonSize,
  }),
  shareRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm }),
  closeButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveActionSurface,
    borderRadius: radius.full,
    height: layout.live.viewer.headerButtonSize,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: layout.live.viewer.headerButtonSize,
  }),
};
