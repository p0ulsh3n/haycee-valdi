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
import { fontSize, montserrat } from '../design-system/tokens/typography';
import { noBounceScrollAttributes } from '../design-system/tokens/scrollBehavior';
import type { HomeProduct } from './components/HomeProductRail';
import { HomeSubcategoryRow } from './components/HomeSubcategoryRow';
import { HomeSubcategoryResultsScreen } from './HomeSubcategoryResultsScreen';
import { getHomeSubcategoryProducts } from './data/HomeCategoryData';
import type { HomeSubcategory } from './data/HomeCategoryData';

export interface HomeSubcategoriesScreenViewModel {
  categoryKey: string;
  categoryLabel: string;
  subcategories: HomeSubcategory[];
  onSelectCategory: (categoryKey: string) => void;
  onProductTap: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd: (product: HomeProduct) => void;
}

/** Second-level Home category screen, with an image-like color tile per subcategory. */
@NavigationPage(module)
export class HomeSubcategoriesScreen extends NavigationPageStatefulComponent<HomeSubcategoriesScreenViewModel, {}> {
  private close = (): void => {
    this.navigationController.pop();
  };

  private selectSubcategory = (subcategoryId: string): void => {
    const subcategory = this.viewModel.subcategories.find(item => item.id === subcategoryId);
    if (!subcategory) return;

    runNavigationAction(this.navigationController, () => {
      this.viewModel.onSelectCategory(this.viewModel.categoryKey);
      const products = getHomeSubcategoryProducts(this.viewModel.categoryKey, subcategoryId);
      this.navigationController.push(
        HomeSubcategoryResultsScreen,
        {
          title: subcategory.label,
          products,
          onProductTap: this.viewModel.onProductTap,
          onQuickAdd: this.viewModel.onQuickAdd,
        },
        {},
      );
    });
  };

  private renderHeader(topInset: number): void {
    <layout style={styles.header.extend({ paddingTop: topInset + spacing.sm })}>
      <view style={styles.headerSide}>
        <view style={styles.backButton} onTap={this.close} accessibilityCategory="button" accessibilityLabel="Retour aux catégories">
          <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
        </view>
      </view>
      <label value={this.viewModel.categoryLabel} style={styles.headerTitle} numberOfLines={1} />
      <view style={styles.headerSide} />
    </layout>;
  }

  onRender(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    const bottomInset = Math.max(0, Device.getDisplayBottomInset());

    <view style={styles.root}>
      {this.renderHeader(topInset)}
      <scroll {...noBounceScrollAttributes} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <view style={styles.rows}>
          {this.viewModel.subcategories.map(subcategory => (
            <HomeSubcategoryRow
              key={subcategory.id}
              label={subcategory.label}
              panelColor={subcategory.panelColor}
              onTap={createReusableCallback(() => this.selectSubcategory(subcategory.id))}
            />
          ))}
        </view>
        <view height={bottomInset + spacing.xl} />
      </scroll>
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.lg }),
  headerSide: new Style<View>({ alignItems: 'center', flexShrink: 0, height: 40, justifyContent: 'center', width: 40 }),
  backButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: radius.full, height: 40, justifyContent: 'center', width: 40 }),
  headerTitle: new Style<Label>({ color: colors.textPrimary, flexGrow: 1, font: montserrat.extraBold(fontSize.section), textAlign: 'center' }),
  scroll: new Style<ScrollView>({ flexGrow: 1, flexShrink: 1 }),
  rows: new Style<View>({ flexDirection: 'column', paddingBottom: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.lg, paddingTop: spacing.md }),
};
