import { Component } from 'valdi_core/src/Component';
import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { Asset } from 'valdi_tsx/src/Asset';
import { Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { DSButton } from '../../design-system/components/DSButton';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';

export interface WalletBalanceCardViewModel {
  title: string;
  amount: string;
  detail: string;
  tone?: 'brand' | 'neutral' | 'dark';
}

const amountFontSizeForWidth = (value: string, availableWidth: number, baseFontSize: number): number => {
  const estimatedWidth = layout.profile.wallet.maxAmountTextWidthAtDisplayLarge
    * value.length
    / layout.profile.wallet.maxAmountLabelCharacters
    * baseFontSize
    / fontSize.displayLarge;
  if (estimatedWidth <= availableWidth || estimatedWidth <= 0) return baseFontSize;
  return Math.max(fontSize.metadata, baseFontSize * availableWidth / estimatedWidth);
};

export class WalletBalanceCard extends Component<WalletBalanceCardViewModel> {
  onRender(): void {
    const tone = this.viewModel.tone ?? 'neutral';
    const isBrand = tone === 'brand';
    const isDark = tone === 'dark';
    const availableAmountWidth = Device.getWindowWidth()
      - layout.profile.wallet.horizontalPadding * 2
      - spacing.md * 2
      - spacing.md
      - layout.profile.wallet.balanceCopyMinWidth;
    const amountFontSize = amountFontSizeForWidth(
      this.viewModel.amount,
      availableAmountWidth,
      fontSize.priceLarge,
    );
    const amountStyle = (isDark ? styles.balanceAmountInverted : styles.balanceAmount)
      .extend({ font: isDark ? montserrat.black(amountFontSize) : montserrat.extraBold(amountFontSize) });
    const detailColor = isBrand
      ? colors.textPrimary
      : isDark
        ? colors.walletAccentOnDark
        : colors.interactivePrimary;
    const infoTint = isBrand
      ? colors.iconBrand
      : isDark
        ? colors.textOnDarkSecondary
        : colors.textTertiary;

    <view style={isBrand ? styles.balanceBrand : isDark ? styles.balanceDark : styles.balanceNeutral}>
      <layout style={styles.balanceCopy}>
        <layout style={styles.balanceTitleRow}>
          <label value={this.viewModel.title} style={isDark ? styles.balanceTitleInverted : styles.balanceTitle} numberOfLines={1} />
          <layout style={styles.balanceInfoGap} />
          <image
            src={navigationIcons.informationCircle}
            tint={infoTint}
            width={layout.profile.wallet.balanceInfoIconSize}
            height={layout.profile.wallet.balanceInfoIconSize}
            objectFit="contain"
          />
        </layout>
        <label value={this.viewModel.detail} style={styles.balanceDetail.extend({ color: detailColor })} numberOfLines={1} textOverflow="ellipsis" />
      </layout>
      <label value={this.viewModel.amount} style={amountStyle} numberOfLines={1} textOverflow="ellipsis" />
    </view>;
  }
}

export interface WalletBalanceOverviewViewModel {
  availableAmount: string;
  pendingAmount: string;
  onWithdrawTap: () => void;
  onRechargeTap: () => void;
}

/** Unboxed Wallet summary inspired by compact balance dashboards. */
export class WalletBalanceOverview extends Component<WalletBalanceOverviewViewModel> {
  onRender(): void {
    const availableWidth = Device.getWindowWidth()
      - layout.profile.wallet.horizontalPadding * 2;
    const availableFontSize = amountFontSizeForWidth(
      this.viewModel.availableAmount,
      availableWidth,
      fontSize.displayLarge,
    );
    const pendingWidth = Math.max(1, availableWidth - spacing.md * 2 - layout.profile.wallet.balanceCopyMinWidth - spacing.md);
    const pendingFontSize = amountFontSizeForWidth(
      this.viewModel.pendingAmount,
      pendingWidth,
      fontSize.product,
    );

    <layout style={styles.balanceOverview}>
      <layout style={styles.overviewHeadline}>
        <label value="Solde" style={styles.overviewTitle} numberOfLines={1} />
        <label value="Disponible pour retrait" style={styles.overviewAvailableDetail} numberOfLines={1} />
        <label
          value={this.viewModel.availableAmount}
          style={styles.overviewAvailableAmount.extend({ font: montserrat.black(availableFontSize) })}
          numberOfLines={1}
          textOverflow="ellipsis"
        />
      </layout>
      <view style={styles.overviewPending}>
        <layout style={styles.overviewPendingCopy}>
          <label value="Paiements en attente" style={styles.overviewPendingTitle} numberOfLines={1} />
          <label value="Après finalisation des commandes" style={styles.overviewPendingDetail} numberOfLines={1} textOverflow="ellipsis" />
        </layout>
        <label
          value={this.viewModel.pendingAmount}
          style={styles.overviewPendingAmount.extend({ font: montserrat.extraBold(pendingFontSize) })}
          numberOfLines={1}
          textOverflow="ellipsis"
        />
      </view>
      <layout style={styles.overviewActions}>
        <DSButton
          title="Retirer"
          variant="cta"
          size="compact"
          width={layout.profile.wallet.overviewActionWidth}
          height={layout.profile.wallet.overviewActionHeight}
          textCase="none"
          icon={navigationIcons.moneySend02}
          iconSize={18}
          onTap={this.viewModel.onWithdrawTap}
        />
        <DSButton
          title="Recharger"
          variant="outline"
          size="compact"
          width={layout.profile.wallet.overviewActionWidth}
          height={layout.profile.wallet.overviewActionHeight}
          textCase="none"
          icon={navigationIcons.moneyAdd02}
          iconSize={18}
          marginLeft={spacing.sm}
          onTap={this.viewModel.onRechargeTap}
        />
      </layout>
    </layout>;
  }
}

export interface WalletMetricCardViewModel {
  title: string;
  period: string;
  value: string;
  detail: string;
  availableValueWidth: number;
}

export class WalletMetricCard extends Component<WalletMetricCardViewModel> {
  onRender(): void {
    const valueFontSize = amountFontSizeForWidth(
      this.viewModel.value,
      this.viewModel.availableValueWidth,
      fontSize.large,
    );

    <view style={styles.metricCard}>
      <label value={this.viewModel.title} style={styles.metricTitle} numberOfLines={1} />
      <label value={this.viewModel.period} style={styles.metricPeriod} numberOfLines={1} />
      <label
        value={this.viewModel.value}
        style={styles.metricValue.extend({ font: montserrat.extraBold(valueFontSize) })}
        numberOfLines={1}
        textOverflow="ellipsis"
      />
      <label value={this.viewModel.detail} style={styles.metricDetail} numberOfLines={1} />
    </view>;
  }
}

export interface WalletPaymentRowViewModel {
  title: string;
  subtitle: string;
  amount: string;
  icon: Asset;
  onTap?: () => void;
}

export class WalletPaymentRow extends Component<WalletPaymentRowViewModel> {
  onRender(): void {
    <view
      style={styles.paymentRow}
      onTap={this.viewModel.onTap}
      accessibilityCategory={this.viewModel.onTap ? 'button' : undefined}
      accessibilityLabel={`${this.viewModel.title}, ${this.viewModel.amount}`}
    >
      <view style={styles.paymentIconWrap}>
        <image src={this.viewModel.icon} tint={colors.iconDefault} width={20} height={20} objectFit="contain" />
      </view>
      <layout style={styles.paymentCopy}>
        <layout style={styles.paymentTitleRow}>
          <label value={this.viewModel.title} style={styles.paymentTitle} numberOfLines={2} />
          <image src={navigationIcons.arrowRight01Round} tint={colors.textTertiary} width={18} height={18} objectFit="contain" />
        </layout>
        <label value={this.viewModel.subtitle} style={styles.paymentSubtitle} numberOfLines={1} />
        <label value={this.viewModel.amount} style={styles.paymentAmount} numberOfLines={1} textOverflow="ellipsis" />
      </layout>
    </view>;
  }
}

const styles = {
  balanceOverview: new Style<Layout>({ flexDirection: 'column', paddingBottom: spacing.lg, paddingLeft: layout.profile.wallet.horizontalPadding, paddingRight: layout.profile.wallet.horizontalPadding, paddingTop: spacing.lg, width: '100%' }),
  overviewHeadline: new Style<Layout>({ alignItems: 'center', flexDirection: 'column', width: '100%' }),
  overviewTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.product), textAlign: 'center' }),
  overviewAvailableAmount: new Style<Label>({ color: colors.textPrimary, font: montserrat.black(fontSize.displayLarge), marginTop: spacing.xs, textAlign: 'center' }),
  overviewAvailableDetail: new Style<Label>({ color: colors.interactivePrimary, font: montserrat.semiBold(fontSize.tiny), marginTop: spacing.xs, textAlign: 'center' }),
  overviewPending: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, padding: spacing.md, width: '100%' }),
  overviewPendingCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginRight: spacing.md, minWidth: layout.profile.wallet.balanceCopyMinWidth }),
  overviewPendingTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body) }),
  overviewPendingDetail: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  overviewPendingAmount: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.product), textAlign: 'right' }),
  overviewActions: new Style<Layout>({ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg, width: '100%' }),
  balanceBrand: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundBrand,
    borderRadius: radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: layout.profile.wallet.balanceCardMinHeight,
    padding: spacing.md,
    width: '100%',
  }),
  balanceDark: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
    borderRadius: radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: layout.profile.wallet.balanceCardMinHeight,
    padding: spacing.md,
    width: '100%',
  }),
  balanceNeutral: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: layout.profile.wallet.balanceCardMinHeight,
    padding: spacing.md,
    width: '100%',
  }),
  balanceCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginRight: spacing.md, minWidth: layout.profile.wallet.balanceCopyMinWidth }),
  balanceTitleRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minWidth: 0 }),
  balanceInfoGap: new Style<Layout>({ width: spacing.xs }),
  balanceTitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata) }),
  balanceTitleInverted: new Style<Label>({ color: colors.textInverted, font: montserrat.semiBold(fontSize.metadata) }),
  balanceAmount: new Style<Label>({ color: colors.textPrimary, flexShrink: 1, font: montserrat.extraBold(fontSize.priceLarge), textAlign: 'right' }),
  balanceAmountInverted: new Style<Label>({ color: colors.textInverted, flexShrink: 1, font: montserrat.black(fontSize.priceLarge), textAlign: 'right' }),
  balanceDetail: new Style<Label>({ font: montserrat.semiBold(fontSize.tiny), marginTop: spacing.xs }),
  metricCard: new Style<View>({
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    flexDirection: 'column',
    height: layout.profile.wallet.metricCardHeight,
    justifyContent: 'space-between',
    padding: spacing.md,
    width: '100%',
  }),
  metricTitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.metadata) }),
  metricPeriod: new Style<Label>({ color: colors.interactivePrimary, font: montserrat.semiBold(fontSize.tiny) }),
  metricValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.large) }),
  metricDetail: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny) }),
  paymentRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', minHeight: layout.profile.wallet.paymentRowHeight, paddingBottom: spacing.sm, paddingTop: spacing.sm, width: '100%' }),
  paymentIconWrap: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexShrink: 0, height: layout.profile.wallet.paymentIconSize, justifyContent: 'center', width: layout.profile.wallet.paymentIconSize }),
  paymentCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  paymentTitleRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', width: '100%' }),
  paymentTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.semiBold(fontSize.metadata), marginRight: spacing.xs }),
  paymentSubtitle: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  paymentAmount: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.product), marginTop: spacing.xs }),
};
