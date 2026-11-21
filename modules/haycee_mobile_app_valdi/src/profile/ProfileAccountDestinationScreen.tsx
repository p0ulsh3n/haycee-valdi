import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Asset } from 'valdi_tsx/src/Asset';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { AddressPickerSheet } from '../cart/AddressPickerSheet';
import { DSButton, Hairline, TabChips } from '../design-system/index';
import type { TabChipItem } from '../design-system/index';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import { runNavigationAction } from '../design-system/utils/NavigationActionGate';
import { PROFILE_ORDER_DEMO_ITEMS } from './data/ProfileOrdersDemoData';
import type { ProfileOrderDemoItem } from './data/ProfileOrdersDemoData';
import { formatFrenchLongDate } from '../design-system/utils/date';
import { ProfileOrderDetailScreen } from './ProfileOrderDetailScreen';

export type ProfileAccountDestinationKind = 'orders' | 'live-support' | 'notifications' | 'payment' | 'shipping';

export interface ProfileAccountDestinationScreenViewModel {
  kind: ProfileAccountDestinationKind;
  selectedAddress?: string;
  onAddressChange?: (address: string) => void;
}

interface ProfileAccountDestinationScreenState {
  selectedOrderFilter: string;
  expandedFaqId?: string;
  selectedAddress?: string;
}

const ORDER_FILTERS: TabChipItem[] = [
  { id: 'all', label: 'Tout' },
  { id: 'processing', label: 'En cours' },
  { id: 'delivered', label: 'Livrées' },
];

const SUPPORT_FAQS = [
  { id: 'orders', title: 'Suivre une commande', message: 'Retrouvez son état et son suivi dans « Mes commandes » dès qu’une commande est confirmée.' },
  { id: 'delivery', title: 'Comprendre la livraison', message: 'Le mode et les frais de livraison sont affichés avant la validation de votre achat.' },
  { id: 'live', title: 'Achats pendant un Live', message: 'Les articles achetés au cours d’un même Live sont regroupés à la fin de la diffusion.' },
];

const PAGE_TITLES: Record<ProfileAccountDestinationKind, string> = {
  orders: 'Mes commandes',
  'live-support': 'Assistance Live',
  notifications: 'Notifications',
  payment: 'Paiement',
  shipping: 'Livraison',
};

/** Account destinations opened from Profile > Mon compte. */
@NavigationPage(module)
export class ProfileAccountDestinationScreen extends NavigationPageStatefulComponent<
  ProfileAccountDestinationScreenViewModel,
  ProfileAccountDestinationScreenState
> {
  state: ProfileAccountDestinationScreenState = { selectedOrderFilter: 'all' };
  private isClosing = false;

  onCreate(): void {
    this.state = {
      selectedOrderFilter: 'all',
      expandedFaqId: undefined,
      selectedAddress: this.viewModel.selectedAddress,
    };
  }

  private close = (): void => {
    if (this.isClosing) return;
    this.isClosing = true;
    this.navigationController.pop();
  };

  private handleAddressSaved = (address: string): void => {
    this.setState({ selectedAddress: address });
    this.viewModel.onAddressChange?.(address);
  };

  private openAddressPicker = (): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController.present(
        AddressPickerSheet,
        { selectedAddress: this.state.selectedAddress, onSave: this.handleAddressSaved },
        {},
        { animated: true, wrapInPlatformNavigationController: false, pageBackgroundColor: colors.backgroundPrimary },
      );
    });
  };

  private renderPageIntro(icon: Asset, title: string, message: string): void {
    <view style={styles.introCard}>
      <view style={styles.introIcon}>
        <image src={icon} tint={colors.interactivePrimary} width={layout.profile.accountDestination.introSvgSize} height={layout.profile.accountDestination.introSvgSize} objectFit="contain" />
      </view>
      <label value={title} style={styles.introTitle} numberOfLines={0} />
      <label value={message} style={styles.introMessage} numberOfLines={0} />
    </view>;
  }

  private renderOrders(): void {
    const visibleOrders = PROFILE_ORDER_DEMO_ITEMS.filter(order => {
      if (this.state.selectedOrderFilter === 'processing') {
        return order.status === 'processing' || order.status === 'shipped';
      }
      if (this.state.selectedOrderFilter === 'delivered') {
        return order.status === 'delivered';
      }
      return true;
    });

    <view style={styles.pageContent}>
      <TabChips
        tabs={ORDER_FILTERS}
        selectedId={this.state.selectedOrderFilter}
        onSelectionChange={id => this.setState({ selectedOrderFilter: id })}
        horizontalPadding={0}
        textCase="none"
      />
      <view style={styles.orderList}>
        {visibleOrders.map(order => this.renderOrder(order))}
      </view>
      <view style={styles.infoRow}>
        <image src={navigationIcons.informationCircle} tint={colors.iconDefault} width={layout.profile.accountDestination.infoSvgSize} height={layout.profile.accountDestination.infoSvgSize} objectFit="contain" />
        <label value="Exemples d’affichage : les commandes du Live seront regroupées à la fin de la diffusion." style={styles.infoText} numberOfLines={0} />
      </view>
    </view>;
  }

  private renderOrder(order: ProfileOrderDemoItem): void {
    const failedPayment = order.status === 'payment-failed';
    const statusColor = failedPayment
      ? colors.backgroundTertiary
      : order.status === 'delivered'
        ? colors.livePanelSage
        : order.status === 'shipped'
          ? colors.livePanelLavender
          : colors.livePanelBlue;
    const statusTextColor = failedPayment ? colors.textInverted : colors.textPrimary;

    const formattedDate = formatFrenchLongDate(order.dateIso);
    <view
      key={order.id}
      style={styles.orderRow}
      onTap={createReusableCallback(() => this.openOrder(order))}
      accessibilityCategory="button"
      accessibilityLabel={`${order.productName}, commande ${order.orderNumber}, ${order.statusLabel}, ${formattedDate}. Afficher le détail.`}
    >
      <view style={styles.orderProductPanel.extend({ backgroundColor: order.panelColor })} />
      <view style={styles.orderCopy}>
        <label value={order.productName} style={styles.orderProductTitle} numberOfLines={2} />
        <label value={`Commande ${order.orderNumber}`} style={styles.orderNumber} numberOfLines={1} />
        <view style={styles.orderStatus.extend({ backgroundColor: statusColor })}>
          <label value={order.statusLabel} style={styles.orderStatusLabel.extend({ color: statusTextColor })} numberOfLines={2} />
        </view>
        <label value={formattedDate} style={styles.orderDate} numberOfLines={1} />
      </view>
    </view>;
  }

  private openOrder(order: ProfileOrderDemoItem): void {
    runNavigationAction(this.navigationController, () => {
      this.navigationController.push(
        ProfileOrderDetailScreen,
        { order },
        {},
        { animated: true, pageBackgroundColor: colors.backgroundPrimary },
      );
    });
  }

  private renderSupport(): void {
    <view style={styles.pageContent}>
      {this.renderPageIntro(
        navigationIcons.customerSupport,
        'Comment pouvons-nous vous aider ?',
        'Les réponses rapides aux questions fréquentes sur vos achats et les Lives.',
      )}
      <label value="Questions fréquentes" style={styles.sectionTitle} numberOfLines={1} />
      <view style={styles.faqGroup}>
        {SUPPORT_FAQS.map((faq, index) => {
          const expanded = this.state.expandedFaqId === faq.id;
          return (
            <view key={faq.id}>
              <view
                style={styles.faqRow}
                onTap={createReusableCallback(() => this.setState({ expandedFaqId: expanded ? undefined : faq.id }))}
                accessibilityCategory="button"
                accessibilityLabel={`${faq.title}${expanded ? ', réduire' : ', afficher la réponse'}`}
              >
                <label value={faq.title} style={styles.faqTitle} numberOfLines={0} />
                <image src={expanded ? navigationIcons.arrowDown01Round : navigationIcons.arrowRight01Round} tint={colors.iconDefault} width={layout.profile.accountDestination.optionSvgSize} height={layout.profile.accountDestination.optionSvgSize} objectFit="contain" />
              </view>
              {expanded ? (
                <view style={styles.faqAnswer}>
                  <label value={faq.message} style={styles.faqMessage} numberOfLines={0} />
                </view>
              ) : null}
              {index < SUPPORT_FAQS.length - 1 ? <Hairline color={colors.borderDefault} /> : null}
            </view>
          );
        })}
      </view>
      <view style={styles.infoRow}>
        <image src={navigationIcons.informationCircle} tint={colors.iconDefault} width={layout.profile.accountDestination.infoSvgSize} height={layout.profile.accountDestination.infoSvgSize} objectFit="contain" />
        <label value="Le contact direct avec l’équipe sera proposé ici dès que le service d’assistance sera connecté." style={styles.infoText} numberOfLines={0} />
      </view>
    </view>;
  }

  private renderNotifications(): void {
    <view style={styles.pageContent}>
      {this.renderPageIntro(
        navigationIcons.notification01,
        'Vous êtes à jour',
        'Les nouvelles concernant vos commandes, vos Lives et votre compte apparaîtront ici.',
      )}
      <view style={styles.infoRow}>
        <image src={navigationIcons.informationCircle} tint={colors.iconDefault} width={layout.profile.accountDestination.infoSvgSize} height={layout.profile.accountDestination.infoSvgSize} objectFit="contain" />
        <label value="Vos notifications seront conservées dans cet espace pour que vous puissiez les retrouver plus tard." style={styles.infoText} numberOfLines={0} />
      </view>
    </view>;
  }

  private renderPayment(): void {
    <view style={styles.pageContent}>
      {this.renderPageIntro(
        navigationIcons.identityCard,
        'Vos moyens de paiement',
        'Les options de paiement disponibles vous seront présentées au moment de confirmer une commande.',
      )}
      <label value="Options disponibles à la commande" style={styles.sectionTitle} numberOfLines={0} />
      <view style={styles.paymentOption}>
        <view style={styles.optionIcon}>
          <image src={navigationIcons.identityCard} tint={colors.iconDefault} width={layout.profile.accountDestination.optionSvgSize} height={layout.profile.accountDestination.optionSvgSize} objectFit="contain" />
        </view>
        <layout style={styles.optionCopy}>
          <label value="Carte bancaire" style={styles.optionTitle} numberOfLines={1} />
          <label value="Si disponible pour votre commande" style={styles.optionDetail} numberOfLines={0} />
        </layout>
      </view>
      <view style={styles.paymentOption}>
        <view style={styles.optionIcon}>
          <image src={navigationIcons.money03} tint={colors.iconDefault} width={layout.profile.accountDestination.optionSvgSize} height={layout.profile.accountDestination.optionSvgSize} objectFit="contain" />
        </view>
        <layout style={styles.optionCopy}>
          <label value="Paiement mobile" style={styles.optionTitle} numberOfLines={1} />
          <label value="Les moyens compatibles seront indiqués au paiement" style={styles.optionDetail} numberOfLines={0} />
        </layout>
      </view>
      <view style={styles.infoRow}>
        <image src={navigationIcons.circleLock01} tint={colors.iconDefault} width={layout.profile.accountDestination.infoSvgSize} height={layout.profile.accountDestination.infoSvgSize} objectFit="contain" />
        <label value="Aucune carte ou coordonnée bancaire n’est enregistrée dans cette version de l’application." style={styles.infoText} numberOfLines={0} />
      </view>
    </view>;
  }

  private renderShipping(): void {
    const address = this.state.selectedAddress;
    <view style={styles.pageContent}>
      {this.renderPageIntro(
        navigationIcons.deliveryTruck02,
        'Vos adresses de livraison',
        'Choisissez un point relais pour retrouver plus facilement vos options de livraison.',
      )}
      {address ? (
        <view style={styles.savedAddress}>
          <view style={styles.optionIcon}>
            <image src={navigationIcons.location04} tint={colors.interactivePrimary} width={layout.profile.accountDestination.optionSvgSize} height={layout.profile.accountDestination.optionSvgSize} objectFit="contain" />
          </view>
          <layout style={styles.optionCopy}>
            <label value="Point relais sélectionné" style={styles.addressEyebrow} numberOfLines={1} />
            <label value={address} style={styles.optionTitle} numberOfLines={3} />
          </layout>
        </view>
      ) : (
        <view style={styles.emptyAddress}>
          <image src={navigationIcons.location04} tint={colors.iconDefault} width={layout.profile.accountDestination.introSvgSize} height={layout.profile.accountDestination.introSvgSize} objectFit="contain" />
          <label value="Aucun point relais enregistré" style={styles.emptyAddressTitle} numberOfLines={2} />
          <label value="Ajoutez-en un pour le retrouver lors de vos prochains achats." style={styles.emptyAddressMessage} numberOfLines={0} />
        </view>
      )}
      <DSButton
        title={address ? 'Modifier le point relais' : 'Ajouter un point relais'}
        variant="cta"
        size="fullWidth"
        textCase="none"
        icon={address ? navigationIcons.edit02 : navigationIcons.add01}
        iconSize={layout.profile.accountDestination.optionSvgSize}
        onTap={this.openAddressPicker}
        accessibilityLabel={address ? 'Modifier le point relais sélectionné' : 'Ajouter un point relais'}
      />
      <view style={styles.infoRow}>
        <image src={navigationIcons.informationCircle} tint={colors.iconDefault} width={layout.profile.accountDestination.infoSvgSize} height={layout.profile.accountDestination.infoSvgSize} objectFit="contain" />
        <label value="La disponibilité et les frais peuvent varier selon le point relais choisi et les articles de votre panier." style={styles.infoText} numberOfLines={0} />
      </view>
    </view>;
  }

  private renderContent(): void {
    switch (this.viewModel.kind) {
      case 'orders': return this.renderOrders();
      case 'live-support': return this.renderSupport();
      case 'notifications': return this.renderNotifications();
      case 'payment': return this.renderPayment();
      case 'shipping': return this.renderShipping();
    }
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    <view style={styles.root}>
      <view style={styles.header.extend({ paddingTop: topInset + spacing.sm })}>
        <view style={styles.headerAction} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
        </view>
        <label value={PAGE_TITLES[this.viewModel.kind]} style={styles.headerTitle} numberOfLines={1} accessibilityCategory="header" />
        <view style={styles.headerAction} />
      </view>
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <view style={styles.body.extend({ paddingBottom: Math.max(bottomInset, spacing.xxxl) })}>
          {this.renderContent()}
        </view>
      </scroll>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', flexGrow: 1, flexShrink: 1, height: '100%' }),
  header: new Style<View>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.profile.wallet.headerHeight, paddingBottom: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.lg, width: '100%' }),
  headerAction: new Style<View>({ alignItems: 'center', height: layout.profile.wallet.headerActionSize, justifyContent: 'center', width: layout.profile.wallet.headerActionSize }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, font: montserrat.extraBold(fontSize.section), textAlign: 'center' }),
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  body: new Style<View>({ flexDirection: 'column', paddingTop: spacing.md, width: '100%' }),
  pageContent: new Style<View>({ flexDirection: 'column', paddingLeft: spacing.lg, paddingRight: spacing.lg, width: '100%' }),
  introCard: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.lg, flexDirection: 'column', marginBottom: spacing.xl, paddingBottom: spacing.xl, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.xl, width: '100%' }),
  introIcon: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.full, height: layout.profile.accountDestination.introIconSize, justifyContent: 'center', marginBottom: spacing.md, width: layout.profile.accountDestination.introIconSize }),
  introTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section), textAlign: 'center' }),
  introMessage: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.product), marginTop: spacing.sm, textAlign: 'center' }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.large), marginBottom: spacing.md, marginTop: spacing.sm }),
  infoRow: new Style<View>({ alignItems: 'flex-start', flexDirection: 'row', marginTop: spacing.lg, paddingLeft: spacing.xs, paddingRight: spacing.xs, width: '100%' }),
  infoText: new Style<Label>({ color: colors.textTertiary, flexGrow: 1, flexShrink: 1, font: montserrat.regular(fontSize.metadata), marginLeft: spacing.sm }),
  faqGroup: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', paddingLeft: spacing.md, paddingRight: spacing.md, width: '100%' }),
  faqRow: new Style<View>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.profile.accountDestination.faqRowMinHeight, paddingBottom: spacing.md, paddingTop: spacing.md, width: '100%' }),
  faqTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.semiBold(fontSize.product), marginRight: spacing.md }),
  faqAnswer: new Style<View>({ paddingBottom: spacing.md, paddingRight: spacing.lg }),
  faqMessage: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata) }),
  orderList: new Style<View>({ flexDirection: 'column', marginTop: spacing.xl, width: '100%' }),
  orderRow: new Style<View>({ alignItems: 'stretch', flexDirection: 'row', marginBottom: spacing.xl, width: '100%' }),
  orderProductPanel: new Style<View>({ borderRadius: radius.xs, flexShrink: 0, height: layout.profile.accountDestination.orderPanelHeight, width: layout.profile.accountDestination.orderPanelWidth }),
  orderCopy: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  orderProductTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product) }),
  orderNumber: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata), marginTop: spacing.xs }),
  orderStatus: new Style<View>({ alignSelf: 'flex-start', borderRadius: radius.xs, flexShrink: 1, justifyContent: 'center', marginTop: spacing.xl, maxWidth: '100%', paddingBottom: spacing.xs, paddingLeft: spacing.sm, paddingRight: spacing.sm, paddingTop: spacing.xs }),
  orderStatusLabel: new Style<Label>({ font: montserrat.semiBold(fontSize.tiny) }),
  orderDate: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product), marginTop: spacing.sm }),
  paymentOption: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'row', marginBottom: spacing.sm, padding: spacing.md, width: '100%' }),
  optionIcon: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.sm, height: layout.profile.accountDestination.optionIconSize, justifyContent: 'center', width: layout.profile.accountDestination.optionIconSize }),
  optionCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  optionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product) }),
  optionDetail: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginTop: spacing.xs }),
  savedAddress: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'row', marginBottom: spacing.md, padding: spacing.md, width: '100%' }),
  addressEyebrow: new Style<Label>({ color: colors.interactivePrimary, font: montserrat.semiBold(fontSize.metadata), marginBottom: spacing.xs }),
  emptyAddress: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', marginBottom: spacing.md, padding: spacing.xl, width: '100%' }),
  emptyAddressTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product), marginTop: spacing.md, textAlign: 'center' }),
  emptyAddressMessage: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginTop: spacing.xs, textAlign: 'center' }),
};
