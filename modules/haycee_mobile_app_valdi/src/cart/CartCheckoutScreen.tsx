import { Device } from 'valdi_core/src/Device';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { EditTextEvent, Label, Layout, ScrollView, TextField, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { AddressPickerSheet } from './AddressPickerSheet';
import type { MarketplaceCartItem } from './data/CartData';
import {
  formatCartAmount,
  getCartAmountLabel,
  getCartDiscountMinor,
  getCartShippingMinor,
  getCartStoreKey,
  getCartSubtotalMinor,
  getCartTotal,
} from './data/CartData';
import type { MasonryProduct } from '../design-system/components/MasonryProductCard';
import { DSButton, Hairline, getBottomSheetNavigationOptions } from '../design-system/index';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat } from '../design-system/tokens/typography';
import { runNavigationAction } from '../design-system/utils/NavigationActionGate';
import { CartOrderSuccessScreen } from './CartOrderSuccessScreen';

export interface CartCheckoutScreenViewModel {
  items: MarketplaceCartItem[];
  selectedAddress?: string;
  onAddressSaved?: (address: string) => void;
  onStoreTap?: (product: MasonryProduct) => void;
  onOrderCompleted?: () => void;
  onViewOrders?: () => void;
  onPlaceOrder?: (orderNote: string, shippingAddress: string) => void | Promise<unknown>;
}

interface CheckoutScreenState {
  selectedAddress?: string;
  orderNote: string;
  isSubmitting: boolean;
}

interface CheckoutStoreGroup {
  id: string;
  name: string;
  avatarUrl?: string;
  product: MasonryProduct;
  items: MarketplaceCartItem[];
}

/** Marketplace checkout with one delivery charge per seller and Wallet-only payment. */
@NavigationPage(module)
export class CartCheckoutScreen extends NavigationPageStatefulComponent<CartCheckoutScreenViewModel, CheckoutScreenState> {
  state: CheckoutScreenState = { orderNote: '', isSubmitting: false };
  private actionPending = false;
  private isClosing = false;

  onCreate(): void {
    this.state = {
      selectedAddress: this.viewModel.selectedAddress,
      orderNote: '',
      isSubmitting: false,
    };
  }

  private close = (): void => {
    if (this.isClosing || this.actionPending) return;
    this.isClosing = true;
    this.navigationController.pop();
  };

  private storeGroups(): CheckoutStoreGroup[] {
    const groups = new Map<string, CheckoutStoreGroup>();
    this.viewModel.items.forEach(item => {
      const product = item.product;
      const id = getCartStoreKey(product);
      const group = groups.get(id);
      if (group) {
        group.items.push(item);
      } else {
        groups.set(id, {
          id,
          name: product.vendorName ?? 'Boutique Haycee',
          avatarUrl: product.vendorAvatarUrl,
          product,
          items: [item],
        });
      }
    });
    return Array.from(groups.values());
  }

  private handleAddressTap = (): void => {
    if (this.actionPending || this.isClosing) return;
    runNavigationAction(this.navigationController, () => {
      this.navigationController.present(
        AddressPickerSheet,
        {
          selectedAddress: this.state.selectedAddress,
          onSave: address => {
            this.setState({ ...this.state, selectedAddress: address });
            this.viewModel.onAddressSaved?.(address);
          },
        },
        {},
        { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions({ transparentPageBackground: true }) },
      );
    });
  };

  private handleNoteChange = (event: EditTextEvent): void => {
    if (this.actionPending) return;
    this.setState({ ...this.state, orderNote: event.text });
  };

  private placeOrder = async (): Promise<void> => {
    if (this.actionPending || this.isClosing) return;
    if (!this.state.selectedAddress) {
      this.handleAddressTap();
      TransientFeedback.show({ message: 'Choisis une adresse pour continuer.' });
      return;
    }
    if (this.viewModel.items.length === 0) return;

    this.actionPending = true;
    this.setState({ ...this.state, isSubmitting: true });
    try {
      await Promise.resolve(this.viewModel.onPlaceOrder?.(this.state.orderNote, this.state.selectedAddress));
      const opened = runNavigationAction(this.navigationController, () => {
        this.navigationController.push(CartOrderSuccessScreen, {
          orderNumber: `HCY-${Date.now().toString().slice(-8)}`,
          itemCount: this.viewModel.items.reduce((count, item) => count + item.quantity, 0),
          total: getCartTotal(this.viewModel.items),
          shippingAddress: this.state.selectedAddress!,
          onViewOrders: this.viewModel.onViewOrders,
        }, {});
      });
      if (opened) this.viewModel.onOrderCompleted?.();
      else {
        this.actionPending = false;
        if (!this.isDestroyed()) this.setState({ ...this.state, isSubmitting: false });
        TransientFeedback.show({ message: 'La confirmation s’ouvre. Réessaie dans un instant.' });
      }
    } catch {
      this.actionPending = false;
      if (!this.isDestroyed()) this.setState({ ...this.state, isSubmitting: false });
      TransientFeedback.show({ message: 'Impossible de préparer la commande. Réessaie.' });
    }
  };

  private renderProduct(item: MarketplaceCartItem): void {
    const product = item.product;
    const imageUrl = product.imageUrl ?? product.imageUrls?.[0];
    const variants = item.selections.map(selection => selection.optionLabel).join(' · ');

    <layout key={item.id} style={styles.productRow}>
      <view style={styles.productImageFrame.extend({ backgroundColor: product.color })}>
        {imageUrl ? (
          <image src={imageUrl} style={styles.productImage} objectFit="cover" />
        ) : (
          <image src={navigationIcons.package} tint={colors.textSecondary} width={24} height={24} objectFit="contain" />
        )}
      </view>
      <layout style={styles.productCopy}>
        <label value={product.title} style={styles.productTitle} numberOfLines={2} textOverflow="ellipsis" />
        {variants ? <label value={variants} style={styles.productVariants} numberOfLines={1} textOverflow="ellipsis" /> : null}
        <label value={`${item.quantity} × ${formatCartAmount(item, item.unitAmountMinor)}`} style={styles.productPrice} numberOfLines={1} />
      </layout>
      <label value={formatCartAmount(item, item.unitAmountMinor * item.quantity)} style={styles.productTotal} numberOfLines={1} textOverflow="ellipsis" />
    </layout>;
  }

  private renderStoreGroup(group: CheckoutStoreGroup): void {
    const isExpedition = group.product.shippingMethod === 'expedition';
    const shippingLabel = isExpedition ? 'Frais d’expédition :' : 'Frais de livraison :';
    const shippingDetail = group.product.shippingFree
      ? 'Gratuite'
      : group.product.shippingPrice ?? 'À calculer';

    <view key={group.id} style={styles.storeCard}>
      <view
        style={styles.storeHeader}
        onTap={this.viewModel.onStoreTap ? createReusableCallback(() => this.viewModel.onStoreTap?.(group.product)) : undefined}
        accessibilityCategory="button"
        accessibilityLabel={`Ouvrir la boutique ${group.name}`}
      >
        <view style={styles.storeAvatarFrame}>
          <view style={styles.storeAvatarFallback} />
          {group.avatarUrl ? <image src={group.avatarUrl} style={styles.storeAvatar} objectFit="cover" /> : null}
        </view>
        <label value={group.name} style={styles.storeName} numberOfLines={1} textOverflow="ellipsis" />
        <image src={navigationIcons.arrowRight01Round} tint={colors.textSecondary} width={16} height={16} objectFit="contain" />
      </view>
      {group.items.map((item, index) => (
        <view key={item.id}>
          {index > 0 ? <Hairline color={colors.borderDefault} /> : null}
          {this.renderProduct(item)}
        </view>
      ))}
      <layout style={styles.shippingRow}>
        <image
          src={isExpedition ? navigationIcons.sellerDeliveryPlane : navigationIcons.deliveryTruck02}
          tint={colors.textSecondary}
          width={layout.cart.shippingIconSize}
          height={layout.cart.shippingIconSize}
          objectFit="contain"
        />
        <label value={shippingLabel} style={styles.shippingLabel} numberOfLines={1} />
        <label value={shippingDetail} style={styles.shippingAmount} numberOfLines={1} textOverflow="ellipsis" />
      </layout>
    </view>;
  }

  private renderSummaryRow(label: string, value: string, isDiscount = false): void {
    <layout style={styles.summaryRow}>
      <label value={label} style={styles.summaryLabel} numberOfLines={1} />
      <label value={value} style={isDiscount ? styles.discountValue : styles.summaryValue} numberOfLines={1} textOverflow="ellipsis" />
    </layout>;
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const subtotal = getCartSubtotalMinor(this.viewModel.items);
    const discount = getCartDiscountMinor(this.viewModel.items);
    const shipping = getCartShippingMinor(this.viewModel.items);
    const total = getCartTotal(this.viewModel.items);
    const itemCount = this.viewModel.items.reduce((count, item) => count + item.quantity, 0);

    <view style={styles.root}>
      <layout style={styles.header.extend({ paddingTop: topInset + spacing.sm })}>
        <view style={styles.headerAction} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour au panier">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
        </view>
        <label value="Checkout" style={styles.headerTitle} numberOfLines={1} accessibilityCategory="header" />
        <view style={styles.headerActionSpacer} />
      </layout>
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <layout style={styles.content}>
          <label value="Livraison" style={styles.sectionTitle} numberOfLines={1} />
          <view style={styles.addressCard} onTap={this.handleAddressTap} accessibilityCategory="button" accessibilityLabel="Choisir une adresse de livraison">
            <image src={navigationIcons.location04} tint={colors.iconDefault} width={20} height={20} objectFit="contain" />
            <layout style={styles.addressCopy}>
              <label value={this.state.selectedAddress ? 'Adresse de livraison' : 'Sélectionner une adresse'} style={styles.addressTitle} numberOfLines={1} />
              {this.state.selectedAddress ? <label value={this.state.selectedAddress} style={styles.addressValue} numberOfLines={2} textOverflow="ellipsis" /> : null}
            </layout>
            <image src={navigationIcons.arrowRight01Round} tint={colors.textTertiary} width={18} height={18} objectFit="contain" />
          </view>

          <label value="Articles" style={styles.sectionTitle} numberOfLines={1} />
          {this.storeGroups().map(group => this.renderStoreGroup(group))}

          <label value="Note pour la boutique" style={styles.sectionTitle} numberOfLines={1} />
          <view style={styles.noteField}>
            <textfield
              style={styles.noteInput}
              value={this.state.orderNote}
              placeholder="Instructions pour le vendeur (facultatif)"
              placeholderColor={colors.textTertiary}
              autocorrection="none"
              autocapitalization="sentences"
              onChange={this.handleNoteChange}
            />
          </view>

          <label value="Paiement" style={styles.sectionTitle} numberOfLines={1} />
          <view style={styles.walletCard}>
            <view style={styles.walletIconFrame}>
              <image src={navigationIcons.money03} tint={colors.textPrimary} width={22} height={22} objectFit="contain" />
            </view>
            <layout style={styles.walletCopy}>
              <label value="Wallet Haycee" style={styles.walletTitle} numberOfLines={1} />
              <label value="Paiement Wallet en mode démo · aucun débit réel" style={styles.walletDescription} numberOfLines={2} />
            </layout>
            <view style={styles.walletRadioSelected}>
              <view style={styles.walletRadioDot} />
            </view>
          </view>

          <label value="Récapitulatif" style={styles.sectionTitle} numberOfLines={1} />
          <view style={styles.summaryCard}>
            {this.renderSummaryRow('Sous-total', getCartAmountLabel(this.viewModel.items, subtotal))}
            {discount > 0 ? this.renderSummaryRow('Réductions', `−${getCartAmountLabel(this.viewModel.items, discount)}`, true) : null}
            {this.renderSummaryRow('Livraison et expédition', getCartAmountLabel(this.viewModel.items, shipping))}
            <Hairline color={colors.borderDefault} />
            {this.renderSummaryRow('Total', total)}
          </view>
          <view height={layout.navigation.bottomTabContentPadding + bottomInset + spacing.xl} />
        </layout>
      </scroll>
      <view style={styles.footer.extend({ paddingBottom: bottomInset + spacing.sm })}>
        <Hairline color={colors.borderDefault} />
        <layout style={styles.footerTotalRow}>
          <label value={`Total (${itemCount} article${itemCount === 1 ? '' : 's'})`} style={styles.footerTotalLabel} numberOfLines={1} />
          <label value={total} style={styles.footerTotalValue} numberOfLines={1} textOverflow="ellipsis" />
        </layout>
        <DSButton
          title="Confirmer avec le Wallet"
          variant="cta"
          size="fullWidth"
          height={layout.cart.checkout.footerButtonHeight}
          textCase="none"
          icon={navigationIcons.money03}
          iconSize={18}
          loading={this.state.isSubmitting}
          disabled={this.viewModel.items.length === 0}
          onTap={this.placeOrder}
          accessibilityLabel="Confirmer la commande en mode démo avec le Wallet"
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
  content: new Style<Layout>({ flexDirection: 'column', paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.lg, width: '100%' }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.large), marginBottom: spacing.sm, marginTop: spacing.lg }),
  addressCard: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'row', padding: spacing.md, width: '100%' }),
  addressCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm, marginRight: spacing.sm, minWidth: 0 }),
  addressTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body) }),
  addressValue: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.label), marginTop: spacing.xs }),
  storeCard: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', marginBottom: spacing.sm, padding: spacing.sm, width: '100%' }),
  storeHeader: new Style<View>({ alignItems: 'center', flexDirection: 'row', paddingBottom: spacing.sm, paddingLeft: spacing.xs, paddingRight: spacing.xs, paddingTop: spacing.xs, width: '100%' }),
  storeAvatarFrame: new Style<View>({ borderRadius: radius.full, flexShrink: 0, height: layout.cart.storeAvatarSize, position: 'relative', width: layout.cart.storeAvatarSize }),
  storeAvatarFallback: new Style<View>({ backgroundColor: colors.backgroundPrimary, borderRadius: radius.full, height: '100%', width: '100%' }),
  storeAvatar: new Style<View>({ borderRadius: radius.full, height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }),
  storeName: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.semiBold(fontSize.product), marginLeft: spacing.sm, minWidth: 0 }),
  productRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', paddingBottom: spacing.sm, paddingLeft: spacing.xs, paddingRight: spacing.xs, paddingTop: spacing.sm, width: '100%' }),
  productImageFrame: new Style<View>({ alignItems: 'center', borderRadius: radius.xs, flexShrink: 0, height: layout.cart.checkout.productImageSize, justifyContent: 'center', width: layout.cart.checkout.productImageSize }),
  productImage: new Style<View>({ borderRadius: radius.xs, height: '100%', width: '100%' }),
  productCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm, marginRight: spacing.sm, minWidth: 0 }),
  productTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata) }),
  productVariants: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  productPrice: new Style<Label>({ color: colors.textTertiary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  productTotal: new Style<Label>({ color: colors.textPrimary, flexShrink: 0, font: montserrat.semiBold(fontSize.metadata) }),
  shippingRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginLeft: spacing.xs, marginTop: spacing.sm, minWidth: 0 }),
  shippingLabel: new Style<Label>({ color: colors.textSecondary, flexShrink: 0, font: montserrat.semiBold(fontSize.label), marginLeft: spacing.xs }),
  shippingAmount: new Style<Label>({ color: colors.textTertiary, flexShrink: 1, font: montserrat.semiBold(fontSize.label), marginLeft: spacing.xs }),
  noteField: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.sm, height: layout.cart.checkout.orderNoteInputHeight, justifyContent: 'center', paddingLeft: spacing.md, paddingRight: spacing.md, width: '100%' }),
  noteInput: new Style<TextField>({ color: colors.textPrimary, flexGrow: 1, flexShrink: 1, font: montserrat.regular(fontSize.body), height: layout.cart.checkout.orderNoteInputHeight, textAlign: 'left' }),
  walletCard: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderColor: colors.interactivePrimary, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', padding: spacing.md, width: '100%' }),
  walletIconFrame: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 }),
  walletCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm, marginRight: spacing.sm, minWidth: 0 }),
  walletTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body) }),
  walletDescription: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.tiny), marginTop: spacing.xs }),
  walletRadioSelected: new Style<View>({ alignItems: 'center', borderColor: colors.buttonPrimary, borderRadius: radius.full, borderWidth: 2, height: 20, justifyContent: 'center', width: 20 }),
  walletRadioDot: new Style<View>({ backgroundColor: colors.buttonPrimary, borderRadius: radius.full, height: 10, width: 10 }),
  summaryCard: new Style<View>({ backgroundColor: colors.backgroundSecondary, borderRadius: radius.md, flexDirection: 'column', padding: spacing.md, width: '100%' }),
  summaryRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: layout.cart.checkout.summaryRowHeight, width: '100%' }),
  summaryLabel: new Style<Label>({ color: colors.textSecondary, flexGrow: 1, flexShrink: 1, font: montserrat.regular(fontSize.label), marginRight: spacing.sm }),
  summaryValue: new Style<Label>({ color: colors.textPrimary, flexShrink: 0, font: montserrat.semiBold(fontSize.label) }),
  discountValue: new Style<Label>({ color: colors.interactivePrimary, flexShrink: 0, font: montserrat.semiBold(fontSize.label) }),
  footer: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexShrink: 0, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.sm, width: '100%' }),
  footerTotalRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.sm, paddingTop: spacing.sm, width: '100%' }),
  footerTotalLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.label) }),
  footerTotalValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.product) }),
};
