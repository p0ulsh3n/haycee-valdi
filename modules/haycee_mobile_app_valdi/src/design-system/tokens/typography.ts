import { Style } from 'valdi_core/src/Style';
import { Label } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from './colors';

/**
 * The four Montserrat faces bundled by this Valdi module.
 * Valdi resolves a module font descriptor as
 * `moduleName:res-relative-font-path size`; the native runtime then loads the
 * matching `.ttf` from this module's `res/` directory.
 */
// Valdi's font asset processor normalizes hyphenated filenames to snake_case
// before bundling them, so the runtime module path must use underscores here.
const MONTSERRAT_FONT_RESOURCE = 'haycee_mobile_app_valdi:fonts/montserrat_';
const montserratFont = (face: string, size: number): string => `${MONTSERRAT_FONT_RESOURCE}${face.toLowerCase()} ${size}`;

export const montserrat = {
  regular: (size: number): string => montserratFont('Regular', size),
  semiBold: (size: number): string => montserratFont('SemiBold', size),
  extraBold: (size: number): string => montserratFont('ExtraBold', size),
  black: (size: number): string => montserratFont('Black', size),
} as const;

/**
 * Shellby's high-density typography primitives, ported as resolved numbers.
 *
 * Shellby's absolute line boxes are converted to Valdi line-height multipliers.
 */
export const fontSize = {
  base: 13,
  nano: 8.5,
  micro: 9,
  tiny: 10,
  label: 11,
  metadata: 12,
  body: 13,
  product: 14.5,
  large: 16.5,
  section: 18.5,
  page: 21.5,
  hero: 25.5,
  message: 15,
  price: 17,
  display: 19,
  priceLarge: 23,
  displayLarge: 29,
  displayHuge: 33,
} as const;

export const lineHeight = {
  base: 18,
  nano: 10,
  micro: 11,
  tiny: 13,
  label: 15,
  product: 17.5,
  body: 20,
  large: 24,
  section: 26,
  page: 30,
  hero: 34,
  message: 21,
  price: 23.5,
  display: 27.5,
  priceLarge: 31.5,
  displayLarge: 37.5,
  displayHuge: 41.5,
  relaxed: 24,
} as const;

export const fontWeight = {
  regular: 400,
  semiBold: 600,
  extraBold: 800,
  black: 900,
} as const;

/** Valdi has no verified textTransform style; transform values before render. */
export type TextCase = 'upper' | 'lower' | 'capitalize' | 'none';

export const defaultTextCase: TextCase = 'upper';

export const transformText = (
  value: string,
  textCase: TextCase = defaultTextCase,
): string => {
  switch (textCase) {
    case 'lower':
      return value.toLowerCase();
    case 'capitalize': {
      const normalized = value.toLowerCase();
      return normalized.length === 0
        ? normalized
        : normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    case 'none':
      return value;
    default:
      return value.toUpperCase();
  }
};

/** Backwards-compatible shorthand for callers that explicitly need uppercase. */
export const uppercase = (value: string): string => transformText(value, 'upper');

/** Convert Shellby's absolute line box into Valdi's verified multiplier API. */
const lineHeightRatio = (size: number, height: number): number => height / size;

/**
 * Typography styles are created once at module initialization and reused.
 * This follows Valdi's Style interning guidance and avoids allocations during
 * render passes.
 */
export const typography = {
  display: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.black(fontSize.hero),
    lineHeight: lineHeightRatio(fontSize.hero, lineHeight.hero),
  }),
  title1: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.page),
    lineHeight: lineHeightRatio(fontSize.page, lineHeight.page),
  }),
  title2: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.section),
    lineHeight: lineHeightRatio(fontSize.section, lineHeight.section),
  }),
  headline: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.large),
    lineHeight: lineHeightRatio(fontSize.large, lineHeight.large),
  }),
  body: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.regular(fontSize.body),
    lineHeight: lineHeightRatio(fontSize.body, lineHeight.body),
  }),
  bodyEmphasis: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.body),
    lineHeight: lineHeightRatio(fontSize.body, lineHeight.body),
  }),
  caption: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.regular(fontSize.label),
    lineHeight: lineHeightRatio(fontSize.label, lineHeight.label),
  }),
  screenHeader: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.page),
    lineHeight: lineHeightRatio(fontSize.page, lineHeight.page),
  }),
  sectionHeader: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.large),
    lineHeight: lineHeightRatio(fontSize.large, lineHeight.large),
  }),
  productTitle: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.semiBold(fontSize.product),
    lineHeight: lineHeightRatio(fontSize.product, lineHeight.product),
  }),
  price: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.price),
    lineHeight: lineHeightRatio(fontSize.price, lineHeight.price),
  }),
  priceRegular: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.regular(fontSize.price),
    lineHeight: lineHeightRatio(fontSize.price, lineHeight.price),
  }),
  button: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.product),
    lineHeight: lineHeightRatio(fontSize.product, lineHeight.label),
  }),
  buttonSmall: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.metadata),
    lineHeight: lineHeightRatio(fontSize.metadata, lineHeight.label),
  }),
  tabLabel: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.extraBold(fontSize.micro),
    lineHeight: lineHeightRatio(fontSize.micro, lineHeight.micro),
  }),
  homeTabLabel: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.extraBold(fontSize.label),
    lineHeight: lineHeightRatio(fontSize.label, lineHeight.label),
  }),
  homeCategoryLabel: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.extraBold(fontSize.tiny),
    lineHeight: lineHeightRatio(fontSize.tiny, lineHeight.tiny),
  }),
  homeSectionLabel: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.label),
    lineHeight: lineHeightRatio(fontSize.label, lineHeight.label),
  }),
  homeSectionSubtitle: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.regular(fontSize.tiny),
    lineHeight: lineHeightRatio(fontSize.tiny, lineHeight.tiny),
  }),
  homeSectionAction: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.tiny),
    lineHeight: lineHeightRatio(fontSize.tiny, lineHeight.tiny),
  }),
  bottomTabLabel: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.tiny),
    lineHeight: lineHeightRatio(fontSize.tiny, lineHeight.tiny),
  }),
  badge: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.extraBold(fontSize.tiny),
    lineHeight: lineHeightRatio(fontSize.tiny, lineHeight.tiny),
  }),
  menuTitle: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.semiBold(fontSize.message),
    lineHeight: lineHeightRatio(fontSize.message, lineHeight.message),
  }),
  menuValue: new Style<Label>({
    color: colors.textSecondary,
    font: montserrat.regular(fontSize.body),
    lineHeight: lineHeightRatio(fontSize.body, lineHeight.base),
  }),
  message: new Style<Label>({
    color: colors.textPrimary,
    font: montserrat.regular(fontSize.message),
    lineHeight: lineHeightRatio(fontSize.message, lineHeight.message),
  }),
} as const;
