import { Component } from 'valdi_core/src/Component';
import { ProductCardBadge } from './ProductCardBadge';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import type { ProductPopularityBadgeType } from './ProductCardTypes';

export interface ProductPopularityBadgeViewModel {
  type: ProductPopularityBadgeType;
}

const BADGES: Record<ProductPopularityBadgeType, { label: string; color: string }> = {
  BADGE_BEST_SELLER: { label: 'TOP', color: colors.productBadgeBestSeller },
  BADGE_TRENDING: { label: 'TENDANCE', color: colors.productBadgeTrending },
  BADGE_HOT: { label: 'HOT', color: colors.productBadgeHot },
  BADGE_SHELLBY_LOVED: { label: 'ADOPTÉ', color: colors.productBadgeLoved },
  BADGE_TOP_PICK: { label: 'SÉLECTION', color: colors.productBadgeTopPick },
  BADGE_NEW: { label: 'NOUVEAU', color: colors.productBadgeNew },
  BADGE_SHELLBY_ELITE: { label: 'ÉLITE', color: colors.productBadgeElite },
  BADGE_SHELLBY_CERTIFIED: { label: 'CERTIFIÉ', color: colors.productBadgeCertified },
  BADGE_OFFICIAL_SHOP: { label: 'OFFICIEL', color: colors.productBadgeOfficial },
  BADGE_AUTHORIZED_SELLER: { label: 'AGRÉÉ', color: colors.productBadgeAuthorized },
};

export const getProductPopularityBadgePresentation = (
  type: ProductPopularityBadgeType,
): { label: string; color: string } => BADGES[type];

/** French popularity and trust badges from the shared product domain. */
export class ProductPopularityBadge extends Component<ProductPopularityBadgeViewModel> {
  onRender(): void {
    const badge = getProductPopularityBadgePresentation(this.viewModel.type);
    <ProductCardBadge label={badge.label} backgroundColor={badge.color} borderRadius={radius.xxs} />;
  }
}
