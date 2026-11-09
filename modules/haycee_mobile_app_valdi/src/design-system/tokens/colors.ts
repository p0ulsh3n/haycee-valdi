/**
 * Haycee design-system color tokens.
 *
 * Keep raw palette values here and use semantic colors in components. This
 * makes a future light/dark palette change local to this module.
 */
export const palette = {
  brandPurple: '#5E00FF',
  brandPurplePressed: '#4B00CC',

  black: '#000000',
  gray900: '#1F1F1F',
  gray800: '#4A4A4A',
  gray700: '#5F5F5F',
  gray500: '#8A8A8A',
  gray300: '#C9C9C9',
  gray100: '#F2F2F2',
  white: '#FFFFFF',

  red: '#D93025',
  green: '#188038',
  blue: '#1A73E8',
  messageBlue: '#3556C8',
  messageBlueLight: '#5475E0',
  orange: '#E37400',
  purple: '#5E00FF',
  liveLavender: '#EEE9F7',
  livePeach: '#F4E9E2',
  liveBlue: '#E6EEF4',
  liveSage: '#E8EFE8',
  liveSand: '#F1EDE2',
} as const;

export const colors = {
  backgroundPrimary: palette.white,
  backgroundSecondary: palette.gray100,
  backgroundTertiary: palette.gray500,
  backgroundDark: palette.black,
  backgroundDarkElevated: palette.gray900,
  backgroundDarkSecondary: palette.gray800,
  /** Visible underlay so Live's translucent surface has something to blend with. */
  liveBackdrop: '#5F5F5F',
  /** Translucent dark material used by default transient feedback. */
  backgroundTransient: 'rgba(72, 72, 72, 0.82)',
  backgroundProfileHeader: 'rgba(0, 0, 0, 0.48)',
  backgroundBrand: palette.brandPurple,
  backgroundMessageSent: palette.messageBlue,
  backgroundOverlay: 'rgba(0, 0, 0, 0.56)',
  mediaIndicatorActive: palette.white,
  mediaIndicatorInactive: 'rgba(255, 255, 255, 0.4)',
  livePanelLavender: palette.liveLavender,
  livePanelPeach: palette.livePeach,
  livePanelBlue: palette.liveBlue,
  livePanelSage: palette.liveSage,
  livePanelSand: palette.liveSand,
  /** Transparent interior and light outline for controls over Live video. */
  liveGlassSurface: 'rgba(0, 0, 0, 0)',
  liveGlassBorder: 'rgba(255, 255, 255, 0.34)',
  /** Translucent dark material used over Live content, including its action buttons. */
  liveActionSurface: 'rgba(8, 14, 18, 0.42)',
  liveChatUsername: '#B6B6B8',
  liveViewerBadgeGradient: `linear-gradient(135deg, rgba(137, 35, 160, 0.7) 0%, #F1A322 22.58%, ${palette.brandPurple} 100%)`,
  liveControlSurface: 'rgba(255, 255, 255, 0.88)',
  liveChatSurface: 'rgba(255, 255, 255, 0.76)',
  liveIndicatorGradient: `linear-gradient(${palette.red}, ${palette.brandPurple})`,
  liveCardBadgeExclusive: '#F2C45F',
  liveCardBadgeSold: palette.gray700,
  liveCardBadgeClearance: palette.red,
  liveCardBadgePromotion: palette.brandPurple,
  liveCardBadgeNew: '#DCEBFF',
  liveCardBadgeLimited: palette.black,
  productRatingStar: '#FF9529',
  productRatingStarEmpty: '#EAEAEA',
  productRatingText: '#374151',
  productDiscountSurface: '#FFF0F3',
  productBadgeBestSeller: palette.orange,
  productBadgeTrending: '#FF3A67',
  productBadgeHot: palette.red,
  productBadgeLoved: '#D63384',
  productBadgeTopPick: palette.brandPurple,
  productBadgeNew: palette.green,
  productBadgeElite: '#C9960C',
  productBadgeCertified: palette.gray700,
  productBadgeOfficial: palette.blue,
  productBadgeAuthorized: '#4A90D9',
  offerAccent: palette.blue,
  offerPositive: palette.green,
  offerGold: '#A77A00',
  offerDanger: palette.red,
  offerWarning: palette.orange,
  /** Lime-to-yellow fill for the shared product stock progress bar. */
  stockProgressGradient: 'linear-gradient(90deg, #67F667 0%, #7FF766 15%, #9AF963 30%, #B8FC61 45%, #D2FE5F 60%, #DBFE5F 75%, #E4FF5E 92%, #E5FF5E 100%)',
  offerTeal: '#008F83',
  offerMuted: palette.gray700,
  liveWalletStatusDelivered: '#E8EFE8',
  liveWalletStatusPending: '#F1EDE2',

  textPrimary: palette.black,
  textPlaceholder: palette.gray800,
  textSecondary: palette.gray700,
  textTertiary: palette.gray500,
  textInverted: palette.white,
  textOnDarkSecondary: palette.gray300,
  textBrand: palette.white,
  textMessageSent: palette.white,
  textDanger: palette.red,
  textSuccess: palette.green,

  interactivePrimary: palette.brandPurple,
  interactivePrimaryPressed: palette.brandPurplePressed,
  /** CTA button surface (purple). */
  buttonPrimary: palette.brandPurple,
  /** Light neutral fill used by the neutral button variant. */
  buttonNeutral: palette.gray100,
  /** Black filled button surface. */
  buttonSecondary: palette.black,
  interactiveDisabled: palette.gray300,
  interactiveDanger: palette.red,
  interactiveSuccess: palette.green,
  interactiveWarning: palette.orange,

  borderDefault: palette.gray300,
  borderFocus: palette.blue,
  borderDanger: palette.red,

  iconDefault: palette.black,
  iconInverted: palette.white,
  iconBrand: palette.white,
} as const;
