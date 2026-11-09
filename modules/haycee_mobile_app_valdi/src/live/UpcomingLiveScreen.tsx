import { Device } from 'valdi_core/src/Device';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import navigationIcons from '../../res/navigation-icons';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { LiveFeedCard } from './components/LiveFeedCard';
import { LiveCountdown } from './components/LiveCountdown';
import { colors } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat, transformText, typography } from '../design-system/tokens/typography';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import type { LiveFeedItem } from './data/LiveFeedData';
import { getLiveFeedItems } from './data/LiveFeedData';

interface UpcomingLiveScreenViewModel {
  item: LiveFeedItem;
  onOpenLive?: (item: LiveFeedItem) => void;
}

interface UpcomingLiveScreenState {
  isReminderSet: boolean;
  isFollowing: boolean;
}

/** Detail and reminder page shown before a scheduled live starts. */
@NavigationPage(module)
export class UpcomingLiveScreen extends NavigationPageStatefulComponent<
  UpcomingLiveScreenViewModel,
  UpcomingLiveScreenState
> {
  state: UpcomingLiveScreenState = {
    isReminderSet: false,
    isFollowing: false,
  };

  private countdownTarget = 0;
  private recommendedLives: LiveFeedItem[] = [];
  private readonly stickyTitleRef = new ElementRef<Label>();
  private readonly headerBackgroundRef = new ElementRef<View>();
  private detailsOffsetY = 0;
  private eventTitleOffsetY = 0;
  private headerBackgroundVisible = false;
  private stickyTitleVisible = false;

  onCreate(): void {
    const scheduledAt = this.viewModel.item.scheduledAtTimestampMs;
    this.countdownTarget = scheduledAt ?? Date.now() + 24 * 60 * 60 * 1000;
    this.recommendedLives = getLiveFeedItems('for-you').filter(item => item.status === 'live').slice(0, 2);
  }

  private handleBack = (): void => {
    this.navigationController.pop();
  };

  private stickyHeaderHeight = (): number => (
    56 + spacing.sm * 2 + Math.max(0, Device.getDisplayTopInset())
  );

  private heroHeight = (): number => (
    Math.round(Device.getWindowWidth() / layout.live.upcoming.heroAspectRatio)
  );

  private handleDetailsLayout = (frame: ElementFrame): void => {
    this.detailsOffsetY = frame.y;
  };

  private handleEventTitleLayout = (frame: ElementFrame): void => {
    this.eventTitleOffsetY = frame.y;
  };

  private handleUpcomingScroll = (event: ScrollEvent): void => {
    const headerHeight = this.stickyHeaderHeight();
    const detailsOffset = this.detailsOffsetY || this.heroHeight();
    const shouldShowBackground = event.y >= Math.max(0, detailsOffset - headerHeight - spacing.lg);
    if (shouldShowBackground !== this.headerBackgroundVisible) {
      this.headerBackgroundVisible = shouldShowBackground;
      const background = this.headerBackgroundRef.single();
      if (background) {
        this.animate(
          { duration: 0.2, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
          () => background.setAttribute('opacity', shouldShowBackground ? 1 : 0),
        );
      }
    }

    const shouldShowTitle = event.y >= Math.max(0, detailsOffset + this.eventTitleOffsetY - headerHeight);
    if (shouldShowTitle === this.stickyTitleVisible) return;

    this.stickyTitleVisible = shouldShowTitle;
    const title = this.stickyTitleRef.single();
    if (!title) return;
    this.animate(
      { duration: 0.22, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
      () => {
        title.setAttribute('opacity', shouldShowTitle ? 1 : 0);
        title.setAttribute('translationY', shouldShowTitle ? 0 : -6);
      },
    );
  };

  private renderHeader(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    <view style={styles.headerOverlay.extend({ height: this.stickyHeaderHeight() })}>
      <view style={topInset > 0 ? styles.header.extend({ paddingTop: topInset }) : styles.header}>
        <view ref={this.headerBackgroundRef} style={styles.headerBackground} />
        <view style={styles.headerContent}>
          <view style={styles.headerButton} onTap={this.handleBack} accessibilityCategory="button" accessibilityLabel="Retour">
            <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={24} height={24} objectFit="contain" />
          </view>
          <view style={styles.stickyTitleSlot}>
            <label
              ref={this.stickyTitleRef}
              value={transformText(this.viewModel.item.title, 'capitalize')}
              style={styles.stickyTitle}
              numberOfLines={1}
            />
          </view>
          <layout style={styles.headerActions}>
            <view style={styles.headerShareButton} onTap={this.handleShare} accessibilityCategory="button" accessibilityLabel="Partager ce live">
              <image src={navigationIcons.share01} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
            </view>
          </layout>
        </view>
      </view>
    </view>;
  }

  private handleShare = (): void => {
    TransientFeedback.show({ message: `Partager le live de ${this.viewModel.item.hostName}` });
  };

  private handleToggleReminder = (): void => {
    const isReminderSet = !this.state.isReminderSet;
    this.setState({ isReminderSet });
    TransientFeedback.show({
      message: isReminderSet ? 'Rappel activé pour ce live' : 'Rappel désactivé',
      duration: 1800,
    });
  };

  private handleToggleFollow = (): void => {
    this.setState({ isFollowing: !this.state.isFollowing });
  };

  private handleLiveTap = (item: LiveFeedItem): void => {
    if (this.viewModel.onOpenLive) {
      this.viewModel.onOpenLive(item);
      return;
    }
    TransientFeedback.show({ message: `Le live de ${item.hostName} sera bientôt disponible.` });
  };

  private renderHero(): void {
    const item = this.viewModel.item;
    <view style={styles.hero.extend({ backgroundColor: item.panelColor })}>
      {item.previewVideoUrl ? (
        <video src={item.previewVideoUrl} style={styles.heroMedia} volume={0} playbackRate={1} />
      ) : item.eventCoverImageUrl ? (
        <image src={item.eventCoverImageUrl} style={styles.heroMedia} objectFit="cover" />
      ) : item.vendorCoverImageUrl ? (
        <image src={item.vendorCoverImageUrl} style={styles.heroMedia} objectFit="cover" />
      ) : null}
      {item.previewVideoUrl ? (
        <view style={styles.previewLabel}>
          <label value="APERÇU" style={styles.previewLabelText} numberOfLines={1} />
        </view>
      ) : null}
      <view style={styles.heroBottomActions}>
        <view
          style={styles.reminderCta}
          onTap={this.handleToggleReminder}
          accessibilityCategory="button"
          accessibilityLabel={this.state.isReminderSet ? 'Désactiver le rappel du live' : 'Activer le rappel du live'}
        >
          <image src={this.state.isReminderSet ? navigationIcons.notification01Bold : navigationIcons.notification01} tint={colors.iconInverted} width={18} height={18} objectFit="contain" />
          <label value={this.state.isReminderSet ? 'Rappel activé' : 'Prévenez-moi'} style={styles.reminderTitle} numberOfLines={1} />
        </view>
        <LiveCountdown targetTimestampMs={this.countdownTarget} compact={true} />
      </view>
    </view>;
  }

  private renderSellerIdentity(): void {
    const item = this.viewModel.item;
    const initials = item.hostName.split(' ').map(part => part.charAt(0)).slice(0, 2).join('').toUpperCase();
    <layout style={styles.sellerIdentity}>
      <view style={styles.sellerAvatar}>
        <label value={initials} style={styles.sellerInitials} numberOfLines={1} />
        {item.vendorAvatarUrl ? <image src={item.vendorAvatarUrl} style={styles.sellerAvatarImage} objectFit="cover" /> : null}
      </view>
      <layout style={styles.sellerCopy}>
        <label value={item.hostName} style={styles.sellerName} numberOfLines={1} />
        <label value={this.countryLine()} style={styles.sellerCountry} numberOfLines={1} />
      </layout>
      <view style={styles.followButton.extend({ backgroundColor: this.state.isFollowing ? colors.buttonNeutral : colors.backgroundSecondary })}
        onTap={this.handleToggleFollow}
        accessibilityCategory="button"
        accessibilityLabel={this.state.isFollowing ? 'Ne plus suivre la boutique' : 'Suivre la boutique'}
      >
        <label value={this.state.isFollowing ? 'Suivi' : 'Suivre'} style={styles.followLabel.extend({ color: colors.textPrimary })} numberOfLines={1} />
      </view>
    </layout>;
  }

  private countryLine(): string {
    const item = this.viewModel.item;
    if (!item.vendorCountry) return 'Boutique vendeur';
    const flag = item.vendorCountryCode && /^[A-Z]{2}$/i.test(item.vendorCountryCode)
      ? this.countryFlag(item.vendorCountryCode)
      : '';
    return `${flag ? `${flag}  ` : ''}Ce vendeur est en ${item.vendorCountry}`;
  }

  private countryFlag(code: string): string {
    const base = 0xDDE6;
    return code.toUpperCase().split('').map(letter => String.fromCharCode(0xD83C, base + letter.charCodeAt(0) - 65)).join('');
  }

  private renderLiveNow(): void {
    if (this.recommendedLives.length === 0) return;
    const horizontalPadding = layout.live.feedHorizontalPadding;
    const columnGap = layout.live.cardColumnGap;
    const cardWidth = (Device.getWindowWidth() - horizontalPadding * 2 - columnGap) / 2;
    <view style={styles.section}>
      <label value="Live maintenant" style={styles.sectionTitle} numberOfLines={1} />
      <label value="Découvrez d’autres lives pendant votre attente" style={styles.sectionSubtitle} numberOfLines={2} />
      <layout style={styles.productRow.extend({ paddingLeft: horizontalPadding, paddingRight: horizontalPadding })}>
        {this.recommendedLives.map((item, index) => (
          <view key={item.id} style={styles.liveCardCell.extend({ width: cardWidth, marginRight: index === 0 ? columnGap : 0 })}>
            <LiveFeedCard item={item} onTap={() => this.handleLiveTap(item)} />
          </view>
        ))}
      </layout>
    </view>;
  }

  onRender(): void {
    const item = this.viewModel.item;
    const scheduledLabel = item.scheduledAtLabel ?? 'Horaire à confirmer';
    <view style={styles.root}>
      {this.renderHeader()}
      <scroll style={styles.scroll} {...noBounceScrollAttributes} onScroll={this.handleUpcomingScroll} showsVerticalScrollIndicator={false}>
        <view style={styles.content}>
          {this.renderHero()}
          <view style={styles.details} onLayout={this.handleDetailsLayout}>
            {this.renderSellerIdentity()}
            <label value={item.title} style={styles.eventTitle} numberOfLines={3} onLayout={this.handleEventTitleLayout} />
            <label value={scheduledLabel} style={styles.scheduleLabel} numberOfLines={1} />
          </view>
          {this.renderLiveNow()}
          <view style={styles.bottomSpace} />
        </view>
      </scroll>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1 }),
  scroll: new Style<ScrollView>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  content: new Style<View>({ flexDirection: 'column', width: '100%' }),
  hero: new Style<View>({ aspectRatio: layout.live.upcoming.heroAspectRatio, flexDirection: 'column', justifyContent: 'space-between', position: 'relative', width: '100%' }),
  heroMedia: new Style<View>({ height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }),
  headerOverlay: new Style<View>({ left: 0, position: 'absolute', right: 0, top: 0, zIndex: 10 }),
  header: new Style<View>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 56, paddingBottom: spacing.sm, paddingTop: spacing.sm, position: 'relative', width: '100%' }),
  headerBackground: new Style<View>({ backgroundColor: colors.backgroundPrimary, bottom: 0, left: 0, opacity: 0, position: 'absolute', right: 0, top: 0, zIndex: 0 }),
  headerContent: new Style<View>({ alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1, justifyContent: 'space-between', minHeight: 56, paddingLeft: spacing.lg, paddingRight: spacing.lg, position: 'relative' }),
  headerButton: new Style<View>({ alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.86)', borderRadius: radius.full, height: 40, justifyContent: 'center', width: 40 }),
  headerActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginLeft: 'auto' }),
  headerShareButton: new Style<View>({ alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.86)', borderRadius: radius.full, height: 40, justifyContent: 'center', marginLeft: spacing.sm, width: 40 }),
  stickyTitleSlot: new Style<View>({ alignItems: 'center', bottom: 0, justifyContent: 'center', left: spacing.lg + 40, position: 'absolute', right: spacing.lg + 40, top: 0, zIndex: 1 }),
  stickyTitle: typography.button.extend({ opacity: 0, textAlign: 'center', translationY: -6 }),
  previewLabel: new Style<View>({ backgroundColor: 'rgba(255, 255, 255, 0.86)', borderRadius: radius.full, bottom: spacing.lg, left: spacing.lg, paddingBottom: spacing.xs, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.xs, position: 'absolute' }),
  previewLabelText: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.tiny) }),
  heroBottomActions: new Style<View>({ alignItems: 'flex-end', bottom: spacing.lg, position: 'absolute', right: spacing.lg }),
  details: new Style<View>({ flexDirection: 'column', paddingBottom: spacing.xl, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.md }),
  sellerIdentity: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginBottom: spacing.lg }),
  sellerAvatar: new Style<View>({ alignItems: 'center', backgroundColor: colors.livePanelLavender, borderRadius: radius.full, height: layout.live.upcoming.sellerAvatarSize, justifyContent: 'center', marginRight: spacing.md, position: 'relative', width: layout.live.upcoming.sellerAvatarSize }),
  sellerAvatarImage: new Style<View>({ borderRadius: radius.full, height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }),
  sellerInitials: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.metadata) }),
  sellerCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  sellerName: typography.bodyEmphasis,
  sellerCountry: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginTop: spacing.xs }),
  followButton: new Style<View>({ alignItems: 'center', borderRadius: radius.full, flexShrink: 0, height: 38, justifyContent: 'center', marginLeft: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.lg }),
  followLabel: new Style<Label>({ font: montserrat.semiBold(fontSize.metadata) }),
  eventTitle: typography.title1,
  scheduleLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.label), marginTop: spacing.md }),
  reminderCta: new Style<View>({ alignItems: 'center', backgroundColor: colors.buttonPrimary, borderRadius: radius.full, flexDirection: 'row', height: 36, justifyContent: 'center', marginBottom: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.md }),
  reminderTitle: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.metadata), marginLeft: spacing.sm }),
  section: new Style<View>({ flexDirection: 'column', paddingBottom: spacing.xl, paddingTop: spacing.xl }),
  sectionTitle: typography.sectionHeader.extend({ marginLeft: spacing.lg, marginRight: spacing.lg }),
  sectionSubtitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginLeft: spacing.lg, marginRight: spacing.lg, marginTop: spacing.xs }),
  productRow: new Style<Layout>({ flexDirection: 'row', marginTop: spacing.lg, width: '100%' }),
  liveCardCell: new Style<View>({ flexGrow: 0, flexShrink: 0 }),
  bottomSpace: new Style<View>({ height: layout.navigation.bottomTabContentPadding }),
};
