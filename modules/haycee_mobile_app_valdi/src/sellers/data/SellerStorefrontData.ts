import { MasonryProduct } from '../../design-system/components/MasonryProductCard';
import { colors } from '../../design-system/tokens/colors';
import { formatFcfa } from '../../design-system/utils/money';
import type { LiveFeedItem } from '../../live/data/LiveFeedData';

export interface SellerStoreCategory {
  id: string;
  label: string;
}

export interface SellerVideoPreview {
  id: string;
  title: string;
  viewCountLabel: string;
  color: string;
  thumbnailUrl?: string;
}

/** Demo storefront categories; replace with the seller catalog API when available. */
const sellerStoreCategoryDefinitions: SellerStoreCategory[] = [
  { id: 'all', label: 'Tout' },
  { id: 'mode', label: 'Mode' },
  { id: 'sacs', label: 'Sacs' },
  { id: 'bijoux', label: 'Bijoux' },
  { id: 'accessoires', label: 'Accessoires' },
  { id: 'chaussures', label: 'Chaussures' },
];

export const normalizeSellerStoreCategoryId = (category: string): string => (
  category
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
);

/** Shows category chips only when they can narrow this seller's actual product list. */
export const getSellerStoreCategories = (products: MasonryProduct[]): SellerStoreCategory[] => {
  const availableCategoryIds = new Set(
    products
      .map(product => product.category ? normalizeSellerStoreCategoryId(product.category) : '')
      .filter(categoryId => categoryId.length > 0),
  );

  if (availableCategoryIds.size < 2) {
    return [];
  }

  const availableDefinitions = sellerStoreCategoryDefinitions.filter(category => (
    category.id !== 'all' && availableCategoryIds.has(category.id)
  ));
  const knownCategoryIds = new Set(availableDefinitions.map(category => category.id));
  const dynamicCategories = Array.from(availableCategoryIds)
    .filter(categoryId => !knownCategoryIds.has(categoryId))
    .map(categoryId => ({
      id: categoryId,
      label: categoryId
        .split('-')
        .map(word => word.charAt(0).toLocaleUpperCase() + word.slice(1))
        .join(' '),
    }));

  return [
    sellerStoreCategoryDefinitions[0],
    ...availableDefinitions,
    ...dynamicCategories,
  ];
};

const demoProducts: Array<Pick<MasonryProduct, 'id' | 'title' | 'price' | 'color' | 'category' | 'masonryAspectRatio'>> = [
  { id: 'linen-shirt', title: 'Chemise en lin', price: formatFcfa(18500), color: colors.livePanelSand, category: 'mode', masonryAspectRatio: 0.82 },
  { id: 'everyday-dress', title: 'Robe fluide', price: formatFcfa(24500), color: colors.livePanelPeach, category: 'mode', masonryAspectRatio: 0.76 },
  { id: 'classic-jacket', title: 'Veste légère', price: formatFcfa(32000), color: colors.livePanelBlue, category: 'mode', masonryAspectRatio: 0.9 },
  { id: 'city-tote', title: 'Sac cabas City', price: formatFcfa(28000), color: colors.livePanelLavender, category: 'sacs', masonryAspectRatio: 0.88 },
  { id: 'mini-crossbody', title: 'Sac bandoulière Mini', price: formatFcfa(22500), color: colors.livePanelPeach, category: 'sacs', masonryAspectRatio: 0.78 },
  { id: 'woven-bag', title: 'Sac tressé', price: formatFcfa(19500), color: colors.livePanelSage, category: 'sacs', masonryAspectRatio: 0.96 },
  { id: 'gold-hoops', title: 'Créoles dorées', price: formatFcfa(8500), color: colors.livePanelSand, category: 'bijoux', masonryAspectRatio: 1 },
  { id: 'stone-necklace', title: 'Collier pierre naturelle', price: formatFcfa(12500), color: colors.livePanelLavender, category: 'bijoux', masonryAspectRatio: 0.9 },
  { id: 'silver-bracelet', title: 'Bracelet argenté', price: formatFcfa(9900), color: colors.livePanelBlue, category: 'bijoux', masonryAspectRatio: 0.84 },
  { id: 'silk-scarf', title: 'Foulard imprimé', price: formatFcfa(7500), color: colors.livePanelPeach, category: 'accessoires', masonryAspectRatio: 0.8 },
  { id: 'leather-belt', title: 'Ceinture fine', price: formatFcfa(11000), color: colors.livePanelSage, category: 'accessoires', masonryAspectRatio: 0.94 },
  { id: 'sunglasses', title: 'Lunettes de soleil', price: formatFcfa(16500), color: colors.livePanelSand, category: 'accessoires', masonryAspectRatio: 0.82 },
  { id: 'canvas-sneakers', title: 'Baskets en toile', price: formatFcfa(21500), color: colors.livePanelBlue, category: 'chaussures', masonryAspectRatio: 0.86 },
  { id: 'leather-sandals', title: 'Sandales en cuir', price: formatFcfa(17500), color: colors.livePanelSand, category: 'chaussures', masonryAspectRatio: 0.78 },
  { id: 'city-sneakers', title: 'Sneakers City', price: formatFcfa(29500), color: colors.livePanelLavender, category: 'chaussures', masonryAspectRatio: 0.92 },
];

const demoSellerVideoPreviews: Array<Pick<SellerVideoPreview, 'title' | 'viewCountLabel' | 'color'>> = [
  { title: 'Les nouveautés de la boutique', viewCountLabel: '12,4 K', color: colors.livePanelLavender },
  { title: 'Une tenue facile pour tous les jours', viewCountLabel: '8 240', color: colors.livePanelPeach },
  { title: 'Les détails de notre sélection', viewCountLabel: '6 105', color: colors.livePanelBlue },
  { title: 'Comment porter les pièces de saison', viewCountLabel: '5 890', color: colors.livePanelSage },
  { title: 'Un aperçu des nouvelles matières', viewCountLabel: '4 720', color: colors.livePanelSand },
  { title: 'La sélection du week-end', viewCountLabel: '3 680', color: colors.livePanelPeach },
  { title: 'Trois façons de porter ce sac', viewCountLabel: '2 940', color: colors.livePanelBlue },
  { title: 'Les pièces préférées de la semaine', viewCountLabel: '1 860', color: colors.livePanelLavender },
  { title: 'Préparation des commandes', viewCountLabel: '1 240', color: colors.livePanelSage },
  { title: 'Les accessoires du moment', viewCountLabel: '980', color: colors.livePanelSand },
  { title: 'Zoom sur les finitions', viewCountLabel: '760', color: colors.livePanelBlue },
  { title: 'Une nouveauté à découvrir', viewCountLabel: '540', color: colors.livePanelPeach },
];

/** Local video-tab fixtures; real seller media can replace these through the view model. */
export const createDemoSellerVideoPreviews = (
  seller: MasonryProduct,
  products: MasonryProduct[] = [],
): SellerVideoPreview[] => {
  const availableThumbnails = Array.from(new Set(
    [
      ...products.map(product => product.imageUrl),
      ...products.flatMap(product => product.imageUrls ?? []),
      seller.imageUrl,
      ...(seller.imageUrls ?? []),
    ].filter((url): url is string => Boolean(url)),
  ));

  const sellerId = seller.vendorId ?? seller.id;
  return demoSellerVideoPreviews.map((preview, index) => ({
    ...preview,
    id: `${sellerId}-video-preview-${index + 1}`,
    thumbnailUrl: availableThumbnails[index],
  }));
};

/** Local sample catalog used by the demo seller storefront. */
export const createDemoSellerStoreProducts = (seller: MasonryProduct): MasonryProduct[] => (
  demoProducts.map(product => ({
    ...seller,
    ...product,
    id: `${seller.vendorId ?? seller.id}-store-${product.id}`,
    imageUrl: undefined,
    imageUrls: undefined,
    galleryColors: undefined,
    isLive: false,
    isFlashSale: false,
    isFavorited: false,
  }))
);

/** Demo seller sessions for profiles opened outside a live-viewer route. */
export const createDemoSellerLiveItems = (seller: MasonryProduct): LiveFeedItem[] => {
  const hostName = seller.vendorName ?? 'Boutique Haycee';
  const baseId = seller.vendorId ?? seller.id;
  const category = seller.category ?? 'Sélection';
  const liveNow = seller.isLive ?? false;

  const previewItems: LiveFeedItem[] = [
    {
      id: `${baseId}-seller-clearance`,
      hostName,
      vendorAvatarUrl: seller.vendorAvatarUrl,
      title: 'Sélection de fin de collection',
      category: 'Mode',
      viewers: 0,
      presentationType: 'showcase',
      status: 'upcoming',
      panelColor: colors.livePanelPeach,
      scheduledAtLabel: 'JEUDI · 18:30',
      badges: [{ id: 'clearance', label: 'DESTOCKAGE', variant: 'clearance' }],
    },
    {
      id: `${baseId}-seller-new`,
      hostName,
      vendorAvatarUrl: seller.vendorAvatarUrl,
      title: 'Les nouveautés de la semaine',
      category: 'Nouveautés',
      viewers: 0,
      presentationType: 'classic',
      status: 'upcoming',
      panelColor: colors.livePanelBlue,
      scheduledAtLabel: 'VENDREDI · 19:00',
      badges: [{ id: 'new', label: 'NOUVEAUTÉ', variant: 'new' }],
    },
    {
      id: `${baseId}-seller-promo`,
      hostName,
      vendorAvatarUrl: seller.vendorAvatarUrl,
      title: 'Offres spéciales en direct',
      category: 'Sélection',
      viewers: 0,
      presentationType: 'auction',
      status: 'upcoming',
      panelColor: colors.livePanelLavender,
      scheduledAtLabel: 'SAMEDI · 17:00',
      badges: [{ id: 'promotion', label: 'PROMO', variant: 'promotion' }],
    },
    {
      id: `${baseId}-seller-limited`,
      hostName,
      vendorAvatarUrl: seller.vendorAvatarUrl,
      title: 'Les dernières pièces disponibles',
      category: 'Pièces rares',
      viewers: 0,
      presentationType: 'showcase',
      status: 'upcoming',
      panelColor: colors.livePanelSand,
      scheduledAtLabel: 'DIMANCHE · 16:00',
      badges: [{ id: 'limited', label: 'DERNIÈRE PIÈCE', variant: 'limited' }],
    },
    {
      id: `${baseId}-seller-live-preview`,
      hostName,
      vendorAvatarUrl: seller.vendorAvatarUrl,
      title: 'Présentation en direct de la sélection',
      category: 'Sélection',
      viewers: 1380,
      presentationType: 'classic',
      status: 'live',
      panelColor: colors.livePanelBlue,
    },
    {
      id: `${baseId}-seller-sold-preview`,
      hostName,
      vendorAvatarUrl: seller.vendorAvatarUrl,
      title: 'Sélection de pièces vendues',
      category: 'Sélection',
      viewers: 936,
      presentationType: 'showcase',
      status: 'live',
      panelColor: colors.livePanelSand,
      badges: [{ id: 'sold', label: 'SOLD', variant: 'sold' }],
    },
  ];

  return [
    {
      id: `${baseId}-seller-live`,
      hostName,
      vendorRating: seller.vendorRating,
      vendorReviewSummary: seller.vendorReviewSummary,
      vendorCountryCode: seller.vendorCountryCode,
      vendorCountry: seller.vendorCountry,
      vendorCity: seller.vendorCity,
      vendorAvatarUrl: seller.vendorAvatarUrl,
      vendorCoverImageUrl: seller.vendorCoverImageUrl,
      vendorBio: seller.vendorBio,
      vendorVerified: seller.vendorVerified,
      vendorSalesCount: seller.vendorSalesCount,
      vendorFollowersCount: seller.vendorFollowersCount,
      vendorDispatchTime: seller.vendorDispatchTime,
      vendorDeliveryTime: seller.vendorDeliveryTime,
      title: seller.title,
      category,
      viewers: liveNow ? 128 : 0,
      presentationType: 'classic',
      status: liveNow ? 'live' : 'upcoming',
      panelColor: seller.color,
      badges: liveNow ? undefined : [{ id: 'exclusive', label: 'EXCLUSIF', variant: 'exclusive' }],
    },
    {
      id: `${baseId}-seller-upcoming`,
      hostName,
      vendorAvatarUrl: seller.vendorAvatarUrl,
      title: `Prochain live de ${hostName}`,
      category,
      viewers: 0,
      presentationType: 'showcase',
      status: 'upcoming',
      panelColor: colors.livePanelLavender,
      scheduledAtLabel: 'DEMAIN · 18:00',
      badges: [{ id: 'exclusive', label: 'EXCLUSIF', variant: 'exclusive' }],
    },
    ...previewItems,
  ];
};
