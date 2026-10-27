import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { bottomSheetSurfaceStyle, getBottomSheetNavigationOptions } from '../../design-system/components/BottomSheet';
import { Hairline } from '../../design-system/components/Hairline';
import { TransientFeedback } from '../../design-system/components/SnackBar';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import type { LiveViewerCartItem, LiveViewerProduct } from '../data/LiveViewerData';
import { LiveCartSheet } from './LiveCartSheet';
import { LiveProductSheetRow } from './LiveProductSheetRow';

export interface LiveProductsSheetViewModel {
  products: LiveViewerProduct[];
  cartItems: LiveViewerCartItem[];
  onCartChange: (items: LiveViewerCartItem[]) => void;
  onBuy: (product: LiveViewerProduct) => void;
  onCheckout: () => void;
}

interface LiveProductsSheetState {
  cartItems: LiveViewerCartItem[];
}

/** Product-list bottom sheet opened from the Live shop/cart action. */
@NavigationPage(module)
export class LiveProductsSheet extends NavigationPageStatefulComponent<LiveProductsSheetViewModel, LiveProductsSheetState> {
  state: LiveProductsSheetState = { cartItems: [] };

  onCreate(): void {
    this.state = { cartItems: this.viewModel.cartItems };
  }

  private close = (): void => {
    // Valdi's animated modal pop reads the parent NavigationView frame. That
    // container can already be detached in this Live overlay stack, so skip
    // that transition path and dismiss the modal without animation.
    this.navigationController.dismiss(false);
  };

  private updateCart = (cartItems: LiveViewerCartItem[]): void => {
    this.setState({ cartItems });
    this.viewModel.onCartChange(cartItems);
  };

  private addToCart = (product: LiveViewerProduct): void => {
    if (product.kind === 'auction' || product.stockLeft === 0) return;
    const current = this.state.cartItems.find(item => item.product.id === product.id);
    if (current && product.stockLeft !== undefined && current.quantity >= product.stockLeft) return;
    const next = current
      ? this.state.cartItems.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...this.state.cartItems, { product, quantity: 1 }];
    this.updateCart(next);
    TransientFeedback.show({ message: `${product.title} ajouté au panier du live.` });
  };

  private openCart = (): void => {
    const sheetOptions = { transparentPageBackground: true };
    this.navigationController.present(
      LiveCartSheet,
      {
        cartItems: this.state.cartItems,
        onCartChange: this.updateCart,
        onCheckout: this.viewModel.onCheckout,
      },
      {},
      { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions(sheetOptions) },
    );
  };

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const cartCount = this.state.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const sheetStyle = bottomSheetSurfaceStyle.extend({
      backgroundColor: colors.backgroundSecondary,
      borderRadius: `${radius.lg} ${radius.lg} 0 0`,
      flexDirection: 'column',
      height: '60%',
      paddingBottom: bottomInset + spacing.lg,
      paddingLeft: spacing.xl,
      paddingRight: spacing.xl,
      paddingTop: spacing.xl,
    });

    <layout style={styles.root}>
      <view style={sheetStyle}>
        <layout style={styles.header}>
          <layout style={styles.heading}>
            <label value="ARTICLES DU LIVE" style={styles.title} numberOfLines={1} />
            <label value={`${this.viewModel.products.length} articles`} style={styles.count} numberOfLines={1} />
          </layout>
          <layout style={styles.headerActions}>
            <view style={styles.cartButton} onTap={this.openCart} accessibilityCategory="button" accessibilityLabel={`Ouvrir le panier, ${cartCount} articles`}>
              <image src={navigationIcons.cart} tint={colors.textPrimary} width={22} height={22} objectFit="contain" />
              {cartCount > 0 ? (
                <view style={styles.cartBadge}>
                  <label value={cartCount > 99 ? '99+' : `${cartCount}`} style={styles.cartBadgeText} numberOfLines={1} />
                </view>
              ) : null}
            </view>
            <view style={styles.closeButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Fermer les articles du live">
              <image src={navigationIcons.cancel01} tint={colors.textPrimary} width={19} height={19} objectFit="contain" />
            </view>
          </layout>
        </layout>
        <Hairline color={colors.borderDefault} />

        {this.viewModel.products.length > 0 ? (
          <scroll style={styles.productsScroll} {...noBounceScrollAttributes} showsVerticalScrollIndicator={false}>
            <layout style={styles.productsList}>
              {this.viewModel.products.map((product, index) => (
                <LiveProductSheetRow
                  key={product.id}
                  product={product}
                  index={index}
                  onAdd={this.addToCart}
                  onBuy={this.viewModel.onBuy}
                />
              ))}
            </layout>
          </scroll>
        ) : (
          <view style={styles.emptyState}>
            <label value="Aucun article n’est affiché pour le moment." style={styles.emptyText} numberOfLines={2} />
          </view>
        )}
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 14 }),
  heading: new Style<Layout>({ flexDirection: 'column' }),
  title: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.label) }),
  count: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.nano), marginTop: 2 }),
  headerActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  cartButton: new Style<View>({ alignItems: 'center', height: 40, justifyContent: 'center', position: 'relative', width: 40 }),
  cartBadge: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.full, height: 16, justifyContent: 'center', minWidth: 16, paddingLeft: 4, paddingRight: 4, position: 'absolute', right: 0, top: 0 }),
  cartBadgeText: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.nano) }),
  closeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.full, height: 36, justifyContent: 'center', marginLeft: spacing.xs, width: 36 }),
  productsScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  productsList: new Style<Layout>({ paddingBottom: spacing.md, paddingTop: spacing.md }),
  emptyState: new Style<View>({ alignItems: 'center', flexGrow: 1, justifyContent: 'center' }),
  emptyText: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.body), textAlign: 'center' }),
};
