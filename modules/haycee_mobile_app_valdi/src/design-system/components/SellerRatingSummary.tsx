import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, Layout, ScrollView } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../../res/navigation-icons';
import { colors } from '../tokens/colors';
import { layout, spacing } from '../tokens/spacing';
import { fontSize, montserrat, transformText } from '../tokens/typography';
import { formatCompactCount } from '../utils/counts';
import { Ticker } from './Ticker';

export interface SellerRatingSummaryViewModel {
  rating?: string;
  /** Existing seller summary, for example "4.8 (126)". */
  reviewSummary?: string;
  followersCount?: number;
  compact?: boolean;
}

/** Rotating seller trust line: rating/reviews and follower count. */
export class SellerRatingSummary extends Component<SellerRatingSummaryViewModel> {
  private renderTickerItem = (
    item: string,
    ratingLabel: string | undefined,
    reviewCount: string | undefined,
    followersLabel: string,
    iconSize: number,
    labelSize: number,
  ): void => {
    if (item === 'followers') {
      <layout style={styles.row}>
        <image
          src={navigationIcons.userGroup}
          tint={colors.textSecondary}
          width={iconSize}
          height={iconSize}
          objectFit="contain"
        />
        <label value={followersLabel} style={styles.followers.extend({ font: montserrat.semiBold(labelSize), marginLeft: spacing.xs })} numberOfLines={1} />
      </layout>;
      return;
    }

    <layout style={styles.row}>
      <image
        src={navigationIcons.sellerRatingStarBold}
        tint={colors.productRatingStar}
        width={iconSize}
        height={iconSize}
        objectFit="contain"
      />
      <label value={ratingLabel ?? ''} style={styles.rating.extend({ font: montserrat.semiBold(labelSize), marginLeft: spacing.xs })} numberOfLines={1} />
      {reviewCount ? (
        <label value={`(${reviewCount})`} style={styles.reviewCount.extend({ font: montserrat.semiBold(labelSize), marginLeft: spacing.xs })} numberOfLines={1} />
      ) : null}
    </layout>;
  };

  onRender(): void {
    const { rating, reviewSummary, followersCount, compact } = this.viewModel;
    const summaryRating = reviewSummary?.match(/^\s*([\d]+(?:[.,][\d]+)?)/)?.[1];
    const ratingValue = rating ?? summaryRating;
    const parsedRating = Number(ratingValue?.replace(',', '.'));
    const hasRating = ratingValue !== undefined && Number.isFinite(parsedRating);
    const ratingLabel = hasRating ? parsedRating.toFixed(1).replace('.', ',') : undefined;
    const rawReviewCount = reviewSummary?.match(/\(\s*([\d\s.,]+)\s*\)/)?.[1];
    const reviewCount = rawReviewCount?.replace(/\D/g, '');
    const hasFollowers = followersCount !== undefined && Number.isFinite(followersCount) && followersCount >= 0;
    const items = [
      ...(hasRating ? ['rating'] : []),
      ...(hasFollowers ? ['followers'] : []),
    ];
    if (items.length === 0) return;

    const tickerLayout = layout.product.sellerInfoTicker;
    const iconSize = compact ? tickerLayout.compactIconSize : tickerLayout.iconSize;
    const labelSize = compact ? fontSize.tiny : fontSize.metadata;
    const followersLabel = `${formatCompactCount(followersCount ?? 0)} ${transformText('Followers', 'capitalize')}`;
    const accessibilityLabel = [
      hasRating ? `Note ${ratingLabel}${reviewCount ? `, ${reviewCount} avis` : ''}` : undefined,
      hasFollowers ? followersLabel : undefined,
    ].filter((value): value is string => value !== undefined).join('. ');

    <Ticker
      items={items}
      mode="rotate"
      orientation="vertical"
      direction="forward"
      active={items.length > 1}
      repeat={items.length > 1}
      rotateTransition="slide"
      holdDurationMs={tickerLayout.holdDurationMilliseconds}
      transitionDurationMs={tickerLayout.transitionDurationMilliseconds}
      style={compact ? styles.compactTicker : styles.ticker}
      accessibilityLabel={accessibilityLabel}
      renderRotateItem={item => this.renderTickerItem(item, ratingLabel, reviewCount, followersLabel, iconSize, labelSize)}
    />;
  }
}

const styles = {
  ticker: new Style<ScrollView>({ flexGrow: 0, flexShrink: 0, height: layout.product.sellerInfoTicker.height, marginTop: spacing.xs, width: '100%' }),
  compactTicker: new Style<ScrollView>({ flexGrow: 0, flexShrink: 0, height: layout.product.sellerInfoTicker.compactHeight, marginTop: spacing.xs, width: '100%' }),
  row: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 1, justifyContent: 'flex-start', minWidth: 0, width: '100%' }),
  rating: new Style<Label>({ color: colors.productRatingText }),
  reviewCount: new Style<Label>({ color: colors.textSecondary }),
  followers: new Style<Label>({ color: colors.textSecondary, flexShrink: 1 }),
};
