/**
 * Haycee design-system color tokens.
 *
 * Keep raw palette values here and use semantic colors in components. This
 * makes a future light/dark palette change local to this module.
 */
export const palette = {
  snapYellow: '#FFFC00',
  snapYellowDark: '#E8E500',
  snapYellowLight: '#FFFDE0',

  black: '#000000',
  gray900: '#1F1F1F',
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
  purple: '#7B61FF',
  liveLavender: '#EEE9F7',
  livePeach: '#F4E9E2',
  liveBlue: '#E6EEF4',
  liveSage: '#E8EFE8',
  liveSand: '#F1EDE2',
} as const;

export const colors = {
  backgroundPrimary: palette.white,
  backgroundSecondary: palette.gray100,
  backgroundDark: palette.black,
  /** Visible underlay so Live's translucent surface has something to blend with. */
  liveBackdrop: '#1D2730',
  /** Translucent dark material used by default transient feedback. */
  backgroundTransient: 'rgba(72, 72, 72, 0.82)',
  backgroundBrand: palette.snapYellow,
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
  liveViewerBadgeSurface: '#080E12',
  liveViewerBadgeGradient: 'linear-gradient(135deg, rgba(137, 35, 160, 0.7) 0%, #F1A322 22.58%, #F7FF1A 100%)',
  liveControlSurface: 'rgba(255, 255, 255, 0.88)',
  liveChatSurface: 'rgba(255, 255, 255, 0.76)',
  liveIndicatorGradient: `linear-gradient(${palette.red}, ${palette.purple})`,

  textPrimary: palette.black,
  textSecondary: palette.gray700,
  textTertiary: palette.gray500,
  textInverted: palette.white,
  textOnDarkSecondary: palette.gray300,
  textBrand: palette.black,
  textMessageSent: palette.white,
  textDanger: palette.red,
  textSuccess: palette.green,

  interactivePrimary: palette.snapYellow,
  interactivePrimaryPressed: palette.snapYellowDark,
  interactiveDisabled: palette.gray300,
  interactiveDanger: palette.red,
  interactiveSuccess: palette.green,
  interactiveWarning: palette.orange,

  borderDefault: palette.gray300,
  borderFocus: palette.blue,
  borderDanger: palette.red,

  iconDefault: palette.black,
  iconInverted: palette.white,
  iconBrand: palette.black,
} as const;
