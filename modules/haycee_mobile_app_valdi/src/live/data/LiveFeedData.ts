import { colors } from '../../design-system/tokens/colors';
import type { DSBadgeVariant } from '../../design-system/components/DSBadge';

export interface LiveFeedBadgeItem {
  id: string;
  label: string;
  variant: DSBadgeVariant;
}

export interface LiveFeedTab {
  id: string;
  label: string;
}

export type LivePresentationType = 'classic' | 'auction' | 'showcase';

export interface LiveFeedItem {
  id: string;
  hostName: string;
  vendorRating?: string;
  vendorReviewSummary?: string;
  vendorCountryCode?: string;
  vendorCountry?: string;
  vendorCity?: string;
  vendorAvatarUrl?: string;
  vendorCoverImageUrl?: string;
  vendorBio?: string;
  vendorVerified?: boolean;
  vendorSalesCount?: number;
  vendorFollowersCount?: number;
  vendorDispatchTime?: string;
  vendorDeliveryTime?: string;
  title: string;
  category: string;
  viewers: number;
  /** Current reminder count reported by live data; the viewer's local toggle is tracked by the UI. */
  reminderCount?: number;
  presentationType: LivePresentationType;
  status: 'live' | 'upcoming';
  panelColor: string;
  scheduledAtLabel?: string;
  /** Unix timestamp in milliseconds, supplied by scheduling data when available. */
  scheduledAtTimestampMs?: number;
  /** Optional preview URL played with Valdi's native Android/iOS video element. */
  previewVideoUrl?: string;
  /** Optional event-specific artwork shown in the scheduled live cover. */
  eventCoverImageUrl?: string;
  /** Optional semantic tags such as EXCLUSIF, SALES or SOLD, supplied by live data. */
  badges?: LiveFeedBadgeItem[];
}

export const liveFeedTabs: LiveFeedTab[] = [
  { id: 'for-you', label: 'Pour vous' },
  { id: 'following', label: 'Abonnements' },
  { id: 'womens-contemporary', label: 'Contemporain femme' },
  { id: 'midrange-fashion-bags', label: 'Sacs moyenne gamme & mode' },
  { id: 'fine-precious-metals', label: 'Métaux fins & précieux' },
  { id: 'luxury-bags', label: 'Sacs de luxe' },
];

const panelColors = [
  colors.livePanelLavender,
  colors.livePanelPeach,
  colors.livePanelBlue,
  colors.livePanelSage,
  colors.livePanelSand,
];

const demoSeeds = [
  ['Atelier Noa', 'Les nouvelles pièces de la saison', 'Mode', 1200],
  ['Maison Élan', 'Sélection de sacs du quotidien', 'Sacs', 846],
  ['Studio Sola', 'Comment porter les tons naturels', 'Style', 2400],
  ['Luna Boutique', 'Nos bijoux préférés en direct', 'Bijoux', 623],
  ['The Sunday Shop', 'Découverte des nouveautés', 'Mode', 3100],
  ['Mina & Co', 'Les essentiels à petit prix', 'Sélection', 478],
  ['Atelier Céleste', 'Argent et pierres de couleur', 'Bijoux', 957],
  ['Maison June', 'Les sacs qui viennent d’arriver', 'Sacs', 1800],
  ['Naya Studio', 'Détails et finitions de nos pièces', 'Créateurs', 312],
  ['Olive Market', 'Une sélection pour tous les jours', 'Mode', 704],
  ['Éclat Paris', 'Or, argent et conseils d’entretien', 'Bijoux', 1500],
  ['Marlow Shop', 'Nos coups de cœur de la semaine', 'Sacs', 529],
  ['Maison Alba', 'Essayages et questions en direct', 'Mode', 2200],
  ['Rue des Fleurs', 'Les pièces fortes de la collection', 'Créateurs', 391],
  ['L’Atelier Doré', 'Focus sur nos nouvelles créations', 'Bijoux', 886],
  ['Sunday Archive', 'Les intemporels revisités', 'Sélection', 1100],
] as const;

const demoPresentationTypes: LivePresentationType[] = ['auction', 'classic', 'showcase'];

/** Local seller fixtures for the demo UI; replace these values with vendor API fields when connected. */
const demoVendorDetails = [
  { vendorRating: '4.8', vendorReviewSummary: '4.8 (126)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Paris', vendorAvatarUrl: 'https://res.cloudinary.com/ddnz9y5v2/image/upload/v1793493675/images_a1a9b3.jpg', vendorDispatchTime: '24H', vendorDeliveryTime: '1–2 jours', vendorSalesCount: 1540, vendorFollowersCount: 8200, vendorBio: 'Atelier Noa choisit des pièces de saison avec soin. Découvrez nos nouveautés, conseils de style et coups de cœur en direct avec une sélection pensée pour durer.', vendorVerified: true },
  { vendorRating: '4.7', vendorReviewSummary: '4.7 (84)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Lyon', vendorDispatchTime: '24H', vendorDeliveryTime: '2–3 jours', vendorSalesCount: 921, vendorFollowersCount: 5700, vendorBio: 'Des essentiels du quotidien, choisis pour leur qualité et leur simplicité.', vendorVerified: true },
  { vendorRating: '4.9', vendorReviewSummary: '4.9 (203)', vendorCountryCode: 'BE', vendorCountry: 'Belgique', vendorCity: 'Bruxelles', vendorDispatchTime: '48H', vendorDeliveryTime: '2–3 jours', vendorSalesCount: 2310, vendorFollowersCount: 12400, vendorBio: 'Un vestiaire moderne aux tons naturels, avec des pièces faciles à porter.', vendorVerified: true },
  { vendorRating: '4.6', vendorReviewSummary: '4.6 (61)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Bordeaux', vendorDispatchTime: '24H', vendorDeliveryTime: '1–2 jours', vendorSalesCount: 487, vendorFollowersCount: 2900, vendorBio: 'Bijoux et petites pièces choisis auprès de créateurs indépendants.', vendorVerified: false },
  { vendorRating: '4.9', vendorReviewSummary: '4.9 (314)', vendorCountryCode: 'GB', vendorCountry: 'Royaume-Uni', vendorCity: 'Londres', vendorDispatchTime: '24H', vendorDeliveryTime: '1d', vendorSalesCount: 4890, vendorFollowersCount: 28600, vendorBio: 'Shop like never before. Découvrez nos pièces favorites et les nouveautés en direct.', vendorVerified: true },
  { vendorRating: '4.5', vendorReviewSummary: '4.5 (48)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Lille', vendorDispatchTime: '48H', vendorDeliveryTime: '2–4 jours', vendorSalesCount: 306, vendorFollowersCount: 1800, vendorBio: 'Une sélection accessible de pièces utiles et bien pensées.', vendorVerified: false },
  { vendorRating: '4.8', vendorReviewSummary: '4.8 (97)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Nice', vendorDispatchTime: '24H', vendorDeliveryTime: '1–2 jours', vendorSalesCount: 1120, vendorFollowersCount: 6900, vendorBio: 'Des bijoux lumineux et des pierres de couleur pour tous les jours.', vendorVerified: true },
  { vendorRating: '4.7', vendorReviewSummary: '4.7 (112)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Nantes', vendorDispatchTime: '24H', vendorDeliveryTime: '2–3 jours', vendorSalesCount: 1390, vendorFollowersCount: 7600, vendorBio: 'Sacs fonctionnels et belles matières, sélectionnés au fil des arrivages.', vendorVerified: true },
  { vendorRating: '4.8', vendorReviewSummary: '4.8 (72)', vendorCountryCode: 'CH', vendorCountry: 'Suisse', vendorCity: 'Genève', vendorDispatchTime: '48H', vendorDeliveryTime: '2–4 jours', vendorSalesCount: 594, vendorFollowersCount: 3400, vendorBio: 'Des créations indépendantes et des détails qui font la différence.', vendorVerified: false },
  { vendorRating: '4.6', vendorReviewSummary: '4.6 (55)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Toulouse', vendorDispatchTime: '24H', vendorDeliveryTime: '1–3 jours', vendorSalesCount: 740, vendorFollowersCount: 4200, vendorBio: 'Une sélection facile à associer, pour accompagner chaque journée.', vendorVerified: true },
  { vendorRating: '4.9', vendorReviewSummary: '4.9 (188)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Paris', vendorDispatchTime: '24H', vendorDeliveryTime: '1–2 jours', vendorSalesCount: 2760, vendorFollowersCount: 15300, vendorBio: 'Pièces dorées, argentées et conseils pour les garder belles longtemps.', vendorVerified: true },
  { vendorRating: '4.5', vendorReviewSummary: '4.5 (39)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Marseille', vendorDispatchTime: '48H', vendorDeliveryTime: '2–4 jours', vendorSalesCount: 412, vendorFollowersCount: 2300, vendorBio: 'Des coups de cœur choisis pour leur allure et leur usage au quotidien.', vendorVerified: false },
  { vendorRating: '4.8', vendorReviewSummary: '4.8 (159)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Paris', vendorDispatchTime: '24H', vendorDeliveryTime: '1–2 jours', vendorSalesCount: 1940, vendorFollowersCount: 10900, vendorBio: 'Essayages, nouveautés et réponses à vos questions en direct.', vendorVerified: true },
  { vendorRating: '4.7', vendorReviewSummary: '4.7 (63)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Strasbourg', vendorDispatchTime: '48H', vendorDeliveryTime: '2–3 jours', vendorSalesCount: 683, vendorFollowersCount: 3900, vendorBio: 'Des pièces fortes et des créations originales en petites quantités.', vendorVerified: false },
  { vendorRating: '4.9', vendorReviewSummary: '4.9 (141)', vendorCountryCode: 'FR', vendorCountry: 'France', vendorCity: 'Reims', vendorDispatchTime: '24H', vendorDeliveryTime: '1–2 jours', vendorSalesCount: 1280, vendorFollowersCount: 7300, vendorBio: 'Créations dorées et finitions soignées, présentées avec leurs détails.', vendorVerified: true },
  { vendorRating: '4.6', vendorReviewSummary: '4.6 (47)', vendorCountryCode: 'GB', vendorCountry: 'Royaume-Uni', vendorCity: 'Manchester', vendorDispatchTime: '48H', vendorDeliveryTime: '2–4 jours', vendorSalesCount: 356, vendorFollowersCount: 2100, vendorBio: 'Des classiques revisités et des pièces à garder longtemps.', vendorVerified: false },
] as const;

const formatCompactCount = (count: number): string => count.toFixed(1).replace(/\.0$/, '');

/** Formats a live viewer count with locale-independent decimal dots and uppercase suffixes. */
export const formatLiveViewerCount = (count: number): string => {
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount >= 1_000_000) return `${formatCompactCount(safeCount / 1_000_000)}M`;
  if (safeCount >= 1_000) return `${formatCompactCount(safeCount / 1_000)}K`;
  return safeCount.toString();
};

/** Local preview data follows the Shellby Live feed model until the API is connected. */
export const getLiveFeedItems = (tabId: string): LiveFeedItem[] => {
  const tabIndex = Math.max(0, liveFeedTabs.findIndex(tab => tab.id === tabId));
  const tab = liveFeedTabs[tabIndex] ?? liveFeedTabs[0];

  return demoSeeds.map((seed, index) => {
    const status = tabId === 'following' && index % 4 === 3 ? 'upcoming' : 'live';
    return {
      ...demoVendorDetails[index % demoVendorDetails.length],
      id: `${tabId}-${index}`,
      hostName: seed[0],
      title: seed[1],
      category: tabIndex === 0 || tabIndex === 1 ? seed[2] : tab.label,
      viewers: seed[3],
      presentationType: demoPresentationTypes[index % demoPresentationTypes.length],
      status,
      panelColor: panelColors[(index + tabIndex) % panelColors.length],
      scheduledAtLabel: status === 'upcoming' ? 'DEMAIN · 18:00' : undefined,
      scheduledAtTimestampMs: status === 'upcoming' ? Date.now() + 24 * 60 * 60 * 1000 : undefined,
    };
  });
};
