import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import navigationIcons from '../../res/navigation-icons';
import { BottomSheet, DSButton, getBottomSheetNavigationOptions, Hairline } from '../design-system/index';
import { SellerProfileScreen } from '../sellers/SellerProfileScreen';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import { formatFrenchLongDate } from '../design-system/utils/date';
import { formatFcfa } from '../design-system/utils/money';
import { runNavigationAction } from '../design-system/utils/NavigationActionGate';
import type { ProfileOrderDemoItem, ProfileOrderTimelineDemoItem } from './data/ProfileOrdersDemoData';

export interface ProfileOrderDetailScreenViewModel {
  order: ProfileOrderDemoItem;
}

/** Detailed demo receipt and fulfillment history for a selected profile order. */
@NavigationPage(module)
export class ProfileOrderDetailScreen extends NavigationPageStatefulComponent<ProfileOrderDetailScreenViewModel, {}> {
  private isClosing = false;

  private close = (): void => {
    if (this.isClosing) return;
    this.isClosing = true;
    this.navigationController.pop();
  };

  private openStore = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController.push(
        SellerProfileScreen,
        { product: this.viewModel.order.storefrontProduct },
        {},
        { animated: true, pageBackgroundColor: colors.backgroundPrimary },
      );
    });
  };

  private openTracking = (): void => {
    const order = this.viewModel.order;
    runNavigationAction(this.navigationController, () => {
      this.navigationController.present(
        BottomSheet,
        {
          title: 'Suivi de la commande',
          textCase: 'none',
          showOverlay: false,
          enableGestures: true,
          snapPointPercent: 82,
          renderContent: () => this.renderTrackingSheetContent(order),
        },
        {},
        { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions({ transparentPageBackground: true }) },
      );
    });
  };

  private renderTrackingSheetContent(order: ProfileOrderDemoItem): void {
    const currentStep = order.timeline.find(item => item.state === 'current') ?? order.timeline[order.timeline.length - 1];
    const trackingStatusStyle = order.status === 'payment-failed'
      ? styles.cancelledTrackingStatus
      : order.status === 'processing'
        ? styles.pendingTrackingStatus
        : order.status === 'shipped' || order.status === 'delivered'
          ? styles.fulfilledTrackingStatus
          : styles.trackingStatus;
    <scroll {...noBounceScrollAttributes} style={styles.trackingScroll} showsVerticalScrollIndicator={false}>
      <view style={styles.trackingContent}>
        <view style={styles.trackingSummary}>
          <view style={styles.trackingIcon}>
            <image src={navigationIcons.package} tint={colors.interactivePrimary} width={22} height={22} objectFit="contain" />
          </view>
          <layout style={styles.trackingSummaryCopy}>
            <label value="Statut" style={styles.detailEyebrow} numberOfLines={1} />
            <label
              value={currentStep?.title ?? order.statusLabel}
              style={trackingStatusStyle}
              numberOfLines={2}
            />
            {currentStep ? (
              <view style={styles.trackingDateGroup}>
                <label value="Dernière mise à jour" style={styles.detailEyebrow.extend({ marginTop: spacing.sm })} numberOfLines={1} />
                <label value={formatTrackingDate(currentStep.dateIso)} style={styles.trackingUpdatedAt} numberOfLines={2} />
              </view>
            ) : null}
            <label value={`Commande ${order.orderNumber}`} style={styles.trackingOrderNumber} numberOfLines={1} />
          </layout>
        </view>
        {order.status === 'payment-failed' ? (
          <view style={styles.trackingUnavailable}>
            <label value="Aucun colis n’a été expédié pour cette commande." style={styles.trackingUnavailableText} numberOfLines={0} />
          </view>
        ) : null}
        <label value="Étapes du suivi" style={styles.trackingSectionTitle} numberOfLines={1} />
        <view style={styles.timelinePanel}>
          {order.timeline.map((item, index) => this.renderTimelineItem(item, index, order.timeline.length, order.status))}
        </view>
        <view style={styles.trackingDeliveryInfo}>
          <label value="Mode de livraison" style={styles.detailEyebrow} numberOfLines={1} />
          <label value={order.deliveryMethod} style={styles.detailValue} numberOfLines={2} />
          <label value="Adresse" style={styles.detailEyebrow.extend({ marginTop: spacing.md })} numberOfLines={1} />
          <label value={order.deliveryAddress} style={styles.detailValue} numberOfLines={0} />
        </view>
      </view>
    </scroll>;
  }

  private renderItems(): void {
    {this.viewModel.order.items.map(item => (
      <view key={item.id} style={styles.itemRow}>
        <view style={styles.itemColorPanel.extend({ backgroundColor: this.viewModel.order.panelColor })} />
        <layout style={styles.itemCopy}>
          <label value={item.title} style={styles.itemTitle} numberOfLines={2} />
          <label value={item.optionLabel} style={styles.itemOption} numberOfLines={2} />
          <label value={`Quantité : ${item.quantity}`} style={styles.itemQuantity} numberOfLines={1} />
        </layout>
        <label value={formatFcfa(item.unitPrice * item.quantity)} style={styles.itemPrice} numberOfLines={2} />
      </view>
    ))}
  }

  private renderTimelineItem(item: ProfileOrderTimelineDemoItem, index: number, count: number, orderStatus: ProfileOrderDemoItem['status']): void {
    const isComplete = item.state === 'complete';
    const isCurrent = item.state === 'current';
    const isCancelled = orderStatus === 'payment-failed';
    const isFulfilled = orderStatus === 'shipped' || orderStatus === 'delivered';
    const isCancellationStep = isCancelled && index === count - 1;
    const isPendingStep = item.state === 'upcoming' || (orderStatus === 'processing' && isCurrent);
    let dotColor: string = colors.borderDefault;
    if (isComplete || isCurrent) dotColor = isFulfilled ? colors.interactiveSuccess : colors.buttonPrimary;
    if (isPendingStep) dotColor = colors.interactivePending;
    if (isCancellationStep) dotColor = colors.interactiveDanger;

    let lineColor: string = isComplete ? isFulfilled ? colors.interactiveSuccess : colors.buttonPrimary : colors.borderDefault;
    if (isCurrent && index < count - 1) lineColor = colors.interactivePending;
    if (isCancelled && index === count - 2) lineColor = colors.interactiveDanger;
    const dateLabel = item.state === 'upcoming'
      ? `Prévue le ${formatTrackingDate(item.dateIso)}`
      : isCancellationStep
        ? `Annulée le ${formatTrackingDate(item.dateIso)}`
      : item.state === 'current'
          ? `En cours depuis le ${formatTrackingDate(item.dateIso)}`
        : `Étape enregistrée le ${formatTrackingDate(item.dateIso)}`;
    <view key={item.id} style={styles.timelineRow}>
      <view style={styles.timelineTrack}>
        <view style={styles.timelineDot.extend({ backgroundColor: dotColor })} />
        {index < count - 1 ? <view style={styles.timelineLine.extend({ backgroundColor: lineColor })} /> : null}
      </view>
      <layout style={styles.timelineCopy}>
        <label value={item.title} style={isCancellationStep ? styles.timelineCancelledTitle : isPendingStep && isCurrent ? styles.timelinePendingTitle : isCurrent ? styles.timelineCurrentTitle : styles.timelineTitle} numberOfLines={2} />
        <label value={dateLabel} style={styles.timelineDate} numberOfLines={2} />
      </layout>
    </view>;
  }

  onRender(): void {
    const order = this.viewModel.order;
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const failedPayment = order.status === 'payment-failed';

    <view style={styles.root}>
      <view style={styles.header.extend({ paddingTop: topInset + spacing.sm })}>
        <view style={styles.headerAction} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour aux commandes">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
        </view>
        <label value="Détail de la commande" style={styles.headerTitle} numberOfLines={1} accessibilityCategory="header" />
        <view style={styles.headerAction} />
      </view>
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <view style={styles.content.extend({ paddingBottom: spacing.lg })}>
          <view style={styles.statusPanel}>
            <label value="Statut" style={styles.detailEyebrow} numberOfLines={1} />
            <label
              value={getOrderStatusLabel(order)}
              style={failedPayment
                ? styles.cancelledOrderStatus
                : order.status === 'processing'
                  ? styles.pendingOrderStatus
                  : order.status === 'shipped' || order.status === 'delivered'
                    ? styles.fulfilledOrderStatus
                    : styles.orderStatus}
              numberOfLines={2}
            />
            <label value={`Commande ${order.orderNumber}`} style={styles.orderNumber} numberOfLines={1} />
            <label value="Date de la commande" style={styles.orderDateLabel} numberOfLines={1} />
            <label value={formatTrackingDate(order.dateIso)} style={styles.orderDate} numberOfLines={1} />
            {failedPayment ? (
              <label value="Cette commande a été annulée. Aucun montant n’a été débité." style={styles.statusNote} numberOfLines={0} />
            ) : null}
            <view style={styles.trackOrderButtonWrap}>
              <DSButton
                title="Suivre mon colis"
                variant="cta"
                size="fullWidth"
                height={48}
                textCase="none"
                icon={navigationIcons.deliveryTracking01}
                iconSize={20}
                onTap={this.openTracking}
                accessibilityLabel="Suivre mon colis"
              />
            </view>
          </view>

          <label value="Boutique" style={styles.sectionTitle} numberOfLines={1} />
          <view
            style={styles.storeRow}
            onTap={createReusableCallback(() => this.openStore())}
            accessibilityCategory="button"
            accessibilityLabel={`Ouvrir la boutique ${order.storefrontProduct.vendorName ?? 'du vendeur'}`}
          >
            <view style={styles.storeAvatarFrame}>
              <view style={styles.storeAvatarFallback.extend({ backgroundColor: order.panelColor })} />
              {order.storefrontProduct.vendorAvatarUrl ? (
                <image src={order.storefrontProduct.vendorAvatarUrl} style={styles.storeAvatar} objectFit="cover" />
              ) : null}
            </view>
            <layout style={styles.storeCopy}>
              <label value={order.storefrontProduct.vendorName ?? 'Boutique'} style={styles.storeName} numberOfLines={1} />
              <label value={order.storefrontProduct.vendorUsername ? `@${order.storefrontProduct.vendorUsername}` : 'Voir la boutique'} style={styles.storeUsername} numberOfLines={1} />
            </layout>
            <image src={navigationIcons.arrowRight01Round} tint={colors.textTertiary} width={layout.profile.accountDestination.optionSvgSize} height={layout.profile.accountDestination.optionSvgSize} objectFit="contain" />
          </view>

          <label value="Articles commandés" style={styles.sectionTitle} numberOfLines={1} />
          <view style={styles.sectionPanel}>
            {this.renderItems()}
          </view>

          <label value="Livraison" style={styles.sectionTitle} numberOfLines={1} />
          <view style={styles.sectionPanel}>
            <label value="Mode" style={styles.detailEyebrow} numberOfLines={1} />
            <label value={order.deliveryMethod} style={styles.detailValue} numberOfLines={2} />
            <label value="Adresse" style={styles.detailEyebrow.extend({ marginTop: spacing.md })} numberOfLines={1} />
            <label value={order.deliveryAddress} style={styles.detailValue} numberOfLines={0} />
          </view>

          <label value="Paiement" style={styles.sectionTitle} numberOfLines={1} />
          <view style={styles.sectionPanel}>
            <label value="Moyen de paiement" style={styles.detailEyebrow} numberOfLines={1} />
            <label value={order.paymentMethod} style={styles.detailValue} numberOfLines={2} />
            <label value="État du paiement" style={styles.detailEyebrow.extend({ marginTop: spacing.md })} numberOfLines={1} />
            <label value={order.paymentStatus} style={styles.detailValue} numberOfLines={0} />
          </view>

          <label value="Données de démonstration" style={styles.demoNotice} numberOfLines={1} />
        </view>
      </scroll>
      <view style={styles.summaryFooter.extend({ paddingBottom: bottomInset + spacing.md })}>
        <view style={styles.summaryPanel}>
          <view style={styles.amountRow}>
            <label value="Sous-total" style={styles.amountLabel} numberOfLines={1} />
            <label value={formatFcfa(order.subtotal)} style={styles.amountValue} numberOfLines={1} />
          </view>
          <view style={styles.amountRow}>
            <label value={order.deliveryMethod.startsWith('Expédition') ? 'Frais d’expédition' : 'Frais de livraison'} style={styles.amountLabel} numberOfLines={1} />
            <label value={formatFcfa(order.shippingFee)} style={styles.amountValue} numberOfLines={1} />
          </view>
          <Hairline color={colors.borderDefault} />
          <view style={styles.amountTotalRow}>
            <label value="Total" style={styles.totalLabel} numberOfLines={1} />
            <label value={formatFcfa(order.total)} style={styles.totalValue} numberOfLines={1} />
          </view>
        </view>
      </view>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', flexGrow: 1, flexShrink: 1, height: '100%' }),
  header: new Style<View>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.profile.wallet.headerHeight, paddingBottom: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.lg, width: '100%' }),
  headerAction: new Style<View>({ alignItems: 'center', height: layout.profile.wallet.headerActionSize, justifyContent: 'center', width: layout.profile.wallet.headerActionSize }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, font: montserrat.extraBold(fontSize.section), textAlign: 'center' }),
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  content: new Style<View>({ flexDirection: 'column', paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.md, width: '100%' }),
  statusPanel: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', marginBottom: spacing.lg, padding: spacing.lg, width: '100%' }),
  orderStatus: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product), marginTop: spacing.xs }),
  pendingOrderStatus: new Style<Label>({ color: colors.interactivePending, font: montserrat.semiBold(fontSize.product), marginTop: spacing.xs }),
  cancelledOrderStatus: new Style<Label>({ color: colors.interactiveDanger, font: montserrat.semiBold(fontSize.product), marginTop: spacing.xs }),
  fulfilledOrderStatus: new Style<Label>({ color: colors.interactiveSuccess, font: montserrat.semiBold(fontSize.product), marginTop: spacing.xs }),
  orderNumber: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata), marginTop: spacing.sm }),
  orderDateLabel: new Style<Label>({ color: colors.textTertiary, font: montserrat.semiBold(fontSize.tiny), marginTop: spacing.md }),
  orderDate: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product), marginTop: spacing.xs }),
  statusNote: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginTop: spacing.sm }),
  trackOrderButtonWrap: new Style<View>({ marginTop: spacing.lg, width: '100%' }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product), marginBottom: spacing.sm, marginTop: spacing.md }),
  sectionPanel: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', padding: spacing.md, width: '100%' }),
  summaryFooter: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexShrink: 0, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.md, width: '100%' }),
  summaryPanel: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', padding: spacing.md, width: '100%' }),
  storeRow: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'row', padding: spacing.xs, width: '100%' }),
  storeAvatarFrame: new Style<View>({ borderRadius: radius.full, flexShrink: 0, height: layout.profile.accountDestination.storeAvatarSize, position: 'relative', width: layout.profile.accountDestination.storeAvatarSize }),
  storeAvatarFallback: new Style<View>({ height: '100%', width: '100%' }),
  storeAvatar: new Style<View>({ borderRadius: radius.full, height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }),
  storeCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, marginRight: spacing.sm, minWidth: 0 }),
  storeName: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata) }),
  storeUsername: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  itemRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.profile.accountDestination.detailItemPanelSize, width: '100%' }),
  itemColorPanel: new Style<View>({ borderRadius: radius.xs, flexShrink: 0, height: layout.profile.accountDestination.detailItemPanelSize, width: layout.profile.accountDestination.detailItemPanelSize }),
  itemCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  itemTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product) }),
  itemOption: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginTop: spacing.xs }),
  itemQuantity: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  itemPrice: new Style<Label>({ color: colors.textPrimary, flexShrink: 0, font: montserrat.semiBold(fontSize.metadata), marginLeft: spacing.sm, textAlign: 'right' }),
  amountRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, width: '100%' }),
  amountTotalRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, width: '100%' }),
  amountLabel: new Style<Label>({ color: colors.textSecondary, flexGrow: 1, font: montserrat.regular(fontSize.metadata), marginRight: spacing.md }),
  amountValue: new Style<Label>({ color: colors.textPrimary, flexShrink: 0, font: montserrat.semiBold(fontSize.metadata), textAlign: 'right' }),
  totalLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.product) }),
  totalValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.product), textAlign: 'right' }),
  detailEyebrow: new Style<Label>({ color: colors.textTertiary, font: montserrat.semiBold(fontSize.tiny) }),
  detailValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product), marginTop: spacing.xs }),
  timelinePanel: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', paddingBottom: spacing.md, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.md, width: '100%' }),
  timelineRow: new Style<View>({ flexDirection: 'row', minHeight: layout.profile.accountDestination.timelineRowHeight, width: '100%' }),
  timelineTrack: new Style<View>({ alignItems: 'center', flexDirection: 'column', marginRight: spacing.md, width: layout.profile.accountDestination.timelineTrackWidth }),
  timelineDot: new Style<View>({ borderRadius: radius.full, height: layout.profile.accountDestination.timelineDotSize, marginTop: spacing.xs, width: layout.profile.accountDestination.timelineDotSize }),
  timelineLine: new Style<View>({ flexGrow: 1, marginTop: spacing.xs, width: layout.profile.accountDestination.timelineLineWidth }),
  timelineCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, paddingBottom: spacing.md, minWidth: 0 }),
  timelineTitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata) }),
  timelineCurrentTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.metadata) }),
  timelineCancelledTitle: new Style<Label>({ color: colors.interactiveDanger, font: montserrat.extraBold(fontSize.metadata) }),
  timelinePendingTitle: new Style<Label>({ color: colors.interactivePending, font: montserrat.extraBold(fontSize.metadata) }),
  timelineDate: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  trackingScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1, width: '100%' }),
  trackingContent: new Style<View>({ flexDirection: 'column', paddingBottom: spacing.lg, width: '100%' }),
  trackingSummary: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'row', padding: spacing.md, width: '100%' }),
  trackingIcon: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 }),
  trackingSummaryCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  trackingDateGroup: new Style<View>({ flexDirection: 'column', width: '100%' }),
  trackingStatus: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata) }),
  pendingTrackingStatus: new Style<Label>({ color: colors.interactivePending, font: montserrat.semiBold(fontSize.metadata) }),
  fulfilledTrackingStatus: new Style<Label>({ color: colors.interactiveSuccess, font: montserrat.semiBold(fontSize.metadata) }),
  cancelledTrackingStatus: new Style<Label>({ color: colors.interactiveDanger, font: montserrat.semiBold(fontSize.metadata) }),
  trackingUpdatedAt: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  trackingOrderNumber: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  trackingUnavailable: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.sm, marginTop: spacing.md, padding: spacing.md, width: '100%' }),
  trackingUnavailableText: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata) }),
  trackingSectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product), marginBottom: spacing.sm, marginTop: spacing.lg }),
  trackingDeliveryInfo: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', marginTop: spacing.md, padding: spacing.md, width: '100%' }),
  demoNotice: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.md, textAlign: 'center' }),
};

function formatTrackingDate(isoDate: string): string {
  const date = formatFrenchLongDate(isoDate).replace(/^Le /, '');
  const year = isoDate.slice(0, 4);
  return date ? `${date} ${year}` : '';
}

function getOrderStatusLabel(order: ProfileOrderDemoItem): string {
  switch (order.status) {
    case 'payment-failed': return 'Annulée · échec du paiement';
    case 'processing': return 'En cours de préparation';
    case 'shipped': return 'Expédiée';
    case 'delivered': return 'Livrée';
  }
}
