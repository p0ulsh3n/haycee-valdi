import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

export interface ProfileAccountMenuItem {
  id: string;
  title: string;
  icon: Asset;
  tone?: 'default' | 'danger';
  detail?: string;
  unreadCount?: number;
  onTap?: () => void;
}

export interface ProfileAccountMenuViewModel {
  items: ProfileAccountMenuItem[];
}

/** Account navigation rows used by the Profile tab's Mon compte page. */
export class ProfileAccountMenu extends Component<ProfileAccountMenuViewModel> {
  private renderItem(item: ProfileAccountMenuItem): void {
    const unreadCount = Math.max(0, Math.floor(item.unreadCount ?? 0));
    const countLabel = unreadCount > 99 ? '99+' : `${unreadCount}`;
    const isDanger = item.tone === 'danger';

    <view
      key={item.id}
      style={styles.row}
      onTap={item.onTap}
      accessibilityCategory="button"
      accessibilityLabel={`${item.title}${item.detail ? `, ${item.detail}` : ''}${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
    >
      <image src={item.icon} tint={isDanger ? colors.textDanger : colors.iconDefault} width={layout.profile.accountIconSize} height={layout.profile.accountIconSize} objectFit="contain" />
      <layout style={styles.rowContent}>
        <label value={item.title} style={isDanger ? styles.dangerTitle : styles.title} numberOfLines={1} />
        {item.detail ? <label value={item.detail} style={styles.detail} numberOfLines={1} /> : null}
      </layout>
      {unreadCount > 0 ? (
        <view style={styles.unreadBadge}>
          <label value={countLabel} style={styles.unreadCount} numberOfLines={1} />
        </view>
      ) : null}
      <image src={navigationIcons.arrowRight01Round} tint={colors.textTertiary} width={18} height={18} objectFit="contain" />
    </view>;
  }

  onRender(): void {
    <view style={styles.root}>
      {this.viewModel.items.map(item => this.renderItem(item))}
    </view>;
  }
}

const styles = {
  root: new Style<View>({ flexDirection: 'column', width: '100%' }),
  row: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    height: layout.profile.accountRowHeight,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    width: '100%',
  }),
  rowContent: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  title: new Style<Label>({ color: colors.textPrimary, flexShrink: 1, font: montserrat.semiBold(fontSize.product) }),
  dangerTitle: new Style<Label>({ color: colors.textDanger, flexShrink: 1, font: montserrat.semiBold(fontSize.product) }),
  detail: new Style<Label>({ color: colors.textSecondary, flexShrink: 0, font: montserrat.regular(fontSize.metadata), marginLeft: spacing.xs }),
  unreadBadge: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.interactiveDanger,
    borderRadius: radius.full,
    height: layout.profile.accountUnreadBadgeSize,
    justifyContent: 'center',
    marginRight: spacing.md,
    minWidth: layout.profile.accountUnreadBadgeSize,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
  }),
  unreadCount: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.tiny), textAlign: 'center' }),
};
