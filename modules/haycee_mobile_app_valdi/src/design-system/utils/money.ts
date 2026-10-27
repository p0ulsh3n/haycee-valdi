/** Shared monetary formatting and whole-amount input helpers. */
export const MONEY_GROUP_SEPARATOR = '.';

const getIntegerDigits = (value: number | string): string => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '0';
    return `${Math.max(0, Math.trunc(value))}`;
  }

  const digits = value.replace(/\D/g, '');
  return digits.length > 0 ? digits : '0';
};

export function formatIntegerWithDotSeparator(value: number | string): string {
  return getIntegerDigits(value).replace(/\B(?=(\d{3})+(?!\d))/g, MONEY_GROUP_SEPARATOR);
}

export function formatFcfa(amount: number): string {
  return `${formatIntegerWithDotSeparator(amount)} FCFA`;
}

export interface WholeAmountInputResult {
  digits: string;
  formatted: string;
  value: number;
  isNegative: boolean;
  exceedsMaximum: boolean;
}

/** Removes non-digits, enforces an optional ceiling and formats as the user types. */
export function normalizeWholeAmountInput(
  rawValue: string,
  maximum = Number.MAX_SAFE_INTEGER,
): WholeAmountInputResult {
  const isNegative = rawValue.includes('-');
  const enteredDigits = rawValue.replace(/\D/g, '');
  const enteredValue = enteredDigits.length > 0 ? Number(enteredDigits) : 0;
  const exceedsMaximum = enteredValue > maximum;
  const digits = exceedsMaximum ? `${maximum}` : enteredDigits;
  const value = digits.length > 0 ? Number(digits) : 0;

  return {
    digits,
    formatted: digits.length > 0 ? formatIntegerWithDotSeparator(digits) : '',
    value,
    isNegative,
    exceedsMaximum,
  };
}

/**
 * Normalizes existing currency labels. Dot is used for grouped thousands; for
 * small decimal prices it is also used as the decimal mark. For a grouped
 * decimal amount, a comma keeps the value unambiguous (for example 1.234,50).
 */
export function formatPriceLabel(price: string): string {
  const match = price.trim().match(/^([^\d]*)([\d][\d.,\s]*)([^\d]*)$/);
  if (!match) return price;

  const [, prefix, rawNumber, suffix] = match;
  const suffixSpacing = rawNumber.match(/\s+$/)?.[0] ?? '';
  const normalized = rawNumber.replace(/\s/g, '');
  const lastSeparatorIndex = Math.max(normalized.lastIndexOf(','), normalized.lastIndexOf('.'));
  const decimalDigits = lastSeparatorIndex >= 0 ? normalized.slice(lastSeparatorIndex + 1) : '';
  const hasDecimal = decimalDigits.length > 0 && decimalDigits.length <= 2;
  const integerPart = hasDecimal ? normalized.slice(0, lastSeparatorIndex) : normalized;
  const integerDigits = integerPart.replace(/\D/g, '') || '0';
  const groupedInteger = formatIntegerWithDotSeparator(integerDigits);

  if (!hasDecimal) return `${prefix}${groupedInteger}${suffixSpacing}${suffix}`;

  const decimalSeparator = integerDigits.length > 3 ? ',' : '.';
  return `${prefix}${groupedInteger}${decimalSeparator}${decimalDigits}${suffixSpacing}${suffix}`;
}
