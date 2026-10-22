import { Style } from 'valdi_core/src/Style';
import { Label } from 'valdi_tsx/src/NativeTemplateElements';
import { colors } from './colors';

/**
 * Custom Metropolis faces bundled by this Valdi module.
 * Valdi resolves a module font descriptor as
 * `moduleName:res-relative-font-path size`; the native runtime then loads the
 * matching `.ttf` from this module's `res/` directory.
 */
const METROPOLIS_FONT_RESOURCE = 'haycee_mobile_app_valdi:fonts/metropolis-';
const metropolisFont = (face: string, size: number): string => `${METROPOLIS_FONT_RESOURCE}${face.toLowerCase()} ${size}`;

export const metropolis = {
  thin: (size: number): string => metropolisFont('Thin', size),
  thinItalic: (size: number): string => metropolisFont('ThinItalic', size),
  extraLight: (size: number): string => metropolisFont('ExtraLight', size),
  extraLightItalic: (size: number): string => metropolisFont('ExtraLightItalic', size),
  light: (size: number): string => metropolisFont('Light', size),
  lightItalic: (size: number): string => metropolisFont('LightItalic', size),
  regular: (size: number): string => metropolisFont('Regular', size),
  regularItalic: (size: number): string => metropolisFont('RegularItalic', size),
  medium: (size: number): string => metropolisFont('Medium', size),
  mediumItalic: (size: number): string => metropolisFont('MediumItalic', size),
  semiBold: (size: number): string => metropolisFont('SemiBold', size),
  semiBoldItalic: (size: number): string => metropolisFont('SemiBoldItalic', size),
  bold: (size: number): string => metropolisFont('Bold', size),
  boldItalic: (size: number): string => metropolisFont('BoldItalic', size),
  extraBold: (size: number): string => metropolisFont('ExtraBold', size),
  extraBoldItalic: (size: number): string => metropolisFont('ExtraBoldItalic', size),
  black: (size: number): string => metropolisFont('Black', size),
  blackItalic: (size: number): string => metropolisFont('BlackItalic', size),
} as const;

/**
 * Shellby's high-density typography primitives, ported as resolved numbers.
 *
 * Valdi's `letterSpacing` is expressed in points and `lineHeight` is a
 * multiplier. The absolute Shellby line boxes are kept in `lineHeight` above
 * and converted to that multiplier below; only resolved native values are
 * passed to Valdi.
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
  light: 300,
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
  extraBold: 800,
  black: 900,
} as const;

export const letterSpacing = {
  nano: 0.8,
  micro: 1.2,
  tiny: 1,
  headingTight: -0.4,
  body: -0.25,
  normal: 0,
  badge: 0.5,
  wide: 1,
  wider: 1.5,
  widest: 2,
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
    font: metropolis.black(fontSize.hero),
    lineHeight: lineHeightRatio(fontSize.hero, lineHeight.hero),
    letterSpacing: letterSpacing.headingTight,
  }),
  title1: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.extraBold(fontSize.page),
    lineHeight: lineHeightRatio(fontSize.page, lineHeight.page),
    letterSpacing: letterSpacing.normal,
  }),
  title2: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.extraBold(fontSize.section),
    lineHeight: lineHeightRatio(fontSize.section, lineHeight.section),
    letterSpacing: letterSpacing.normal,
  }),
  headline: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.extraBold(fontSize.large),
    lineHeight: lineHeightRatio(fontSize.large, lineHeight.large),
    letterSpacing: letterSpacing.normal,
  }),
  body: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.regular(fontSize.body),
    lineHeight: lineHeightRatio(fontSize.body, lineHeight.body),
    letterSpacing: letterSpacing.body,
  }),
  bodyEmphasis: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.extraBold(fontSize.body),
    lineHeight: lineHeightRatio(fontSize.body, lineHeight.body),
    letterSpacing: letterSpacing.body,
  }),
  caption: new Style<Label>({
    color: colors.textSecondary,
    font: metropolis.regular(fontSize.label),
    lineHeight: lineHeightRatio(fontSize.label, lineHeight.label),
    letterSpacing: letterSpacing.normal,
  }),
  screenHeader: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.bold(fontSize.page),
    lineHeight: lineHeightRatio(fontSize.page, lineHeight.page),
    letterSpacing: letterSpacing.widest,
  }),
  sectionHeader: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.extraBold(fontSize.large),
    lineHeight: lineHeightRatio(fontSize.large, lineHeight.large),
    letterSpacing: letterSpacing.wider,
  }),
  productTitle: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.semiBold(fontSize.product),
    lineHeight: lineHeightRatio(fontSize.product, lineHeight.product),
    letterSpacing: letterSpacing.body,
  }),
  price: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.extraBold(fontSize.price),
    lineHeight: lineHeightRatio(fontSize.price, lineHeight.price),
    letterSpacing: letterSpacing.headingTight,
  }),
  priceLight: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.light(fontSize.price),
    lineHeight: lineHeightRatio(fontSize.price, lineHeight.price),
    letterSpacing: letterSpacing.headingTight,
  }),
  button: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.bold(fontSize.product),
    lineHeight: lineHeightRatio(fontSize.product, lineHeight.label),
    letterSpacing: letterSpacing.wide,
  }),
  buttonSmall: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.bold(fontSize.metadata),
    lineHeight: lineHeightRatio(fontSize.metadata, lineHeight.label),
    letterSpacing: letterSpacing.wide,
  }),
  tabLabel: new Style<Label>({
    color: colors.textSecondary,
    font: metropolis.bold(fontSize.micro),
    lineHeight: lineHeightRatio(fontSize.micro, lineHeight.micro),
    letterSpacing: letterSpacing.wider,
  }),
  homeTabLabel: new Style<Label>({
    color: colors.textSecondary,
    font: metropolis.bold(fontSize.label),
    lineHeight: lineHeightRatio(fontSize.label, lineHeight.label),
    letterSpacing: letterSpacing.wider,
  }),
  homeCategoryLabel: new Style<Label>({
    color: colors.textSecondary,
    font: metropolis.bold(fontSize.tiny),
    lineHeight: lineHeightRatio(fontSize.tiny, lineHeight.tiny),
    letterSpacing: letterSpacing.wide,
  }),
  homeSectionLabel: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.extraBold(fontSize.label),
    lineHeight: lineHeightRatio(fontSize.label, lineHeight.label),
    letterSpacing: letterSpacing.widest,
  }),
  homeSectionSubtitle: new Style<Label>({
    color: colors.textSecondary,
    font: metropolis.regular(fontSize.tiny),
    lineHeight: lineHeightRatio(fontSize.tiny, lineHeight.tiny),
    letterSpacing: letterSpacing.wide,
  }),
  homeSectionAction: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.bold(fontSize.tiny),
    lineHeight: lineHeightRatio(fontSize.tiny, lineHeight.tiny),
    letterSpacing: letterSpacing.wider,
  }),
  bottomTabLabel: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.bold(fontSize.tiny),
    lineHeight: lineHeightRatio(fontSize.tiny, lineHeight.tiny),
    letterSpacing: letterSpacing.normal,
  }),
  badge: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.extraBold(fontSize.tiny),
    lineHeight: lineHeightRatio(fontSize.tiny, lineHeight.tiny),
    letterSpacing: letterSpacing.wide,
  }),
  menuTitle: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.semiBold(fontSize.message),
    lineHeight: lineHeightRatio(fontSize.message, lineHeight.message),
    letterSpacing: letterSpacing.body,
  }),
  menuValue: new Style<Label>({
    color: colors.textSecondary,
    font: metropolis.regular(fontSize.body),
    lineHeight: lineHeightRatio(fontSize.body, lineHeight.base),
    letterSpacing: letterSpacing.normal,
  }),
  message: new Style<Label>({
    color: colors.textPrimary,
    font: metropolis.regular(fontSize.message),
    lineHeight: lineHeightRatio(fontSize.message, lineHeight.message),
    letterSpacing: letterSpacing.normal,
  }),
} as const;
