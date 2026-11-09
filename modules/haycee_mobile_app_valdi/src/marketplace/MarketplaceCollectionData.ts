import { homeCategoryDefinitions } from '../home/data/HomeCategoryData';
import type { HomeProduct } from '../home/components/HomeProductRail';

export type MarketplaceCollectionKind = 'flash' | 'trending';

export interface MarketplaceCategoryFilter {
  id: string;
  label: string;
}

export const marketplaceCategoryFilters: MarketplaceCategoryFilter[] = [
  { id: 'all', label: 'TOUT' },
  { id: 'beauty', label: 'BEAUTÉ' },
  { id: 'womenswear', label: 'FEMME' },
  { id: 'electronics', label: 'ÉLECTRONIQUE' },
  { id: 'modest_wear', label: 'TENUE MODESTE' },
];

const sourceCategoriesByFilter: Record<string, string[] | undefined> = {
  all: undefined,
  beauty: ['beauty'],
  womenswear: ['fashion', 'bags', 'jewelry'],
  electronics: ['electronics'],
  modest_wear: ['fashion'],
};

/** Demo-backed collection source. The cursor contract is compatible with API pagination. */
export const getMarketplaceCollectionProducts = (
  kind: MarketplaceCollectionKind,
  categoryFilterId: string,
): HomeProduct[] => {
  const includedCategories = sourceCategoriesByFilter[categoryFilterId];
  const categories = homeCategoryDefinitions.filter(category => (
    !includedCategories || includedCategories.includes(category.id)
  ));

  return categories.flatMap(category => {
    const products = kind === 'flash' ? category.flashProducts : category.trendingProducts;
    return products.map((product, index): HomeProduct => ({
      ...product,
      category: category.id,
      isFlashSale: kind === 'flash' ? true : product.isFlashSale,
      popularityBadge: kind === 'trending'
        ? product.popularityBadge ?? 'BADGE_TRENDING'
        : product.popularityBadge,
      stockCount: kind === 'flash' ? product.stockCount ?? ((index % 7) + 2) : product.stockCount,
      stockTotal: kind === 'flash' ? product.stockTotal ?? 30 : product.stockTotal,
    }));
  });
};

export const MARKETPLACE_COLLECTION_PAGE_SIZE = 16;
