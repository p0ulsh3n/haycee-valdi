import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { ImageView, Label, Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { fontSize, montserrat } from '../tokens/typography';

export interface ProductRatingSummaryViewModel {
  rating?: string;
  reviewCount?: number;
}

const STAR_SIZE = 14;

/** Shellby-style star average and review count, adapted to shared Valdi tokens. */
export class ProductRatingSummary extends Component<ProductRatingSummaryViewModel> {
  onRender(): void {
    const rating = this.viewModel.rating;
    const parsedRating = Number(rating);
    const reviewCount = this.viewModel.reviewCount ?? 0;
    const showRating = rating !== undefined && Number.isFinite(parsedRating) && reviewCount >= 5;
    if (!showRating) return;
    const ratingLabel = parsedRating.toFixed(1);
    const clampedRating = Math.max(0, Math.min(5, parsedRating));

    <layout style={styles.row}>
      <layout style={styles.starsAndRating}>
        {Array.from({ length: 5 }).map((_item, index) => {
          const fillRatio = Math.max(0, Math.min(1, clampedRating - index));
          return (
            <view style={styles.starFrame}>
              <image
                src={navigationIcons.sellerRatingStarBold}
                tint={colors.productRatingStarEmpty}
                width={STAR_SIZE}
                height={STAR_SIZE}
                style={styles.starLayer}
                objectFit="contain"
              />
              {fillRatio >= 1 ? (
                <image
                  src={navigationIcons.sellerRatingStarBold}
                  tint={colors.productRatingStar}
                  width={STAR_SIZE}
                  height={STAR_SIZE}
                  style={styles.starLayer}
                  objectFit="contain"
                />
              ) : fillRatio > 0 ? (
                <view style={styles.partialStarClip.extend({ width: STAR_SIZE * fillRatio })}>
                  <image
                    src={navigationIcons.sellerRatingStarBold}
                    tint={colors.productRatingStar}
                    width={STAR_SIZE}
                    height={STAR_SIZE}
                    style={styles.starLayer}
                    objectFit="contain"
                  />
                </view>
              ) : null}
            </view>
          );
        })}
        <label value={ratingLabel} style={styles.rating} numberOfLines={1} />
        <label value={`(${reviewCount} Avis)`} style={styles.reviewCount} numberOfLines={1} />
      </layout>
    </layout>;
  }
}

const styles = {
  row: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1 }),
  starsAndRating: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0 }),
  starFrame: new Style<View>({ flexShrink: 0, height: STAR_SIZE, marginRight: 1, position: 'relative', width: STAR_SIZE }),
  starLayer: new Style<ImageView>({ left: 0, position: 'absolute', top: 0 }),
  /** Only the fractional star needs clipping; full and empty stars stay unclipped. */
  partialStarClip: new Style<View>({ height: STAR_SIZE, left: 0, position: 'absolute', slowClipping: true, top: 0 }),
  rating: new Style<Label>({ color: colors.productRatingText, font: montserrat.semiBold(fontSize.body), marginLeft: spacing.xs }),
  reviewCount: new Style<Label>({ color: colors.textSecondary, font: montserrat.semiBold(fontSize.tiny), marginLeft: spacing.xs }),
};
