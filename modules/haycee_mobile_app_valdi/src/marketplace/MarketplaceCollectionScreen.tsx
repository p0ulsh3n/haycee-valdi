import { Device } from 'valdi_core/src/Device';
import { Component } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { Label, ScrollView, View } from 'valdi_tsx/src/NativeTemplateElements';
import { SwipeTabs } from '../design-system/components/SwipeTabs';
import type { SwipeTabItem } from '../design-system/components/SwipeTabs';
import { Ticker } from '../design-system/components/Ticker';
import { Hairline } from '../design-system/components/Hairline';
import { colors } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/radius';
import { spacing, layout } from '../design-system/tokens/spacing';
import { fontSize, montserrat, typography, transformText } from '../design-system/tokens/typography';
import navigationIcons from '../../res/navigation-icons';
import type { HomeProduct } from '../home/components/HomeProductRail';
import { marketplaceCategoryFilters } from './MarketplaceCollectionData';
import type { MarketplaceCollectionKind } from './MarketplaceCollectionData';
import { CollectionCountdown } from './components/CollectionCountdown';
import { MarketplaceCollectionPage } from './components/MarketplaceCollectionPage';

export interface MarketplaceCollectionScreenViewModel {
  kind: MarketplaceCollectionKind;
  onBack: () => void;
  onCartTap?: () => void;
  onProductTap?: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd?: (product: HomeProduct) => void;
}

const categoryTabs: SwipeTabItem[] = marketplaceCategoryFilters.map(category => ({
  id: category.id,
  label: category.label,
  pageTitle: category.label,
  pageMessage: '',
}));

const SOCIAL_PROOF_MESSAGES = [
  'Aminata vient de commander cette tendance',
  'Mariam vient de choisir une pièce populaire',
  'Nadia vient de découvrir cette sélection',
];

const HEADER_TITLE: Record<MarketplaceCollectionKind, string> = {
  flash: 'Vente flash',
  trending: 'Tendances',
};

/** Shared Shellby-inspired collection shell with Home's native swipe pager. */
export class MarketplaceCollectionScreen extends Component<MarketplaceCollectionScreenViewModel> {
  private renderCategoryPage = (tab: SwipeTabItem, _isActive: boolean, isPrepared: boolean): void => {
    <MarketplaceCollectionPage
      key={`collection-${this.viewModel.kind}-${tab.id}`}
      kind={this.viewModel.kind}
      categoryId={tab.id}
      isPrepared={isPrepared}
      onProductTap={this.viewModel.onProductTap}
      onQuickAdd={this.viewModel.onQuickAdd}
    />;
  };

  private renderHeader(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    <view style={topInset > 0 ? styles.header.extend({ paddingTop: topInset + spacing.sm }) : styles.header}>
      <view style={styles.headerAction} onTap={this.viewModel.onBack} accessibilityCategory="button" accessibilityLabel="Retour">
        <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={24} height={24} objectFit="contain" />
      </view>
      <view style={styles.headerTitleSlot}>
        <label
          value={transformText(HEADER_TITLE[this.viewModel.kind], 'upper')}
          style={styles.headerTitle}
          numberOfLines={1}
        />
      </view>
      <view style={styles.headerAction} onTap={this.viewModel.onCartTap} accessibilityCategory="button" accessibilityLabel="Panier">
        <image src={navigationIcons.shoppingCart02} tint={colors.iconDefault} width={24} height={24} objectFit="contain" />
      </view>
    </view>;
  }

  private renderFlashHeader(): void {
    <CollectionCountdown durationSeconds={2 * 60 * 60} />;
    <Hairline color={colors.borderDefault} />;
  }

  private renderTrendingHeader(): void {
    <view style={styles.trendingHero}>
      <label value="LES PIÈCES LES PLUS CONVOITÉES" style={styles.trendingHeroTitle} />
    </view>;
    <Hairline color={colors.borderDefault} />;
  }

  private renderSocialProof(): void {
    <view style={styles.socialProof}>
      <view style={styles.socialProofAvatar}>
        <image
          src={navigationIcons.userGroup}
          tint={colors.iconDefault}
          width={13}
          height={13}
          objectFit="contain"
        />
      </view>
      <Ticker
        items={SOCIAL_PROOF_MESSAGES}
        mode="rotate"
        orientation="vertical"
        direction="forward"
        rotateTransition="fade"
        transitionDurationMs={240}
        holdDurationMs={4000}
        repeat={true}
        style={styles.socialProofTicker}
        textStyle={styles.socialProofText}
        accessibilityLabel="Activité récente des tendances"
      />
    </view>;
  }

  onRender(): void {
    <view style={styles.root}>
      {this.renderHeader()}
      {this.viewModel.kind === 'flash' ? this.renderFlashHeader() : this.renderTrendingHeader()}
      {this.viewModel.kind === 'trending' ? this.renderSocialProof() : null}
      <SwipeTabs
        tabs={categoryTabs}
        initialIndex={0}
        showPages={true}
        showHairline={false}
        tabHeight={layout.home.categoryTabs.height}
        tabItemWidth={96}
        strongLabels={true}
        textCase="upper"
        indicatorColor={colors.textPrimary}
        activeIndicatorWidthRatio={0.55}
        renderPage={this.renderCategoryPage}
      />
    </view>;
  }
}

const styles = {
  root: new Style<View>({
    backgroundColor: colors.backgroundPrimary,
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
  }),
  header: new Style<View>({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.md,
    position: 'relative',
  }),
  headerAction: new Style<View>({
    alignItems: 'center',
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    width: 40,
  }),
  headerTitleSlot: new Style<View>({
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 56,
    position: 'absolute',
    right: 56,
    top: 0,
  }),
  headerTitle: typography.bodyEmphasis.extend({ textAlign: 'center' }),
  trendingHero: new Style<View>({
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.xl,
  }),
  trendingHeroTitle: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.semiBold(fontSize.label),
  }),
  socialProof: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    flexDirection: 'row',
    marginBottom: spacing.md,
    marginLeft: spacing.lg,
    marginRight: spacing.lg,
    marginTop: spacing.md,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    paddingTop: spacing.xs,
  }),
  socialProofAvatar: new Style<View>({
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderRadius: radius.full,
    flexShrink: 0,
    height: 24,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 24,
  }),
  socialProofTicker: new Style<ScrollView>({
    flexGrow: 1,
    flexShrink: 1,
    height: 28,
    minWidth: 0,
  }),
  socialProofText: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.semiBold(fontSize.metadata),
    textAlign: 'left',
  }),
};
