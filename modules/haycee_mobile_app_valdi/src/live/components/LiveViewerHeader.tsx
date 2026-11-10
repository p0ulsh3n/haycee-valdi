import { Component } from 'valdi_core/src/Component';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { ImageView, Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { DSButton } from '../../design-system/components/DSButton';
import { Ticker } from '../../design-system/components/Ticker';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { formatLiveViewerCount } from '../data/LiveFeedData';
import type { LiveFeedItem } from '../data/LiveFeedData';

export interface LiveViewerHeaderViewModel {
  item: LiveFeedItem;
  isFollowing: boolean;
  likeCount: number;
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
        <view style={styles.sellerPill}>
          <view style={styles.profileTapArea} onTap={this.viewModel.onOpenProfile} accessibilityCategory="button" accessibilityLabel={`Profil de ${item.hostName}`}>
            <view style={styles.avatar.extend({ backgroundColor: item.panelColor })}>
              <label value={initials} style={styles.avatarLabel} numberOfLines={1} />
              {item.vendorAvatarUrl ? (
                <image src={item.vendorAvatarUrl} style={styles.avatarPhoto} objectFit="cover" />
              ) : null}
            </view>
            <view style={styles.hostDetails}>
              <label value={item.hostName} style={styles.hostName} numberOfLines={1} textOverflow="ellipsis" />
              <layout style={styles.sellerChips}>
                {item.vendorRating ? (
                  <view style={styles.sellerChip}>
                    <image src={navigationIcons.sellerRatingStarBold} tint={colors.textInverted} width={8} height={8} objectFit="contain" />
                    <label value={item.vendorRating} style={styles.sellerStatLabel} numberOfLines={1} textOverflow="ellipsis" />
                  </view>
                ) : null}
                <view style={styles.heartStat} accessibilityLabel={`${formatLiveViewerCount(this.viewModel.likeCount)} cœurs envoyés`}>
                  <image
                    src={navigationIcons.favouriteBold}
                    tint={colors.textInverted}
                    width={10}
                    height={10}
                    objectFit="contain"
                  />
                  <label
                    value={formatLiveViewerCount(this.viewModel.likeCount)}
                    style={styles.sellerStatLabel}
                    numberOfLines={1}
                    textOverflow="ellipsis"
                  />
                </view>
              </layout>
            </view>
          </view>
          <view style={styles.followButtonSlot}>
            <DSButton
              title={this.viewModel.isFollowing ? 'Suivi' : 'Suivre'}
              variant={this.viewModel.isFollowing ? 'neutral' : 'cta'}
              size="compact"
              width={72}
              height={26}
              labelTranslationY={-1.5}
              onTap={this.viewModel.onToggleFollow}
              accessibilityLabel={this.viewModel.isFollowing ? 'Ne plus suivre la boutique' : 'Suivre la boutique'}
              textCase="none"
            />
          </view>
        </view>
        <layout style={styles.headerActions}>
          <view style={styles.viewerBadge} accessibilityLabel={`${formatLiveViewerCount(item.viewers)} spectateurs`}>
            <view style={styles.viewerBadgeIconDisc}>
              <image src={navigationIcons.userGroup} tint={colors.textPrimary} width={13} height={13} objectFit="contain" />
            </view>
            <label value={formatLiveViewerCount(item.viewers)} style={styles.viewerCount} numberOfLines={1} />
          </view>
          <view style={styles.closeButton} onTap={this.viewModel.onBack} accessibilityCategory="button" accessibilityLabel="Fermer le Live">
            <image src={navigationIcons.cancel01} tint={colors.textInverted} width={19} height={19} objectFit="contain" />
          </view>
        </layout>
      </layout>
      <layout style={styles.shareRow}>
        {item.vendorDispatchTime || item.vendorDeliveryTime ? (
          <LiveLogisticsPill dispatchTime={item.vendorDispatchTime} deliveryTime={item.vendorDeliveryTime} />
        ) : null}
        <view style={styles.shareRowSpacer} />
        <view style={styles.shareButton} onTap={this.viewModel.onShare} accessibilityCategory="button" accessibilityLabel="Partager le Live">
          <image src={navigationIcons.share01} tint={colors.textInverted} width={18} height={18} objectFit="contain" />
        </view>
      </layout>
    </view>;
  }
}

interface LiveLogisticsPillViewModel {
  dispatchTime?: string;
  deliveryTime?: string;
}

interface LiveLogisticsPillDimensions {
  tickerWidth: number;
  pillWidth: number;
}

/** Rotates the seller's dispatch and delivery estimates inside one compact pill. */
class LiveLogisticsPill extends Component<LiveLogisticsPillViewModel> {
  private readonly pillRef = new ElementRef<View>();
  private readonly tickerFrameRef = new ElementRef<View>();
  private activeItemIndex = 0;
  private currentDimensions?: LiveLogisticsPillDimensions;
  private pendingGrowth?: { index: number; dimensions: LiveLogisticsPillDimensions };
  private pendingShrink?: { index: number; dimensions: LiveLogisticsPillDimensions };

  private handleItemWillChange = (index: number, item: string): void => {
    const nextDimensions = this.measureWidths(item);
    const currentDimensions = this.currentDimensions ?? nextDimensions;
    if (nextDimensions.pillWidth < currentDimensions.pillWidth) {
      this.pendingGrowth = undefined;
      this.pendingShrink = { index, dimensions: nextDimensions };
      return;
    }

    this.pendingShrink = undefined;
    if (nextDimensions.pillWidth === currentDimensions.pillWidth) {
      this.pendingGrowth = undefined;
      return;
    }
    this.tickerFrameRef.single()?.setAttribute('width', nextDimensions.tickerWidth);
    this.pillRef.single()?.setAttribute('width', nextDimensions.pillWidth);
    this.pendingGrowth = { index, dimensions: nextDimensions };
  };

  private handleItemChange = (index: number): void => {
    this.activeItemIndex = index;
    const pendingGrowth = this.pendingGrowth;
    if (pendingGrowth?.index === index) {
      this.currentDimensions = pendingGrowth.dimensions;
      this.pendingGrowth = undefined;
      return;
    }
    const pendingShrink = this.pendingShrink;
    if (!pendingShrink || pendingShrink.index !== index) return;
    this.pendingShrink = undefined;
    this.animateDimensions(pendingShrink.dimensions, 0.22, AnimationCurve.EaseOut);
  };

  private animateDimensions(
    dimensions: LiveLogisticsPillDimensions,
    duration: number,
    curve: AnimationCurve,
  ): void {
    this.animate(
      {
        duration,
        curve,
        beginFromCurrentState: true,
        completion: wasCancelled => {
          if (!wasCancelled) this.currentDimensions = dimensions;
        },
      },
      () => {
        this.tickerFrameRef.single()?.setAttribute('width', dimensions.tickerWidth);
        this.pillRef.single()?.setAttribute('width', dimensions.pillWidth);
      },
    );
  }

  private measureWidths(label: string): LiveLogisticsPillDimensions {
    const textWidth = Math.ceil(label.length * fontSize.tiny * 0.53);
    const tickerWidth = textWidth + 13 + spacing.xs;
    return { tickerWidth, pillWidth: tickerWidth + spacing.md * 2 };
  }

  onRender(): void {
    const items: string[] = [];
    const icons: Asset[] = [];
    if (this.viewModel.dispatchTime) {
      icons.push(navigationIcons.deliveryTruck02Bold);
      items.push(`Livraison en ${this.viewModel.dispatchTime}`);
    }
    if (this.viewModel.deliveryTime) {
      icons.push(navigationIcons.sellerDeliveryPlaneBold);
      items.push(`Expédition en ${this.viewModel.deliveryTime}`);
    }
    if (items.length === 0) return;

    this.activeItemIndex = Math.min(this.activeItemIndex, items.length - 1);
    const dimensions = this.currentDimensions ?? this.measureWidths(items[this.activeItemIndex]);
    this.currentDimensions = dimensions;
    const { tickerWidth, pillWidth } = dimensions;
    <view ref={this.pillRef} width={pillWidth} style={styles.logisticsPill} accessibilityLabel={items.join('. ')}>
      <view ref={this.tickerFrameRef} width={tickerWidth} style={styles.logisticsTickerFrame}>
        <Ticker
          items={items}
          leadingIcons={icons}
          leadingIconSize={13}
          leadingIconTint={colors.textInverted}
          leadingIconGap={spacing.xs}
          mode="rotate"
          orientation="vertical"
          direction="forward"
          active={items.length > 1}
          repeat
          rotateTransition="slide"
          // Keep width changes in the same native animation as the text movement.
          transitionCurve={AnimationCurve.EaseOut}
          holdDurationMs={layout.home.ticker.holdMilliseconds}
          transitionDurationMs={300}
          onItemWillChange={this.handleItemWillChange}
          onItemChange={this.handleItemChange}
          style={styles.logisticsTicker}
          textStyle={styles.logisticsTickerText}
        />
      </view>
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
  identityRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }),
  sellerPill: new Style<View>({ alignItems: 'center', backgroundColor: colors.liveOverlaySurface, borderRadius: radius.full, flexDirection: 'row', flexGrow: 0, flexShrink: 1, height: layout.live.viewer.sellerAvatarSize, minWidth: 0, paddingRight: spacing.xs, width: '58%' }),
  profileTapArea: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1, minWidth: 0 }),
  avatar: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.full,
    height: layout.live.viewer.sellerAvatarSize,
    justifyContent: 'center',
    position: 'relative',
    width: layout.live.viewer.sellerAvatarSize,
  }),
  avatarLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.nano) }),
  avatarPhoto: new Style<ImageView>({
    borderRadius: radius.full,
    height: layout.live.viewer.sellerAvatarSize,
    left: 0,
    position: 'absolute',
    top: 0,
    width: layout.live.viewer.sellerAvatarSize,
  }),
  hostDetails: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm, minWidth: 0 }),
  hostName: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.product) }),
  sellerChips: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1, marginTop: 2, minWidth: 0 }),
  sellerChip: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1, minWidth: 0 }),
  sellerStatLabel: new Style<Label>({ color: colors.textInverted, flexShrink: 1, font: montserrat.semiBold(fontSize.nano), marginLeft: 3, minWidth: 0 }),
  heartStat: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0, marginLeft: spacing.sm }),
  headerActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginLeft: spacing.sm }),
  followButtonSlot: new Style<View>({ alignItems: 'center', flexShrink: 0, height: '100%', justifyContent: 'center', marginLeft: 2, width: 72 }),
  viewerBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveOverlaySurface,
    borderRadius: radius.full,
    flexDirection: 'row',
    paddingLeft: 0,
    paddingRight: spacing.xs,
  }),
  viewerBadgeIconDisc: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.textInverted,
    borderRadius: radius.full,
    height: 22,
    justifyContent: 'center',
    marginRight: 2,
    width: 22,
  }),
  viewerCount: new Style<Label>({ color: colors.textInverted, flexShrink: 0, font: montserrat.extraBold(fontSize.micro), marginLeft: 2, minWidth: 34, textAlign: 'center' }),
  shareButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveOverlaySurface,
    borderRadius: radius.full,
    height: layout.live.viewer.headerButtonSize,
    justifyContent: 'center',
    width: layout.live.viewer.headerButtonSize,
  }),
  logisticsPill: new Style<View>({ alignItems: 'center', backgroundColor: colors.liveOverlaySurface, borderRadius: radius.sm, flexDirection: 'row', flexShrink: 1, minWidth: 0, paddingBottom: spacing.xs, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.xs }),
  logisticsTickerFrame: new Style<View>({ flexShrink: 0, height: 16 }),
  logisticsTicker: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1, height: 16, minWidth: 0, width: '100%' }),
  logisticsTickerText: new Style<Label>({ color: colors.textInverted, flexGrow: 1, flexShrink: 1, font: montserrat.semiBold(fontSize.tiny), textAlign: 'left', translationY: -4.5 }),
  shareRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginTop: spacing.xs, width: '100%' }),
  shareRowSpacer: new Style<View>({ flexGrow: 1, flexShrink: 1 }),
  closeButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.liveOverlaySurface,
    borderRadius: radius.full,
    height: layout.live.viewer.headerButtonSize,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: layout.live.viewer.headerButtonSize,
  }),
};
