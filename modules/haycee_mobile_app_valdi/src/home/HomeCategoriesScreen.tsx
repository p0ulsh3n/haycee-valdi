import { Device } from 'valdi_core/src/Device';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { Label, Layout, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { colors } from '../design-system/tokens/colors';
import { runNavigationAction } from '../design-system/utils/NavigationActionGate';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat, transformText } from '../design-system/tokens/typography';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import { HomeCategoryDirectoryCard } from './components/HomeCategoryDirectoryCard';
import type { HomeProduct } from './components/HomeProductRail';
import { HomeSubcategoriesScreen } from './HomeSubcategoriesScreen';
import { getHomeSubcategories, homeCategoryDefinitions } from './data/HomeCategoryData';

export interface HomeCategoriesScreenViewModel {
  selectedCategoryKey: string;
  onSelectCategory: (categoryKey: string) => void;
  onProductTap: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd: (product: HomeProduct) => void;
}

const directoryCategories = homeCategoryDefinitions.filter(category => category.id !== 'all');

/** Full-screen Home category directory with a three-column, square tile grid. */
@NavigationPage(module)
export class HomeCategoriesScreen extends NavigationPageStatefulComponent<HomeCategoriesScreenViewModel, {}> {
  private close = (): void => {
    this.navigationController.pop();
  };

  private openSubcategories = (categoryKey: string, categoryLabel: string): void => {
    runNavigationAction(this.navigationController, () => {
      this.navigationController.push(
        HomeSubcategoriesScreen,
        {
          categoryKey,
          categoryLabel,
          subcategories: getHomeSubcategories(categoryKey),
          onSelectCategory: this.viewModel.onSelectCategory,
          onProductTap: this.viewModel.onProductTap,
          onQuickAdd: this.viewModel.onQuickAdd,
        },
        {},
      );
    });
  };

  private renderHeader(topInset: number): void {
    <layout style={styles.header.extend({ paddingTop: topInset + spacing.sm })}>
      <view style={styles.backButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour à l’accueil">
        <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
      </view>
      <label value="Catégories" style={styles.headerTitle} numberOfLines={1} />
      <view style={styles.headerBalance} />
    </layout>;
  }

  private renderGrid(cardWidth: number): void {
    const rows: Array<typeof directoryCategories> = [];
    for (let index = 0; index < directoryCategories.length; index += layout.home.categoryDirectory.columns) {
      rows.push(directoryCategories.slice(index, index + layout.home.categoryDirectory.columns));
    }

    <view style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <layout key={`category-row-${rowIndex}`} style={styles.row}>
          {row.map((category, columnIndex) => (
            <HomeCategoryDirectoryCard
              key={category.id}
              id={category.id}
              label={transformText(category.label, 'capitalize')}
              panelColor={category.banners[0]?.color ?? colors.backgroundSecondary}
              width={cardWidth}
              marginRight={columnIndex < row.length - 1 ? layout.home.categoryDirectory.columnGap : 0}
              onTap={createReusableCallback(() => this.openSubcategories(category.id, transformText(category.label, 'capitalize')))}
            />
          ))}
        </layout>
      ))}
    </view>;
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());
    const { columns, horizontalPadding, columnGap } = layout.home.categoryDirectory;
    const availableWidth = Math.max(1, Device.getWindowWidth() - horizontalPadding * 2 - columnGap * (columns - 1));
    const cardWidth = Math.floor(availableWidth / columns);

    <view style={styles.root}>
      {this.renderHeader(topInset)}
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        {this.renderGrid(cardWidth)}
        <view height={bottomInset + spacing.xl} />
      </scroll>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg }),
  backButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, flexShrink: 0, height: 40, justifyContent: 'center', width: 40 }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, font: montserrat.extraBold(fontSize.section), marginLeft: spacing.md, textAlign: 'left' }),
  headerBalance: new Style<View>({ flexShrink: 0, width: 40 }),
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  grid: new Style<View>({ flexDirection: 'column', paddingLeft: layout.home.categoryDirectory.horizontalPadding, paddingRight: layout.home.categoryDirectory.horizontalPadding }),
  row: new Style<Layout>({ flexDirection: 'row', marginBottom: layout.home.categoryDirectory.rowGap }),
};
