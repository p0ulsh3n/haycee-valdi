import { Device } from 'valdi_core/src/Device';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { ImageCarousel } from '../design-system/components/ImageCarousel';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { colors } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/radius';
import { spacing } from '../design-system/tokens/spacing';
import { typography } from '../design-system/tokens/typography';
import { MasonryProduct } from '../design-system/components/MasonryProductCard';
import { SellerProfileScreen } from '../sellers/SellerProfileScreen';

export interface ProductImageViewerViewModel {
  product: MasonryProduct;
  initialIndex?: number;
  imageRatio?: '1:1' | '3:4';
}

interface ProductImageViewerState {
  galleryIndex: number;
  isFavorited: boolean;
  viewportHeight: number;
  viewportWidth: number;
}

/** Full-screen product gallery opened from the PDP media carousel. */
@NavigationPage(module)
export class ProductImageViewerScreen extends NavigationPageStatefulComponent<
  ProductImageViewerViewModel,
  ProductImageViewerState
> {
  state: ProductImageViewerState = {
    galleryIndex: 0,
    isFavorited: false,
    viewportHeight: 0,
    viewportWidth: 0,
  };

  onCreate(): void {
    this.state = {
      galleryIndex: this.viewModel.initialIndex ?? 0,
      isFavorited: this.viewModel.product.isFavorited ?? false,
      viewportHeight: 0,
      viewportWidth: 0,
    };
  }

  private galleryWidth = (): number => Math.max(
    this.state.viewportWidth || Device.getWindowWidth(),
    1,
  );

  private footerHeight = (): number => 48 + spacing.md + spacing.lg;

  private galleryHeight = (bottomInset: number): number => {
    // Use the actual Valdi layout frame: Device dimensions can include the
    // physical display size, while this component may be inset by its host.
    // Reserve the footer inside that measured frame so it cannot be clipped.
    if (this.state.viewportHeight <= 0) return 1;

    return Math.max(
      1,
      Math.round(this.state.viewportHeight - bottomInset - this.footerHeight()),
    );
  };

  private handleRootLayout = (frame: ElementFrame): void => {
    const width = Math.max(0, Math.round(frame.width));
    const height = Math.max(0, Math.round(frame.height));
    if (width === this.state.viewportWidth && height === this.state.viewportHeight) return;

    this.setState({ viewportWidth: width, viewportHeight: height });
  };

  private handleGalleryIndexChange = (index: number): void => {
    if (index !== this.state.galleryIndex) {
      this.setState({ galleryIndex: index });
    }
  };

  private handleBack = (): void => {
    this.navigationController.pop();
  };

  private handleFavorite = (): void => {
    const isFavorited = !this.state.isFavorited;
    this.setState({ isFavorited });
    TransientFeedback.show({
      message: isFavorited ? 'Ajouté aux favoris' : 'Retiré des favoris',
      icon: isFavorited ? navigationIcons.favouriteBold : navigationIcons.favourite,
      duration: 1800,
    });
  };

  private handleShare = (): void => {
    TransientFeedback.show({ message: 'Partager le produit', duration: 1800 });
  };

  private handleShop = (): void => {
    this.navigationController.push(
      SellerProfileScreen,
      { product: this.viewModel.product },
      {},
    );
  };

  private renderHeader(topInset: number): void {
    <view style={styles.headerOverlay}>
      <view style={topInset > 0 ? styles.header.extend({ paddingTop: topInset }) : styles.header}>
        <view style={styles.headerButton} onTap={this.handleBack} accessibilityCategory="button">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.textInverted} width={24} height={24} objectFit="contain" />
        </view>
      </view>
    </view>;
  }

  private renderActions(bottomInset: number): void {
    <view style={styles.actions.extend({ paddingBottom: bottomInset + spacing.lg })}>
      <view style={styles.shopButton} onTap={this.handleShop} accessibilityCategory="button">
        <label value="Voir la boutique" style={styles.shopButtonText} numberOfLines={1} />
      </view>
      <view style={styles.iconButton} onTap={this.handleFavorite} accessibilityCategory="button">
        <image
          src={this.state.isFavorited ? navigationIcons.favouriteBold : navigationIcons.favourite}
          tint={this.state.isFavorited ? colors.textDanger : colors.textPrimary}
          width={24}
          height={24}
          objectFit="contain"
        />
      </view>
      <view style={styles.iconButton} onTap={this.handleShare} accessibilityCategory="button">
        <image src={navigationIcons.share01} tint={colors.textPrimary} width={24} height={24} objectFit="contain" />
      </view>
    </view>;
  }

  onRender(): void {
    const product = this.viewModel.product;
    const width = this.galleryWidth();
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const height = this.galleryHeight(bottomInset);

    <view style={styles.root} onLayout={this.handleRootLayout}>
      <ImageCarousel
        imageUrls={product.imageUrls ?? (product.imageUrl ? [product.imageUrl] : undefined)}
        fallbackColors={product.galleryColors ?? [product.color]}
        initialIndex={this.viewModel.initialIndex}
        topInset={topInset}
        width={width}
        height={height}
        onIndexChange={this.handleGalleryIndexChange}
      />
      {this.renderActions(bottomInset)}
      {this.renderHeader(topInset)}
    </view>;
  }
}

const styles = {
  root: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    height: '100%',
  }),
  headerOverlay: new Style<View>({
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  }),
  header: new Style<View>({
    alignItems: 'flex-start',
    minHeight: 56,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.lg,
    paddingTop: spacing.sm,
    width: '100%',
  }),
  headerButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  }),
  actions: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
    flexDirection: 'row',
    flexShrink: 0,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.md,
  }),
  shopButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.full,
    flexGrow: 1,
    height: 48,
    justifyContent: 'center',
    marginRight: spacing.sm,
  }),
  shopButtonText: typography.buttonSmall.extend({ color: colors.textPrimary }),
  iconButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 48,
  }),
};
