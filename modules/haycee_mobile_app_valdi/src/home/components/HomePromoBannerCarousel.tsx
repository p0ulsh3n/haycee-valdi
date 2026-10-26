import { StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Device } from 'valdi_core/src/Device';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { ScrollEndEvent } from 'valdi_tsx/src/GestureEvents';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { colors } from '../../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { layout, spacing } from '../../design-system/tokens/spacing';
import { montserrat, transformText } from '../../design-system/tokens/typography';

export interface HomePromoBanner {
  id: string;
  eyebrow: string;
  title: string;
  color: string;
}

export interface HomePromoBannerCarouselViewModel {
  banners: HomePromoBanner[];
  onBannerTap?: (banner: HomePromoBanner) => void;
}

interface HomePromoBannerCarouselState {
  activeIndex: number;
}

export class HomePromoBannerCarousel extends StatefulComponent<
  HomePromoBannerCarouselViewModel,
  HomePromoBannerCarouselState
> {
  state: HomePromoBannerCarouselState = { activeIndex: 0 };

  private handleScrollEnd = (event: ScrollEndEvent): void => {
    const bannerWidth = Device.getWindowWidth();
    const index = bannerWidth > 0 ? Math.round(event.x / bannerWidth) : 0;
    this.setState({ activeIndex: Math.max(0, Math.min(index, this.viewModel.banners.length - 1)) });
  };

  onRender(): void {
    const bannerWidth = Device.getWindowWidth();
    const bannerHeight = Math.round(bannerWidth * layout.home.hero.aspectRatio);

    <layout style={styles.root.extend({ height: bannerHeight })}>
      <scroll
        {...noBounceScrollAttributes}
        style={styles.scroll.extend({ height: bannerHeight })}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onScrollEnd={this.handleScrollEnd}
      >
        {this.viewModel.banners.map(banner => (
          <view
            key={banner.id}
            style={styles.banner.extend({
              backgroundColor: banner.color,
              height: bannerHeight,
              width: bannerWidth,
            })}
            onTap={createReusableCallback(() => this.viewModel.onBannerTap?.(banner))}
            accessibilityCategory="button"
          >
            <label style={styles.eyebrow} value={transformText(banner.eyebrow, 'upper')} />
            <label style={styles.title} value={transformText(banner.title, 'capitalize')} numberOfLines={2} />
          </view>
        ))}
      </scroll>
      <layout style={styles.dots}>
        {this.viewModel.banners.map((banner, index) => (
          <view
            key={`dot-${banner.id}`}
            style={styles.dot.extend({
              backgroundColor: index === this.state.activeIndex
                ? colors.mediaIndicatorActive
                : colors.mediaIndicatorInactive,
              marginLeft: index === 0 ? 0 : spacing.xs,
              width: index === this.state.activeIndex ? 30 : 6,
            })}
          />
        ))}
      </layout>
    </layout>;
  }
}

const styles = {
  root: new Style<Layout>({
    position: 'relative',
  }),
  scroll: new Style<ScrollView>({}),
  banner: new Style<View>({
    justifyContent: 'flex-end',
    padding: 20,
  }),
  eyebrow: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(10),
    lineHeight: 1.2,
  }),
  title: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.black(25),
    lineHeight: 1.2,
    marginTop: spacing.sm,
  }),
  dots: new Style<Layout>({
    alignItems: 'center',
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  }),
  dot: new Style<View>({
    backgroundColor: colors.textInverted,
    borderRadius: 3,
    height: 6,
  }),
};
