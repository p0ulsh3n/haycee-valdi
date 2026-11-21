import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { DSButton, Hairline } from '../design-system/index';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import { runNavigationAction } from '../design-system/utils/NavigationActionGate';

export interface CartOrderSuccessScreenViewModel {
  orderNumber: string;
  itemCount: number;
  total: string;
  shippingAddress: string;
  onViewOrders?: () => void;
}

/** Demo confirmation screen; it explicitly states that Wallet debit is not connected yet. */
@NavigationPage(module)
export class CartOrderSuccessScreen extends NavigationPageStatefulComponent<CartOrderSuccessScreenViewModel, {}> {
  private isClosing = false;

  private close = (): void => {
    if (this.isClosing) return;
    this.isClosing = true;
    this.navigationController.pop();
  };

  private viewOrders = (): void => {
    if (this.isClosing) return;
    const opened = runNavigationAction(this.navigationController, () => this.viewModel.onViewOrders?.());
    if (opened) this.isClosing = true;
  };

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const itemLabel = `${this.viewModel.itemCount} article${this.viewModel.itemCount === 1 ? '' : 's'}`;

    <view style={styles.root}>
      <layout style={styles.header.extend({ paddingTop: topInset + spacing.sm })}>
        <view style={styles.headerAction} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour au checkout">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
        </view>
        <label value="Confirmation" style={styles.headerTitle} numberOfLines={1} accessibilityCategory="header" />
        <view style={styles.headerActionSpacer} />
      </layout>
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <layout style={styles.content.extend({ paddingBottom: bottomInset + layout.navigation.bottomTabContentPadding + spacing.xl })}>
          <view style={styles.successIconFrame}>
            <image src={navigationIcons.tick03} tint={colors.textInverted} width={30} height={30} objectFit="contain" />
          </view>
          <label value="Commande préparée" style={styles.title} numberOfLines={2} />
          <label value="Votre commande de démonstration est prête." style={styles.message} numberOfLines={3} />

          <view style={styles.orderCard}>
            <layout style={styles.detailRow}>
              <label value="Numéro de commande" style={styles.detailLabel} numberOfLines={1} />
              <label value={this.viewModel.orderNumber} style={styles.detailValue} numberOfLines={1} />
            </layout>
            <Hairline color={colors.borderDefault} />
            <layout style={styles.detailRow}>
              <label value={itemLabel} style={styles.detailLabel} numberOfLines={1} />
              <label value={this.viewModel.total} style={styles.detailValue} numberOfLines={1} />
            </layout>
            <Hairline color={colors.borderDefault} />
            <layout style={styles.addressRow}>
              <image src={navigationIcons.location04} tint={colors.textSecondary} width={18} height={18} objectFit="contain" />
              <layout style={styles.addressCopy}>
                <label value="Adresse de livraison" style={styles.detailLabel} numberOfLines={1} />
                <label value={this.viewModel.shippingAddress} style={styles.addressValue} numberOfLines={3} textOverflow="ellipsis" />
              </layout>
            </layout>
          </view>

          <view style={styles.walletNotice}>
            <image src={navigationIcons.money03} tint={colors.interactivePrimary} width={19} height={19} objectFit="contain" />
            <label
              value="Le paiement réel par Wallet n’est pas encore connecté. Aucun débit n’a été effectué."
              style={styles.walletNoticeText}
              numberOfLines={4}
            />
          </view>
        </layout>
      </scroll>
      <view style={styles.footer.extend({ paddingBottom: bottomInset + spacing.sm })}>
        <DSButton
          title="Voir mes commandes"
          variant="cta"
          size="fullWidth"
          height={layout.cart.checkout.footerButtonHeight}
          textCase="none"
          icon={navigationIcons.package}
          iconSize={18}
          onTap={this.viewOrders}
        />
        <DSButton
          title="Continuer mes achats"
          variant="outline"
          size="fullWidth"
          height={48}
          textCase="none"
          onTap={this.close}
        />
      </view>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', height: layout.cart.checkout.headerHeight, justifyContent: 'space-between', paddingLeft: spacing.lg, paddingRight: spacing.lg, width: '100%' }),
  headerAction: new Style<View>({ alignItems: 'center', borderRadius: radius.full, height: 40, justifyContent: 'center', width: 40 }),
  headerActionSpacer: new Style<View>({ height: 40, width: 40 }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.page), textAlign: 'center' }),
  scroll: new Style<ScrollView>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  content: new Style<Layout>({ alignItems: 'center', flexDirection: 'column', paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.xxxxl, width: '100%' }),
  successIconFrame: new Style<View>({ alignItems: 'center', backgroundColor: colors.interactiveSuccess, borderRadius: radius.full, height: 64, justifyContent: 'center', width: 64 }),
  title: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section), marginTop: spacing.lg, textAlign: 'center' }),
  message: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.body), marginTop: spacing.xs, textAlign: 'center' }),
  orderCard: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', marginTop: spacing.xxl, paddingLeft: spacing.md, paddingRight: spacing.md, width: '100%' }),
  detailRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, width: '100%' }),
  detailLabel: new Style<Label>({ color: colors.textSecondary, flexGrow: 1, flexShrink: 1, font: montserrat.regular(fontSize.label), marginRight: spacing.sm }),
  detailValue: new Style<Label>({ color: colors.textPrimary, flexShrink: 0, font: montserrat.semiBold(fontSize.label) }),
  addressRow: new Style<Layout>({ alignItems: 'flex-start', flexDirection: 'row', paddingBottom: spacing.md, paddingTop: spacing.md, width: '100%' }),
  addressCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm, minWidth: 0 }),
  addressValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.label), marginTop: spacing.xs }),
  walletNotice: new Style<View>({ alignItems: 'flex-start', backgroundColor: colors.backgroundSecondary, borderRadius: radius.sm, flexDirection: 'row', marginTop: spacing.lg, padding: spacing.md, width: '100%' }),
  walletNoticeText: new Style<Label>({ color: colors.textSecondary, flexGrow: 1, flexShrink: 1, font: montserrat.regular(fontSize.tiny), marginLeft: spacing.sm }),
  footer: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexShrink: 0, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.sm, width: '100%' }),
};
