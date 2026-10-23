import { StatefulComponent } from 'valdi_core/src/Component';
import { Component } from 'valdi_core/src/Component';
import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { Device } from 'valdi_core/src/Device';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Asset } from 'valdi_tsx/src/Asset';
import { ScrollEvent } from 'valdi_tsx/src/GestureEvents';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ImageView, Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { Hairline } from '../design-system/components/Hairline';
import { ImageCarousel } from '../design-system/components/ImageCarousel';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { colors } from '../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { radius } from '../design-system/tokens/radius';
import { spacing } from '../design-system/tokens/spacing';
import { fontSize, metropolis, typography, transformText } from '../design-system/tokens/typography';
import { MasonryProduct } from '../design-system/components/MasonryProductCard';
import { ProductImageViewerScreen } from './ProductImageViewerScreen';
import { SellerProfileScreen } from '../sellers/SellerProfileScreen';

export interface ProductDetailViewModel {
  product: MasonryProduct;
  recommendations?: MasonryProduct[];
}

interface ProductDetailState {
  galleryIndex: number;
  selectedColorId: string;
  selectedSize: string;
  quantity: number;
  isFavorited: boolean;
  openSection: string;
}

interface ProductAccordionViewModel {
  title: string;
  summary?: string;
  body: string;
  icon: Asset;
  isOpen: boolean;
  onTap: () => void;
}

class ProductAccordion extends Component<ProductAccordionViewModel> {
  onRender(): void {
    const { title, summary, body, icon, isOpen, onTap } = this.viewModel;

    <layout style={styles.accordion}>
      <view style={styles.accordionHeader} onTap={onTap} accessibilityCategory="button">
        <image src={icon} tint={colors.textPrimary} width={20} height={20} objectFit="contain" />
        <label value={title} style={styles.accordionTitle} numberOfLines={1} />
        {!isOpen && summary ? <label value={summary} style={styles.accordionSummary} numberOfLines={1} /> : null}
        <image
          src={isOpen ? navigationIcons.arrowDown01Round : navigationIcons.arrowRight01Round}
          tint={colors.textSecondary}
          width={18}
          height={18}
          objectFit="contain"
        />
      </view>
      {isOpen ? <label value={body} style={styles.accordionBody} numberOfLines={0} /> : null}
    </layout>;
  }
}

class ProductRecommendationTile extends Component<{ product: MasonryProduct }> {
  onRender(): void {
    const product = this.viewModel.product;
    <view style={styles.recommendationTile} accessibilityCategory="button">
      <view style={styles.recommendationImage} backgroundColor={product.color}>
        {product.imageUrl ? <image src={product.imageUrl} width="100%" height="100%" objectFit="cover" /> : null}
      </view>
      <label value={transformText(product.title, 'capitalize')} style={styles.recommendationTitle} numberOfLines={2} />
      <label value={product.price} style={styles.recommendationPrice} numberOfLines={1} />
    </view>;
  }
}

/**
 * Product detail page opened directly from a product card.
 *
 * The page deliberately keeps one native vertical scroll container. Product
 * data is passed from the tapped card for now; the view model can later be
 * populated by the product API without changing the page/navigation contract.
 */
@NavigationPage(module)
export class ProductDetailScreen extends NavigationPageStatefulComponent<ProductDetailViewModel, ProductDetailState> {
  state: ProductDetailState = {
    galleryIndex: 0,
    selectedColorId: 'default',
    selectedSize: 'Unique',
    quantity: 1,
    isFavorited: false,
    openSection: 'shipping',
  };

  private readonly stickyTitleRef = new ElementRef<Label>();
  private readonly headerBackgroundRef = new ElementRef<View>();
  private readonly stickyVendorRef = new ElementRef<View>();
  private readonly mediaFavoriteIconRef = new ElementRef<ImageView>();
  private contentOffsetY = 0;
  private vendorRowOffsetY = 0;
  private vendorRowHeight = 64;
  private vendorRowContentOffsetY = Number.POSITIVE_INFINITY;
  private productTitleOffsetY = 0;
  private vendorRevealOffset = Number.POSITIVE_INFINITY;
  private titleRevealOffset = Number.POSITIVE_INFINITY;
  private stickyVendorVisible = false;
  private stickyTitleVisible = false;
  private headerBackgroundVisible = false;

  onCreate(): void {
    const product = this.viewModel.product;
    this.state = {
      ...this.state,
      selectedColorId: product.colors?.[0]?.id ?? 'default',
      selectedSize: product.sizes?.[0] ?? 'Unique',
      isFavorited: product.isFavorited ?? false,
    };
  }

  private productColors(): Array<{ id: string; name: string; hex: string }> {
    const colorsList = this.viewModel.product.colors;
    return colorsList && colorsList.length > 0
      ? colorsList
      : [{ id: 'default', name: 'Standard', hex: this.viewModel.product.color }];
  }

  private productSizes(): string[] {
    const sizes = this.viewModel.product.sizes;
    return sizes && sizes.length > 0 ? sizes : ['Unique'];
  }

  private productImages(): string[] {
    const product = this.viewModel.product;
    if (product.imageUrls && product.imageUrls.length > 0) return product.imageUrls;
    return product.imageUrl ? [product.imageUrl] : [];
  }
  private handleBack = (): void => {
    this.navigationController.pop();
  };

  private handleOpenImageViewer = (): void => {
    this.navigationController.push(
      ProductImageViewerScreen,
      { product: this.viewModel.product, initialIndex: this.state.galleryIndex },
      {},
    );
  };

  private handleOpenSeller = (): void => {
    this.navigationController.push(
      SellerProfileScreen,
      { product: this.viewModel.product },
      {},
    );
  };

  private showFeedback = (message: string): void => {
    TransientFeedback.show({ message, duration: 1800 });
  };

  private handleFavorite = (): void => {
    const isFavorited = !this.state.isFavorited;
    this.setState({ isFavorited });
    const icon = this.mediaFavoriteIconRef.single();
    if (icon) {
      icon.setAttribute('scaleX', 0.72);
      icon.setAttribute('scaleY', 0.72);
      this.animate(
        { stiffness: 480, damping: 15, beginFromCurrentState: true },
        () => {
          icon.setAttribute('scaleX', 1);
          icon.setAttribute('scaleY', 1);
        },
      );
    }
    TransientFeedback.show({
      message: isFavorited ? 'Ajouté aux favoris' : 'Retiré des favoris',
      icon: navigationIcons.favourite,
      duration: 1800,
    });
  };

  private handleBuyNow = (): void => {
    this.showFeedback('Passage au paiement');
  };

  private handleMessageSeller = (): void => {
    this.showFeedback('Contacter le vendeur');
  };

  private handleGalleryIndexChange = (index: number): void => {
    if (index !== this.state.galleryIndex) this.setState({ galleryIndex: index });
  };

  private handleColorSelect = (id: string): void => {
    this.setState({ selectedColorId: id });
  };

  private handleSizeSelect = (size: string): void => {
    this.setState({ selectedSize: size });
  };

  private decreaseQuantity = (): void => {
    this.setState({ quantity: Math.max(1, this.state.quantity - 1) });
  };

  private increaseQuantity = (): void => {
    this.setState({ quantity: this.state.quantity + 1 });
  };

  private toggleSection = (section: string): void => {
    this.setState({ openSection: this.state.openSection === section ? '' : section });
  };

  private stickyHeaderHeight = (): number => 56 + spacing.sm * 2 + Math.max(0, Device.getDisplayTopInset());

  private productMediaHeight = (): number => {
    const width = Math.max(Device.getWindowWidth(), 1);
    return Math.round(Math.min(width * 1.05, 520));
  };

  private updateTitleRevealOffset = (): void => {
    const headerHeight = this.stickyHeaderHeight();
    const mediaHeight = this.productMediaHeight();
    const vendorRowStartY = mediaHeight - spacing.lg + spacing.xl;
    this.vendorRevealOffset = Math.max(0, vendorRowStartY + this.vendorRowHeight - headerHeight);
    this.titleRevealOffset = Math.max(0, this.contentOffsetY + this.productTitleOffsetY - headerHeight);
  };

  private handleContentLayout = (frame: ElementFrame): void => {
    this.contentOffsetY = frame.y;
    this.vendorRowContentOffsetY = this.contentOffsetY + this.vendorRowOffsetY;
    this.updateTitleRevealOffset();
  };

  private handleVendorLayout = (frame: ElementFrame): void => {
    this.vendorRowOffsetY = frame.y;
    this.vendorRowHeight = Math.max(1, frame.height);
    this.vendorRowContentOffsetY = this.contentOffsetY + this.vendorRowOffsetY;
    this.vendorRevealOffset = Math.max(
      0,
      this.vendorRowContentOffsetY + this.vendorRowHeight - this.stickyHeaderHeight(),
    );
  };

  private handleProductTitleLayout = (frame: ElementFrame): void => {
    this.productTitleOffsetY = frame.y;
    this.updateTitleRevealOffset();
  };

  private updateStickyVendor = (scrollOffsetY: number): void => {
    const vendor = this.stickyVendorRef.single();
    if (!vendor) return;

    const fallbackRevealOffset = Math.max(
      0,
      this.productMediaHeight() - spacing.lg + spacing.xl + this.vendorRowHeight - this.stickyHeaderHeight(),
    );
    const vendorRevealOffset = Number.isFinite(this.vendorRevealOffset)
      ? this.vendorRevealOffset
      : fallbackRevealOffset;
    const titleRevealOffset = Number.isFinite(this.titleRevealOffset)
      ? this.titleRevealOffset
      : vendorRevealOffset;
    const revealOffset = Math.max(vendorRevealOffset, titleRevealOffset);
    const visible = scrollOffsetY >= revealOffset;
    if (visible === this.stickyVendorVisible) return;

    this.stickyVendorVisible = visible;
    this.animate(
      { duration: 0.32, curve: AnimationCurve.EaseOut, beginFromCurrentState: true },
      () => {
        vendor.setAttribute('opacity', visible ? 1 : 0);
        vendor.setAttribute('translationY', visible ? 0 : 8);
      },
    );
  };

  private handleProductScroll = (event: ScrollEvent): void => {
    if (this.contentOffsetY > 0) {
      const headerHeight = this.stickyHeaderHeight();
      const shouldShowHeaderBackground = event.y >= Math.max(0, this.contentOffsetY - headerHeight - spacing.lg);
      if (shouldShowHeaderBackground !== this.headerBackgroundVisible) {
        this.headerBackgroundVisible = shouldShowHeaderBackground;
        const background = this.headerBackgroundRef.single();
        if (background) {
          this.animate(
            { duration: 0.2, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
            () => background.setAttribute('opacity', shouldShowHeaderBackground ? 1 : 0),
          );
        }
      }
    }

    this.updateStickyVendor(event.y);

    const shouldShowTitle = event.y >= this.titleRevealOffset;
    if (shouldShowTitle === this.stickyTitleVisible) return;

    this.stickyTitleVisible = shouldShowTitle;
    const title = this.stickyTitleRef.single();
    if (!title) return;

    this.animate(
      { duration: 0.22, curve: AnimationCurve.EaseInOut, beginFromCurrentState: true },
      () => {
        title.setAttribute('opacity', shouldShowTitle ? 1 : 0);
        title.setAttribute('translationY', shouldShowTitle ? 0 : -6);
      },
    );
  };

  private renderHeader(): void {
    <view style={styles.headerContent}>
      <view style={styles.headerButton} onTap={this.handleBack} accessibilityCategory="button">
        <image src={navigationIcons.arrowLeft01Round} tint={colors.textPrimary} width={24} height={24} objectFit="contain" />
      </view>
      <view style={styles.stickyTitleSlot}>
        <label
          ref={this.stickyTitleRef}
          value={transformText(this.viewModel.product.title, 'capitalize')}
          style={styles.stickyTitle}
          numberOfLines={1}
        />
      </view>
      <layout style={styles.headerActions}>
        <view style={styles.headerButton} onTap={() => this.showFeedback('Recherche')} accessibilityCategory="button">
          <image src={navigationIcons.search02} tint={colors.textPrimary} width={22} height={22} objectFit="contain" />
        </view>
        <view style={styles.headerShareButton} onTap={() => this.showFeedback('Partager le produit')} accessibilityCategory="button">
          <image src={navigationIcons.share01} tint={colors.textPrimary} width={22} height={22} objectFit="contain" />
        </view>
      </layout>
    </view>;
  }

  private renderMedia(product: MasonryProduct, images: string[]): void {
    const width = Device.getWindowWidth();
    const height = Math.round(Math.min(Math.max(width, 1) * 1.05, 520));
    const fallbackColors = product.galleryColors ?? [product.color];

    <view style={styles.media} height={height}>
      <ImageCarousel
        imageUrls={images.length > 0 ? images : undefined}
        fallbackColors={fallbackColors}
        width={width}
        height={height}
        paginationBottomOffset={spacing.md}
        showCounter={false}
        onTap={this.handleOpenImageViewer}
        onIndexChange={this.handleGalleryIndexChange}
      />
      {product.badgeText ? (
        <view style={styles.mediaBadge}>
          <label value={transformText(product.badgeText, 'upper')} style={styles.mediaBadgeText} />
        </view>
      ) : null}
      {product.isFlashSale ? (
        <view style={styles.flashBadge}>
          <label value="⚡ FLASH" style={styles.flashBadgeText} />
        </view>
      ) : null}
      <view style={styles.mediaFavorite} onTap={this.handleFavorite} accessibilityCategory="button">
        <image
          ref={this.mediaFavoriteIconRef}
          src={this.state.isFavorited ? navigationIcons.favouriteBold : navigationIcons.favourite}
          tint={this.state.isFavorited ? colors.textDanger : colors.textPrimary}
          width={24}
          height={24}
          objectFit="contain"
        />
      </view>
    </view>;
  }

  private handleAddToCart = (): void => {
    TransientFeedback.show({
      message: 'Votre article a été ajouté au panier',
      icon: navigationIcons.shoppingCartAdd02,
      duration: 2200,
    });
  };

  private renderVendor(product: MasonryProduct): void {
    const vendorName = product.vendorName ?? 'Boutique Haycee';
    const initial = vendorName.charAt(0).toUpperCase();

    <view
      style={styles.vendorRow}
      onLayout={this.handleVendorLayout}
      onTap={this.handleOpenSeller}
      accessibilityCategory="button"
    >
      {product.vendorAvatarUrl ? (
        <image src={product.vendorAvatarUrl} style={styles.vendorAvatar} objectFit="cover" />
      ) : (
        <view style={styles.vendorAvatarFallback}>
          <label value={initial} style={styles.vendorInitial} />
        </view>
      )}
      <layout style={styles.vendorDetails}>
        <label value={vendorName} style={styles.vendorName} numberOfLines={1} />
        <label
          value={(product.vendorRating ?? '4.8') + ' · ' + (product.vendorSales ?? '120 ventes')}
          style={styles.vendorMeta}
          numberOfLines={1}
        />
      </layout>
      <view style={styles.vendorAction} onTap={this.handleOpenSeller} accessibilityCategory="button">
        <label value="Voir la boutique" style={styles.vendorActionText} />
      </view>
    </view>;
  }

  private renderStickyVendor(product: MasonryProduct): void {
    const vendorName = product.vendorName ?? 'Boutique Haycee';
    const initial = vendorName.charAt(0).toUpperCase();

    <view
      ref={this.stickyVendorRef}
      style={styles.stickyVendor.extend({
        opacity: this.stickyVendorVisible ? 1 : 0,
        translationY: this.stickyVendorVisible ? 0 : 8,
      })}
      onTap={this.handleOpenSeller}
      accessibilityCategory="button"
    >
      {product.vendorAvatarUrl ? (
        <image src={product.vendorAvatarUrl} style={styles.stickyVendorAvatar} objectFit="cover" />
      ) : (
        <view style={styles.stickyVendorAvatarFallback}>
          <label value={initial} style={styles.stickyVendorInitial} />
        </view>
      )}
      <view style={styles.stickyVendorDetails}>
        <label value={vendorName} style={styles.stickyVendorName} numberOfLines={1} />
        <label
          value={(product.vendorRating ?? '4.8') + ' ★ · ' + (product.vendorSales ?? '120 ventes')}
          style={styles.stickyVendorMeta}
          numberOfLines={1}
        />
      </view>
      <image src={navigationIcons.moreHorizontalCircle01} tint={colors.textPrimary} width={24} height={24} objectFit="contain" />
    </view>;
  }

  private renderVariants(): void {
    const colorsList = this.productColors();
    const sizes = this.productSizes();

    <layout style={styles.variantsSection}>
      <label value="Options" style={styles.sectionTitle} />
      <layout style={styles.optionHeading}>
        <label value="Couleur" style={styles.optionLabel} />
        <label value={colorsList.find(item => item.id === this.state.selectedColorId)?.name ?? 'Standard'} style={styles.optionValue} />
      </layout>
      <scroll {...noBounceScrollAttributes} horizontal={true} showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
        <layout style={styles.colorOptions}>
          {colorsList.map(item => (
            <view
              key={item.id}
              style={this.state.selectedColorId === item.id ? styles.colorOptionSelected : styles.colorOption}
              onTap={() => this.handleColorSelect(item.id)}
              accessibilityCategory="button"
            >
              <view style={styles.colorDot.extend({ backgroundColor: item.hex })} />
            </view>
          ))}
        </layout>
      </scroll>
      <layout style={styles.optionHeading}>
        <label value="Taille" style={styles.optionLabel} />
        <label value={this.state.selectedSize} style={styles.optionValue} />
      </layout>
      <scroll {...noBounceScrollAttributes} horizontal={true} showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
        <layout style={styles.sizeOptions}>
          {sizes.map(size => (
            <view
              key={size}
              style={this.state.selectedSize === size ? styles.sizeOptionSelected : styles.sizeOption}
              onTap={() => this.handleSizeSelect(size)}
              accessibilityCategory="button"
            >
              <label value={size} style={this.state.selectedSize === size ? styles.sizeTextSelected : styles.sizeText} />
            </view>
          ))}
        </layout>
      </scroll>
      <layout style={styles.quantityRow}>
        <label value="Quantité" style={styles.optionLabel} />
        <layout style={styles.quantityControls}>
          <view style={styles.quantityButton} onTap={this.decreaseQuantity} accessibilityCategory="button">
            <image src={navigationIcons.remove02} tint={colors.textPrimary} width={16} height={16} objectFit="contain" />
          </view>
          <label value={String(this.state.quantity)} style={styles.quantityValue} />
          <view style={styles.quantityButton} onTap={this.increaseQuantity} accessibilityCategory="button">
            <image src={navigationIcons.add02} tint={colors.textPrimary} width={16} height={16} objectFit="contain" />
          </view>
        </layout>
      </layout>
    </layout>;
  }

  private renderAccordions(product: MasonryProduct): void {
    const description = product.description ?? 'Une sélection Haycee pensée pour votre quotidien. Découvrez les détails du produit et choisissez vos options.';
    const details = [
      'Catégorie : ' + (product.category ?? 'Sélection Haycee'),
      'État : ' + (product.conditionLabel ?? 'Neuf'),
      product.stockCount === undefined ? 'Disponibilité : En stock' : 'Disponibilité : ' + product.stockCount + ' disponible(s)',
      product.tags && product.tags.length > 0 ? 'Tags : ' + product.tags.join(', ') : 'Produit sélectionné avec soin par Haycee',
    ].join('\n');

    <layout style={styles.accordions}>
      <ProductAccordion
        title="Livraison"
        summary={product.shippingFree === false ? product.shippingPrice ?? 'Frais calculés' : 'Gratuite'}
        body={product.shippingFree === false
          ? 'Livraison disponible. Frais estimés : ' + (product.shippingPrice ?? 'calculés au paiement') + '.'
          : 'Livraison gratuite. Les informations de suivi seront disponibles après l’expédition.'}
        icon={navigationIcons.deliveryTruck02}
        isOpen={this.state.openSection === 'shipping'}
        onTap={() => this.toggleSection('shipping')}
      />
      <ProductAccordion
        title="Retours et remboursements"
        body="Retour accepté selon les conditions de la commande. Contactez le support depuis votre espace client pour lancer une demande."
        icon={navigationIcons.returnRequest}
        isOpen={this.state.openSection === 'returns'}
        onTap={() => this.toggleSection('returns')}
      />
      <ProductAccordion
        title="Détails du produit"
        body={details}
        icon={navigationIcons.package}
        isOpen={this.state.openSection === 'details'}
        onTap={() => this.toggleSection('details')}
      />
      <ProductAccordion
        title="Description"
        body={description}
        icon={navigationIcons.informationCircle}
        isOpen={this.state.openSection === 'description'}
        onTap={() => this.toggleSection('description')}
      />
      <ProductAccordion
        title="Avis clients"
        summary={(product.rating ?? '4.8') + '/5'}
        body={(product.rating ?? '4.8') + '/5 · ' + (product.reviewCount ?? '248 avis') + '\nLes avis clients seront affichés ici dès que les données seront disponibles.'}
        icon={navigationIcons.star}
        isOpen={this.state.openSection === 'reviews'}
        onTap={() => this.toggleSection('reviews')}
      />
    </layout>;
  }

  private renderBottomBar(bottomInset: number): void {
    <view style={bottomInset > 0 ? styles.bottomBar.extend({ paddingBottom: bottomInset + spacing.sm }) : styles.bottomBar}>
      <Hairline color={colors.borderDefault} />
      <layout style={styles.bottomActions}>
        <view style={styles.bottomMessage} onTap={this.handleMessageSeller} accessibilityCategory="button">
          <image src={navigationIcons.bubbleChat} tint={colors.textPrimary} width={20} height={20} objectFit="contain" />
          <label value="Message" style={styles.bottomMessageLabel} numberOfLines={1} />
        </view>
        <view style={styles.bottomAdd} onTap={this.handleAddToCart} accessibilityCategory="button">
          <label value="Ajouter" style={styles.bottomAddText} />
        </view>
        <view style={styles.bottomBuy} onTap={this.handleBuyNow} accessibilityCategory="button">
          <label value="Acheter" style={styles.bottomBuyText} />
        </view>
      </layout>
    </view>;
  }

  onRender(): void {
    const product = this.viewModel.product;
    const images = this.productImages();
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const discount = product.originalPrice && product.originalPrice !== product.price
      ? product.discountLabel
      : undefined;

    <layout style={styles.root}>
      <view style={styles.headerOverlay.extend({ height: this.stickyHeaderHeight() + 64 })}>
        <view style={topInset > 0 ? styles.header.extend({ paddingTop: topInset }) : styles.header}>
          <view ref={this.headerBackgroundRef} style={styles.headerBackground} />
          {this.renderHeader()}
        </view>
        <view style={styles.stickyVendorSlot.extend({ top: this.stickyHeaderHeight() })}>
          {this.renderStickyVendor(product)}
        </view>
      </view>
      <scroll
        {...noBounceScrollAttributes}
        style={styles.scroll}
        onScroll={this.handleProductScroll}
        showsVerticalScrollIndicator={false}
        viewportExtensionBottom={160}
      >
        {this.renderMedia(product, images)}

        <view style={styles.content} onLayout={this.handleContentLayout}>
          {this.renderVendor(product)}
          {product.isLive ? (
            <view style={styles.liveRow} onTap={() => this.showFeedback('Live')} accessibilityCategory="button">
              <label value="PRÉSENTÉ EN DIRECT" style={styles.liveTitle} />
              <label value="Rejoindre le live" style={styles.liveAction} />
            </view>
          ) : null}
          {product.isFlashSale ? (
            <view style={styles.offerBanner}>
              <label value="VENTE FLASH" style={styles.offerTitle} />
              <label value="Offre limitée dans le temps" style={styles.offerBody} />
            </view>
          ) : null}
          <label
            value={transformText(product.title, 'capitalize')}
            style={styles.productTitle}
            numberOfLines={0}
            onLayout={this.handleProductTitleLayout}
          />

          <layout style={styles.priceRow}>
            <label value={product.price} style={styles.price} />
            {product.originalPrice ? (
              <label value={product.originalPrice} style={styles.originalPrice} />
            ) : null}
            {discount ? (
              <view style={styles.discountBadge}>
                <label value={discount} style={styles.discountText} />
              </view>
            ) : null}
          </layout>

          <layout style={styles.statsRow}>
            <label value={`★ ${product.rating ?? '4.8'}`} style={styles.statStrong} />
            <label value={product.soldCount ?? '120 vendus'} style={styles.stat} />
            {product.isFlashSale ? (
              <label value="Flash" style={styles.flashStat} />
            ) : null}
          </layout>
          {product.isFeatured ? <label value="SÉLECTION HAYCEE" style={styles.featuredLabel} /> : null}
          <Hairline color={colors.borderDefault} />
          {this.renderVariants()}
          <Hairline color={colors.borderDefault} />
          {this.renderAccordions(product)}
          {this.viewModel.recommendations && this.viewModel.recommendations.length > 0 ? (
            <layout style={styles.recommendations}>
              <label value="Vous aimerez aussi" style={styles.sectionTitle} />
              <scroll {...noBounceScrollAttributes} horizontal={true} showsHorizontalScrollIndicator={false} style={styles.recommendationScroll}>
                <layout style={styles.recommendationContent}>
                  {this.viewModel.recommendations.map(item => <ProductRecommendationTile key={item.id} product={item} />)}
                </layout>
              </scroll>
            </layout>
          ) : null}
          <view height={bottomInset + 112} />
        </view>
      </scroll>
      {this.renderBottomBar(bottomInset)}
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({
    flexGrow: 1,
    flexShrink: 1,
  }),
  scroll: new Style<ScrollView>({
    backgroundColor: colors.backgroundPrimary,
    flexGrow: 1,
  }),
  header: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    position: 'relative',
    width: '100%',
  }),
  headerButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  }),
  headerShareButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 40,
  }),
  headerOverlay: new Style<View>({
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  }),
  stickyVendorSlot: new Style<View>({
    height: 64,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  }),
  stickyVendor: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    flexDirection: 'row',
    height: 64,
    opacity: 0,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    translationY: 8,
    width: '100%',
  }),
  stickyVendorAvatar: new Style<View>({
    borderRadius: radius.full,
    height: 40,
    width: 40,
  }),
  stickyVendorAvatarFallback: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  }),
  stickyVendorInitial: typography.bodyEmphasis,
  stickyVendorDetails: new Style<View>({
    flexShrink: 1,
    flexGrow: 1,
    marginLeft: spacing.md,
  }),
  stickyVendorName: typography.bodyEmphasis,
  stickyVendorMeta: typography.caption.extend({ marginTop: spacing.xs }),
  headerTitle: typography.headline.extend({
    font: metropolis.bold(fontSize.large),
  }),
  headerBackground: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    bottom: 0,
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  }),
  stickyTitleSlot: new Style<View>({
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: spacing.lg + 40,
    position: 'absolute',
    right: spacing.lg + 88,
    top: 0,
    zIndex: 1,
  }),
  stickyTitle: typography.button.extend({
    opacity: 0,
    textAlign: 'center',
    translationY: -6,
  }),
  media: new Style<View>({
    alignItems: 'center',
    height: 360,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  }),
  mediaLabel: new Style<Label>({
    color: 'rgba(255, 255, 255, 0.78)',
    font: metropolis.bold(fontSize.label),
    letterSpacing: 1.5,
  }),
  badge: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.sm,
    left: spacing.lg,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.xs,
    position: 'absolute',
    top: spacing.lg,
  }),
  badgeText: typography.badge,
  content: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    borderRadius: `${radius.xl} ${radius.xl} 0 0`,
    marginTop: -spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.xl,
  }),
  productTitle: typography.title1,
  priceRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.md,
  }),
  price: typography.price.extend({
    font: metropolis.black(fontSize.priceLarge),
  }),
  originalPrice: typography.priceLight.extend({
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  }),
  discountBadge: new Style<View>({
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.xs,
    marginLeft: spacing.sm,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.xs,
  }),
  discountText: typography.badge,
  statsRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  }),
  statStrong: typography.bodyEmphasis,
  stat: typography.caption.extend({
    marginLeft: spacing.md,
  }),
  flashStat: typography.caption.extend({
    color: colors.textDanger,
    marginLeft: spacing.md,
  }),
  section: new Style<Layout>({
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
  }),
  sectionTitle: typography.title2,
  body: typography.body.extend({
    color: colors.textSecondary,
    marginTop: spacing.md,
  }),
  detailRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  }),
  detailLabel: typography.caption,
  detailValue: typography.bodyEmphasis,
  actionContainer: new Style<View>({
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
  }),
  headerContent: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'space-between',
    minHeight: 56,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    position: 'relative',
  }),
  headerActions: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 'auto',
  }),
  mediaBadge: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.sm,
    left: spacing.lg,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.xs,
    position: 'absolute',
    top: spacing.lg,
  }),
  mediaBadgeText: typography.badge,
  flashBadge: new Style<View>({
    backgroundColor: colors.backgroundDark,
    bottom: spacing.lg,
    left: spacing.lg,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.xs,
    position: 'absolute',
  }),
  flashBadgeText: typography.badge.extend({ color: colors.textInverted }),
  mediaFavorite: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderRadius: radius.full,
    // Keep its center aligned with the 6pt carousel dots, raised clear of the overlapping panel.
    bottom: spacing.xxl + spacing.md - 17,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.lg,
    width: 40,
    zIndex: 2,
  }),
  vendorRow: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  }),
  vendorAvatar: new Style<View>({
    borderRadius: radius.full,
    height: 40,
    width: 40,
  }),
  vendorAvatarFallback: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  }),
  vendorInitial: typography.headline.extend({ font: metropolis.bold(fontSize.body) }),
  vendorDetails: new Style<Layout>({
    flexGrow: 1,
    marginLeft: spacing.md,
  }),
  vendorName: typography.bodyEmphasis,
  vendorMeta: typography.caption.extend({ marginTop: spacing.xs }),
  vendorAction: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.sm,
  }),
  vendorActionText: typography.buttonSmall,
  liveRow: new Style<View>({
    borderColor: colors.borderDefault,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
  }),
  liveTitle: typography.badge,
  liveAction: typography.buttonSmall.extend({ color: colors.textDanger }),
  offerBanner: new Style<View>({
    borderColor: colors.interactivePrimary,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  }),
  offerTitle: typography.badge.extend({ letterSpacing: 2 }),
  offerBody: typography.caption.extend({ marginTop: spacing.sm }),
  featuredLabel: typography.badge.extend({ color: colors.textSecondary, marginBottom: spacing.lg }),
  variantsSection: new Style<Layout>({
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
  }),
  optionHeading: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  }),
  optionLabel: typography.caption.extend({ letterSpacing: 1.2 }),
  optionValue: typography.bodyEmphasis,
  optionScroll: new Style<ScrollView>({ marginTop: spacing.sm }),
  colorOptions: new Style<Layout>({ flexDirection: 'row' }),
  colorOption: new Style<View>({
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radius.full,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 44,
  }),
  colorOptionSelected: new Style<View>({
    alignItems: 'center',
    borderColor: colors.textPrimary,
    borderRadius: radius.full,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 44,
  }),
  colorDot: new Style<View>({
    borderColor: colors.borderDefault,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 30,
    width: 30,
  }),
  sizeOptions: new Style<Layout>({ flexDirection: 'row' }),
  sizeOption: new Style<View>({
    alignItems: 'center',
    borderColor: colors.borderDefault,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    minWidth: 56,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.sm,
  }),
  sizeOptionSelected: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    minWidth: 56,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.sm,
  }),
  sizeText: typography.buttonSmall,
  sizeTextSelected: typography.buttonSmall.extend({ color: colors.textInverted }),
  quantityRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  }),
  quantityControls: new Style<Layout>({ alignItems: 'center', flexDirection: 'row' }),
  quantityButton: new Style<View>({
    alignItems: 'center',
    borderColor: colors.borderDefault,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  }),
  quantityValue: typography.bodyEmphasis.extend({ marginLeft: spacing.md, marginRight: spacing.md }),
  accordions: new Style<Layout>({ paddingTop: spacing.md }),
  accordion: new Style<Layout>({
    // Keep the accordion surface explicit so stale style metadata cannot omit it.
    paddingBottom: spacing.md,
    paddingLeft: 0,
    paddingRight: 0,
  }),
  accordionHeader: new Style<View>({ alignItems: 'center', flexDirection: 'row', minHeight: 64 }),
  accordionTitle: typography.button.extend({ flexGrow: 1, marginLeft: spacing.md }),
  accordionSummary: typography.caption.extend({ marginRight: spacing.sm }),
  accordionBody: typography.body.extend({
    color: colors.textSecondary,
    paddingBottom: spacing.lg,
    paddingLeft: 32,
    paddingRight: spacing.xl,
  }),
  recommendations: new Style<Layout>({ paddingBottom: spacing.xl, paddingTop: spacing.xxl }),
  recommendationScroll: new Style<ScrollView>({ marginTop: spacing.md }),
  recommendationContent: new Style<Layout>({ flexDirection: 'row' }),
  recommendationTile: new Style<View>({ marginRight: spacing.md, width: 140 }),
  recommendationImage: new Style<View>({ borderRadius: radius.md, height: 175, width: 140 }),
  recommendationTitle: typography.productTitle.extend({ marginTop: spacing.sm }),
  recommendationPrice: typography.price.extend({ marginTop: spacing.xs }),
  bottomBar: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    bottom: 0,
    left: 0,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
  }),
  bottomActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', paddingBottom: spacing.sm, paddingTop: spacing.sm }),
  bottomMessage: new Style<View>({ alignItems: 'center', height: 52, justifyContent: 'center', width: 58 }),
  bottomMessageLabel: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.medium(fontSize.nano),
    marginTop: spacing.xs,
  }),
  bottomAdd: new Style<View>({
    alignItems: 'center',
    borderColor: colors.textPrimary,
    borderRadius: radius.xs,
    borderWidth: 1,
    flexGrow: 1,
    height: 52,
    justifyContent: 'center',
    marginLeft: spacing.sm,
  }),
  bottomAddText: typography.buttonSmall,
  bottomBuy: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.interactivePrimary,
    borderRadius: radius.xs,
    flexGrow: 1,
    height: 52,
    justifyContent: 'center',
    marginLeft: spacing.sm,
  }),
  bottomBuyText: typography.buttonSmall,
};

