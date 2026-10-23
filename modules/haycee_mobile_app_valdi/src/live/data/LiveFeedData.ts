import { colors } from '../../design-system/tokens/colors';

export interface LiveFeedTab {
  id: string;
  label: string;
}

export interface LiveFeedItem {
  id: string;
  hostName: string;
  title: string;
  category: string;
  viewers: string;
  status: 'live' | 'upcoming';
  panelColor: string;
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
  ['Atelier Noa', 'Les nouvelles pièces de la saison', 'Mode', '1,2 k'],
  ['Maison Élan', 'Sélection de sacs du quotidien', 'Sacs', '846'],
  ['Studio Sola', 'Comment porter les tons naturels', 'Style', '2,4 k'],
  ['Luna Boutique', 'Nos bijoux préférés en direct', 'Bijoux', '623'],
  ['The Sunday Shop', 'Découverte des nouveautés', 'Mode', '3,1 k'],
  ['Mina & Co', 'Les essentiels à petit prix', 'Sélection', '478'],
  ['Atelier Céleste', 'Argent et pierres de couleur', 'Bijoux', '957'],
  ['Maison June', 'Les sacs qui viennent d’arriver', 'Sacs', '1,8 k'],
  ['Naya Studio', 'Détails et finitions de nos pièces', 'Créateurs', '312'],
  ['Olive Market', 'Une sélection pour tous les jours', 'Mode', '704'],
  ['Éclat Paris', 'Or, argent et conseils d’entretien', 'Bijoux', '1,5 k'],
  ['Marlow Shop', 'Nos coups de cœur de la semaine', 'Sacs', '529'],
  ['Maison Alba', 'Essayages et questions en direct', 'Mode', '2,2 k'],
  ['Rue des Fleurs', 'Les pièces fortes de la collection', 'Créateurs', '391'],
  ['L’Atelier Doré', 'Focus sur nos nouvelles créations', 'Bijoux', '886'],
  ['Sunday Archive', 'Les intemporels revisités', 'Sélection', '1,1 k'],
] as const;

/** Local preview data follows the Shellby Live feed model until the API is connected. */
export const getLiveFeedItems = (tabId: string): LiveFeedItem[] => {
  const tabIndex = Math.max(0, liveFeedTabs.findIndex(tab => tab.id === tabId));
  const tab = liveFeedTabs[tabIndex] ?? liveFeedTabs[0];

  return demoSeeds.map((seed, index) => ({
    id: `${tabId}-${index}`,
    hostName: seed[0],
    title: seed[1],
    category: tabIndex === 0 || tabIndex === 1 ? seed[2] : tab.label,
    viewers: seed[3],
    status: tabId === 'following' && index % 4 === 3 ? 'upcoming' : 'live',
    panelColor: panelColors[(index + tabIndex) % panelColors.length],
  }));
};
