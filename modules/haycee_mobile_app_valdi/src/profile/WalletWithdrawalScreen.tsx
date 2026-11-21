import { Device } from 'valdi_core/src/Device';
import { EditTextUtils } from 'valdi_core/src/utils/EditTextUtils';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { EditTextEvent, Label, Layout, ScrollView, TextField, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { DSButton } from '../design-system/components/DSButton';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { layout, spacing } from '../design-system/tokens/spacing';
import { radius } from '../design-system/tokens/radius';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import { formatFcfa, formatIntegerWithDotSeparator, normalizeWholeAmountInput } from '../design-system/utils/money';
import { WALLET_OVERVIEW, WALLET_QUICK_WITHDRAW_AMOUNTS } from './data/WalletDemoData';
import { WalletBalanceCard } from './components/WalletSummaryCards';

export interface WalletWithdrawalScreenViewModel {
  onSubmit?: (amount: number) => void | Promise<unknown>;
}

interface WalletWithdrawalScreenState {
  amount: string;
  isSubmitting: boolean;
}

/** Withdrawal form; account and balance are demo data until wallet services are connected. */
@NavigationPage(module)
export class WalletWithdrawalScreen extends NavigationPageStatefulComponent<WalletWithdrawalScreenViewModel, WalletWithdrawalScreenState> {
  state: WalletWithdrawalScreenState = { amount: '', isSubmitting: false };
  private requestPending = false;
  private isClosing = false;

  onCreate(): void {
    this.state = { amount: '', isSubmitting: false };
  }

  private close = (): void => {
    if (this.isClosing) return;
    this.isClosing = true;
    this.navigationController.pop();
  };

  private handleAmountWillChange = (event: EditTextEvent): EditTextEvent => {
    if (this.requestPending) {
      return EditTextUtils.makeUpdatedEvent(event, formatIntegerWithDotSeparator(this.state.amount));
    }
    const normalized = normalizeWholeAmountInput(event.text, WALLET_OVERVIEW.availableBalance);
    return EditTextUtils.makeUpdatedEvent(event, normalized.formatted);
  };

  private handleAmountChange = (event: EditTextEvent): void => {
    if (this.requestPending) return;
    const normalized = normalizeWholeAmountInput(event.text, WALLET_OVERVIEW.availableBalance);
    this.setState({ amount: normalized.digits, isSubmitting: this.state.isSubmitting });
  };

  private chooseAmount = (amount: number): void => {
    if (this.requestPending) return;
    if (amount > WALLET_OVERVIEW.availableBalance) return;
    this.setState({ amount: `${amount}`, isSubmitting: false });
  };

  private amountError(): string | undefined {
    const amount = Number(this.state.amount);
    if (!this.state.amount || !Number.isFinite(amount) || amount <= 0) return undefined;
    if (amount < WALLET_OVERVIEW.minimumWithdrawal) {
      return `Le retrait minimum est de ${formatFcfa(WALLET_OVERVIEW.minimumWithdrawal)}.`;
    }
    if (amount > WALLET_OVERVIEW.availableBalance) {
      return 'Le montant dépasse le solde disponible.';
    }
    return undefined;
  }

  private canSubmit(): boolean {
    const amount = Number(this.state.amount);
    return Number.isFinite(amount)
      && amount >= WALLET_OVERVIEW.minimumWithdrawal
      && amount <= WALLET_OVERVIEW.availableBalance
      && !this.state.isSubmitting
      && !this.amountError();
  }

  private submitWithdrawal = async (): Promise<void> => {
    if (this.requestPending || !this.canSubmit()) return;
    this.requestPending = true;
    const amount = Number(this.state.amount);
    this.setState({ amount: this.state.amount, isSubmitting: true });
    try {
      if (this.viewModel.onSubmit) {
        await this.viewModel.onSubmit(amount);
      } else {
        TransientFeedback.show({ message: 'Le retrait sera disponible lorsque le wallet sera connecté.' });
      }
      this.isClosing = true;
      this.navigationController.pop();
    } catch {
      this.requestPending = false;
      this.setState({ amount: this.state.amount, isSubmitting: false });
      TransientFeedback.show({ message: 'Impossible de préparer le retrait. Réessaie.' });
    }
  };

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const amountError = this.amountError();
    const amount = Number(this.state.amount);

    <view style={styles.root}>
      <view style={styles.header.extend({ paddingTop: Math.max(0, Device.getDisplayTopInset()) + spacing.sm })}>
        <view style={styles.headerAction} onTapDisabled={this.requestPending} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour au wallet">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
        </view>
        <label value="Retrait" style={styles.headerTitle} numberOfLines={1} accessibilityCategory="header" />
        <view style={styles.headerAction} onTap={() => TransientFeedback.show({ message: 'Aide au retrait bientôt disponible.' })} accessibilityCategory="button" accessibilityLabel="Aide au retrait">
          <image src={navigationIcons.informationCircle} tint={colors.iconDefault} width={21} height={21} objectFit="contain" />
        </view>
      </view>
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <layout style={styles.content}>
          <WalletBalanceCard
            title="Solde disponible"
            amount={formatFcfa(WALLET_OVERVIEW.availableBalance)}
            detail="Solde de démonstration"
            tone="brand"
          />
          <label value="Montant du retrait" style={styles.sectionTitle} numberOfLines={1} />
          <view style={styles.amountInputContainer}>
            <label value="FCFA" style={styles.currencyLabel} numberOfLines={1} />
            <textfield
              style={styles.amountInput}
              value={this.state.amount ? formatIntegerWithDotSeparator(this.state.amount) : ''}
              placeholder="Saisir un montant"
              placeholderColor={colors.textTertiary}
              contentType="number"
              textDirection="ltr"
              autocorrection="none"
              autocapitalization="none"
              onWillChange={this.handleAmountWillChange}
              onChange={this.handleAmountChange}
            />
          </view>
          {amountError ? <label value={amountError} style={styles.amountError} numberOfLines={2} /> : null}
          <label value={`Minimum : ${formatFcfa(WALLET_OVERVIEW.minimumWithdrawal)}`} style={styles.minimumHint} numberOfLines={1} />
          <layout style={styles.quickAmounts}>
            {WALLET_QUICK_WITHDRAW_AMOUNTS.map(value => (
              <view
                key={`withdraw-amount-${value}`}
                style={amount === value ? styles.quickAmountSelected : styles.quickAmount}
                onTapDisabled={this.requestPending}
                onTap={() => this.chooseAmount(value)}
                accessibilityCategory="button"
                accessibilityLabel={`Choisir ${formatFcfa(value)}`}
              >
                <label value={formatFcfa(value)} style={amount === value ? styles.quickAmountTextSelected : styles.quickAmountText} numberOfLines={1} />
              </view>
            ))}
          </layout>
          <layout style={styles.bankHeading}>
            <label value="Compte de versement" style={styles.sectionTitle} numberOfLines={1} />
            <view
              style={styles.editButton}
              onTap={() => TransientFeedback.show({ message: 'La gestion des comptes sera bientôt disponible.' })}
              accessibilityCategory="button"
              accessibilityLabel="Modifier le compte de versement"
            >
              <label value="Modifier" style={styles.editLabel} numberOfLines={1} />
            </view>
          </layout>
          <view
            style={styles.bankCardSelected}
            accessibilityLabel={`${WALLET_OVERVIEW.bankName}, ${WALLET_OVERVIEW.maskedAccountNumber}`}
          >
            <view style={styles.bankCardTop}>
              <view style={styles.bankIcon}>
                <image src={navigationIcons.identityCard} tint={colors.iconDefault} width={21} height={21} objectFit="contain" />
              </view>
              <layout style={styles.bankDetails}>
                <label value={WALLET_OVERVIEW.bankName} style={styles.bankName} numberOfLines={1} />
                <label value={WALLET_OVERVIEW.accountHolder} style={styles.bankMeta} numberOfLines={1} />
              </layout>
              <image src={navigationIcons.tick03Bold} tint={colors.interactivePrimary} width={layout.profile.wallet.bankCheckSize} height={layout.profile.wallet.bankCheckSize} objectFit="contain" />
            </view>
            <label value={`Compte : ${WALLET_OVERVIEW.maskedAccountNumber}`} style={styles.bankMeta} numberOfLines={1} />
          </view>
        </layout>
      </scroll>
      <view style={styles.footer.extend({ paddingBottom: Math.max(bottomInset, spacing.md) })}>
        <DSButton
          title="Confirmer le retrait"
          variant="cta"
          size="fullWidth"
          textCase="none"
          height={layout.profile.wallet.footerButtonHeight}
          disabled={!this.canSubmit()}
          loading={this.state.isSubmitting}
          onTap={this.submitWithdrawal}
        />
      </view>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', flexGrow: 1, flexShrink: 1, height: '100%' }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.profile.wallet.headerHeight, paddingBottom: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.lg, width: '100%' }),
  headerAction: new Style<View>({ alignItems: 'center', height: layout.profile.wallet.headerActionSize, justifyContent: 'center', width: layout.profile.wallet.headerActionSize }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, font: montserrat.extraBold(fontSize.section), marginLeft: spacing.sm }),
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  content: new Style<Layout>({ flexDirection: 'column', paddingBottom: spacing.xl, paddingLeft: layout.profile.wallet.horizontalPadding, paddingRight: layout.profile.wallet.horizontalPadding, paddingTop: spacing.sm }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.large), marginTop: layout.profile.wallet.sectionGap }),
  amountInputContainer: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'row', height: layout.profile.wallet.withdrawalInputHeight, marginTop: spacing.md, paddingLeft: spacing.md, paddingRight: spacing.md, width: '100%' }),
  currencyLabel: new Style<Label>({ color: colors.interactivePrimary, font: montserrat.extraBold(fontSize.body), marginRight: spacing.md }),
  amountInput: new Style<TextField>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.extraBold(fontSize.body), height: layout.profile.wallet.withdrawalInputHeight, textAlign: 'left' }),
  amountError: new Style<Label>({ color: colors.textDanger, font: montserrat.semiBold(fontSize.tiny), marginTop: spacing.xs }),
  minimumHint: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  quickAmounts: new Style<Layout>({ flexDirection: 'row', marginTop: spacing.md, width: '100%' }),
  quickAmount: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexGrow: 1, flexShrink: 1, height: layout.profile.wallet.quickAmountHeight, justifyContent: 'center', marginRight: spacing.xs, paddingLeft: spacing.xs, paddingRight: spacing.xs }),
  quickAmountSelected: new Style<View>({ alignItems: 'center', backgroundColor: colors.buttonPrimary, borderRadius: radius.md, flexGrow: 1, flexShrink: 1, height: layout.profile.wallet.quickAmountHeight, justifyContent: 'center', marginRight: spacing.xs, paddingLeft: spacing.xs, paddingRight: spacing.xs }),
  quickAmountText: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.tiny) }),
  quickAmountTextSelected: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.tiny) }),
  bankHeading: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl, width: '100%' }),
  editButton: new Style<View>({ justifyContent: 'center', marginTop: layout.profile.wallet.sectionGap, minHeight: layout.profile.wallet.headerActionSize }),
  editLabel: new Style<Label>({ color: colors.interactivePrimary, font: montserrat.semiBold(fontSize.metadata) }),
  bankCardSelected: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderColor: colors.borderFocus, borderRadius: radius.md, borderWidth: 1, flexDirection: 'column', marginTop: spacing.md, padding: spacing.md, width: '100%' }),
  bankCardTop: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginBottom: spacing.md, width: '100%' }),
  bankIcon: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.full, height: layout.profile.wallet.bankIconSize, justifyContent: 'center', width: layout.profile.wallet.bankIconSize }),
  bankDetails: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, marginRight: spacing.sm, minWidth: 0 }),
  bankName: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.metadata) }),
  bankMeta: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  footer: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexShrink: 0, paddingLeft: layout.profile.wallet.horizontalPadding, paddingRight: layout.profile.wallet.horizontalPadding, paddingTop: spacing.md }),
};
