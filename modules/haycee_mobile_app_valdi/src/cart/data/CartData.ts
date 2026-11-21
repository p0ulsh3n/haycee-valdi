import type { MasonryProduct } from '../../design-system/components/MasonryProductCard';
import type { SelectedProductVariant } from '../../products/ProductVariantSelectionSheet';
import { formatIntegerWithDotSeparator } from '../../design-system/utils/money';

export interface MarketplaceCartItem {
  id: string;
  product: MasonryProduct;
  quantity: number;
  selections: SelectedProductVariant[];
  combinationId?: string;
  stockLimit?: number;
  unitAmountMinor: number;
  pricePrecision: 0 | 2;
  pricePrefix: string;
  priceSuffix: string;
  decimalSeparator: '.' | ',';
}

interface ParsedCartPrice {
  amountMinor: number;
  precision: 0 | 2;
  prefix: string;
  suffix: string;
  decimalSeparator: '.' | ',';
}

function parseCartPrice(price: string): ParsedCartPrice {
  const match = price.trim().match(/^([^\d]*)([\d][\d.,\s]*)([^\d]*)$/);
  if (!match) {
    return { amountMinor: 0, precision: 0, prefix: '', suffix: '', decimalSeparator: '.' };
  }

  const [, prefix, rawAmount, suffix] = match;
  const normalized = rawAmount.replace(/\s/g, '');
  const separatorIndex = Math.max(normalized.lastIndexOf(','), normalized.lastIndexOf('.'));
  const trailingDigits = separatorIndex >= 0 ? normalized.slice(separatorIndex + 1) : '';
  const hasFraction = trailingDigits.length > 0 && trailingDigits.length <= 2;
  const precision: 0 | 2 = hasFraction || /[€$£]/.test(`${prefix}${suffix}`) ? 2 : 0;
  const integerText = hasFraction ? normalized.slice(0, separatorIndex) : normalized;
  const integerAmount = Number(integerText.replace(/\D/g, '')) || 0;
  const fractionAmount = hasFraction ? Number(trailingDigits.padEnd(2, '0')) || 0 : 0;

  return {
    amountMinor: integerAmount * 100 + fractionAmount,
    precision,
    prefix,
    suffix,
    decimalSeparator: normalized.includes(',') ? ',' : '.',
  };
}

export function getCartStoreKey(product: MasonryProduct): string {
  const name = product.vendorName ?? 'Boutique Haycee';
  return product.vendorId?.trim().toLowerCase()
    || product.vendorUsername?.trim().toLowerCase()
    || name.trim().toLowerCase();
}

export function formatCartAmount(item: Pick<MarketplaceCartItem, 'pricePrecision' | 'pricePrefix' | 'priceSuffix' | 'decimalSeparator'>, amountMinor: number): string {
  const safeAmount = Math.max(0, Math.round(amountMinor));
  const integerAmount = item.pricePrecision === 2 ? Math.floor(safeAmount / 100) : Math.round(safeAmount / 100);
  const integerLabel = formatIntegerWithDotSeparator(integerAmount);
  const fractionLabel = `${safeAmount % 100}`.padStart(2, '0');
  const amountLabel = item.pricePrecision === 2
    ? `${integerLabel}${item.decimalSeparator}${fractionLabel}`
    : integerLabel;
  return `${item.pricePrefix}${amountLabel}${item.priceSuffix}`;
}

export function addMarketplaceCartItem(
  items: MarketplaceCartItem[],
  product: MasonryProduct,
  quantity: number,
  selections: SelectedProductVariant[] = [],
  combinationId?: string,
): MarketplaceCartItem[] {
  const optionStock = selections.flatMap(selection => {
    const option = product.variantGroups
      ?.find(group => group.id === selection.groupId)
      ?.options.find(candidate => candidate.id === selection.optionId);
    return option?.remaining === undefined ? [] : [option.remaining];
  });
  const stockLimit = product.variantCombinations?.find(combination => combination.id === combinationId)?.remaining
    ?? (optionStock.length > 0 ? Math.min(...optionStock) : product.stockCount ?? product.stockTotal);
  if (stockLimit !== undefined && stockLimit <= 0) return items;

  const variantKey = combinationId ?? selections.map(selection => `${selection.groupId}:${selection.optionId}`).join('|');
  const id = `${product.id}::${variantKey || 'default'}`;
  const parsedPrice = parseCartPrice(product.price);
  const boundedQuantity = Math.max(1, Math.min(stockLimit ?? Number.MAX_SAFE_INTEGER, Math.trunc(quantity)));
  const existingIndex = items.findIndex(item => item.id === id);

  if (existingIndex >= 0) {
    const existing = items[existingIndex];
    const nextQuantity = Math.min(existing.stockLimit ?? Number.MAX_SAFE_INTEGER, existing.quantity + boundedQuantity);
    if (nextQuantity === existing.quantity) return items;
    return items.map((item, index) => index === existingIndex ? { ...item, quantity: nextQuantity } : item);
  }

  return [...items, {
    id,
    product,
    quantity: boundedQuantity,
    selections: selections.slice(),
    combinationId,
    stockLimit,
    unitAmountMinor: parsedPrice.amountMinor,
    pricePrecision: parsedPrice.precision,
    pricePrefix: parsedPrice.prefix,
    priceSuffix: parsedPrice.suffix,
    decimalSeparator: parsedPrice.decimalSeparator,
  }];
}

export function updateMarketplaceCartQuantity(items: MarketplaceCartItem[], id: string, delta: number): MarketplaceCartItem[] {
  return items.map(item => {
    if (item.id !== id) return item;
    const quantity = Math.max(1, Math.min(item.stockLimit ?? Number.MAX_SAFE_INTEGER, item.quantity + Math.trunc(delta)));
    return quantity === item.quantity ? item : { ...item, quantity };
  });
}

export function removeMarketplaceCartItem(items: MarketplaceCartItem[], id: string): MarketplaceCartItem[] {
  return items.filter(item => item.id !== id);
}

export function getCartQuantityTotal(items: MarketplaceCartItem[]): number {
  return items.reduce((quantity, item) => quantity + item.quantity, 0);
}

export function getCartSubtotalMinor(items: MarketplaceCartItem[]): number {
  return items.reduce((amount, item) => {
    const regularUnitPrice = item.product.originalPrice
      ? parseCartPrice(item.product.originalPrice).amountMinor
      : item.unitAmountMinor;
    return amount + regularUnitPrice * item.quantity;
  }, 0);
}

export function getCartDiscountMinor(items: MarketplaceCartItem[]): number {
  return items.reduce((amount, item) => {
    if (!item.product.originalPrice) return amount;
    const originalAmount = parseCartPrice(item.product.originalPrice).amountMinor;
    return amount + Math.max(0, originalAmount - item.unitAmountMinor) * item.quantity;
  }, 0);
}

export function getCartShippingMinor(items: MarketplaceCartItem[]): number {
  const shippingByStore = new Map<string, MarketplaceCartItem>();
  items.forEach(item => {
    const storeKey = getCartStoreKey(item.product);
    if (!shippingByStore.has(storeKey)) shippingByStore.set(storeKey, item);
  });
  return Array.from(shippingByStore.values()).reduce((amount, item) => {
    if (item.product.shippingFree || !item.product.shippingPrice) return amount;
    return amount + parseCartPrice(item.product.shippingPrice).amountMinor;
  }, 0);
}

export function getCartAmountLabel(items: MarketplaceCartItem[], amountMinor: number): string {
  return items.length > 0 ? formatCartAmount(items[0], amountMinor) : '0';
}

export function getCartTotal(items: MarketplaceCartItem[]): string {
  if (items.length === 0) return '0';
  const total = getCartSubtotalMinor(items) - getCartDiscountMinor(items) + getCartShippingMinor(items);
  return formatCartAmount(items[0], total);
}
