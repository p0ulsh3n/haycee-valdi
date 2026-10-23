import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, lineHeight, metropolis, typography } from '../../design-system/tokens/typography';
import type { LiveFeedItem } from '../data/LiveFeedData';

export interface LiveFeedCardViewModel {
  item: LiveFeedItem;
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

    <view style={styles.card}>
      <layout style={styles.hostRow}>
        <view style={styles.avatar.extend({ backgroundColor: item.panelColor })}>
          <label style={styles.avatarLabel} value={initials} numberOfLines={1} />
        </view>
        <label style={styles.hostName} value={item.hostName} numberOfLines={1} />
      </layout>

      <view
        style={styles.panel.extend({
          aspectRatio: layout.live.panelAspectRatio,
          backgroundColor: item.panelColor,
          borderRadius: layout.live.panelRadius,
        })}
      >
        <view style={styles.panelTopRow}>
          <view style={isUpcoming ? styles.upcomingBadge : styles.liveBadge}>
            {!isUpcoming ? <view style={styles.liveDot} /> : null}
            <label
              style={isUpcoming ? styles.upcomingLabel : styles.liveLabel}
              value={isUpcoming ? 'BIENTÔT' : 'EN DIRECT'}
              numberOfLines={1}
            />
          </view>
        </view>
        <view style={styles.panelCenter}>
          <label style={styles.panelCategory} value={item.category} numberOfLines={2} />
        </view>
        <view style={styles.panelBottomRow}>
          {isUpcoming ? (
            <view style={styles.upcomingBadge}>
              <label style={styles.upcomingLabel} value="RAPPEL DISPONIBLE" numberOfLines={1} />
            </view>
          ) : (
            <view style={styles.viewersBadge}>
              <view style={styles.viewersIconBacking}>
                <image src={navigationIcons.userGroup} tint={colors.textInverted} width={15} height={15} objectFit="contain" />
              </view>
              <label style={styles.viewersLabel} value={`${item.viewers} spectateurs`} numberOfLines={1} />
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
    width: 26,
  }),
  avatarLabel: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.semiBold(fontSize.micro),
  }),
  hostName: typography.caption.extend({
    alignSelf: 'center',
    color: colors.textPrimary,
    flexGrow: 1,
    font: metropolis.semiBold(fontSize.metadata),
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
  }),
  liveBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.xs,
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.xs,
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
  liveDot: new Style<View>({
    backgroundColor: colors.textDanger,
    borderRadius: radius.full,
    height: 6,
    marginRight: spacing.xs,
    width: 6,
  }),
  liveLabel: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.bold(fontSize.nano),
    letterSpacing: 0.4,
  }),
  upcomingLabel: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.bold(fontSize.nano),
    letterSpacing: 0.4,
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
    font: metropolis.extraBold(fontSize.section),
    letterSpacing: -0.3,
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
    borderRadius: radius.xs,
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    paddingTop: spacing.xs,
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
  viewersLabel: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.semiBold(fontSize.metadata),
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
    font: metropolis.semiBold(fontSize.nano),
    letterSpacing: 0.6,
    marginTop: spacing.xs,
  }),
};
