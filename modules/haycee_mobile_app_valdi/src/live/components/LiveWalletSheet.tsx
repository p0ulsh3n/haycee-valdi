import { Device } from 'valdi_core/src/Device';
import { EditTextUtils } from 'valdi_core/src/utils/EditTextUtils';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { EditTextEvent, Label, Layout, ScrollView, TextField, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { BottomSheetContentPager, bottomSheetSurfaceStyle } from '../../design-system/components/BottomSheet';
import { Hairline } from '../../design-system/components/Hairline';
import { TransientFeedback } from '../../design-system/components/SnackBar';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { formatFcfa, formatIntegerWithDotSeparator, normalizeWholeAmountInput } from '../../design-system/utils/money';
import {
  LIVE_WALLET_BALANCE,
  LIVE_WALLET_ORDERS,
  LIVE_WALLET_TRANSACTIONS,
  type LiveWalletOrder,
  type LiveWalletTransaction,
} from '../data/LiveWalletData';

type LiveWalletTab = 'wallet' | 'history';

interface LiveWalletSheetState {
  selectedTab: LiveWalletTab;
  activePage: number;
  topUpAmount: string;
  selectedPaymentMethod: string;
  topUpError?: string;
}

const TOP_UP_AMOUNTS = [5000, 10000, 25000, 50000];
const MAX_TOP_UP_AMOUNT = 200000;
const PAYMENT_METHODS = [
  { id: 'wave', label: 'Wave' },
  { id: 'orange-money', label: 'Orange Money' },
  { id: 'mtn-momo', label: 'MTN MoMo' },
  { id: 'moov-money', label: 'Moov Money' },
];

/** Live wallet sheet with account activity and the complete local order history. */
@NavigationPage(module)
export class LiveWalletSheet extends NavigationPageStatefulComponent<{}, LiveWalletSheetState> {
  state: LiveWalletSheetState = { selectedTab: 'wallet', activePage: 0, topUpAmount: `${TOP_UP_AMOUNTS[1]}`, selectedPaymentMethod: '' };
  private pendingTopUpError?: string;

  private close = (): void => this.navigationController.dismiss(true);

  private selectTab = (selectedTab: LiveWalletTab): void => {
    if (this.state.selectedTab === selectedTab) return;
    this.setState({ selectedTab, activePage: selectedTab === 'wallet' ? 0 : 1 });
  };

  private handlePagerIndexChange = (activePage: number): void => {
    this.setState({
      activePage,
      selectedTab: activePage === 1 ? 'history' : 'wallet',
    });
  };

  private openAddFunds = (): void => {
    this.setState({ activePage: 2 });
  };

  private returnToWallet = (): void => {
    this.setState({ activePage: 0, selectedTab: 'wallet' });
  };

  private handleTopUpAmountWillChange = (event: EditTextEvent): EditTextEvent => {
    const normalized = normalizeWholeAmountInput(event.text, MAX_TOP_UP_AMOUNT);
    if (normalized.isNegative) {
      this.pendingTopUpError = 'Le montant ne peut pas être négatif.';
      this.setState({ topUpError: this.pendingTopUpError });
      return EditTextUtils.makeUpdatedEvent(event, formatIntegerWithDotSeparator(this.state.topUpAmount));
    }

    if (normalized.exceedsMaximum) {
      this.pendingTopUpError = `Le montant maximum est de ${formatFcfa(MAX_TOP_UP_AMOUNT)}.`;
    } else {
      this.pendingTopUpError = undefined;
    }
    this.setState({ topUpError: this.pendingTopUpError });

    return EditTextUtils.makeUpdatedEvent(event, normalized.formatted);
  };

  private handleTopUpAmountChange = (event: EditTextEvent): void => {
    const normalized = normalizeWholeAmountInput(event.text, MAX_TOP_UP_AMOUNT);
    const pendingError = this.pendingTopUpError;
    this.pendingTopUpError = undefined;
    if (normalized.isNegative) {
      this.setState({ topUpError: pendingError ?? 'Le montant ne peut pas être négatif.' });
      return;
    }

    this.setState({ topUpAmount: normalized.digits, topUpError: pendingError });
  };

  private selectPaymentMethod = (selectedPaymentMethod: string): void => {
    this.setState({ selectedPaymentMethod });
  };

  private continueTopUp = (): void => {
    const amount = Number(this.state.topUpAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.setState({ topUpError: 'Saisissez un montant supérieur à 0 FCFA.' });
      return;
    }
    if (amount > MAX_TOP_UP_AMOUNT) {
      this.setState({ topUpError: `Le montant maximum est de ${formatFcfa(MAX_TOP_UP_AMOUNT)}.` });
      return;
    }
    if (!this.state.selectedPaymentMethod) {
      TransientFeedback.show({ message: 'Choisissez un moyen de paiement.' });
      return;
    }
    TransientFeedback.show({ message: 'Le rechargement sera disponible avec le service de paiement.' });
  };

  private renderWalletPage(): void {
    <scroll style={styles.pageScroll} {...noBounceScrollAttributes} showsVerticalScrollIndicator={false}>
      <layout style={styles.walletContent}>
        <view style={styles.balanceHero}>
          <label value="SOLDE DISPONIBLE" style={styles.balanceCaption} numberOfLines={1} />
          <label value={formatFcfa(LIVE_WALLET_BALANCE)} style={styles.balanceValue} numberOfLines={1} />
        </view>
        <layout style={styles.walletActions}>
          <view style={styles.addFundsButton} onTap={this.openAddFunds} accessibilityCategory="button" accessibilityLabel="Ajouter des fonds au portefeuille">
            <image src={navigationIcons.moneyAdd02} tint={colors.iconBrand} width={19} height={19} objectFit="contain" />
            <label value="Ajouter des fonds" style={styles.addFundsLabel} numberOfLines={1} />
          </view>
          <view style={styles.openHistoryButton} onTap={() => this.selectTab('history')} accessibilityCategory="button" accessibilityLabel="Voir l’historique des transactions et commandes">
            <image src={navigationIcons.moneyExchange02} tint={colors.textSecondary} width={19} height={19} objectFit="contain" />
            <label value="Transactions" style={styles.openHistoryLabel} numberOfLines={1} />
          </view>
        </layout>
        <layout style={styles.sectionHeading}>
          <label value="Transactions récentes" style={styles.sectionTitle} numberOfLines={1} />
        </layout>
        <layout style={styles.historyList}>
          {LIVE_WALLET_TRANSACTIONS.slice(0, 3).map(transaction => this.renderTransaction(transaction))}
        </layout>
      </layout>
    </scroll>;
  }

  private renderHistoryPage(): void {
    <scroll style={styles.pageScroll} {...noBounceScrollAttributes} showsVerticalScrollIndicator={false}>
      <layout style={styles.ordersContent}>
        <layout style={styles.sectionHeading}>
          <label value="Transactions" style={styles.sectionTitle} numberOfLines={1} />
          <label value={`${LIVE_WALLET_TRANSACTIONS.length}`} style={styles.sectionCount} numberOfLines={1} />
        </layout>
        <layout style={styles.historyList}>
          {LIVE_WALLET_TRANSACTIONS.map(transaction => this.renderTransaction(transaction))}
        </layout>
        <layout style={styles.sectionHeading}>
          <label value="Historique des commandes" style={styles.sectionTitle} numberOfLines={1} />
          <label value={`${LIVE_WALLET_ORDERS.length}`} style={styles.sectionCount} numberOfLines={1} />
        </layout>
        <layout style={styles.ordersList}>
          {LIVE_WALLET_ORDERS.map(order => this.renderOrder(order))}
        </layout>
      </layout>
    </scroll>;
  }

  private renderTopUpPage(): void {
    const topUpAmount = Number(this.state.topUpAmount);
    const canContinueTopUp =
      Number.isFinite(topUpAmount) &&
      topUpAmount > 0 &&
      topUpAmount <= MAX_TOP_UP_AMOUNT &&
      this.state.selectedPaymentMethod.length > 0 &&
      !this.state.topUpError;

    <layout style={styles.topUpPage}>
      <layout style={styles.topUpContent}>
        <view style={styles.topUpBalanceCard}>
          <label value="SOLDE ACTUEL" style={styles.balanceCaption} numberOfLines={1} />
          <label value={formatFcfa(LIVE_WALLET_BALANCE)} style={styles.topUpBalanceValue} numberOfLines={1} />
        </view>
        <label value="Choisir un montant" style={styles.topUpSectionTitle} numberOfLines={1} />
        <view style={styles.amountInputContainer}>
          <textfield
            style={styles.amountInput}
            value={formatIntegerWithDotSeparator(this.state.topUpAmount)}
            placeholder="Montant"
            placeholderColor={colors.textTertiary}
            contentType="number"
            textDirection="ltr"
            autocorrection="none"
            autocapitalization="none"
            onWillChange={this.handleTopUpAmountWillChange}
            onChange={this.handleTopUpAmountChange}
          />
          <label value="FCFA" style={styles.amountInputCurrency} numberOfLines={1} />
        </view>
        {this.state.topUpError ? (
          <label value={this.state.topUpError} style={styles.topUpError} numberOfLines={2} />
        ) : null}
        <layout style={styles.amountGrid}>
          {[0, 1].map(row => (
            <layout key={`amount-row-${row}`} style={styles.amountRow}>
              {TOP_UP_AMOUNTS.slice(row * 2, row * 2 + 2).map(amount => (
                <view
                  key={`amount-${amount}`}
                  style={this.state.topUpAmount === `${amount}` ? styles.amountOptionSelected : styles.amountOption}
                  onTap={() => this.setState({ topUpAmount: `${amount}`, topUpError: undefined })}
                  accessibilityCategory="button"
                  accessibilityLabel={`Choisir ${formatFcfa(amount)}`}
                >
                  <label value={formatFcfa(amount)} style={this.state.topUpAmount === `${amount}` ? styles.amountLabelSelected : styles.amountLabel} numberOfLines={1} />
                </view>
              ))}
            </layout>
          ))}
        </layout>
        <label value="Moyen de paiement" style={styles.topUpSectionTitle} numberOfLines={1} />
        <scroll style={styles.paymentMethodsCarousel} horizontal={true} {...noBounceScrollAttributes} showsHorizontalScrollIndicator={false}>
          {PAYMENT_METHODS.map(method => (
            <view
              key={method.id}
              style={this.state.selectedPaymentMethod === method.id ? styles.paymentMethodSelected : styles.paymentMethod}
              onTap={() => this.selectPaymentMethod(method.id)}
              accessibilityCategory="button"
              accessibilityLabel={`Choisir ${method.label}`}
            >
              <view style={styles.paymentMethodIcon}>
                <image src={navigationIcons.money03} tint={this.state.selectedPaymentMethod === method.id ? colors.iconBrand : colors.textSecondary} width={20} height={20} objectFit="contain" />
              </view>
              <label value={method.label} style={this.state.selectedPaymentMethod === method.id ? styles.paymentMethodLabelSelected : styles.paymentMethodLabel} numberOfLines={2} />
            </view>
          ))}
        </scroll>
      </layout>
      <view style={styles.topUpFooter}>
        <view
          style={canContinueTopUp ? styles.continueButton : styles.continueButtonDisabled}
          onTapDisabled={!canContinueTopUp}
          onTap={this.continueTopUp}
          accessibilityCategory="button"
          accessibilityLabel="Continuer le rechargement"
        >
          <label value="Continuer" style={canContinueTopUp ? styles.continueButtonLabel : styles.continueButtonLabelDisabled} numberOfLines={1} />
        </view>
      </view>
    </layout>;
  }

  private renderTransaction(transaction: LiveWalletTransaction): void {
    const isCredit = transaction.direction === 'credit';
    <layout key={transaction.id} style={styles.historyRowContainer}>
      <layout style={styles.historyRow}>
        <view style={styles.transactionIcon}>
          <image src={navigationIcons.money03} tint={isCredit ? colors.textSuccess : colors.textPrimary} width={18} height={18} objectFit="contain" />
        </view>
        <layout style={styles.historyCopy}>
          <label value={transaction.title} style={styles.rowTitle} numberOfLines={1} />
          <label value={transaction.subtitle} style={styles.rowSubtitle} numberOfLines={1} />
        </layout>
        <label
          value={`${isCredit ? '+' : '−'} ${formatFcfa(transaction.amount)}`}
          style={isCredit ? styles.creditAmount : styles.debitAmount}
          numberOfLines={1}
        />
      </layout>
      <Hairline color={colors.borderDefault} />
    </layout>;
  }

  private renderOrder(order: LiveWalletOrder): void {
    <view key={order.id} style={styles.orderCard}>
      <layout style={styles.orderRow}>
        <view style={styles.orderIcon}>
          <image src={navigationIcons.package} tint={colors.textPrimary} width={19} height={19} objectFit="contain" />
        </view>
        <layout style={styles.historyCopy}>
          <label value={`${order.items.length} article${order.items.length === 1 ? '' : 's'}`} style={styles.orderTitle} numberOfLines={1} />
          <label value={order.storeName} style={styles.orderStore} numberOfLines={1} />
          <label value={order.date} style={styles.orderDate} numberOfLines={1} />
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

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const selectedTab = this.state.selectedTab;
    const isAddingFunds = this.state.activePage === 2;
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
          {isAddingFunds ? (
            <layout style={styles.headerCopyWithBack}>
              <view style={styles.backButton} onTap={this.returnToWallet} accessibilityCategory="button" accessibilityLabel="Retour au portefeuille">
                <image src={navigationIcons.arrowLeft01Round} tint={colors.textPrimary} width={20} height={20} objectFit="contain" />
              </view>
              <layout style={styles.headerCopy}>
                <label value="Ajouter des fonds" style={styles.sheetTitle} numberOfLines={1} />
                <label value="Choisissez le montant à ajouter" style={styles.sheetSubtitle} numberOfLines={1} />
              </layout>
            </layout>
          ) : (
            <layout style={styles.headerCopy}>
              <label value="Mon portefeuille" style={styles.sheetTitle} numberOfLines={1} />
              <label value="Solde et activité de votre compte" style={styles.sheetSubtitle} numberOfLines={1} />
            </layout>
          )}
          <view style={styles.closeButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Fermer le portefeuille">
            <image src={navigationIcons.cancel01} tint={colors.textPrimary} width={19} height={19} objectFit="contain" />
          </view>
        </layout>

        {!isAddingFunds ? (
          <view style={styles.tabsSurface}>
            <layout style={styles.tabs}>
              <view
                style={selectedTab === 'wallet' ? styles.tabActive : styles.tab}
                onTap={() => this.selectTab('wallet')}
                accessibilityCategory="button"
                accessibilityLabel="Afficher le solde et l’activité du portefeuille"
              >
                <label value="Portefeuille" style={selectedTab === 'wallet' ? styles.tabLabelActive : styles.tabLabel} numberOfLines={1} />
              </view>
              <view
                style={selectedTab === 'history' ? styles.tabActive : styles.tab}
                onTap={() => this.selectTab('history')}
                accessibilityCategory="button"
                accessibilityLabel="Afficher les transactions et l’historique des commandes"
              >
                <label value="Historique" style={selectedTab === 'history' ? styles.tabLabelActive : styles.tabLabel} numberOfLines={1} />
              </view>
            </layout>
          </view>
        ) : null}

        <BottomSheetContentPager
          activeIndex={this.state.activePage}
          onIndexChange={this.handlePagerIndexChange}
          pages={[
            { id: 'wallet', render: () => this.renderWalletPage() },
            { id: 'history', render: () => this.renderHistoryPage() },
            { id: 'add-funds', render: () => this.renderTopUpPage() },
          ]}
        />
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.md }),
  headerCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  headerCopyWithBack: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexShrink: 1 }),
  backButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexShrink: 0, height: 38, justifyContent: 'center', marginRight: spacing.md, width: 38 }),
  sheetTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section) }),
  sheetSubtitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginTop: spacing.xs }),
  closeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexShrink: 0, height: 38, justifyContent: 'center', marginLeft: spacing.md, width: 38 }),
  tabsSurface: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexDirection: 'column', height: layout.live.viewer.wallet.tabHeight, marginBottom: spacing.lg, padding: 3 }),
  tabs: new Style<Layout>({ flexDirection: 'row', flexGrow: 1, flexShrink: 1 }),
  tab: new Style<View>({ alignItems: 'center', borderRadius: radius.full, flexGrow: 1, flexShrink: 1, height: layout.live.viewer.wallet.tabHeight - 6, justifyContent: 'center' }),
  tabActive: new Style<View>({ alignItems: 'center', backgroundColor: colors.textPrimary, borderRadius: radius.full, flexGrow: 1, flexShrink: 1, height: layout.live.viewer.wallet.tabHeight - 6, justifyContent: 'center' }),
  tabLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata) }),
  tabLabelActive: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.metadata) }),
  pageScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1, width: '100%' }),
  walletContent: new Style<Layout>({ alignItems: 'center', flexDirection: 'column', paddingBottom: spacing.xl, paddingTop: spacing.md }),
  balanceHero: new Style<View>({ alignItems: 'center', flexDirection: 'column', marginBottom: spacing.lg, marginTop: spacing.sm, width: '100%' }),
  balanceCaption: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata) }),
  balanceValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.black(fontSize.displayHuge), marginTop: spacing.sm, textAlign: 'center' }),
  walletActions: new Style<Layout>({ flexDirection: 'row', marginBottom: spacing.lg, width: '100%' }),
  addFundsButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundBrand, borderRadius: radius.full, flexDirection: 'column', flexGrow: 1, flexShrink: 1, height: 60, justifyContent: 'center', marginRight: spacing.xs, paddingLeft: spacing.sm, paddingRight: spacing.sm }),
  addFundsLabel: new Style<Label>({ color: colors.textBrand, font: montserrat.semiBold(fontSize.metadata), marginTop: spacing.xs, textAlign: 'center' }),
  openHistoryButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexDirection: 'column', flexGrow: 1, flexShrink: 1, height: 60, justifyContent: 'center', marginLeft: spacing.xs, paddingLeft: spacing.sm, paddingRight: spacing.sm }),
  openHistoryLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata), marginTop: spacing.xs, textAlign: 'center' }),
  topUpPage: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, width: '100%' }),
  topUpContent: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, paddingBottom: spacing.md, paddingTop: spacing.md }),
  topUpBalanceCard: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.lg, flexDirection: 'column', marginBottom: spacing.xl, paddingBottom: spacing.lg, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.lg, width: '100%' }),
  topUpBalanceValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.displayLarge), marginTop: spacing.xs, textAlign: 'center' }),
  topUpSectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.large), marginBottom: spacing.md }),
  amountInputContainer: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'row', height: 58, marginBottom: spacing.md, paddingLeft: spacing.md, paddingRight: spacing.md, width: '100%' }),
  amountInputCurrency: new Style<Label>({ color: colors.textSecondary, flexShrink: 0, font: montserrat.semiBold(fontSize.body), marginLeft: spacing.sm }),
  amountInput: new Style<TextField>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.extraBold(fontSize.display), height: 58, textAlign: 'left' }),
  topUpError: new Style<Label>({ color: colors.textDanger, font: montserrat.semiBold(fontSize.metadata), marginBottom: spacing.md, marginTop: spacing.xs }),
  amountGrid: new Style<Layout>({ flexDirection: 'column', marginBottom: spacing.md }),
  amountRow: new Style<Layout>({ flexDirection: 'row', marginBottom: spacing.sm }),
  amountOption: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexGrow: 1, flexShrink: 1, height: 52, justifyContent: 'center', marginRight: spacing.xs }),
  amountOptionSelected: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundBrand, borderRadius: radius.md, flexGrow: 1, flexShrink: 1, height: 52, justifyContent: 'center', marginRight: spacing.xs }),
  amountLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body) }),
  amountLabelSelected: new Style<Label>({ color: colors.textBrand, font: montserrat.extraBold(fontSize.body) }),
  paymentMethodsCarousel: new Style<ScrollView>({ flexGrow: 0, flexShrink: 0, height: 106, marginBottom: spacing.md, width: '100%' }),
  paymentMethod: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', height: 94, justifyContent: 'center', marginRight: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.md, width: 132 }),
  paymentMethodSelected: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundBrand, borderRadius: radius.md, flexDirection: 'column', height: 94, justifyContent: 'center', marginRight: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.md, width: 132 }),
  paymentMethodIcon: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.full, height: 36, justifyContent: 'center', marginBottom: spacing.xs, width: 36 }),
  paymentMethodLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata), textAlign: 'center' }),
  paymentMethodLabelSelected: new Style<Label>({ color: colors.textBrand, font: montserrat.extraBold(fontSize.metadata), textAlign: 'center' }),
  topUpFooter: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexShrink: 0, paddingBottom: spacing.md, paddingTop: spacing.md, width: '100%' }),
  continueButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.interactivePrimary, borderRadius: radius.full, height: 52, justifyContent: 'center', width: '100%' }),
  continueButtonDisabled: new Style<View>({ alignItems: 'center', backgroundColor: colors.interactiveDisabled, borderRadius: radius.full, height: 52, justifyContent: 'center', width: '100%' }),
  continueButtonLabel: new Style<Label>({ color: colors.textBrand, font: montserrat.extraBold(fontSize.body) }),
  continueButtonLabelDisabled: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.body) }),
  sectionHeading: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, marginTop: spacing.xs }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.large) }),
  sectionCount: new Style<Label>({ color: colors.textTertiary, font: montserrat.semiBold(fontSize.tiny) }),
  historyList: new Style<Layout>({ flexDirection: 'column' }),
  historyRowContainer: new Style<Layout>({ flexDirection: 'column' }),
  historyRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minHeight: 68, paddingBottom: spacing.sm, paddingTop: spacing.sm }),
  transactionIcon: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexShrink: 0, height: 40, justifyContent: 'center', width: 40 }),
  historyCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  rowTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata) }),
  rowSubtitle: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  creditAmount: new Style<Label>({ color: colors.textSuccess, font: montserrat.extraBold(fontSize.tiny), marginLeft: spacing.xs }),
  debitAmount: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.tiny), marginLeft: spacing.xs }),
  ordersContent: new Style<Layout>({ flexDirection: 'column', paddingBottom: spacing.sm }),
  ordersList: new Style<Layout>({ flexDirection: 'column' }),
  orderCard: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', marginBottom: spacing.md, paddingBottom: spacing.sm, paddingLeft: spacing.md, paddingRight: spacing.md, paddingTop: spacing.sm }),
  orderRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minHeight: 70 }),
  orderIcon: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.md, flexShrink: 0, height: 42, justifyContent: 'center', width: 42 }),
  orderTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body) }),
  orderStore: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.tiny), marginTop: 2 }),
  orderDate: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
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
