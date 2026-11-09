import { HomeProduct } from '../components/HomeProductRail';
import { HomePromoBanner } from '../components/HomePromoBannerCarousel';
import { formatPriceLabel } from '../../design-system/utils/money';

/**
 * Stable category identity plus server-friendly display data.
 * The id is used for tab/page selection; labels and content can later come
 * from the Home API without changing the SwipeTabs structure.
 */
export interface HomeCategoryDefinition {
  id: string;
  label: string;
  banners: HomePromoBanner[];
  flashProducts: HomeProduct[];
  trendingProducts: HomeProduct[];
  dealsProducts: HomeProduct[];
}

export interface HomeSubcategory {
  id: string;
  label: string;
  panelColor: string;
}

const product = (
  id: string,
  title: string,
  price: string,
  color: string,
  galleryColors?: string[],
  metadata: Partial<HomeProduct> = {},
): HomeProduct => ({
  id,
  title,
  price: formatPriceLabel(price),
  color,
  ...(galleryColors ? { galleryColors } : {}),
  ...metadata,
});

const banner = (id: string, eyebrow: string, title: string, color: string): HomePromoBanner => ({
  id,
  eyebrow,
  title,
  color,
});

/** Local fixture catalog used until the category API is connected. */
export const homeCategoryDefinitions: HomeCategoryDefinition[] = [
  {
    id: 'all',
    label: 'ALL',
    banners: [
      banner('all-spring', 'Nouvelle saison', 'Les essentiels du printemps', '#FFF2C7'),
      banner('all-live', 'En direct', 'Découvre les ventes live', '#D9F2FF'),
    ],
    flashProducts: [
      product('all-p1', 'Sac minimaliste', '24,90 €', '#E8D8CF', [
        '#E8D8CF',
        '#E5D7E8',
        '#D7E2E9',
      ], {
        originalPrice: '32,90 €',
        discountLabel: '-24%',
        popularityBadge: 'BADGE_BEST_SELLER',
        isFlashSale: true,
        stockCount: 4,
        stockTotal: 50,
        offer: { type: 'OFFER_FLASH_SALE_COUNTDOWN', params: { pct: '-24%' }, endsAt: new Date(Date.now() + 45 * 60 * 1000).toISOString() },
        rating: '4.8',
        reviewCount: '32',
      }),
      product('all-p2', 'Sneakers everyday', '59,00 €', '#D7E2E9', undefined, {
        isLive: true,
        popularityBadge: 'BADGE_HOT',
        offer: { type: 'OFFER_LIVE_EXCLUSIVE' },
        rating: '4.7',
        reviewCount: '12',
      }),
      product('all-p3', 'Montre classique', '39,90 €', '#E4E0D4'),
      product('all-p4', 'Accessoire signature', '18,50 €', '#E5D7E8'),
    ],
    trendingProducts: [
      product('all-t1', 'Look quotidien', '49,90 €', '#E5D7E8', undefined, {
        popularityBadge: 'BADGE_TRENDING',
        offer: { type: 'SOCIAL_IN_CART', params: { count: 28 } },
        rating: '4.9',
        reviewCount: '18',
      }),
      product('all-t2', 'Édition studio', '79,00 €', '#D7E2E9'),
      product('all-t3', 'Essentiel neutre', '34,90 €', '#E4E0D4'),
    ],
    dealsProducts: [
      product('all-d1', 'Sélection du jour', '29,90 €', '#E8D8CF', undefined, {
        popularityBadge: 'BADGE_NEW',
        offer: { type: 'OFFER_FREE_SHIPPING', params: { amount: '20.000 FCFA' } },
      }),
      product('all-d2', 'Dernières pièces', '19,90 €', '#D7E2E9'),
    ],
  },
  {
    id: 'fashion',
    label: 'MODE',
    banners: [
      banner('fashion-edit', 'Édition mode', 'Les silhouettes qui attirent les regards', '#F8DDE5'),
      banner('fashion-studio', 'Studio', 'Compose ton look de saison', '#E8E0FF'),
    ],
    flashProducts: [
      product('fashion-p1', 'Veste oversize', '79,90 €', '#E6D4C8'),
      product('fashion-p2', 'Robe satinée', '64,00 €', '#E8D6E0'),
      product('fashion-p3', 'Jean coupe droite', '45,90 €', '#D6E2EC'),
      product('fashion-p4', 'Chemise blanche', '29,90 €', '#ECE9E0'),
    ],
    trendingProducts: [
      product('fashion-t1', 'Minimal tailoring', '99,00 €', '#D9D4C8'),
      product('fashion-t2', 'Soft layers', '54,90 €', '#E8D6E0'),
      product('fashion-t3', 'Denim essentiel', '39,90 €', '#D6E2EC'),
    ],
    dealsProducts: [
      product('fashion-d1', 'Pièces intemporelles', '34,90 €', '#ECE9E0'),
      product('fashion-d2', 'Sélection créateurs', '89,90 €', '#E6D4C8'),
    ],
  },
  {
    id: 'sneakers',
    label: 'SNEAKERS',
    banners: [
      banner('sneakers-drop', 'Nouveau drop', 'Les sneakers du moment', '#D8F0FF'),
      banner('sneakers-live', 'En direct', 'Les paires à ne pas manquer', '#E5E0FF'),
    ],
    flashProducts: [
      product('sneakers-p1', 'Runner cloud', '89,00 €', '#D7E2E9'),
      product('sneakers-p2', 'Court classic', '74,90 €', '#E8D8CF'),
      product('sneakers-p3', 'Street low', '69,00 €', '#E4E0D4'),
      product('sneakers-p4', 'Trail light', '109,90 €', '#D8E6D5'),
    ],
    trendingProducts: [
      product('sneakers-t1', 'Daily runner', '84,90 €', '#D7E2E9'),
      product('sneakers-t2', 'Retro court', '79,90 €', '#E8D8CF'),
      product('sneakers-t3', 'Urban trail', '119,00 €', '#D8E6D5'),
    ],
    dealsProducts: [
      product('sneakers-d1', 'Fin de série', '49,90 €', '#E4E0D4'),
      product('sneakers-d2', 'Paires exclusives', '99,00 €', '#D7E2E9'),
    ],
  },
  {
    id: 'watches',
    label: 'MONTRES',
    banners: [
      banner('watches-classic', 'Ligne classique', 'Le temps avec élégance', '#EFE4D1'),
      banner('watches-detail', 'Détails', 'Des cadrans qui font la différence', '#DCE8E7'),
    ],
    flashProducts: [
      product('watches-p1', 'Cadran acier', '129,00 €', '#E4E0D4'),
      product('watches-p2', 'Bracelet cuir', '94,90 €', '#E8D8CF'),
      product('watches-p3', 'Minimal black', '149,00 €', '#D8D8D8'),
      product('watches-p4', 'Chrono silver', '179,90 €', '#D7E2E9'),
    ],
    trendingProducts: [
      product('watches-t1', 'Everyday steel', '139,00 €', '#D7E2E9'),
      product('watches-t2', 'Leather line', '109,90 €', '#E8D8CF'),
      product('watches-t3', 'Clean dial', '159,00 €', '#E4E0D4'),
    ],
    dealsProducts: [
      product('watches-d1', 'Dernières montres', '89,90 €', '#D8D8D8'),
      product('watches-d2', 'Bracelets seuls', '24,90 €', '#E8D8CF'),
    ],
  },
  {
    id: 'beauty',
    label: 'BEAUTÉ',
    banners: [
      banner('beauty-glow', 'Glow naturel', 'La routine qui te ressemble', '#FFE1D7'),
      banner('beauty-care', 'Self care', 'Prends du temps pour toi', '#F0DDF4'),
    ],
    flashProducts: [
      product('beauty-p1', 'Sérum éclat', '24,90 €', '#F2D8CF'),
      product('beauty-p2', 'Crème hydratante', '19,90 €', '#E8D8CF'),
      product('beauty-p3', 'Palette nude', '29,00 €', '#E5D7E8'),
      product('beauty-p4', 'Huile légère', '16,90 €', '#E4E0D4'),
    ],
    trendingProducts: [
      product('beauty-t1', 'Skin first', '34,90 €', '#F2D8CF'),
      product('beauty-t2', 'Soft color', '27,90 €', '#E5D7E8'),
      product('beauty-t3', 'Clean routine', '42,00 €', '#E8D8CF'),
    ],
    dealsProducts: [
      product('beauty-d1', 'Routine découverte', '29,90 €', '#E4E0D4'),
      product('beauty-d2', 'Formats voyage', '14,90 €', '#F2D8CF'),
    ],
  },
  {
    id: 'home',
    label: 'MAISON',
    banners: [
      banner('home-slow', 'Slow living', 'Un intérieur qui respire', '#E4E8D8'),
      banner('home-details', 'Petits détails', 'Change ton quotidien', '#F3E5CE'),
    ],
    flashProducts: [
      product('home-p1', 'Lampe nomade', '39,90 €', '#E4E0D4'),
      product('home-p2', 'Vase organique', '24,90 €', '#E8D8CF'),
      product('home-p3', 'Plaid doux', '49,00 €', '#D7E2E9'),
      product('home-p4', 'Miroir rond', '59,90 €', '#E5D7E8'),
    ],
    trendingProducts: [
      product('home-t1', 'Natural textures', '44,90 €', '#E4E0D4'),
      product('home-t2', 'Warm lights', '34,90 €', '#F3E5CE'),
      product('home-t3', 'Soft corners', '54,00 €', '#E8D8CF'),
    ],
    dealsProducts: [
      product('home-d1', 'Sélection maison', '22,90 €', '#D7E2E9'),
      product('home-d2', 'Dernières pièces déco', '18,90 €', '#E5D7E8'),
    ],
  },
  {
    id: 'electronics',
    label: 'ÉLECTRONIQUE',
    banners: [
      banner('electronics-smart', 'Smart living', 'La technologie au quotidien', '#D8E8F7'),
      banner('electronics-audio', 'Audio', 'Écoute autrement', '#E1DCF7'),
    ],
    flashProducts: [
      product('electronics-p1', 'Casque studio', '89,90 €', '#D7E2E9'),
      product('electronics-p2', 'Mini enceinte', '39,90 €', '#D8D8D8'),
      product('electronics-p3', 'Lampe connectée', '29,00 €', '#E4E0D4'),
      product('electronics-p4', 'Chargeur compact', '18,90 €', '#E5D7E8'),
    ],
    trendingProducts: [
      product('electronics-t1', 'Desk setup', '119,00 €', '#D7E2E9'),
      product('electronics-t2', 'Sound essentials', '69,90 €', '#D8D8D8'),
      product('electronics-t3', 'Travel tech', '49,90 €', '#E5D7E8'),
    ],
    dealsProducts: [
      product('electronics-d1', 'Accessoires utiles', '12,90 €', '#E4E0D4'),
      product('electronics-d2', 'Offres audio', '44,90 €', '#D7E2E9'),
    ],
  },
  {
    id: 'sport',
    label: 'SPORT',
    banners: [
      banner('sport-motion', 'En mouvement', 'Bouge à ton rythme', '#D9F1E2'),
      banner('sport-outdoor', 'Outdoor', 'Prends l’air', '#D8E8F7'),
    ],
    flashProducts: [
      product('sport-p1', 'Legging studio', '34,90 €', '#D8E6D5'),
      product('sport-p2', 'Veste running', '64,00 €', '#D7E2E9'),
      product('sport-p3', 'Sac training', '44,90 €', '#E8D8CF'),
      product('sport-p4', 'Gourde inox', '19,90 €', '#E4E0D4'),
    ],
    trendingProducts: [
      product('sport-t1', 'Studio flow', '39,90 €', '#D8E6D5'),
      product('sport-t2', 'Run outside', '79,00 €', '#D7E2E9'),
      product('sport-t3', 'Weekend active', '54,90 €', '#E8D8CF'),
    ],
    dealsProducts: [
      product('sport-d1', 'Équipement léger', '24,90 €', '#E4E0D4'),
      product('sport-d2', 'Dernières tailles', '29,90 €', '#D8E6D5'),
    ],
  },
  {
    id: 'bags',
    label: 'BAGAGERIE',
    banners: [
      banner('bags-city', 'City essentials', 'Tout ce qui te suit', '#E8D8CF'),
      banner('bags-weekend', 'Weekend', 'Partir léger, partir bien', '#D7E2E9'),
    ],
    flashProducts: [
      product('bags-p1', 'Tote structuré', '49,90 €', '#E8D8CF'),
      product('bags-p2', 'Mini crossbody', '39,00 €', '#E5D7E8'),
      product('bags-p3', 'Sac weekend', '79,90 €', '#D7E2E9'),
      product('bags-p4', 'Pochette grainée', '24,90 €', '#E4E0D4'),
    ],
    trendingProducts: [
      product('bags-t1', 'City carry', '59,90 €', '#E8D8CF'),
      product('bags-t2', 'Soft leather', '89,00 €', '#E4E0D4'),
      product('bags-t3', 'Travel light', '69,90 €', '#D7E2E9'),
    ],
    dealsProducts: [
      product('bags-d1', 'Petits formats', '19,90 €', '#E5D7E8'),
      product('bags-d2', 'Derniers coloris', '34,90 €', '#E8D8CF'),
    ],
  },
  {
    id: 'jewelry',
    label: 'BIJOUX',
    banners: [
      banner('jewelry-light', 'Lumière', 'Les détails qui signent un look', '#FFF0CF'),
      banner('jewelry-layering', 'Layering', 'Superpose tes envies', '#F0DDF4'),
    ],
    flashProducts: [
      product('jewelry-p1', 'Chaîne fine', '24,90 €', '#E4E0D4'),
      product('jewelry-p2', 'Bague dorée', '19,90 €', '#FFF0CF'),
      product('jewelry-p3', 'Boucles créoles', '29,90 €', '#E5D7E8'),
      product('jewelry-p4', 'Bracelet minimal', '22,00 €', '#E8D8CF'),
    ],
    trendingProducts: [
      product('jewelry-t1', 'Fine layers', '39,90 €', '#FFF0CF'),
      product('jewelry-t2', 'Everyday gold', '34,90 €', '#E4E0D4'),
      product('jewelry-t3', 'Soft sparkle', '29,00 €', '#E5D7E8'),
    ],
    dealsProducts: [
      product('jewelry-d1', 'Petits cadeaux', '14,90 €', '#E8D8CF'),
      product('jewelry-d2', 'Dernières pièces', '18,90 €', '#FFF0CF'),
    ],
  },
];

export const getHomeCategory = (id: string): HomeCategoryDefinition => {
  return homeCategoryDefinitions.find(category => category.id === id) ?? homeCategoryDefinitions[0];
};

/** Demo subcategory directory; replace these entries with the category API response. */
export const homeSubcategoriesByCategory: Record<string, HomeSubcategory[]> = {
  fashion: [
    { id: 'blouses-shirts', label: 'Blouses et chemises', panelColor: '#B8D3F0' },
    { id: 'trousers', label: 'Pantalons', panelColor: '#C99A83' },
    { id: 'outerwear', label: 'Manteaux et vestes', panelColor: '#88C9A7' },
    { id: 'knitwear', label: 'Pulls, cols roulés et cardigans', panelColor: '#E9C7D0' },
    { id: 'jeans', label: 'Jeans', panelColor: '#839BC8' },
    { id: 'jumpsuits', label: 'Combinaisons', panelColor: '#E8C6B3' },
    { id: 'sets', label: 'Ensembles', panelColor: '#67BBA0' },
    { id: 'long-sleeve-tops', label: 'Hauts à manches longues', panelColor: '#E7BFD2' },
    { id: 'blazers', label: 'Blazers, gilets et vestes habillées', panelColor: '#C95C83' },
  ],
  sneakers: [
    { id: 'low-sneakers', label: 'Sneakers basses', panelColor: '#D5D8E4' },
    { id: 'high-top-sneakers', label: 'Sneakers montantes', panelColor: '#C8B4D1' },
    { id: 'running-shoes', label: 'Chaussures de running', panelColor: '#B5D8D2' },
    { id: 'casual-shoes', label: 'Chaussures de ville', panelColor: '#D7B9A8' },
    { id: 'sandals', label: 'Sandales', panelColor: '#E8D5AD' },
    { id: 'shoe-care', label: 'Entretien et accessoires', panelColor: '#C8D3DF' },
  ],
  watches: [
    { id: 'analog-watches', label: 'Montres classiques', panelColor: '#D8C7A7' },
    { id: 'smart-watches', label: 'Montres connectées', panelColor: '#B8C6D8' },
    { id: 'watch-straps', label: 'Bracelets de montre', panelColor: '#C99F87' },
    { id: 'watch-jewelry', label: 'Bijoux de montre', panelColor: '#E3D8B8' },
  ],
  beauty: [
    { id: 'skincare', label: 'Soins du visage', panelColor: '#F0CFC5' },
    { id: 'makeup', label: 'Maquillage', panelColor: '#E4B9C9' },
    { id: 'haircare', label: 'Soins des cheveux', panelColor: '#C8B5A6' },
    { id: 'fragrance', label: 'Parfums', panelColor: '#E8D6B7' },
    { id: 'bodycare', label: 'Soins du corps', panelColor: '#D9C4E3' },
  ],
  home: [
    { id: 'lighting', label: 'Luminaires', panelColor: '#D9C798' },
    { id: 'decor', label: 'Décoration', panelColor: '#D5BCAF' },
    { id: 'textiles', label: 'Textiles et linge de maison', panelColor: '#B9CBD8' },
    { id: 'furniture', label: 'Meubles', panelColor: '#AFC6BB' },
    { id: 'kitchen', label: 'Cuisine et art de la table', panelColor: '#E2D1B5' },
  ],
  electronics: [
    { id: 'phones', label: 'Téléphones et accessoires', panelColor: '#AFC3E7' },
    { id: 'audio', label: 'Audio', panelColor: '#C5B8D9' },
    { id: 'computers', label: 'Ordinateurs et tablettes', panelColor: '#B7C9CF' },
    { id: 'gaming', label: 'Jeux vidéo', panelColor: '#B7D3B4' },
    { id: 'smart-home', label: 'Maison connectée', panelColor: '#D9C8A8' },
  ],
  sport: [
    { id: 'sportswear', label: 'Vêtements de sport', panelColor: '#B8D6C3' },
    { id: 'training', label: 'Fitness et musculation', panelColor: '#D6C2AF' },
    { id: 'outdoor', label: 'Outdoor et randonnée', panelColor: '#B6CCB5' },
    { id: 'team-sports', label: 'Sports collectifs', panelColor: '#B6C8E0' },
    { id: 'sports-accessories', label: 'Accessoires de sport', panelColor: '#E2D1A8' },
  ],
  bags: [
    { id: 'handbags', label: 'Sacs à main', panelColor: '#D9B9A8' },
    { id: 'backpacks', label: 'Sacs à dos', panelColor: '#B9C9D8' },
    { id: 'crossbody-bags', label: 'Sacs bandoulière', panelColor: '#C8B9D5' },
    { id: 'luggage', label: 'Valises et voyage', panelColor: '#B6CDBE' },
    { id: 'wallets', label: 'Portefeuilles et pochettes', panelColor: '#E1C99E' },
  ],
  jewelry: [
    { id: 'necklaces', label: 'Colliers', panelColor: '#E4D3A3' },
    { id: 'earrings', label: 'Boucles d’oreilles', panelColor: '#D4B8C9' },
    { id: 'rings', label: 'Bagues', panelColor: '#D7C6A6' },
    { id: 'bracelets', label: 'Bracelets', panelColor: '#C5D2DC' },
    { id: 'hair-accessories', label: 'Accessoires pour cheveux', panelColor: '#D7C4B5' },
  ],
};

export const getHomeSubcategories = (categoryId: string): HomeSubcategory[] => (
  homeSubcategoriesByCategory[categoryId] ?? []
);

/** Demo result catalog for a subcategory, derived from its owning Home category. */
export const getHomeSubcategoryProducts = (categoryId: string, subcategoryId: string): HomeProduct[] => {
  const subcategories = getHomeSubcategories(categoryId);
  const subcategoryIndex = subcategories.findIndex(item => item.id === subcategoryId);
  if (subcategoryIndex < 0 || subcategories.length === 0) return [];

  const category = getHomeCategory(categoryId);
  const products = [...category.flashProducts, ...category.trendingProducts, ...category.dealsProducts];
  return products
    .filter((_product, index) => index % subcategories.length === subcategoryIndex)
    .map(product => ({ ...product, category: categoryId }));
};
