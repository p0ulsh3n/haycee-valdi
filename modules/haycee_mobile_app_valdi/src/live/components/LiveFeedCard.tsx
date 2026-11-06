import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { DSBadge } from '../../design-system/components/DSBadge';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, lineHeight, montserrat, transformText, typography } from '../../design-system/tokens/typography';
import { formatLiveViewerCount } from '../data/LiveFeedData';
import type { LiveFeedItem } from '../data/LiveFeedData';
import { LiveNowPlayingIndicator } from './LiveNowPlayingIndicator';

export interface LiveFeedCardViewModel {
  item: LiveFeedItem;
  onTap: () => void;
  /** Omits seller identity when this card is already inside that seller's profile. */
  showHostHeader?: boolean;
  /** Adds the Shellby-style reminder control to scheduled live cards. */
  showReminderButton?: boolean;
  isReminderSet?: boolean;
  reminderCount?: number;
  onToggleReminder?: () => void;
}

/** Shellby-style Live tile, using a Haycee color panel instead of a thumbnail. */
export class LiveFeedCard extends Component<LiveFeedCardViewModel> {
  onRender(): void {
    const item = this.viewModel.item;
    const initials = item.hostName
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
    const isUpcoming = item.status === 'upcoming';
    const cardBadges = item.badges ?? [];

    <view
      style={styles.card}
      onTap={this.viewModel.onTap}
      accessibilityCategory="button"
      accessibilityLabel={isUpcoming ? `Voir le live programmé de ${item.hostName}` : `Ouvrir le live de ${item.hostName}`}
    >
      {this.viewModel.showHostHeader === false ? null : (
        <layout style={styles.hostRow}>
          <view style={styles.avatar.extend({ backgroundColor: item.panelColor })}>
            <label style={styles.avatarLabel} value={initials} numberOfLines={1} />
            {item.vendorAvatarUrl ? (
              <image src={item.vendorAvatarUrl} style={styles.avatarPhoto} objectFit="cover" />
            ) : null}
          </view>
          <label style={styles.hostName} value={item.hostName} numberOfLines={1} />
        </layout>
      )}

      <view
        style={styles.panel.extend({
          aspectRatio: layout.live.panelAspectRatio,
          backgroundColor: item.panelColor,
          borderRadius: layout.live.panelRadius,
        })}
      >
        <view style={styles.panelTopRow}>
          {isUpcoming ? (
            cardBadges.length > 0 ? (
              <layout style={styles.cardBadges}>
                {cardBadges.slice(0, 2).map(badge => (
                  <DSBadge key={`${item.id}-${badge.id}`} label={badge.label} variant={badge.variant} />
                ))}
              </layout>
            ) : null
          ) : (
            <view style={styles.liveBadge}>
              <LiveNowPlayingIndicator />
              <label style={styles.liveLabel} value="EN DIRECT" numberOfLines={1} />
            </view>
          )}
          <layout style={styles.panelTopActions}>
            {!isUpcoming && cardBadges.length > 0 ? (
              <layout style={styles.cardBadges}>
                {cardBadges.slice(0, 2).map(badge => (
                  <DSBadge key={`${item.id}-${badge.id}`} label={badge.label} variant={badge.variant} />
                ))}
              </layout>
            ) : null}
            {isUpcoming && this.viewModel.showReminderButton && this.viewModel.onToggleReminder ? (
              <view
                style={this.viewModel.isReminderSet ? styles.reminderButtonActive : styles.reminderButton}
                onTap={this.viewModel.onToggleReminder}
                accessibilityCategory="button"
                accessibilityLabel={this.viewModel.isReminderSet ? 'Désactiver le rappel du live' : 'Activer le rappel du live'}
              >
                <image
                  src={this.viewModel.isReminderSet ? navigationIcons.notification01Bold : navigationIcons.notification01}
                  tint={this.viewModel.isReminderSet ? colors.iconInverted : colors.iconDefault}
                  width={16}
                  height={16}
                  objectFit="contain"
                />
                <label
                  style={this.viewModel.isReminderSet ? styles.reminderCountActive : styles.reminderCount}
                  value={String((this.viewModel.reminderCount ?? 0) + (this.viewModel.isReminderSet ? 1 : 0))}
                  numberOfLines={1}
                />
              </view>
            ) : null}
          </layout>
        </view>
        <view style={styles.panelCenter}>
          <label style={styles.panelCategory} value={item.category} numberOfLines={2} />
        </view>
        <view style={styles.panelBottomRow}>
          {isUpcoming ? (
            item.scheduledAtLabel ? (
              <view style={styles.upcomingBadge}>
                <label style={styles.upcomingLabel} value={transformText(item.scheduledAtLabel, 'upper')} numberOfLines={1} />
              </view>
            ) : null
          ) : (
            <view style={styles.viewersBadge}>
              <view style={styles.viewersIconBacking}>
                <image src={navigationIcons.userGroup} tint={colors.textInverted} width={15} height={15} objectFit="contain" />
              </view>
              <layout style={styles.viewersText}>
                <label style={styles.viewersCount} value={formatLiveViewerCount(item.viewers)} numberOfLines={1} />
                <label style={styles.viewersSuffix} value="spectateurs" numberOfLines={1} />
              </layout>
            </view>
          )}
        </view>
      </view>

      <layout style={styles.info}>
        <label style={styles.title} value={item.title} numberOfLines={2} />
        <label style={styles.category} value={item.category.toUpperCase()} numberOfLines={1} />
      </layout>
    </view>;
  }
}

const styles = {
  card: new Style<View>({
    flexGrow: 1,
    flexShrink: 1,
  }),
  hostRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 28,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
  }),
  avatar: new Style<View>({
    alignItems: 'center',
    borderRadius: radius.full,
    height: 26,
    justifyContent: 'center',
    marginRight: spacing.sm,
    position: 'relative',
    width: 26,
  }),
  avatarLabel: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.semiBold(fontSize.micro),
  }),
  avatarPhoto: new Style<View>({
    borderRadius: radius.full,
    height: 26,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 26,
  }),
  hostName: typography.caption.extend({
    alignSelf: 'center',
    color: colors.textPrimary,
    flexGrow: 1,
    font: montserrat.semiBold(fontSize.metadata),
    lineHeight: lineHeight.label / fontSize.metadata,
  }),
  panel: new Style<View>({
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: spacing.sm,
    width: '100%',
  }),
  panelTopRow: new Style<Layout>({
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  }),
  cardBadges: new Style<Layout>({
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  }),
  panelTopActions: new Style<Layout>({
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  }),
  reminderButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.full,
    flexDirection: 'row',
    height: 28,
    justifyContent: 'center',
    marginLeft: spacing.xs,
    minWidth: 42,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
  }),
  reminderButtonActive: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.full,
    flexDirection: 'row',
    height: 28,
    justifyContent: 'center',
    marginLeft: spacing.xs,
    minWidth: 42,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
  }),
  reminderCount: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.semiBold(fontSize.nano),
    marginLeft: spacing.xs,
  }),
  reminderCountActive: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.semiBold(fontSize.nano),
    marginLeft: spacing.xs,
  }),
  liveBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.xs,
    flexDirection: 'row',
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: spacing.sm,
    paddingTop: 0,
  }),
  upcomingBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.xs,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.xs,
  }),
  liveLabel: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.nano),
  }),
  upcomingLabel: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.nano),
  }),
  panelCenter: new Style<Layout>({
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  }),
  panelCategory: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.section),
    textAlign: 'center',
  }),
  panelBottomRow: new Style<Layout>({
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  }),
  viewersBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: '11 4 4 11',
    flexDirection: 'row',
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: spacing.sm,
    paddingTop: 0,
  }),
  viewersIconBacking: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    borderRadius: radius.full,
    height: 22,
    justifyContent: 'center',
    marginRight: spacing.xs,
    width: 22,
  }),
  viewersText: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
  }),
  viewersCount: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.metadata),
  }),
  viewersSuffix: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.semiBold(fontSize.metadata),
    marginLeft: spacing.xs,
  }),
  info: new Style<Layout>({
    flexDirection: 'column',
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    paddingTop: spacing.sm,
  }),
  title: typography.productTitle.extend({
    color: colors.textPrimary,
    lineHeight: 1.15,
  }),
  category: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.semiBold(fontSize.nano),
    marginTop: spacing.xs,
  }),
};
