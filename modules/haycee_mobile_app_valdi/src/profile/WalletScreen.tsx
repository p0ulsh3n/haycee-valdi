import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { Hairline } from '../design-system/components/Hairline';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import { formatFcfa, formatIntegerWithDotSeparator } from '../design-system/utils/money';
import { WALLET_OVERVIEW } from './data/WalletDemoData';
import { WalletBalanceOverview, WalletMetricCard, WalletPaymentRow } from './components/WalletSummaryCards';

export interface WalletScreenViewModel {
  onWithdrawTap?: () => void;
}

const metricRows = [
  [
    { title: 'Commandes', period: 'Ce mois-ci', value: formatIntegerWithDotSeparator(WALLET_OVERVIEW.monthlyOrders), detail: 'commandes' },
    { title: 'Achats', period: 'Ce mois-ci', value: formatFcfa(WALLET_OVERVIEW.monthlySpend), detail: 'montant dépensé' },
  ],
  [
    { title: 'Commandes livrées', period: 'Au total', value: formatIntegerWithDotSeparator(WALLET_OVERVIEW.deliveredOrders), detail: 'commandes finalisées' },
    { title: 'En cours', period: 'Actuellement', value: formatIntegerWithDotSeparator(WALLET_OVERVIEW.pendingOrders), detail: 'commandes à traiter' },
  ],
];

/** Personal wallet overview, using local display fixtures until account APIs are connected. */
@NavigationPage(module)
export class WalletScreen extends NavigationPageStatefulComponent<WalletScreenViewModel, {}> {
  private isClosing = false;
  private close = (): void => {
    if (this.isClosing) return;
    this.isClosing = true;
    this.navigationController.pop();
  };

  private showPaymentInfo = (message: string): void => {
    TransientFeedback.show({ message, duration: 1800 });
  };

  private renderMetrics(): void {
    const contentWidth = Device.getWindowWidth() - layout.profile.wallet.horizontalPadding * 2;
    const metricColumns = [
      {
        cellStyle: styles.metricCellFirst,
        valueWidth: contentWidth * layout.profile.wallet.metricFirstColumnRatio - spacing.md * 2,
      },
      {
        cellStyle: styles.metricCellLast,
        valueWidth: contentWidth * layout.profile.wallet.metricSecondColumnRatio - spacing.md * 2,
      },
    ];

    <layout style={styles.metricGrid}>
      {metricRows.map((row, rowIndex) => (
        <layout key={`wallet-metric-row-${rowIndex}`} style={styles.metricRow}>
          {row.map((metric, columnIndex) => (
            <view key={`wallet-metric-${metric.title}`} style={metricColumns[columnIndex].cellStyle}>
              <WalletMetricCard
                title={metric.title}
                period={metric.period}
                value={metric.value}
                detail={metric.detail}
                availableValueWidth={metricColumns[columnIndex].valueWidth}
              />
            </view>
          ))}
        </layout>
      ))}
    </layout>;
  }

  private handleWithdraw = (): void => {
    if (this.viewModel.onWithdrawTap) {
      this.viewModel.onWithdrawTap();
      return;
    }
    this.showPaymentInfo('Les retraits seront disponibles prochainement.');
  };

  private handleHelp = (): void => {
    this.showPaymentInfo('Le détail du wallet sera bientôt disponible.');
  };

  private handleRecharge = (): void => {
    this.showPaymentInfo('Le rechargement du wallet sera bientôt disponible.');
  };

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());

    <view style={styles.root}>
      <view style={styles.walletHero}>
        <view style={styles.header.extend({ paddingTop: Math.max(0, Device.getDisplayTopInset()) + spacing.sm })}>
          <view style={styles.headerAction} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour">
            <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
          </view>
          <label value="Wallet" style={styles.headerTitle} numberOfLines={1} accessibilityCategory="header" />
          <view style={styles.headerAction} onTap={this.handleHelp} accessibilityCategory="button" accessibilityLabel="Aide du wallet">
            <image src={navigationIcons.helpCircle} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
          </view>
        </view>
        <WalletBalanceOverview
          availableAmount={formatFcfa(WALLET_OVERVIEW.availableBalance)}
          pendingAmount={formatFcfa(WALLET_OVERVIEW.pendingAmount)}
          onWithdrawTap={this.handleWithdraw}
          onRechargeTap={this.handleRecharge}
        />
      </view>
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <layout style={styles.content.extend({ paddingBottom: Math.max(bottomInset, spacing.lg) })}>
          <layout style={styles.contentInner}>
            <layout style={styles.sectionHeading}>
              <label value="Activité du compte" style={styles.sectionTitle} numberOfLines={1} />
              <label value="Ce mois-ci" style={styles.sectionCaption} numberOfLines={1} />
            </layout>
            {this.renderMetrics()}
            <layout style={styles.sectionHeading}>
              <label value="Paiements" style={styles.sectionTitle} numberOfLines={1} />
            </layout>
            <WalletPaymentRow
              title="Montant des commandes en attente"
              subtitle="En cours de traitement"
              amount={formatFcfa(WALLET_OVERVIEW.pendingAmount)}
              icon={navigationIcons.packageProcess}
              onTap={() => this.showPaymentInfo('Détail des paiements en attente')}
            />
            <Hairline color={colors.borderDefault} />
            <WalletPaymentRow
              title="Montant déjà réglé"
              subtitle="Commandes livrées"
              amount={formatFcfa(WALLET_OVERVIEW.completedPayments)}
              icon={navigationIcons.packageDelivered}
              onTap={() => this.showPaymentInfo('Détail des paiements réglés')}
            />
            <view style={styles.notice}>
              <image src={navigationIcons.informationCircle} tint={colors.iconDefault} width={16} height={16} objectFit="contain" />
              <label value="Les indicateurs affichés sont des exemples de présentation." style={styles.noticeText} numberOfLines={2} />
            </view>
          </layout>
        </layout>
      </scroll>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', flexGrow: 1, flexShrink: 1, height: '100%' }),
  walletHero: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', width: '100%' }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.profile.wallet.headerHeight, paddingBottom: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.lg, width: '100%' }),
  headerAction: new Style<View>({ alignItems: 'center', height: layout.profile.wallet.headerActionSize, justifyContent: 'center', width: layout.profile.wallet.headerActionSize }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, font: montserrat.extraBold(fontSize.section), textAlign: 'center' }),
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  content: new Style<Layout>({ flexDirection: 'column', paddingBottom: spacing.lg, width: '100%' }),
  contentInner: new Style<Layout>({ flexDirection: 'column', paddingLeft: layout.profile.wallet.horizontalPadding, paddingRight: layout.profile.wallet.horizontalPadding, width: '100%' }),
  sectionHeading: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: layout.profile.wallet.sectionGap }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.large) }),
  sectionCaption: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata) }),
  metricGrid: new Style<Layout>({ flexDirection: 'column', width: '100%' }),
  metricRow: new Style<Layout>({ flexDirection: 'row', justifyContent: 'space-between', marginBottom: layout.profile.wallet.metricGap, width: '100%' }),
  metricCellFirst: new Style<View>({ flexShrink: 1, minWidth: 0, width: `${layout.profile.wallet.metricFirstColumnRatio * 100}%` }),
  metricCellLast: new Style<View>({ flexShrink: 1, minWidth: 0, width: `${layout.profile.wallet.metricSecondColumnRatio * 100}%` }),
  notice: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginTop: spacing.lg, paddingLeft: spacing.xs, paddingRight: spacing.xs }),
  noticeText: new Style<Label>({ color: colors.textTertiary, flexShrink: 1, font: montserrat.regular(fontSize.tiny), marginLeft: spacing.sm }),
};
