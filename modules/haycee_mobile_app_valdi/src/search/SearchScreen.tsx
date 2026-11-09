import { Device } from 'valdi_core/src/Device';
import { ElementRef } from 'valdi_core/src/ElementRef';
import { Style } from 'valdi_core/src/Style';
import { NavigationPage } from 'valdi_navigation/src/NavigationPage';
import { NavigationPageStatefulComponent } from 'valdi_navigation/src/NavigationPageComponent';
import { EditTextEvent, Label, Layout, TextField, TextFieldInteractive, View } from 'valdi_tsx/src/NativeTemplateElements';
import navigationIcons from '../../res/navigation-icons';
import { getBottomSheetNavigationOptions } from '../design-system/components/BottomSheet';
import { colors } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/radius';
import { layout, spacing } from '../design-system/tokens/spacing';
import { fontSize, montserrat, transformText } from '../design-system/tokens/typography';
import { TransientFeedback } from '../design-system/components/SnackBar';
import { runNavigationAction } from '../design-system/utils/NavigationActionGate';
import { SwipeTabItem, SwipeTabs } from '../design-system/components/SwipeTabs';
import type { HomeProduct } from '../home/components/HomeProductRail';
import { SearchAutocomplete } from './components/SearchAutocomplete';
import { SearchDiscovery } from './components/SearchDiscovery';
import { SearchResults } from './components/SearchResults';
import { SearchSellerDiscovery } from './components/SearchSellerDiscovery';
import { SearchOptionsSheet } from './components/SearchOptionsSheet';
import { getDemoSearchCatalog, getDemoSearchSellers, getSearchTitleSuggestions, recentSearchFixtures, searchCategories, searchSortOptions } from './SearchData';
import type { SearchSeller, SearchSort } from './SearchData';

export interface SearchScreenViewModel {
  onProductTap: (product: HomeProduct, recommendations?: HomeProduct[]) => void;
  onQuickAdd: (product: HomeProduct) => void;
  onSellerTap: (product: HomeProduct) => void;
}

interface SearchScreenState {
  query: string;
  submittedQuery: string;
  isShowingSuggestions: boolean;
  activeTabIndex: number;
  recentSearches: string[];
  recentSellerIds: string[];
  selectedCategoryId: string;
  selectedSort: SearchSort;
}

const SEARCH_CATALOG = getDemoSearchCatalog();
const SEARCH_SELLERS = getDemoSearchSellers(SEARCH_CATALOG);
const SEARCH_TABS: SwipeTabItem[] = [
  { id: 'products', label: 'Produits', pageTitle: '', pageMessage: '' },
  { id: 'sellers', label: 'Vendeurs', pageTitle: '', pageMessage: '' },
];
let recentSearchesCache = recentSearchFixtures.slice();
let recentSellerIdsCache: string[] = [];

/** Full-screen search flow adapted from Shellby's search overlay to native Valdi. */
@NavigationPage(module)
export class SearchScreen extends NavigationPageStatefulComponent<SearchScreenViewModel, SearchScreenState> {
  private readonly searchFieldRef = new ElementRef<TextFieldInteractive>();

  state: SearchScreenState = {
    query: '',
    submittedQuery: '',
    isShowingSuggestions: true,
    activeTabIndex: 0,
    recentSearches: recentSearchesCache.slice(),
    recentSellerIds: recentSellerIdsCache.slice(),
    selectedCategoryId: 'all',
    selectedSort: 'recommended',
  };

  onCreate(): void {
    this.searchFieldRef.setAttribute('focused', true);
  }

  private handleBack = (): void => {
    if (!this.state.isShowingSuggestions) {
      this.setState({
        query: '',
        isShowingSuggestions: true,
        recentSearches: recentSearchesCache.slice(),
        recentSellerIds: recentSellerIdsCache.slice(),
      });
      this.searchFieldRef.setAttribute('focused', true);
      return;
    }

    if (this.state.query.trim().length > 0) {
      this.setState({ query: '', recentSearches: recentSearchesCache.slice(), recentSellerIds: recentSellerIdsCache.slice() });
      this.searchFieldRef.setAttribute('focused', true);
      return;
    }

    this.navigationController.pop();
  };

  private handleTextChange = (event: EditTextEvent): void => {
    this.setState({ query: event.text });
  };

  private handleEditBegin = (): void => {
    this.setState({ isShowingSuggestions: true });
  };

  private handleReturn = (event: EditTextEvent): void => {
    this.submitSearch(event.text);
  };

  private handleSubmitTap = (): void => {
    this.submitSearch(this.state.query);
  };

  private submitSearch(rawQuery: string): void {
    const query = rawQuery.trim();
    if (!query) {
      TransientFeedback.show({ message: 'Saisis un mot-clé pour rechercher.' });
      return;
    }

    const recentSearches = this.state.activeTabIndex === 0
      ? [query, ...this.state.recentSearches.filter(item => item.toLowerCase() !== query.toLowerCase())].slice(0, 20)
      : this.state.recentSearches;
    if (this.state.activeTabIndex === 0) recentSearchesCache = recentSearches;
    this.setState({
      query,
      submittedQuery: query,
      isShowingSuggestions: false,
      recentSearches,
    });
    this.searchFieldRef.setAttribute('focused', false);
  }

  private handleSuggestionSelect = (query: string): void => {
    this.submitSearch(query);
  };

  private handleClearQuery = (): void => {
    this.setState({ query: '', isShowingSuggestions: true });
    this.searchFieldRef.setAttribute('focused', true);
  };

  private handleRemoveRecent = (query: string): void => {
    recentSearchesCache = this.state.recentSearches.filter(item => item !== query);
    this.setState({ recentSearches: recentSearchesCache.slice() });
  };

  private handleClearRecent = (): void => {
    recentSearchesCache = [];
    this.setState({ recentSearches: [] });
  };

  private handleSearchTabChange = (index: number): void => {
    if (index === this.state.activeTabIndex) return;
    this.setState({ activeTabIndex: index });
  };

  private openSortSheet = (): void => {
    const sheetOptions = { transparentPageBackground: true };
    runNavigationAction(this.navigationController, () => {
      this.navigationController.present(
        SearchOptionsSheet,
        {
          title: 'Trier par',
          options: searchSortOptions,
          selectedId: this.state.selectedSort,
          onApply: (id: string) => this.setState({ selectedSort: id as SearchSort }),
        },
        {},
        { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions(sheetOptions) },
      );
    });
  };

  private openFilterSheet = (): void => {
    const sheetOptions = { transparentPageBackground: true };
    runNavigationAction(this.navigationController, () => {
      this.navigationController.present(
        SearchOptionsSheet,
        {
          title: 'Filtrer par catégorie',
          options: searchCategories,
          selectedId: this.state.selectedCategoryId,
          onApply: (id: string) => this.setState({ selectedCategoryId: id }),
        },
        {},
        { animated: true, wrapInPlatformNavigationController: false, ...getBottomSheetNavigationOptions(sheetOptions) },
      );
    });
  };

  private handleSellerSelect = (seller: SearchSeller): void => {
    recentSellerIdsCache = [seller.id, ...this.state.recentSellerIds.filter(id => id !== seller.id)].slice(0, 20);
    this.setState({ recentSellerIds: recentSellerIdsCache.slice() });
    this.viewModel.onSellerTap(seller.profileProduct);
  };

  private handleRemoveRecentSeller = (sellerId: string): void => {
    recentSellerIdsCache = this.state.recentSellerIds.filter(id => id !== sellerId);
    this.setState({ recentSellerIds: recentSellerIdsCache.slice() });
  };

  private handleClearRecentSellers = (): void => {
    recentSellerIdsCache = [];
    this.setState({ recentSellerIds: [] });
  };

  private renderSearchPage = (tab: SwipeTabItem, _isActive: boolean, _isPrepared: boolean): void => {
    const query = this.state.query.trim();
    if (tab.id === 'sellers') {
      <SearchSellerDiscovery
        query={query}
        sellers={SEARCH_SELLERS}
        recentSellerIds={this.state.recentSellerIds}
        onSelect={this.handleSellerSelect}
        onRemoveRecent={this.handleRemoveRecentSeller}
        onClearRecent={this.handleClearRecentSellers}
      />;
      return;
    }

    if (!this.state.isShowingSuggestions) {
      <SearchResults
        query={this.state.submittedQuery}
        products={SEARCH_CATALOG}
        selectedCategoryId={this.state.selectedCategoryId}
        selectedSort={this.state.selectedSort}
        onProductTap={this.viewModel.onProductTap}
        onQuickAdd={this.viewModel.onQuickAdd}
      />;
      return;
    }

    if (query.length > 0) {
      <SearchAutocomplete
        query={query}
        suggestions={getSearchTitleSuggestions(SEARCH_CATALOG, query)}
        onSelect={this.handleSuggestionSelect}
      />;
      return;
    }

    <SearchDiscovery
      recentSearches={this.state.recentSearches}
      onSelect={this.handleSuggestionSelect}
      onRemoveRecent={this.handleRemoveRecent}
      onClearRecent={this.handleClearRecent}
    />;
  };

  private renderHeader(): void {
    const topInset = Math.max(0, Device.getDisplayTopInset());
    <layout style={topInset > 0 ? styles.header.extend({ paddingTop: topInset + spacing.sm }) : styles.header}>
      <view style={styles.backButton} onTap={this.handleBack} accessibilityCategory="button" accessibilityLabel="Retour">
        <image src={navigationIcons.arrowLeft01Round} tint={colors.iconDefault} width={22} height={22} objectFit="contain" />
      </view>
      <view style={styles.searchFieldShell}>
        <image src={navigationIcons.search02} tint={colors.textSecondary} width={18} height={18} objectFit="contain" />
        <textfield
          ref={this.searchFieldRef}
          style={styles.searchField}
          value={this.state.query}
          placeholder={this.state.activeTabIndex === 0 ? 'Rechercher des articles' : 'Rechercher des vendeurs'}
          placeholderColor={colors.textPlaceholder}
          onChange={this.handleTextChange}
          onEditBegin={this.handleEditBegin}
          onReturn={this.handleReturn}
          contentType="default"
          returnKeyText="search"
          autocapitalization="none"
          autocorrection="none"
        />
        {this.state.query.length > 0 ? (
          <view style={styles.clearQueryButton} onTap={this.handleClearQuery} accessibilityCategory="button" accessibilityLabel="Effacer la recherche">
            <image src={navigationIcons.cancel01} tint={colors.textInverted} width={12} height={12} objectFit="contain" />
          </view>
        ) : null}
      </view>
      {this.state.isShowingSuggestions ? (
        <view style={styles.submitButton} onTap={this.handleSubmitTap} accessibilityCategory="button" accessibilityLabel="Rechercher">
          <label value="Rechercher" style={styles.submitLabel} numberOfLines={1} />
        </view>
      ) : this.state.activeTabIndex === 0 ? (
        <layout style={styles.resultActions}>
          <view style={styles.resultActionButton} onTap={this.openSortSheet} accessibilityCategory="button" accessibilityLabel="Trier les produits">
            <image src={navigationIcons.sortByDown01} tint={colors.iconDefault} width={24} height={24} objectFit="contain" />
          </view>
          <view style={styles.resultActionButton} onTap={this.openFilterSheet} accessibilityCategory="button" accessibilityLabel="Filtrer les produits">
            <image src={navigationIcons.filter} tint={colors.iconDefault} width={24} height={24} objectFit="contain" />
          </view>
        </layout>
      ) : null}
    </layout>;
  }

  onRender(): void {
    <view style={styles.root}>
      {this.renderHeader()}
      {this.state.isShowingSuggestions ? (
        <SwipeTabs
          tabs={SEARCH_TABS}
          initialIndex={this.state.activeTabIndex}
          tabHeight={46}
          strongLabels={false}
          labelStyle={styles.searchTabLabel}
          textCase="capitalize"
          showHairline={true}
          hairlineColor={colors.borderDefault}
          indicatorColor={colors.interactivePrimary}
          activeIndicatorWidthRatio={0.55}
          renderPage={this.renderSearchPage}
          renderPageKey={`${this.state.query}|${this.state.submittedQuery}|${this.state.isShowingSuggestions}|${this.state.recentSearches.join('\u001f')}|${this.state.recentSellerIds.join('\u001f')}`}
          onIndexChange={this.handleSearchTabChange}
        />
      ) : this.state.activeTabIndex === 0 ? (
        <SearchResults
          query={this.state.submittedQuery}
          products={SEARCH_CATALOG}
          selectedCategoryId={this.state.selectedCategoryId}
          selectedSort={this.state.selectedSort}
          onProductTap={this.viewModel.onProductTap}
          onQuickAdd={this.viewModel.onQuickAdd}
        />
      ) : (
        <SearchSellerDiscovery
          query={this.state.submittedQuery}
          sellers={SEARCH_SELLERS}
          recentSellerIds={this.state.recentSellerIds}
          onSelect={this.handleSellerSelect}
          onRemoveRecent={this.handleRemoveRecentSeller}
          onClearRecent={this.handleClearRecentSellers}
        />
      )}
    </view>;
  }
}

const styles = {
  root: new Style<View>({ backgroundColor: colors.backgroundPrimary, flexGrow: 1, flexShrink: 1 }),
  header: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', paddingBottom: spacing.sm, paddingLeft: spacing.sm, paddingRight: spacing.sm, paddingTop: spacing.md }),
  backButton: new Style<View>({ alignItems: 'center', flexShrink: 0, height: 40, justifyContent: 'center', width: 40 }),
  searchFieldShell: new Style<View>({
    alignItems: 'center',
    borderColor: colors.textPrimary,
    borderRadius: radius.xs,
    borderWidth: 1,
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    height: 40,
    minWidth: 0,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
  }),
  searchField: new Style<TextField>({
    color: colors.textPrimary,
    flexGrow: 1,
    flexShrink: 1,
    font: montserrat.regular(fontSize.body),
    height: 40,
    marginLeft: spacing.sm,
    minWidth: 0,
  }),
  clearQueryButton: new Style<View>({ alignItems: 'center', backgroundColor: colors.backgroundTertiary, borderRadius: radius.full, flexShrink: 0, height: 18, justifyContent: 'center', width: 18 }),
  submitButton: new Style<View>({ alignItems: 'center', flexShrink: 0, height: 40, justifyContent: 'center', marginLeft: spacing.sm, paddingLeft: spacing.xs, paddingRight: spacing.xs }),
  submitLabel: new Style<Label>({ color: colors.interactivePrimary, font: montserrat.semiBold(fontSize.metadata) }),
  resultActions: new Style<Layout>({ alignItems: 'center', flexDirection: 'row', flexShrink: 0 }),
  resultActionButton: new Style<View>({ alignItems: 'center', height: layout.home.header.actionTarget, justifyContent: 'center', width: layout.home.header.actionTarget }),
  searchTabLabel: new Style<Label>({ color: colors.textPrimary, font: montserrat.semiBold(fontSize.body) }),
};
