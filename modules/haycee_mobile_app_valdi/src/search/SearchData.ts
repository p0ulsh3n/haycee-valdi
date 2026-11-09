import { homeCategoryDefinitions } from '../home/data/HomeCategoryData';
import type { HomeProduct } from '../home/components/HomeProductRail';
import { getLiveFeedItems } from '../live/data/LiveFeedData';

export interface SearchCategory {
  id: string;
  label: string;
}

export interface SearchSeller {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  rating?: string;
  reviewSummary?: string;
  profileProduct: HomeProduct;
}

export const searchCategories: SearchCategory[] = [
  { id: 'all', label: 'Tout' },
  ...homeCategoryDefinitions
    .filter(category => category.id !== 'all')
    .map(category => ({ id: category.id, label: category.label })),
];

/** Demo catalog adapter. Replace its source with the search API without changing the UI contract. */
export const getDemoSearchCatalog = (): HomeProduct[] => {
  const products = homeCategoryDefinitions.flatMap(category => [
    ...category.flashProducts,
    ...category.trendingProducts,
    ...category.dealsProducts,
  ]);
  const seenIds = new Set<string>();
  return products.filter(product => {
    if (seenIds.has(product.id)) return false;
    seenIds.add(product.id);
    return true;
  });
};

/** Product-title suggestions used while the user types, until the search API is connected. */
export const getSearchTitleSuggestions = (products: HomeProduct[], query: string): string[] => {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const seenTitles = new Set<string>();
  return products
    .filter(product => {
      const title = normalizeSearchText(product.title);
      return terms.every(term => title.includes(term));
    })
    .map(product => product.title)
    .filter(title => {
      const normalizedTitle = normalizeSearchText(title);
      if (seenTitles.has(normalizedTitle)) return false;
      seenTitles.add(normalizedTitle);
      return true;
    })
    .slice(0, 8);
};

/** Demo seller accounts sourced from the same local seller fixtures as the Live feed. */
export const getDemoSearchSellers = (products: HomeProduct[]): SearchSeller[] => {
  if (products.length === 0) return [];

  const seenSellerIds = new Set<string>();
  return getLiveFeedItems('for-you').flatMap((item, index) => {
    const username = item.hostName
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30);
    const id = username || item.id;
    if (seenSellerIds.has(id)) return [];
    seenSellerIds.add(id);

    const baseProduct = products[index % products.length];
    return [{
      id,
      displayName: item.hostName,
      username,
      avatarUrl: item.vendorAvatarUrl,
      rating: item.vendorRating,
      reviewSummary: item.vendorReviewSummary,
      profileProduct: {
        ...baseProduct,
        id: `search-seller-${id}`,
        vendorId: id,
        vendorName: item.hostName,
        vendorUsername: username,
        vendorAvatarUrl: item.vendorAvatarUrl,
        vendorCoverImageUrl: item.vendorCoverImageUrl,
        vendorRating: item.vendorRating,
        vendorReviewSummary: item.vendorReviewSummary,
        vendorSalesCount: item.vendorSalesCount,
        vendorFollowersCount: item.vendorFollowersCount,
        vendorBio: item.vendorBio,
        vendorCountryCode: item.vendorCountryCode,
        vendorCountry: item.vendorCountry,
        vendorCity: item.vendorCity,
        vendorVerified: item.vendorVerified,
        vendorDispatchTime: item.vendorDispatchTime,
        vendorDeliveryTime: item.vendorDeliveryTime,
      },
    }];
  });
};

export const filterSearchSellers = (sellers: SearchSeller[], query: string): SearchSeller[] => {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return sellers.filter(seller => {
    const searchableText = normalizeSearchText(`${seller.displayName} ${seller.username}`);
    return terms.every(term => searchableText.includes(term));
  });
};

const normalizeSearchText = (value: string): string => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim();

export type SearchSort = 'recommended' | 'newest' | 'popular' | 'trending' | 'price_low' | 'price_high';

export const searchSortOptions: Array<{ id: SearchSort; label: string }> = [
  { id: 'recommended', label: 'Recommandé' },
  { id: 'newest', label: 'Nouveautés' },
  { id: 'popular', label: 'Populaires' },
  { id: 'trending', label: 'Tendances' },
  { id: 'price_low', label: 'Prix croissant' },
  { id: 'price_high', label: 'Prix décroissant' },
];

export const filterAndSortSearchProducts = (
  products: HomeProduct[],
  query: string,
  categoryId: string,
  sort: SearchSort,
): HomeProduct[] => {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  const filtered = products.filter(product => {
    const categoryMatches = categoryId === 'all' || product.category === categoryId;
    if (!categoryMatches) return false;
    if (terms.length === 0) return true;

    const searchableText = normalizeSearchText([
      product.title,
      product.description ?? '',
      product.category ?? '',
      product.vendorName ?? '',
      product.vendorUsername ?? '',
      ...(product.tags ?? []),
    ].join(' '));
    return terms.every(term => searchableText.includes(term));
  });

  if (sort === 'newest') return filtered.slice().reverse();
  if (sort === 'popular') {
    return filtered.slice().sort((left, right) => Number(right.reviewCount ?? 0) - Number(left.reviewCount ?? 0));
  }
  if (sort === 'trending') {
    return filtered.slice().sort((left, right) => Number(Boolean(right.popularityBadge)) - Number(Boolean(left.popularityBadge)));
  }
  if (sort === 'price_low' || sort === 'price_high') {
    const priceValue = (product: HomeProduct): number => Number(product.price.replace(/[^\d]/g, '')) || 0;
    return filtered.slice().sort((left, right) => (
      sort === 'price_low' ? priceValue(left) - priceValue(right) : priceValue(right) - priceValue(left)
    ));
  }
  return filtered;
};

export const recentSearchFixtures = [
  'Veste en cuir vintage',
  'Sneakers',
  'Montre classique',
  'Sac minimaliste',
  'Jean coupe droite',
  'Lunettes vintage',
];

export const trendingSearchFixtures = [
  'Veste en cuir vintage',
  'Maison Margiela Tabi',
  'Balenciaga Track',
  'Jean coupe droite',
  'Chrome Hearts Ring',
];

export const discoverySearchFixtures = [
  'Nouvelle collection',
  'Sac à main',
  'Sneakers femme',
  'Bijoux',
  'Montre',
  'Beauté',
];
