import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { StatefulComponent } from 'valdi_core/src/Component';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ImageView, Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { getMasonryImageAspectRatio } from './MasonryFeed';
import { colors } from '../tokens/colors';
import { fontSize, montserrat, typography, transformText } from '../tokens/typography';
import { formatPriceLabel } from '../utils/money';

export interface MasonryProduct {
  id: string;
  title: string;
  price: string;
  color: string;
  /** Optional remote/bundled product image supplied by the product API. */
  imageUrl?: string;
  imageUrls?: string[];
  /** Local/demo gallery panels used when an API has not supplied image URLs. */
  galleryColors?: string[];
  originalPrice?: string;
  discountLabel?: string;
  badgeText?: string;
  isLive?: boolean;
  isFlashSale?: boolean;
  isFavorited?: boolean;
  rating?: string;
  soldCount?: string;
  masonryAspectRatio?: number;
  description?: string;
  category?: string;
  /** Seller display name shown above the @username on storefronts. */
  vendorName?: string;
  /** Seller account username, kept separate from the display name. */
  vendorUsername?: string;
  vendorId?: string;
  vendorAvatarUrl?: string;
  vendorRating?: string;
  /** Seller rating summary, for example "5 (6)" in the seller profile badges. */
  vendorReviewSummary?: string;
  vendorSalesCount?: number;
  vendorFollowersCount?: number;
  vendorBio?: string;
  vendorCountry?: string;
  vendorCity?: string;
  vendorVerified?: boolean;
  vendorIsFollowing?: boolean;
  /** Seller dispatch estimate, for example "24H" in the seller profile badges. */
  vendorDispatchTime?: string;
  /** Seller delivery estimate, for example "1.7 Day" in the seller profile badges. */
  vendorDeliveryTime?: string;
  vendorSales?: string;
  colors?: Array<{ id: string; name: string; hex: string }>;
  sizes?: string[];
  reviewCount?: string;
  stockCount?: number;
  shippingFree?: boolean;
  shippingPrice?: string;
  conditionLabel?: string;
  tags?: string[];
  isFeatured?: boolean;
}

export interface MasonryProductCardViewModel {
  product: MasonryProduct;
  columnWidth: number;
  onTap?: (product: MasonryProduct) => void;
  onFavorite?: (product: MasonryProduct) => void;
  onQuickAdd?: (product: MasonryProduct) => void;
  animateIn?: boolean;
}

interface MasonryProductCardState {
  isFavorited: boolean;
  isQuickAddConfirmed: boolean;
  isVisible: boolean;
}

/** Reusable product card for every two-column Masonry feed in the app. */
export class MasonryProductCard extends StatefulComponent<
  MasonryProductCardViewModel,
  MasonryProductCardState
> {
  state: MasonryProductCardState = {
    isFavorited: this.viewModel.product.isFavorited ?? false,
    isQuickAddConfirmed: false,
    isVisible: true,
  };
  private cardRef = new ElementRef<View>();
  private favoriteIconRef = new ElementRef<ImageView>();
  private quickAddIconRef = new ElementRef<ImageView>();
  private fadeStarted = false;
  private quickAddAnimationToken = 0;

  private handleTap = (): void => {
    this.viewModel.onTap?.(this.viewModel.product);
  };

  private handleFavorite = (): void => {
    this.setState({ isFavorited: !this.state.isFavorited });
    const icon = this.favoriteIconRef.single();
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
    this.viewModel.onFavorite?.(this.viewModel.product);
  };

  private handleQuickAdd = (): void => {
    const token = ++this.quickAddAnimationToken;
    this.setState({ isQuickAddConfirmed: true });

    const icon = this.quickAddIconRef.single();
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

    this.viewModel.onQuickAdd?.(this.viewModel.product);

    this.setTimeoutDisposable(() => {
      if (this.isDestroyed() || token !== this.quickAddAnimationToken) {
        return;
      }

      const icon = this.quickAddIconRef.single();
      if (!icon) {
        this.setState({ isQuickAddConfirmed: false });
        return;
      }

      this.animate(
        { duration: 0.14, curve: AnimationCurve.EaseIn, beginFromCurrentState: true },
        () => {
          icon.setAttribute('scaleX', 0.72);
          icon.setAttribute('scaleY', 0.72);
        },
      );

      this.setTimeoutDisposable(() => {
        if (this.isDestroyed() || token !== this.quickAddAnimationToken) {
          return;
        }

        this.setState({ isQuickAddConfirmed: false });
        this.setTimeoutDisposable(() => {
          const nextIcon = this.quickAddIconRef.single();
          if (!nextIcon || this.isDestroyed() || token !== this.quickAddAnimationToken) {
            return;
          }

          nextIcon.setAttribute('scaleX', 0.72);
          nextIcon.setAttribute('scaleY', 0.72);
          this.animate(
            { stiffness: 480, damping: 15, beginFromCurrentState: true },
            () => {
              nextIcon.setAttribute('scaleX', 1);
              nextIcon.setAttribute('scaleY', 1);
            },
          );
        }, 0);
      }, 140);
    }, 850);
  };

  private handleVisibilityChanged = (isVisible: boolean): void => {
    if (this.state.isVisible !== isVisible) {
      this.setState({ isVisible });
    }
  };

  private startFadeIn = (): void => {
    if (!this.viewModel.animateIn || this.fadeStarted || !this.cardRef.single()) {
      return;
    }

    this.fadeStarted = true;
    this.animate(
      { duration: 0.24, curve: AnimationCurve.EaseOut },
      () => this.cardRef.single()?.setAttribute('opacity', 1),
    );
  };

  private handleCardLayout = (_frame: ElementFrame): void => {
    this.startFadeIn();
  };

  onViewModelUpdate(previous?: MasonryProductCardViewModel): void {
    if (previous?.product.id !== this.viewModel.product.id) {
      this.quickAddAnimationToken += 1;
      this.setState({
        isFavorited: this.viewModel.product.isFavorited ?? false,
        isQuickAddConfirmed: false,
        isVisible: true,
      });
    }

    if (previous?.animateIn !== this.viewModel.animateIn && this.viewModel.animateIn) {
      this.fadeStarted = false;
      this.cardRef.single()?.setAttribute('opacity', 0);
      this.startFadeIn();
    }
  }

  onRender(): void {
    const product = this.viewModel.product;
    const width = this.viewModel.columnWidth;
    const imageHeight = Math.round(width * getMasonryImageAspectRatio(product));
    const title = transformText(product.title, 'capitalize');
    const rating = product.rating ?? '4.8';
    const soldCount = product.soldCount ?? '120 vendus';
    const discount = product.originalPrice && product.originalPrice !== product.price
      ? product.discountLabel
      : undefined;

    <view
      style={styles.card}
      width={width}
      opacity={this.viewModel.animateIn ? 0 : 1}
      ref={this.cardRef}
      onLayout={this.handleCardLayout}
      onTap={this.handleTap}
      onVisibilityChanged={this.handleVisibilityChanged}
      accessibilityCategory="button"
    >
      <view
        style={styles.imageFrame}
        width={width}
        height={imageHeight}
        backgroundColor={product.color}
      >
        {product.imageUrl ? (
          <image
            src={product.imageUrl}
            width={width}
            height={imageHeight}
            objectFit="cover"
          />
        ) : null}
        {product.badgeText ? (
          <view style={styles.badge}>
            <label value={transformText(product.badgeText, 'upper')} style={styles.badgeText} />
          </view>
        ) : null}

        {product.isFlashSale ? (
          <view style={styles.flashBadge}>
            <label value="⚡ FLASH" style={styles.flashText} />
          </view>
        ) : null}

        <view style={styles.favoriteButton} onTap={this.handleFavorite} accessibilityCategory="button">
          <image
            ref={this.favoriteIconRef}
            src={this.state.isFavorited ? navigationIcons.favouriteBold : navigationIcons.favourite}
            tint={this.state.isFavorited ? colors.textDanger : colors.textPrimary}
            width={18}
            height={18}
            objectFit="contain"
          />
        </view>

        {this.state.isVisible ? (
          <view style={styles.quickAddButton} onTap={this.handleQuickAdd} accessibilityCategory="button">
            <image
              ref={this.quickAddIconRef}
              src={
                this.state.isQuickAddConfirmed
                  ? navigationIcons.shoppingCartCheck02
                  : navigationIcons.add02
              }
              tint={colors.textPrimary}
              width={18}
              height={18}
              objectFit="contain"
            />
          </view>
        ) : null}
      </view>

      <layout style={styles.infoContainer}>
        <label value={title} style={styles.title} numberOfLines={2} />
        <layout style={styles.priceRow}>
          <label value={formatPriceLabel(product.price)} style={styles.price} />
          {product.originalPrice ? <label value={formatPriceLabel(product.originalPrice)} style={styles.originalPrice} /> : null}
          {discount ? (
            <view style={styles.discountBadge}>
              <label value={discount} style={styles.discountText} />
            </view>
          ) : null}
        </layout>
        <layout style={styles.statsRow}>
          <label value={`★ ${rating}`} style={styles.rating} />
          <label value={soldCount} style={styles.soldCount} />
        </layout>
      </layout>
    </view>;
  }
}

const styles = {
  card: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    borderRadius: 12,
    marginBottom: 8,
    slowClipping: true,
  }),
  imageFrame: new Style<View>({
    position: 'relative',
    slowClipping: true,
  }),
  badge: new Style<View>({
    backgroundColor: colors.textDanger,
    borderRadius: 4,
    left: 8,
    paddingBottom: 3,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 3,
    position: 'absolute',
    top: 8,
  }),
  badgeText: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(fontSize.nano),
  }),
  flashBadge: new Style<View>({
    backgroundColor: colors.backgroundOverlay,
    borderRadius: 4,
    bottom: 8,
    left: 8,
    paddingBottom: 3,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 3,
    position: 'absolute',
  }),
  flashText: new Style<Label>({
    color: colors.backgroundBrand,
    font: montserrat.extraBold(fontSize.nano),
  }),
  favoriteButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32,
  }),
  quickAddButton: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundBrand,
    borderRadius: 16,
    bottom: 8,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    width: 32,
  }),
  infoContainer: new Style<Layout>({
    paddingBottom: 10,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
  }),
  title: typography.productTitle.extend({
    marginBottom: 4,
  }),
  priceRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  }),
  price: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.price),
    marginRight: 4,
  }),
  originalPrice: new Style<Label>({
    color: colors.textTertiary,
    font: montserrat.regular(fontSize.metadata),
    marginRight: 4,
    textDecoration: 'strikethrough',
  }),
  discountBadge: new Style<View>({
    backgroundColor: '#FFF0F3',
    borderRadius: 3,
    paddingBottom: 1,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 1,
  }),
  discountText: new Style<Label>({
    color: colors.textDanger,
    font: montserrat.extraBold(fontSize.nano),
  }),
  statsRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
  }),
  rating: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.regular(fontSize.micro),
    marginRight: 6,
  }),
  soldCount: new Style<Label>({
    color: colors.textTertiary,
    font: montserrat.regular(fontSize.micro),
  }),
};
