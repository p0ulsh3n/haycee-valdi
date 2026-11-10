export type ProductPopularityBadgeType =
  | 'BADGE_BEST_SELLER'
  | 'BADGE_TRENDING'
  | 'BADGE_HOT'
  | 'BADGE_SHELLBY_LOVED'
  | 'BADGE_TOP_PICK'
  | 'BADGE_NEW'
  | 'BADGE_SHELLBY_ELITE'
  | 'BADGE_SHELLBY_CERTIFIED'
  | 'BADGE_OFFICIAL_SHOP'
  | 'BADGE_AUTHORIZED_SELLER';

export type ProductOfferType =
  | 'OFFER_NEW_CUSTOMER'
  | 'OFFER_EXTRA_FIXED_OFF'
  | 'OFFER_EXTRA_PERCENT_OFF'
  | 'OFFER_MEMBER_PRICE'
  | 'OFFER_FLASH_SALE'
  | 'OFFER_FLASH_SALE_COUNTDOWN'
  | 'OFFER_HOT_DEAL'
  | 'OFFER_LIVE_EXCLUSIVE'
  | 'OFFER_ENDS_SOON'
  | 'OFFER_LIMITED_TIME'
  | 'OFFER_BUY_X_SAVE_PERCENT'
  | 'OFFER_SPEND_X_GET_PERCENT'
  | 'OFFER_BUY_X_GET_Y'
  | 'OFFER_FREE_SHIPPING'
  | 'OFFER_FAST_SHIPPING'
  | 'SOCIAL_IN_CART'
  | 'SOCIAL_HIGH_REPEAT'
  | 'SOCIAL_UNITS_SOLD'
  | 'SOCIAL_REPURCHASED'
  | 'SOCIAL_VIEWING_NOW'
  | 'STOCK_LOW'
  | 'STOCK_ALMOST_GONE';

export interface ProductOffer {
  type: ProductOfferType;
  params?: {
    amount?: string;
    pct?: string;
    price?: string;
    x?: number;
    y?: number;
    discountPct?: string;
    days?: number;
    count?: number;
  };
  endsAt?: string;
}

/** A selectable value for a product variant axis such as size, color or shade. */
export interface ProductVariantOption {
  id: string;
  label: string;
  /** Optional native color swatch for color-based options. */
  swatchColor?: string;
  /** Optional option-level inventory when the API does not send combinations. */
  remaining?: number;
}

/** Dynamic variant axis; labels and options come from product data/API mapping. */
export interface ProductVariantGroup {
  id: string;
  label: string;
  options: ProductVariantOption[];
}

/** Inventory for one concrete combination across the product's variant groups. */
export interface ProductVariantCombination {
  id: string;
  selections: Array<{ groupId: string; optionId: string }>;
  remaining: number;
  total?: number;
}
