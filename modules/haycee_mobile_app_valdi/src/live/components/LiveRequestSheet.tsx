import { Device } from 'valdi_core/src/Device';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { MasonryFeed, MasonryItem, getMasonryImageAspectRatio } from '../../design-system/components/MasonryFeed';
import { bottomSheetSurfaceStyle } from '../../design-system/components/BottomSheet';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/radius';
import { spacing } from '../../design-system/tokens/spacing';
import { fontSize, montserrat } from '../../design-system/tokens/typography';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import type { LiveViewerProduct } from '../data/LiveViewerData';
import { LiveRequestProductCard } from './LiveRequestProductCard';

export interface LiveRequestSheetViewModel {
  products: LiveViewerProduct[];
  requestedProductIds: string[];
  onRequest: (product: LiveViewerProduct) => void;
}

interface LiveRequestSheetState {
  requestedProductIds: string[];
}

interface LiveRequestGridItem extends MasonryItem {
  product: LiveViewerProduct;
}

/** Full-height Live request sheet with the shared two-column masonry layout. */
@NavigationPage(module)
export class LiveRequestSheet extends NavigationPageStatefulComponent<LiveRequestSheetViewModel, LiveRequestSheetState> {
  state: LiveRequestSheetState = { requestedProductIds: [] };
  private gridItems: LiveRequestGridItem[] = [];

  onCreate(): void {
    this.state = {
      requestedProductIds: this.viewModel.requestedProductIds,
    };
    this.gridItems = this.viewModel.products.map(product => ({
      id: product.id,
      masonryAspectRatio: product.imageAspectRatio && product.imageAspectRatio > 0
        ? 1 / product.imageAspectRatio
        : undefined,
      product,
    }));
  }

  private close = (): void => {
    this.navigationController.dismiss(true);
  };

  private requestProduct = (product: LiveViewerProduct): void => {
    if (this.state.requestedProductIds.includes(product.id)) return;
    this.setState({ requestedProductIds: [...this.state.requestedProductIds, product.id] });
    this.viewModel.onRequest(product);
  };

  private renderProduct = (item: MasonryItem, columnWidth: number): void => {
    const gridItem = item as LiveRequestGridItem;
    <LiveRequestProductCard
      key={gridItem.product.id}
      product={gridItem.product}
      columnWidth={columnWidth}
      requestCount={gridItem.product.requestCount ?? 0}
      requested={this.state.requestedProductIds.includes(gridItem.product.id)}
      onRequest={this.requestProduct}
    />;
  };

  private estimateProductHeight = (item: MasonryItem, columnWidth: number): number =>
    Math.round(columnWidth * getMasonryImageAspectRatio(item)) + 52;

  onRender(): void {
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const sheetStyle = bottomSheetSurfaceStyle.extend({
      backgroundColor: colors.backgroundDark,
      borderRadius: `${radius.lg} ${radius.lg} 0 0`,
      flexDirection: 'column',
      height: '94%',
      paddingBottom: bottomInset + spacing.md,
      paddingTop: spacing.sm,
    });

    <layout style={styles.root}>
      <view style={sheetStyle}>
        <layout style={styles.header}>
          <view style={styles.closeButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Fermer les demandes de produits">
            <image src={navigationIcons.cancel01} tint={colors.textInverted} width={19} height={19} objectFit="contain" />
          </view>
        </layout>

        <view style={styles.notice}>
          <view style={styles.noticeIcon}>
            <image src={navigationIcons.userHandUp01} tint={colors.textInverted} width={18} height={18} objectFit="contain" />
          </view>
          <view style={styles.noticeCopy}>
            <label value="Appuyez sur Demander pour voir les produits" style={styles.noticeTitle} numberOfLines={2} />
            <label
              value="Nous informerons le vendeur de votre intérêt. Nous vous préviendrons dès que le bien sera présenté."
              style={styles.noticeMessage}
              numberOfLines={0}
            />
          </view>
        </view>

        {this.viewModel.products.length > 0 ? (
          <scroll style={styles.productsScroll} {...noBounceScrollAttributes} showsVerticalScrollIndicator={false}>
            <MasonryFeed
              items={this.gridItems}
              renderItem={this.renderProduct}
              estimateItemHeight={this.estimateProductHeight}
            />
          </scroll>
        ) : (
          <view style={styles.emptyState}>
            <label value="Aucun produit à demander pour le moment." style={styles.emptyLabel} numberOfLines={2} />
          </view>
        )}
      </view>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({ height: '100%', width: '100%' }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', height: 36, justifyContent: 'flex-end', marginBottom: spacing.xs, marginLeft: spacing.sm, marginRight: spacing.sm }),
  closeButton: new Style<View>({ alignItems: 'center', borderRadius: radius.full, height: 36, justifyContent: 'center', width: 36 }),
  notice: new Style<View>({
    alignItems: 'flex-start',
    backgroundColor: '#222225',
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    padding: spacing.md,
  }),
  noticeIcon: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    width: 34,
  }),
  noticeCopy: new Style<View>({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, marginLeft: spacing.sm }),
  noticeTitle: new Style<Label>({ color: colors.textInverted, font: montserrat.extraBold(fontSize.body) }),
  noticeMessage: new Style<Label>({ color: colors.textOnDarkSecondary, font: montserrat.regular(fontSize.metadata), marginTop: spacing.xs }),
  productsScroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  emptyState: new Style<View>({ alignItems: 'center', flexGrow: 1, justifyContent: 'center', padding: spacing.xl }),
  emptyLabel: new Style<Label>({ color: colors.textOnDarkSecondary, font: montserrat.regular(fontSize.body), textAlign: 'center' }),
};
