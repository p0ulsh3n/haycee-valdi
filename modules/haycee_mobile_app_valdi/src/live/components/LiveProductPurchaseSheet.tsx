import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { ImageView, Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { DSButton, Hairline, RadioSelection, bottomSheetSurfaceStyle, TransientFeedback } from '../../design-system/index';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { formatFcfa } from '../../design-system/utils/money';
import type { LiveViewerCartItem, LiveViewerProduct } from '../data/LiveViewerData';
import { getLiveViewerCartItemKey } from '../data/LiveViewerData';
import { registerLiveSheet } from '../LiveSheetVisibility';

export interface LiveProductPurchaseSheetViewModel {
  product: LiveViewerProduct;
  cartItems: LiveViewerCartItem[];
  intent: LiveProductPurchaseIntent;
  onAddToCart: (product: LiveViewerProduct, quantity: number, variantId?: string) => void;
  onBuyNow: (product: LiveViewerProduct, quantity: number, variantId?: string) => void;
}

export type LiveProductPurchaseIntent = 'add-to-cart' | 'buy-now';

interface LiveProductPurchaseSheetState {
  selectedVariantId: string;
  quantity: number;
  submitting: boolean;
}

/** Purchase configuration opened by an in-stock featured Live card or product-list action. */
@NavigationPage(module)
export class LiveProductPurchaseSheet extends NavigationPageStatefulComponent<LiveProductPurchaseSheetViewModel, LiveProductPurchaseSheetState> {
  state: LiveProductPurchaseSheetState = { selectedVariantId: '', quantity: 1, submitting: false };
  private submitting = false;
  private dismissing = false;
  private releaseSheetRegistration?: () => void;

  onCreate(): void {
    this.releaseSheetRegistration = registerLiveSheet();
    this.state = { selectedVariantId: '', quantity: 1, submitting: false };
    this.submitting = false;
    this.dismissing = false;
  }

  onDestroy(): void {
    this.releaseSheetRegistration?.();
    this.releaseSheetRegistration = undefined;
  }

  private close = (): void => {
    if (this.dismissing || this.submitting) return;
    this.dismissing = true;
    this.navigationController.dismiss(false);
  };

  private selectedVariant = () => this.viewModel.product.variantStocks?.find(variant => variant.id === this.state.selectedVariantId);

  private getVariantCartQuantity(variantId?: string): number {
    const key = `${this.viewModel.product.id}:${variantId ?? 'default'}`;
    return this.viewModel.cartItems.find(item => getLiveViewerCartItemKey(item) === key)?.quantity ?? 0;
  }

  private getAvailableStock(variantId?: string): number {
    const product = this.viewModel.product;
    const variant = variantId ? product.variantStocks?.find(item => item.id === variantId) : undefined;
    const stock = variant?.remaining ?? product.stockLeft;
    return Math.max(0, stock - this.getVariantCartQuantity(variantId));
  }

  private selectVariant = (selectedVariantId: string): void => {
    if (this.state.selectedVariantId === selectedVariantId) return;
    this.setState({ selectedVariantId, quantity: 1 });
  };

  private changeQuantity = (delta: number): void => {
    const hasVariants = (this.viewModel.product.variantStocks?.length ?? 0) > 0;
    if (hasVariants && !this.state.selectedVariantId) return;
    const available = this.getAvailableStock(this.state.selectedVariantId || undefined);
    const quantity = Math.max(1, Math.min(available, this.state.quantity + delta));
    if (quantity !== this.state.quantity) this.setState({ quantity });
  };

  private confirm = (): void => {
    if (this.submitting || this.dismissing) return;
    const product = this.viewModel.product;
    const hasVariants = (product.variantStocks?.length ?? 0) > 0;
    const variantId = this.state.selectedVariantId || undefined;
    if (hasVariants && !variantId) {
      TransientFeedback.show({ message: 'Choisissez une variante avant de continuer.' });
      return;
    }
    if (this.getAvailableStock(variantId) < this.state.quantity) {
      TransientFeedback.show({ message: 'La quantité sélectionnée n’est plus disponible.' });
      return;
    }

    this.submitting = true;
    this.dismissing = true;
    this.setState({ submitting: true });
    try {
      const action = this.viewModel.intent === 'buy-now' ? this.viewModel.onBuyNow : this.viewModel.onAddToCart;
      action(product, this.state.quantity, variantId);
      this.navigationController.dismiss(false);
    } catch {
      this.submitting = false;
      this.dismissing = false;
      this.setState({ submitting: false });
      TransientFeedback.show({ message: 'Impossible d’ajouter cet article au panier. Réessaie.' });
    }
  };

  private renderVariantOptions(): void {
    const variants = this.viewModel.product.variantStocks ?? [];
    if (variants.length === 0) return;

    <layout style={styles.variantSection}>
      <label value="Choisir une variante" style={styles.sectionTitle} numberOfLines={1} />
      {variants.map(variant => {
        const remaining = this.getAvailableStock(variant.id);
        const soldOut = remaining === 0;
        const label = `${variant.label} · ${soldOut ? 'Épuisé' : `${remaining} en stock`}`;
        <RadioSelection
          key={variant.id}
          label={label}
          selected={this.state.selectedVariantId === variant.id}
          disabled={soldOut}
          onTap={() => this.selectVariant(variant.id)}
          accessibilityLabel={`${variant.label}, ${soldOut ? 'épuisé' : `${remaining} en stock`}`}
        />;
      })}
    </layout>;
  }

  onRender(): void {
    const { product } = this.viewModel;
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const hasVariants = (product.variantStocks?.length ?? 0) > 0;
    const variant = this.selectedVariant();
    const variantId = this.state.selectedVariantId || undefined;
    const availableStock = this.getAvailableStock(variantId);
    const quantityEnabled = !hasVariants || !!variant;
    const canAdd = product.stockLeft > 0
      && availableStock > 0
      && (!hasVariants || !!variant)
      && !this.state.submitting;
    const subtotal = product.price * this.state.quantity;
    const estimatedTotal = subtotal + product.shippingAmount;
    const discountPercent = product.originalPrice !== undefined && product.originalPrice > product.price
      ? Math.round((product.originalPrice - product.price) / product.originalPrice * 100)
      : 0;
    const surfaceStyle = bottomSheetSurfaceStyle.extend({
      backgroundColor: colors.backgroundPrimary,
      borderRadius: `${radius.lg} ${radius.lg} 0 0`,
      flexDirection: 'column',
      height: '78%',
      paddingBottom: bottomInset + spacing.lg,
      paddingLeft: spacing.xl,
      paddingRight: spacing.xl,
      paddingTop: spacing.lg,
    });

    <layout style={styles.root}>
      <view style={surfaceStyle}>
        <layout style={styles.header}>
          <layout style={styles.headerTitleBlock}>
            <label value={this.viewModel.intent === 'buy-now' ? 'ACHETER' : 'AJOUTER AU PANIER'} style={styles.headerTitle} numberOfLines={1} />
            <label
              value={this.viewModel.intent === 'buy-now' ? 'Finalise les options de ton article' : 'Choisis les options avant de l’ajouter'}
              style={styles.headerSubtitle}
              numberOfLines={1}
            />
          </layout>
          <view style={styles.closeButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Fermer les détails d’achat">
            <image src={navigationIcons.cancel01} tint={colors.textPrimary} width={19} height={19} objectFit="contain" />
          </view>
        </layout>
        <Hairline color={colors.borderDefault} />

        <scroll style={styles.contentScroll} {...noBounceScrollAttributes} showsVerticalScrollIndicator={false}>
          <layout style={styles.content}>
            <layout style={styles.productSummary}>
              <view style={styles.productImageFrame.extend({ backgroundColor: product.color })}>
                {product.imageUrl ? <image src={product.imageUrl} style={styles.productImage} objectFit="cover" /> : null}
              </view>
              <layout style={styles.productCopy}>
                <label value={product.title} style={styles.productTitle} numberOfLines={2} textOverflow="ellipsis" />
                <layout style={styles.priceRow}>
                  <label value={formatFcfa(product.price)} style={styles.price} numberOfLines={1} />
                  {discountPercent > 0 && product.originalPrice !== undefined ? (
                    <label value={`${formatFcfa(product.originalPrice)} (-${discountPercent}%)`} style={styles.discount} numberOfLines={1} textOverflow="ellipsis" />
                  ) : null}
                </layout>
                {variant ? <label value={variant.label} style={styles.selectedVariant} numberOfLines={1} /> : null}
              </layout>
            </layout>

            {this.renderVariantOptions()}

            <layout style={styles.quantitySection}>
              <layout style={styles.quantityCopy}>
                <label value="Quantité" style={styles.sectionTitle} numberOfLines={1} />
                <label
                  value={hasVariants && !variant ? 'Choisis une variante' : availableStock > 0 ? `${availableStock} disponible${availableStock > 1 ? 's' : ''}` : 'Indisponible'}
                  style={styles.stockLabel}
                  numberOfLines={1}
                />
              </layout>
              <layout style={styles.quantityControls}>
                <view
                  style={styles.quantityButton}
                  opacity={!quantityEnabled || this.state.quantity <= 1 ? 0.45 : 1}
                  onTapDisabled={!quantityEnabled || this.state.quantity <= 1}
                  onTap={() => this.changeQuantity(-1)}
                  accessibilityCategory="button"
                  accessibilityLabel="Diminuer la quantité"
                >
                  <image src={navigationIcons.remove02} tint={colors.textPrimary} width={17} height={17} objectFit="contain" />
                </view>
                <label value={`${this.state.quantity}`} style={styles.quantityValue} numberOfLines={1} />
                <view
                  style={styles.quantityButton}
                  opacity={!quantityEnabled || this.state.quantity >= availableStock ? 0.45 : 1}
                  onTapDisabled={!quantityEnabled || this.state.quantity >= availableStock}
                  onTap={() => this.changeQuantity(1)}
                  accessibilityCategory="button"
                  accessibilityLabel="Augmenter la quantité"
                >
                  <image src={navigationIcons.add02} tint={colors.textPrimary} width={17} height={17} objectFit="contain" />
                </view>
              </layout>
            </layout>

            <Hairline color={colors.borderDefault} />
            <layout style={styles.costRow}>
              <label value="Sous-total" style={styles.costLabel} numberOfLines={1} />
              <label value={formatFcfa(subtotal)} style={styles.costValue} numberOfLines={1} />
            </layout>
            <layout style={styles.costRow}>
              <label value={product.shippingLabel} style={styles.costLabel} numberOfLines={1} />
              <label value={formatFcfa(product.shippingAmount)} style={styles.costValue} numberOfLines={1} />
            </layout>
            <layout style={styles.totalRow}>
              <label value="Total estimé" style={styles.totalLabel} numberOfLines={1} />
              <label value={formatFcfa(estimatedTotal)} style={styles.totalValue} numberOfLines={1} />
            </layout>
          </layout>
        </scroll>

        <DSButton
          title={this.viewModel.intent === 'buy-now' ? 'Acheter' : 'Ajouter au panier'}
          textCase="none"
          variant="cta"
          size="fullWidth"
          onTap={this.confirm}
          disabled={!canAdd}
          loading={this.state.submitting}
          accessibilityLabel={this.viewModel.intent === 'buy-now' ? `Acheter ${product.title}` : `Ajouter ${product.title} au panier`}
        />
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.md }),
  headerTitleBlock: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, minWidth: 0 }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.section) }),
  headerSubtitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata), marginTop: 2 }),
  closeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexShrink: 0, height: 38, justifyContent: 'center', marginLeft: spacing.md, width: 38 }),
  contentScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  content: new Style<Layout>({ flexDirection: 'column', paddingBottom: spacing.md, paddingTop: spacing.md }),
  productSummary: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginBottom: spacing.lg }),
  productImageFrame: new Style<View>({ borderRadius: radius.sm, flexShrink: 0, height: 88, overflow: 'visible', width: 88 }),
  productImage: new Style<ImageView>({ height: 88, width: 88 }),
  productCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  productTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body), marginBottom: spacing.xs }),
  priceRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap' }),
  price: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.product), marginRight: spacing.sm }),
  discount: new Style<Label>({ color: colors.interactivePrimary, font: montserrat.semiBold(fontSize.nano) }),
  selectedVariant: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.nano), marginTop: spacing.xs }),
  variantSection: new Style<Layout>({ flexDirection: 'column', marginBottom: spacing.md }),
  sectionTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.label) }),
  quantitySection: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: spacing.sm }),
  quantityCopy: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1 }),
  stockLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.nano), marginTop: 3 }),
  quantityControls: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginLeft: spacing.md }),
  quantityButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, height: 34, justifyContent: 'center', width: 34 }),
  quantityValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body), marginLeft: spacing.md, marginRight: spacing.md, minWidth: 18, textAlign: 'center' }),
  costRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md }),
  costLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.metadata) }),
  costValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata) }),
  totalRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, paddingTop: spacing.md }),
  totalLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.body) }),
  totalValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.product) }),
};
