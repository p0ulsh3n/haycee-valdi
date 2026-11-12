import { MasonryProduct } from '../../design-system/components/MasonryProductCard';
import { colors } from '../../design-system/tokens/colors';
import { formatFcfa } from '../../design-system/utils/money';
import type { LiveFeedItem } from '../../live/data/LiveFeedData';
import {
  DEMO_SELLER_VIDEO_ASSET_IDS,
  getSellerVideoThumbnailFit,
  getSellerVideoThumbnailUrl,
  getSellerVideoUrl,
} from './SellerVideoMedia';

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
  thumbnailFit?: 'cover' | 'contain';
  /** Optional HTTPS playback source supplied by seller-video data. */
  videoUrl?: string;
  likeCount?: number;
  commentCount?: number;
  favoriteCount?: number;
  shareCount?: number;
  isLiked?: boolean;
  isFavorited?: boolean;
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

const demoSellerVideoPreviews: Array<Pick<SellerVideoPreview, 'title' | 'viewCountLabel' | 'color' | 'likeCount' | 'commentCount' | 'favoriteCount' | 'shareCount'>> = [
  { title: 'Les nouveautés de la boutique', viewCountLabel: '12,4 K', color: colors.livePanelLavender, likeCount: 3240, commentCount: 128, favoriteCount: 486, shareCount: 92 },
  { title: 'Une tenue facile pour tous les jours', viewCountLabel: '8 240', color: colors.livePanelPeach, likeCount: 2180, commentCount: 86, favoriteCount: 342, shareCount: 57 },
  { title: 'Les détails de notre sélection', viewCountLabel: '6 105', color: colors.livePanelBlue, likeCount: 1640, commentCount: 64, favoriteCount: 231, shareCount: 42 },
  { title: 'Comment porter les pièces de saison', viewCountLabel: '5 890', color: colors.livePanelSage, likeCount: 1490, commentCount: 58, favoriteCount: 218, shareCount: 38 },
  { title: 'Un aperçu des nouvelles matières', viewCountLabel: '4 720', color: colors.livePanelSand, likeCount: 1180, commentCount: 46, favoriteCount: 176, shareCount: 31 },
  { title: 'La sélection du week-end', viewCountLabel: '3 680', color: colors.livePanelPeach, likeCount: 920, commentCount: 39, favoriteCount: 144, shareCount: 26 },
  { title: 'Trois façons de porter ce sac', viewCountLabel: '2 940', color: colors.livePanelBlue, likeCount: 740, commentCount: 32, favoriteCount: 118, shareCount: 21 },
  { title: 'Les pièces préférées de la semaine', viewCountLabel: '1 860', color: colors.livePanelLavender, likeCount: 480, commentCount: 23, favoriteCount: 84, shareCount: 16 },
  { title: 'Préparation des commandes', viewCountLabel: '1 240', color: colors.livePanelSage, likeCount: 326, commentCount: 18, favoriteCount: 62, shareCount: 12 },
  { title: 'Les accessoires du moment', viewCountLabel: '980', color: colors.livePanelSand, likeCount: 254, commentCount: 14, favoriteCount: 49, shareCount: 9 },
  { title: 'Zoom sur les finitions', viewCountLabel: '760', color: colors.livePanelBlue, likeCount: 192, commentCount: 11, favoriteCount: 38, shareCount: 7 },
  { title: 'Une nouveauté à découvrir', viewCountLabel: '540', color: colors.livePanelPeach, likeCount: 138, commentCount: 8, favoriteCount: 27, shareCount: 5 },
  { title: 'Les pièces qu’on porte cette saison', viewCountLabel: '486', color: colors.livePanelLavender, likeCount: 124, commentCount: 7, favoriteCount: 24, shareCount: 4 },
  { title: 'Un sac, trois idées de tenues', viewCountLabel: '392', color: colors.livePanelBlue, likeCount: 98, commentCount: 6, favoriteCount: 19, shareCount: 3 },
  { title: 'Dans les coulisses de la boutique', viewCountLabel: '318', color: colors.livePanelSage, likeCount: 81, commentCount: 5, favoriteCount: 16, shareCount: 3 },
  { title: 'Les matières en détail', viewCountLabel: '274', color: colors.livePanelSand, likeCount: 69, commentCount: 4, favoriteCount: 13, shareCount: 2 },
  { title: 'Notre sélection de bijoux', viewCountLabel: '231', color: colors.livePanelPeach, likeCount: 58, commentCount: 3, favoriteCount: 11, shareCount: 2 },
  { title: 'Comment choisir sa taille', viewCountLabel: '187', color: colors.livePanelBlue, likeCount: 47, commentCount: 3, favoriteCount: 9, shareCount: 1 },
  { title: 'Les nouveautés arrivent', viewCountLabel: '154', color: colors.livePanelLavender, likeCount: 39, commentCount: 2, favoriteCount: 8, shareCount: 1 },
  { title: 'Une tenue pour le week-end', viewCountLabel: '128', color: colors.livePanelSage, likeCount: 32, commentCount: 2, favoriteCount: 6, shareCount: 1 },
  { title: 'Zoom sur les finitions', viewCountLabel: '96', color: colors.livePanelSand, likeCount: 24, commentCount: 1, favoriteCount: 5, shareCount: 1 },
];

/** Local video-tab fixtures; all media URLs are resolved in the data layer. */
export const createDemoSellerVideoPreviews = (
  seller: MasonryProduct,
  _products: MasonryProduct[] = [],
): SellerVideoPreview[] => {
  const sellerId = seller.vendorId ?? seller.id;
  return demoSellerVideoPreviews.map((preview, index) => ({
    ...preview,
    id: `${sellerId}-video-preview-${index + 1}`,
    thumbnailUrl: DEMO_SELLER_VIDEO_ASSET_IDS[index]
      ? getSellerVideoThumbnailUrl(DEMO_SELLER_VIDEO_ASSET_IDS[index])
      : undefined,
    thumbnailFit: DEMO_SELLER_VIDEO_ASSET_IDS[index]
      ? getSellerVideoThumbnailFit(DEMO_SELLER_VIDEO_ASSET_IDS[index])
      : undefined,
    videoUrl: DEMO_SELLER_VIDEO_ASSET_IDS[index]
      ? getSellerVideoUrl(DEMO_SELLER_VIDEO_ASSET_IDS[index])
      : undefined,
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
