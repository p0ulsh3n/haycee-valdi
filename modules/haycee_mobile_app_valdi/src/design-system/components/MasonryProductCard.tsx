import { AnimationCurve } from 'valdi_core/src/AnimationOptions';
import { StatefulComponent } from 'valdi_core/src/Component';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { AttributedTextBuilder } from 'valdi_core/src/utils/AttributedTextBuilder';
import { ElementFrame } from 'valdi_tsx/src/Geometry';
import { ImageView, Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import { AttributedTextInlineViewVerticalAlignment } from 'valdi_tsx/src/AttributedTextInlineViewAttachment';
import navigationIcons from '../../../res/navigation-icons';
import { getMasonryImageAspectRatio } from './MasonryFeed';
import { ProductCardBadge } from './ProductCardBadge';
import { ProductOfferPlacement } from './ProductOfferPlacement';
import { ProductPopularityBadge } from './ProductPopularityBadge';
import { ProductRatingSummary } from './ProductRatingSummary';
import type { ProductOffer, ProductPopularityBadgeType } from './ProductCardTypes';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
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
  popularityBadge?: ProductPopularityBadgeType;
  offer?: ProductOffer;
  isLive?: boolean;
  isFlashSale?: boolean;
  isFavorited?: boolean;
  rating?: string;
  masonryAspectRatio?: number;
  /** Optional product-level sales summary shown on the product detail page. */
  soldCount?: string;
  description?: string;
  category?: string;
  /** Seller display name shown above the @username on storefronts. */
  vendorName?: string;
  /** Seller account username (max 30 characters), separate from the display name. */
  vendorUsername?: string;
  vendorId?: string;
  vendorAvatarUrl?: string;
  /** Optional seller storefront cover image used behind the profile header. */
  vendorCoverImageUrl?: string;
  vendorRating?: string;
  /** Seller rating summary, for example "5 (6)" in the seller profile badges. */
  vendorReviewSummary?: string;
  vendorSalesCount?: number;
  vendorFollowersCount?: number;
  vendorBio?: string;
  /** ISO 3166-1 alpha-2 seller country code, for example FR or CI. */
  vendorCountryCode?: string;
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
  stockTotal?: number;
  shippingFree?: boolean;
  shippingPrice?: string;
  conditionLabel?: string;
  tags?: string[];
  isFeatured?: boolean;
}

/** Estimates the rendered card height for the shared two-column masonry balancer. */
export const estimateMasonryProductCardHeight = (product: MasonryProduct, columnWidth: number): number => {
  const imageHeight = Math.round(columnWidth * getMasonryImageAspectRatio(product));
  const reviewCount = Number(product.reviewCount ?? 0);
  const hasRatingSummary = product.rating !== undefined && Number.isFinite(reviewCount) && reviewCount >= 5;
  const optionalRowsHeight = (product.offer ? 14 + spacing.xs : 0)
    + (hasRatingSummary ? 14 + spacing.xs : 0);

  return imageHeight + 18 + fontSize.price + spacing.xs + spacing.sm * 2 + optionalRowsHeight + 8;
};

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
    const titleValue = product.popularityBadge
      ? new AttributedTextBuilder()
          .appendInlineView(0, AttributedTextInlineViewVerticalAlignment.Center)
          .appendText(` ${title}`)
          .build()
      : title;
    const discount = product.originalPrice && product.originalPrice !== product.price
      ? product.discountLabel
      : undefined;
    const reviewCount = Number(product.reviewCount ?? 0);
    const hasRatingSummary = product.rating !== undefined && Number.isFinite(reviewCount) && reviewCount >= 5;

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
          <view style={styles.badge.extend({ top: product.isLive ? 34 : 8 })}>
            <ProductCardBadge label={product.badgeText} backgroundColor={colors.liveCardBadgePromotion} />
          </view>
        ) : null}

        {product.isLive ? (
          <view style={styles.liveBadge}>
            <ProductCardBadge label="EN DIRECT" backgroundColor={colors.offerDanger} />
          </view>
        ) : null}

        {product.isFlashSale ? (
          <view style={styles.flashBadge}>
            <ProductCardBadge
              label="VENTE FLASH"
              backgroundColor={colors.offerDanger}
              icon={navigationIcons.discountTag01}
            />
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
                  : navigationIcons.shoppingCartAdd02
              }
              tint={colors.textInverted}
              width={18}
              height={18}
              objectFit="contain"
            />
          </view>
        ) : null}
      </view>

      <layout style={styles.infoContainer}>
        <label value={titleValue} style={styles.title} numberOfLines={1} textOverflow="ellipsis">
          {product.popularityBadge ? <ProductPopularityBadge type={product.popularityBadge} /> : null}
        </label>
        {product.offer ? (
          <layout style={styles.infoRow}>
            <ProductOfferPlacement offer={product.offer} />
          </layout>
        ) : null}
        <layout style={styles.priceRow}>
          <label value={formatPriceLabel(product.price)} style={styles.price} />
          {product.originalPrice ? <label value={formatPriceLabel(product.originalPrice)} style={styles.originalPrice} /> : null}
          {discount ? (
            <view style={styles.discountBadge}>
              <label value={discount} style={styles.discountText} />
            </view>
          ) : null}
        </layout>
        {hasRatingSummary ? (
          <layout style={styles.infoRow}>
            <ProductRatingSummary rating={product.rating} reviewCount={reviewCount} />
          </layout>
        ) : null}
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
    borderRadius: radius.cardImage,
    position: 'relative',
    slowClipping: true,
  }),
  badge: new Style<View>({ left: 8, position: 'absolute', top: 8 }),
  liveBadge: new Style<View>({ left: 8, position: 'absolute', top: 8 }),
  flashBadge: new Style<View>({ bottom: 8, left: 8, position: 'absolute' }),
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
    flexDirection: 'column',
    paddingBottom: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.sm,
  }),
  title: typography.productTitle,
  infoRow: new Style<Layout>({
    marginTop: spacing.xs,
  }),
  priceRow: new Style<Layout>({
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
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
    backgroundColor: colors.productDiscountSurface,
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
};
