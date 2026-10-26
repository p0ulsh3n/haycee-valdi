import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { MasonryProduct } from '../../design-system/components/MasonryProductCard';
import { colors } from '../../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { layout } from '../../design-system/tokens/spacing';
import { montserrat, typography, transformText } from '../../design-system/tokens/typography';
import { HomeSectionHeader } from './HomeSectionHeader';

export interface HomeProduct extends MasonryProduct {}

export interface HomeProductRailViewModel {
  title: string;
  subtitle?: string;
  variant?: HomeProductRailVariant;
  products: HomeProduct[];
  actionLabel?: string;
  onViewAllTap?: () => void;
  onProductTap?: (product: HomeProduct) => void;
}

export type HomeProductRailVariant = 'flash' | 'trending' | 'deals';

interface HomeProductCardViewModel extends HomeProduct {
  variant: HomeProductRailVariant;
  onTap?: () => void;
}

class HomeProductCard extends Component<HomeProductCardViewModel> {
  onRender(): void {
    const productTitle = transformText(this.viewModel.title, 'capitalize');

    if (this.viewModel.variant === 'trending') {
      <view
        style={styles.trendingCard.extend({ backgroundColor: this.viewModel.color })}
        onTap={this.viewModel.onTap}
        accessibilityCategory="button"
      >
        <view style={styles.trendingImage.extend({ backgroundColor: this.viewModel.color })} />
        <view style={styles.trendingOverlay}>
          <label style={styles.trendingTitle} value={transformText(productTitle, 'upper')} numberOfLines={1} />
          <label style={styles.trendingPrice} value={this.viewModel.price} />
        </view>
      </view>;
      return;
    }

    if (this.viewModel.variant === 'deals') {
      <view
        style={styles.dealsCard}
        onTap={this.viewModel.onTap}
        accessibilityCategory="button"
      >
        <view style={styles.dealsImage.extend({ backgroundColor: this.viewModel.color })} />
        <layout style={styles.dealsContent}>
          <label style={styles.dealsTitle} value={productTitle} numberOfLines={2} />
          <label style={styles.dealsPrice} value={this.viewModel.price} />
        </layout>
      </view>;
      return;
    }

    <view style={styles.flashCard} onTap={this.viewModel.onTap} accessibilityCategory="button">
      <view style={styles.flashImage.extend({ backgroundColor: this.viewModel.color })} />
      <layout style={styles.flashContent}>
        <label style={styles.flashPrice} value={this.viewModel.price} />
      </layout>
    </view>;
  }
}

export class HomeProductRail extends Component<HomeProductRailViewModel> {
  onRender(): void {
    const variant = this.viewModel.variant ?? 'flash';
    const rail = layout.home.productRails[variant];

    <layout style={styles.root}>
      <HomeSectionHeader
        title={this.viewModel.title}
        subtitle={this.viewModel.subtitle}
        actionLabel={this.viewModel.actionLabel}
        onActionTap={this.viewModel.onViewAllTap}
      />
      <scroll
        {...noBounceScrollAttributes}
        style={styles.scroll.extend({ height: rail.railHeight })}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <layout style={styles.content}>
          {this.viewModel.products.map(product => (
            <HomeProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              price={product.price}
              color={product.color}
              variant={variant}
              onTap={createReusableCallback(() => this.viewModel.onProductTap?.(product))}
            />
          ))}
        </layout>
      </scroll>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({
  }),
  scroll: new Style<ScrollView>({
  }),
  content: new Style<Layout>({
    flexDirection: 'row',
    paddingBottom: layout.home.productRails.verticalPadding,
    paddingLeft: layout.home.productRails.horizontalPadding,
    paddingRight: layout.home.productRails.horizontalPadding,
    paddingTop: layout.home.productRails.verticalPadding,
  }),
  flashCard: new Style<View>({
    marginRight: layout.home.productRails.gap,
    width: layout.home.productRails.flash.cardWidth,
  }),
  flashImage: new Style<View>({
    borderRadius: layout.home.productRails.flash.imageRadius,
    height: layout.home.productRails.flash.imageHeight,
    width: layout.home.productRails.flash.imageWidth,
  }),
  flashContent: new Style<Layout>({
    paddingBottom: layout.home.productRails.flash.contentBottomPadding,
    paddingLeft: layout.home.productRails.flash.contentHorizontalPadding,
    paddingRight: layout.home.productRails.flash.contentHorizontalPadding,
    paddingTop: 8,
  }),
  flashPrice: typography.priceRegular,
  trendingCard: new Style<View>({
    borderRadius: layout.home.productRails.trending.cardRadius,
    height: layout.home.productRails.trending.cardHeight,
    marginRight: layout.home.productRails.gap,
    position: 'relative',
    width: layout.home.productRails.trending.cardWidth,
  }),
  trendingImage: new Style<View>({
    height: layout.home.productRails.trending.cardHeight,
    width: layout.home.productRails.trending.cardWidth,
  }),
  trendingOverlay: new Style<View>({
    backgroundColor: colors.backgroundOverlay,
    bottom: 0,
    height: 80,
    justifyContent: 'flex-end',
    left: 0,
    padding: layout.home.productRails.trending.overlayPadding,
    position: 'absolute',
    right: 0,
  }),
  trendingTitle: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.extraBold(10),
    lineHeight: 1.3,
  }),
  trendingPrice: new Style<Label>({
    color: colors.textInverted,
    font: montserrat.regular(17),
    lineHeight: 1.3,
  }),
  dealsCard: new Style<View>({
    borderRadius: layout.home.productRails.deals.cardRadius,
    flexDirection: 'row',
    height: layout.home.productRails.deals.cardHeight,
    marginRight: layout.home.productRails.gap,
    width: layout.home.productRails.deals.cardWidth,
  }),
  dealsImage: new Style<View>({
    borderRadius: layout.home.productRails.deals.cardRadius,
    height: layout.home.productRails.deals.imageSize,
    width: layout.home.productRails.deals.imageSize,
  }),
  dealsContent: new Style<Layout>({
    flexGrow: 1,
    justifyContent: 'center',
    padding: layout.home.productRails.deals.contentPadding,
  }),
  dealsTitle: typography.productTitle.extend({
    marginBottom: 6,
  }),
  dealsPrice: typography.priceRegular,
  productImage: new Style<View>({
    borderRadius: 10,
    height: 156,
    width: 148,
  }),
};
