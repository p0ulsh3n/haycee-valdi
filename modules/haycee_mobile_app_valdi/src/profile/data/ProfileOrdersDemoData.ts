import { colors } from '../../design-system/tokens/colors';
import { formatFcfa } from '../../design-system/utils/money';
import type { MasonryProduct } from '../../design-system/components/MasonryProductCard';

export type ProfileOrderStatus = 'payment-failed' | 'processing' | 'shipped' | 'delivered';
export type ProfileOrderTimelineState = 'complete' | 'current' | 'upcoming';

export interface ProfileOrderLineDemoItem {
  id: string;
  title: string;
  optionLabel: string;
  quantity: number;
  unitPrice: number;
}

export interface ProfileOrderTimelineDemoItem {
  id: string;
  title: string;
  dateIso: string;
  state: ProfileOrderTimelineState;
}

export interface ProfileOrderDemoItem {
  id: string;
  productName: string;
  orderNumber: string;
  status: ProfileOrderStatus;
  statusLabel: string;
  dateIso: string;
  panelColor: string;
  storefrontProduct: MasonryProduct;
  items: ProfileOrderLineDemoItem[];
  deliveryMethod: string;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  timeline: ProfileOrderTimelineDemoItem[];
}

const DEMO_STORE_AVATAR_URL = 'https://res.cloudinary.com/ddnz9y5v2/image/upload/v1793493675/images_a1a9b3.jpg';

const createDemoStorefrontProduct = (
  id: string,
  title: string,
  unitPrice: number,
  panelColor: string,
  category: string,
): MasonryProduct => ({
  id,
  title,
  price: formatFcfa(unitPrice),
  color: panelColor,
  category,
  vendorName: 'Atelier Noa',
  vendorUsername: 'ateliernoa',
  vendorId: 'atelier-noa',
  vendorAvatarUrl: DEMO_STORE_AVATAR_URL,
  vendorBio: 'Une sélection soignée de pièces et d’objets pour le quotidien.',
  vendorCountryCode: 'CI',
  vendorCountry: 'Côte d’Ivoire',
  vendorCity: 'Abidjan',
  vendorVerified: true,
  vendorRating: '4.8',
  vendorReviewSummary: '4.8 (126)',
  vendorSalesCount: 1540,
  vendorFollowersCount: 8200,
  vendorDispatchTime: '24H',
  vendorDeliveryTime: '1–2 jours',
});

/** Local visual fixtures for the Profile > Mes commandes screen. */
export const PROFILE_ORDER_DEMO_ITEMS: ProfileOrderDemoItem[] = [
  {
    id: 'order-osmo-pocket-3',
    productName: 'OSMO POCKET 3',
    orderNumber: '345325528',
    status: 'payment-failed',
    statusLabel: 'ANNULÉE · ÉCHEC DU PAIEMENT',
    dateIso: '2026-08-16',
    panelColor: colors.livePanelLavender,
    storefrontProduct: createDemoStorefrontProduct('store-order-osmo', 'OSMO POCKET 3', 679000, colors.livePanelLavender, 'Électronique'),
    items: [{ id: 'osmo-pocket-3', title: 'OSMO POCKET 3', optionLabel: 'Creator Combo', quantity: 1, unitPrice: 679000 }],
    deliveryMethod: 'Point relais',
    deliveryAddress: 'Cocody, Rue des Jardins, Abidjan',
    paymentMethod: 'Mobile Money',
    paymentStatus: 'Échec du paiement — aucun montant débité',
    subtotal: 679000,
    shippingFee: 2500,
    total: 681500,
    timeline: [
      { id: 'created', title: 'Commande créée', dateIso: '2026-08-16', state: 'complete' },
      { id: 'payment-failed', title: 'Paiement refusé', dateIso: '2026-08-16', state: 'complete' },
      { id: 'cancelled', title: 'Commande annulée', dateIso: '2026-08-16', state: 'current' },
    ],
  },
  {
    id: 'order-chrono-watch',
    productName: 'Montre chronographe',
    orderNumber: '345325107',
    status: 'processing',
    statusLabel: 'EN COURS DE PRÉPARATION',
    dateIso: '2026-08-14',
    panelColor: colors.livePanelSand,
    storefrontProduct: createDemoStorefrontProduct('store-order-watch', 'Montre chronographe', 189000, colors.livePanelSand, 'Accessoires'),
    items: [{ id: 'chrono-watch', title: 'Montre chronographe', optionLabel: 'Noir · Bracelet acier', quantity: 1, unitPrice: 189000 }],
    deliveryMethod: 'Point relais',
    deliveryAddress: 'Plateau, Avenue Noguès, Abidjan',
    paymentMethod: 'Carte bancaire',
    paymentStatus: 'Paiement confirmé',
    subtotal: 189000,
    shippingFee: 1500,
    total: 190500,
    timeline: [
      { id: 'created', title: 'Commande créée', dateIso: '2026-08-14', state: 'complete' },
      { id: 'paid', title: 'Paiement confirmé', dateIso: '2026-08-14', state: 'complete' },
      { id: 'preparing', title: 'Préparation de la commande', dateIso: '2026-08-14', state: 'current' },
      { id: 'shipped', title: 'Expédition', dateIso: '2026-08-15', state: 'upcoming' },
      { id: 'delivered', title: 'Livraison', dateIso: '2026-08-17', state: 'upcoming' },
    ],
  },
  {
    id: 'order-crossbody-bag',
    productName: 'Sac bandoulière',
    orderNumber: '345324891',
    status: 'shipped',
    statusLabel: 'EXPÉDIÉE',
    dateIso: '2026-08-12',
    panelColor: colors.livePanelBlue,
    storefrontProduct: createDemoStorefrontProduct('store-order-bag', 'Sac bandoulière', 45000, colors.livePanelBlue, 'Sacs'),
    items: [{ id: 'crossbody-bag', title: 'Sac bandoulière', optionLabel: 'Bleu nuit', quantity: 1, unitPrice: 45000 }],
    deliveryMethod: 'Expédition standard',
    deliveryAddress: 'Yopougon, Niangon, Abidjan',
    paymentMethod: 'Mobile Money',
    paymentStatus: 'Paiement confirmé',
    subtotal: 45000,
    shippingFee: 1000,
    total: 46000,
    timeline: [
      { id: 'created', title: 'Commande créée', dateIso: '2026-08-12', state: 'complete' },
      { id: 'paid', title: 'Paiement confirmé', dateIso: '2026-08-12', state: 'complete' },
      { id: 'preparing', title: 'Commande préparée', dateIso: '2026-08-13', state: 'complete' },
      { id: 'shipped', title: 'Colis expédié', dateIso: '2026-08-14', state: 'current' },
      { id: 'delivered', title: 'Livraison', dateIso: '2026-08-16', state: 'upcoming' },
    ],
  },
  {
    id: 'order-table-lamp',
    productName: 'Lampe de table',
    orderNumber: '345324602',
    status: 'delivered',
    statusLabel: 'LIVRÉE',
    dateIso: '2026-08-10',
    panelColor: colors.livePanelSage,
    storefrontProduct: createDemoStorefrontProduct('store-order-lamp', 'Lampe de table', 32000, colors.livePanelSage, 'Maison'),
    items: [{ id: 'table-lamp', title: 'Lampe de table', optionLabel: 'Blanc cassé', quantity: 1, unitPrice: 32000 }],
    deliveryMethod: 'Point relais',
    deliveryAddress: 'Marcory, Boulevard Valéry Giscard d’Estaing, Abidjan',
    paymentMethod: 'Mobile Money',
    paymentStatus: 'Paiement confirmé',
    subtotal: 32000,
    shippingFee: 1500,
    total: 33500,
    timeline: [
      { id: 'created', title: 'Commande créée', dateIso: '2026-08-10', state: 'complete' },
      { id: 'paid', title: 'Paiement confirmé', dateIso: '2026-08-10', state: 'complete' },
      { id: 'preparing', title: 'Commande préparée', dateIso: '2026-08-11', state: 'complete' },
      { id: 'shipped', title: 'Colis expédié', dateIso: '2026-08-12', state: 'complete' },
      { id: 'delivered', title: 'Commande livrée', dateIso: '2026-08-14', state: 'complete' },
    ],
  },
];
