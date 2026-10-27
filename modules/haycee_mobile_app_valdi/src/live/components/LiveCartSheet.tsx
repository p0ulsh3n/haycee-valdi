import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { BottomSheetFooter, bottomSheetSurfaceStyle } from '../../design-system/components/BottomSheet';
import { Hairline } from '../../design-system/components/Hairline';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { formatFcfa } from '../../design-system/utils/money';
import type { LiveViewerCartItem } from '../data/LiveViewerData';

export interface LiveCartSheetViewModel {
  cartItems: LiveViewerCartItem[];
  onCartChange: (items: LiveViewerCartItem[]) => void;
  onCheckout: () => void;
}

interface LiveCartSheetState {
  cartItems: LiveViewerCartItem[];
}

/** Live-only cart sheet presented from the cart icon in the product sheet. */
@NavigationPage(module)
export class LiveCartSheet extends NavigationPageStatefulComponent<LiveCartSheetViewModel, LiveCartSheetState> {
  state: LiveCartSheetState = { cartItems: [] };

  onCreate(): void {
    this.state = { cartItems: this.viewModel.cartItems };
  }

  private close = (): void => this.navigationController.dismiss(true);

  private updateQuantity = (productId: string, delta: number): void => {
    const nextItems = this.state.cartItems.flatMap(item => {
      if (item.product.id !== productId) return [item];
      const quantity = item.quantity + delta;
      if (quantity <= 0) return [];
      const stock = item.product.stockLeft;
      return [{ ...item, quantity: stock === undefined ? quantity : Math.min(stock, quantity) }];
    });
    this.setState({ cartItems: nextItems });
    this.viewModel.onCartChange(nextItems);
  };

  private renderRow(item: LiveViewerCartItem): void {
    const product = item.product;
    <layout key={product.id} style={styles.cartRow}>
      <view style={styles.thumb.extend({ backgroundColor: product.color })}>
        {product.imageUrl ? <image src={product.imageUrl} style={styles.thumbImage} objectFit="cover" /> : null}
      </view>
      <layout style={styles.itemInfo}>
        <label value={product.title} style={styles.itemTitle} numberOfLines={1} />
        <label value={formatFcfa(product.price)} style={styles.itemPrice} numberOfLines={1} />
      </layout>
      <layout style={styles.quantityControl}>
        <view style={styles.quantityButton} onTap={() => this.updateQuantity(product.id, -1)} accessibilityCategory="button" accessibilityLabel="Diminuer la quantité">
          <image src={navigationIcons.remove02} width={16} height={16} objectFit="contain" />
        </view>
        <label value={`${item.quantity}`} style={styles.quantity} numberOfLines={1} />
        <view
          style={styles.quantityButton}
          opacity={product.stockLeft !== undefined && item.quantity >= product.stockLeft ? 0.4 : 1}
          onTapDisabled={product.stockLeft !== undefined && item.quantity >= product.stockLeft}
          onTap={() => this.updateQuantity(product.id, 1)}
          accessibilityCategory="button"
          accessibilityLabel="Augmenter la quantité"
        >
          <image src={navigationIcons.add02} width={16} height={16} objectFit="contain" />
        </view>
      </layout>
    </layout>;
  }

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const cartItems = this.state.cartItems;
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const sheetStyle = bottomSheetSurfaceStyle.extend({
      backgroundColor: colors.backgroundSecondary,
      borderRadius: `${radius.lg} ${radius.lg} 0 0`,
      flexDirection: 'column',
      height: '60%',
      paddingBottom: bottomInset + spacing.lg,
      paddingLeft: spacing.xl,
      paddingRight: spacing.xl,
      paddingTop: spacing.lg,
    });

    <layout style={styles.root}>
      <view style={sheetStyle}>
        <layout style={styles.header}>
          <layout style={styles.heading}>
            <label value="PANIER DU LIVE" style={styles.title} numberOfLines={1} />
            <label value={`${itemCount} article${itemCount === 1 ? '' : 's'}`} style={styles.subtitle} numberOfLines={1} />
          </layout>
          <view style={styles.closeButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Fermer le panier">
            <image src={navigationIcons.cancel01} tint={colors.textPrimary} width={20} height={20} objectFit="contain" />
          </view>
        </layout>
        <Hairline color={colors.borderDefault} />

        {cartItems.length > 0 ? (
          <scroll style={styles.itemsScroll} {...noBounceScrollAttributes} showsVerticalScrollIndicator={false}>
            <layout style={styles.itemsContent}>
              {cartItems.map(item => this.renderRow(item))}
            </layout>
          </scroll>
        ) : (
          <view style={styles.emptyState}>
            <label value="Ton panier live est vide." style={styles.emptyText} numberOfLines={1} />
          </view>
        )}

        {cartItems.length > 0 ? (
          <layout style={styles.summarySection}>
            <Hairline color={colors.borderDefault} />
            <layout style={styles.summary}>
              <label value="TOTAL" style={styles.totalLabel} numberOfLines={1} />
              <label value={formatFcfa(total)} style={styles.totalValue} numberOfLines={1} />
            </layout>
          </layout>
        ) : null}
        <BottomSheetFooter
          label="CONTINUER VERS LE PAIEMENT"
          onTap={this.viewModel.onCheckout}
          disabled={cartItems.length === 0}
          background="transparent"
        />
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 14 }),
  heading: new Style<Layout>({ flexDirection: 'column' }),
  title: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.label) }),
  subtitle: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.nano), marginTop: 2 }),
  closeButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.full, height: 40, justifyContent: 'center', width: 40 }),
  itemsScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  itemsContent: new Style<Layout>({ paddingBottom: spacing.md, paddingTop: spacing.md }),
  cartRow: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginBottom: spacing.md, minHeight: 64 }),
  thumb: new Style<View>({ borderRadius: radius.xs, flexShrink: 0, height: 56, width: 56 }),
  thumbImage: new Style<View>({ height: 56, width: 56 }),
  itemInfo: new Style<Layout>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.md, minWidth: 0 }),
  itemTitle: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata) }),
  itemPrice: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.metadata), marginTop: spacing.xs }),
  quantityControl: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', marginLeft: spacing.sm }),
  quantityButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundPrimary, borderRadius: radius.xs, height: 30, justifyContent: 'center', width: 30 }),
  quantity: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.metadata), marginLeft: spacing.sm, marginRight: spacing.sm }),
  emptyState: new Style<View>({ alignItems: 'center', flexGrow: 1, justifyContent: 'center' }),
  emptyText: new Style<Label>({ color: colors.textSecondary, font: montserrat.regular(fontSize.body) }),
  summarySection: new Style<Layout>({ flexDirection: 'column' }),
  summary: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.sm, paddingTop: spacing.md }),
  totalLabel: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.label) }),
  totalValue: new Style<Label>({ color: colors.textPrimary, font: montserrat.extraBold(fontSize.large) }),
};
