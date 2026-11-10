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
import { formatFcfa } from '../../design-system/utils/money';
import { getDemoLiveOrdersForSession, type LiveWalletOrder } from '../data/LiveWalletData';
import { registerLiveSheet } from '../LiveSheetVisibility';

interface LiveOrdersSheetViewModel {
  liveId: string;
}

/** Orders placed during the current Live session. */
@NavigationPage(module)
export class LiveOrdersSheet extends NavigationPageStatefulComponent<LiveOrdersSheetViewModel, {}> {
  private releaseSheetRegistration?: () => void;
  private isDismissing = false;

  onCreate(): void {
    this.releaseSheetRegistration = registerLiveSheet();
  }

  onDestroy(): void {
    this.releaseSheetRegistration?.();
    this.releaseSheetRegistration = undefined;
  }

  private close = (): void => {
    if (this.isDismissing) return;
    this.isDismissing = true;
    this.navigationController.dismiss(true);
  };

  private renderOrder(order: LiveWalletOrder, showStoreName: boolean): void {
    <view key={order.id} style={styles.orderCard}>
      <layout style={styles.orderRow}>
        <view style={styles.orderIcon}>
          <image src={navigationIcons.package} tint={colors.textPrimary} width={19} height={19} objectFit="contain" />
        </view>
        <layout style={styles.orderCopy}>
          <label value={`${order.items.length} article${order.items.length === 1 ? '' : 's'}`} style={styles.orderTitle} numberOfLines={1} />
          {showStoreName ? <label value={order.storeName} style={styles.orderStore} numberOfLines={1} /> : null}
          <label value={order.date} style={showStoreName ? styles.orderDate : styles.orderDateCompact} numberOfLines={1} />
        </layout>
        <layout style={styles.orderMeta}>
          <label value={formatFcfa(order.totalAmount)} style={styles.orderAmount} numberOfLines={1} />
          <view style={order.status === 'Livrée' ? styles.statusPillDelivered : styles.statusPillPending}>
            <label value={order.status} style={styles.statusLabel} numberOfLines={1} />
          </view>
        </layout>
      </layout>
      <layout style={styles.orderItems}>
        {order.items.map(item => (
          <layout key={item.id} style={styles.orderItemRow}>
            <label value={item.title} style={styles.orderItemTitle} numberOfLines={1} />
            <label value={`${item.quantity} × ${formatFcfa(item.unitPrice)}`} style={styles.orderItemPrice} numberOfLines={1} />
          </layout>
        ))}
      </layout>
    </view>;
  }

  private renderLiveOrders(): void {
    const orders = getDemoLiveOrdersForSession(this.viewModel.liveId);

    <scroll style={styles.content} {...noBounceScrollAttributes} showsVerticalScrollIndicator={false}>
      <layout style={styles.ordersContent}>
        <layout style={styles.sectionHeading}>
          <label value="Commandes de ce live" style={styles.sectionTitle} numberOfLines={1} />
          <label value={`${orders.length}`} style={styles.sectionCount} numberOfLines={1} />
        </layout>
        <layout style={styles.ordersList}>
          {orders.map(order => this.renderOrder(order, false))}
        </layout>
      </layout>
    </scroll>;
  }

  private renderLiveOrdersNotice(): void {
    <view style={styles.noticeFooter}>
      <view style={styles.liveOrdersNotice}>
        <image src={navigationIcons.informationCircle} tint={colors.textSecondary} width={18} height={18} objectFit="contain" />
        <layout style={styles.noticeCopy}>
          <label value="Achats regroupés" style={styles.noticeTitle} numberOfLines={1} />
          <label
            value="Ajoutez des articles à volonté pendant ce live. À sa fin, vos achats seront regroupés en une seule commande et les frais de livraison ou d’expédition ne seront payés qu’une fois."
            style={styles.noticeMessage}
            numberOfLines={0}
          />
        </layout>
      </view>
    </view>;
  }

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const sheetStyle = bottomSheetSurfaceStyle.extend({
      backgroundColor: colors.backgroundPrimary,
      flexDirection: 'column',
      height: '82%',
      paddingBottom: bottomInset + spacing.lg,
      paddingLeft: spacing.xl,
      paddingRight: spacing.xl,
      paddingTop: spacing.md,
    });

    <layout style={styles.root}>
      <view style={sheetStyle}>
        <layout style={styles.header}>
          <layout style={styles.headerCopy}>
            <label value="Commandes" style={styles.sheetTitle} numberOfLines={1} />
            <label value="Suivez vos achats et leur livraison" style={styles.sheetSubtitle} numberOfLines={1} />
          </layout>
          <view style={styles.closeButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Fermer l’historique des commandes">
            <image src={navigationIcons.cancel01} tint={colors.textPrimary} width={19} height={19} objectFit="contain" />
          </view>
        </layout>
        {this.renderLiveOrders()}
        {this.renderLiveOrdersNotice()}
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.md }),
  headerCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  sheetTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section) }),
  sheetSubtitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginTop: spacing.xs }),
  closeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexShrink: 0, height: 38, justifyContent: 'center', marginLeft: spacing.md, width: 38 }),
  content: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1, width: '100%' }),
  ordersContent: new Style<Layout>({ flexDirection: 'column', paddingBottom: spacing.sm, paddingTop: spacing.lg }),
  noticeFooter: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexShrink: 0, paddingBottom: spacing.sm, paddingTop: spacing.md, width: '100%' }),
  liveOrdersNotice: new Style<View>({ alignItems: 'flex-start', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'row', padding: spacing.md, width: '100%' }),
  noticeCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm, minWidth: 0 }),
  noticeTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata) }),
  noticeMessage: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs, numberOfLines: 0 }),
  sectionHeading: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, marginTop: spacing.xs }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.large) }),
  sectionCount: new Style<Label>({ color: colors.textTertiary, font: montserrat.semiBold(fontSize.tiny) }),
  ordersList: new Style<Layout>({ flexDirection: 'column' }),
  orderCard: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', marginBottom: spacing.md, paddingBottom: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.sm }),
  orderRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minHeight: 70 }),
  orderIcon: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.md, flexShrink: 0, height: 42, justifyContent: 'center', width: 42 }),
  orderCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  orderTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body) }),
  orderStore: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.tiny), marginTop: 2 }),
  orderDate: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  orderDateCompact: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginTop: 2 }),
  orderMeta: new Style<Layout>({ alignItems: 'flex-end', flexDirection: 'column', flexShrink: 0, marginLeft: spacing.xs }),
  orderAmount: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.metadata) }),
  orderItems: new Style<Layout>({ flexDirection: 'column', marginLeft: spacing.xxxxxl, marginTop: spacing.xs }),
  orderItemRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 24 }),
  orderItemTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.regular(fontSize.tiny), marginRight: spacing.sm }),
  orderItemPrice: new Style<Label>({ color: colors.textSecondary, flexShrink: 0, font: montserrat.semiBold(fontSize.nano) }),
  statusPillDelivered: new Style<View>({ alignItems: 'center', backgroundColor: colors.liveWalletStatusDelivered, borderRadius: radius.full, justifyContent: 'center', marginTop: spacing.xs, paddingBottom: 4, paddingLeft: spacing.sm, paddingRight: spacing.sm, paddingTop: 4 }),
  statusPillPending: new Style<View>({ alignItems: 'center', backgroundColor: colors.liveWalletStatusPending, borderRadius: radius.full, justifyContent: 'center', marginTop: spacing.xs, paddingBottom: 4, paddingLeft: spacing.sm, paddingRight: spacing.sm, paddingTop: 4 }),
  statusLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.nano) }),
};
