import type { LiveFeedItem, LivePresentationType } from './LiveFeedData';
import { colors } from '../../design-system/tokens/colors';

export interface LiveViewerMessage {
  id: string;
  username: string;
  text: string;
  avatarUrl?: string;
  isHost?: boolean;
}

interface LiveViewerDemoComment {
  username: string;
  text: string;
  avatarIndex: number;
  isHost?: boolean;
}

const LIVE_DEMO_AVATARS = [
  'https://cdn.wisa-events.com/avatars/defaults/a8KxP2mNwQ7f.png',
  'https://cdn.wisa-events.com/avatars/defaults/fL9qR3vTx1Za.png',
  'https://cdn.wisa-events.com/avatars/defaults/mD7wK2pYb8Ns.png',
  'https://cdn.wisa-events.com/avatars/defaults/qJ4nX8tVr5Lp.png',
  'https://cdn.wisa-events.com/avatars/defaults/zR1cMw9Qa6Hu.png',
  'https://cdn.wisa-events.com/avatars/defaults/tP8vLd2Xk7Ej.png',
  'https://cdn.wisa-events.com/avatars/defaults/bY5mQn4Hs9Rf.png',
  'https://cdn.wisa-events.com/avatars/defaults/wK3jTa8Nv2Cx.png',
  'https://cdn.wisa-events.com/avatars/defaults/hN7rQx5Lm2Vy.png',
  'https://cdn.wisa-events.com/avatars/defaults/pX4kZ9BwT6Jq.png',
  'https://cdn.wisa-events.com/avatars/defaults/cM8vL2RnY5Hs.png',
];

/** More than one viewport of fixture chat, to exercise the live scroll behavior. */
const LIVE_DEMO_COMMENTS: LiveViewerDemoComment[] = [
  { username: 'Amina', text: 'Bonjour, est-ce disponible dans une autre couleur ?', avatarIndex: 0 },
  { username: 'Lina', text: 'La finition est vraiment jolie.', avatarIndex: 1 },
  { username: 'Mariam', text: 'Vous pouvez montrer le détail de la fermeture ?', avatarIndex: 2 },
  { username: 'Fatou', text: 'Très belle pièce ✨', avatarIndex: 3 },
  { username: 'Nadia', text: 'Est-ce que vous avez une taille au-dessus ?', avatarIndex: 4 },
  { username: 'Awa', text: 'Je viens de rejoindre, c’est le modèle en quelle matière ?', avatarIndex: 5 },
  { username: 'Inès', text: 'La couleur est encore plus belle en vidéo.', avatarIndex: 6 },
  { username: 'Maya', text: 'Bonsoir tout le monde 👋', avatarIndex: 7 },
  { username: 'Sarah', text: 'Vous livrez aussi à Bouaké ?', avatarIndex: 8 },
  { username: 'Yasmine', text: 'Le petit détail doré est magnifique.', avatarIndex: 9 },
  { username: 'Amina', text: 'Je peux voir le produit porté ?', avatarIndex: 0 },
  { username: 'Lina', text: 'J’adore cette sélection.', avatarIndex: 1 },
  { username: 'Mariam', text: 'Le prix affiché comprend la livraison ?', avatarIndex: 2 },
  { username: 'Fatou', text: 'Je le prends en noir si vous l’avez.', avatarIndex: 3 },
  { username: 'Nadia', text: 'Il reste combien de pièces ?', avatarIndex: 4 },
  { username: 'Awa', text: 'Merci pour les précisions !', avatarIndex: 5 },
  { username: 'Inès', text: 'La coupe tombe très bien.', avatarIndex: 6 },
  { username: 'Maya', text: 'Vous pourrez remettre le lien du produit ?', avatarIndex: 7 },
  { username: 'Sarah', text: 'Est-ce que la bandoulière est réglable ?', avatarIndex: 8 },
  { username: 'Yasmine', text: 'Le beige est disponible aussi ?', avatarIndex: 9 },
  { username: 'Amina', text: 'Super, merci beaucoup ❤️', avatarIndex: 0 },
  { username: 'Lina', text: 'Je regarde depuis Paris, bonsoir !', avatarIndex: 1 },
  { username: 'Mariam', text: 'On peut commander directement depuis le live ?', avatarIndex: 2 },
  { username: 'Fatou', text: 'La qualité a l’air top.', avatarIndex: 3 },
  { username: 'Nadia', text: 'Vous avez une photo des autres coloris ?', avatarIndex: 4 },
  { username: 'Awa', text: 'La livraison prend combien de jours ?', avatarIndex: 5 },
  { username: 'Inès', text: 'J’hésite entre les deux couleurs 😍', avatarIndex: 6 },
  { username: 'Maya', text: 'C’est noté pour la taille, merci.', avatarIndex: 7 },
  { username: 'Sarah', text: 'Le modèle est très élégant.', avatarIndex: 8 },
  { username: 'Yasmine', text: 'Vous avez aussi des accessoires assortis ?', avatarIndex: 9 },
  { username: 'Amina', text: 'Je viens de passer commande !', avatarIndex: 0 },
  { username: 'Lina', text: 'Bravo pour cette collection.', avatarIndex: 1 },
  { username: 'Mariam', text: 'La prochaine présentation sera quand ?', avatarIndex: 2 },
  { username: 'Fatou', text: 'Merci, c’est beaucoup plus clair.', avatarIndex: 3 },
  { username: 'Nadia', text: 'Vous pouvez montrer le dos du sac ?', avatarIndex: 4 },
  { username: 'Boutique', text: 'Oui, je vous montre les détails juste après.', avatarIndex: 10, isHost: true },
];

export interface LiveViewerProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  stockLeft?: number;
  /** Existing interest requests from other viewers in the local demo/API data. */
  requestCount?: number;
  shippingAmount: number;
  shippingLabel: 'Frais de livraison' | 'Expédition';
  color: string;
  /** Optional product image URL supplied by the product API. */
  imageUrl?: string;
  /** Image width divided by height, used to preserve its source ratio. */
  imageAspectRatio?: number;
  kind: 'listing' | 'auction';
  isPinned: boolean;
}

export interface LiveViewerCartItem {
  product: LiveViewerProduct;
  quantity: number;
}

export interface LiveViewerDemoContent {
  title: string;
  products: LiveViewerProduct[];
  messages: LiveViewerMessage[];
  presentationType: LivePresentationType;
}

/** Local fixture seam for the Live viewer; replace this factory with API mapping later. */
export const createLiveViewerDemoContent = (item: LiveFeedItem): LiveViewerDemoContent => ({
  title: item.title,
  presentationType: item.presentationType,
  products: [
    {
      id: `${item.id}-product-1`,
      title: item.presentationType === 'auction' ? 'Pièce en enchère' : 'Sélection du moment',
      price: item.presentationType === 'auction' ? 18500 : 24900,
      originalPrice: item.presentationType === 'auction' ? undefined : 29900,
      stockLeft: item.presentationType === 'auction' ? 3 : 4,
      requestCount: 1,
      shippingAmount: 1500,
      shippingLabel: 'Frais de livraison',
      color: item.panelColor,
      kind: item.presentationType === 'auction' ? 'auction' : 'listing',
      isPinned: item.presentationType !== 'showcase',
    },
    {
      id: `${item.id}-product-2`,
      title: 'La découverte du live',
      price: 32900,
      stockLeft: 12,
      shippingAmount: 1500,
      shippingLabel: 'Frais de livraison',
      color: colors.livePanelSand,
      kind: 'listing',
      isPinned: false,
    },
    {
      id: `${item.id}-product-3`,
      title: 'Dernière nouveauté',
      price: 41750,
      originalPrice: 45900,
      stockLeft: 0,
      shippingAmount: 1500,
      shippingLabel: 'Frais de livraison',
      color: colors.livePanelBlue,
      kind: 'listing',
      isPinned: false,
    },
  ],
  messages: LIVE_DEMO_COMMENTS.map((comment, index) => ({
    id: `${item.id}-message-${index + 1}`,
    username: comment.isHost ? item.hostName : comment.username,
    avatarUrl: LIVE_DEMO_AVATARS[comment.avatarIndex],
    text: comment.text,
    isHost: comment.isHost,
  })),
});
