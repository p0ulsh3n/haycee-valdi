import { Asset } from 'valdi_tsx/src/Asset';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from '../../design-system/tokens/colors';
import { noBounceScrollAttributes } from '../../design-system/tokens/scrollBehavior';
import { layout } from '../../design-system/tokens/spacing';
import { typography, transformText } from '../../design-system/tokens/typography';

export interface HomeCategoryItem {
  id: string;
  label: string;
  icon: Asset;
}

export interface HomeCategoryRailViewModel {
  categories: HomeCategoryItem[];
  onCategoryTap?: (category: HomeCategoryItem) => void;
}

class HomeCategoryCard extends Component<HomeCategoryItem & { onTap?: () => void }> {
  onRender(): void {
    <view style={styles.card} onTap={this.viewModel.onTap} accessibilityCategory="button">
      <view style={styles.iconBackground}>
        <image
          src={this.viewModel.icon}
          tint={colors.iconDefault}
          width={28}
          height={28}
          objectFit="contain"
        />
      </view>
      <label style={styles.label} value={transformText(this.viewModel.label, 'capitalize')} numberOfLines={1} />
    </view>;
  }
}

export class HomeCategoryRail extends Component<HomeCategoryRailViewModel> {
  onRender(): void {
    <scroll
      {...noBounceScrollAttributes}
      style={styles.scroll}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
    >
      <layout style={styles.content}>
        {this.viewModel.categories.map(category => (
          <HomeCategoryCard
            key={category.id}
            id={category.id}
            label={category.label}
            icon={category.icon}
            onTap={createReusableCallback(() => this.viewModel.onCategoryTap?.(category))}
          />
        ))}
      </layout>
    </scroll>;
  }
}

const styles = {
  scroll: new Style<ScrollView>({
    height: layout.home.categoryRail.height,
  }),
  content: new Style<Layout>({
    flexDirection: 'row',
    paddingBottom: layout.home.categoryRail.verticalPadding,
    paddingLeft: layout.home.categoryRail.horizontalPadding,
    paddingRight: layout.home.categoryRail.horizontalPadding,
    paddingTop: layout.home.categoryRail.verticalPadding,
  }),
  card: new Style<View>({
    alignItems: 'center',
    marginRight: layout.home.categoryRail.gap,
    width: layout.home.categoryRail.itemWidth,
  }),
  iconBackground: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: layout.home.categoryRail.imageRadius,
    height: layout.home.categoryRail.imageSize,
    justifyContent: 'center',
    width: layout.home.categoryRail.imageSize,
  }),
  label: typography.homeCategoryLabel.extend({
    color: colors.textPrimary,
    marginTop: layout.home.categoryRail.labelMarginTop,
    textAlign: 'center',
  }),
};
