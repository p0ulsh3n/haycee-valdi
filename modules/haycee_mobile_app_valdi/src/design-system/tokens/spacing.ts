/** 4pt spacing grid used by the application. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
  xxxxxxl: 64,
} as const;

/** Resolved Shellby-inspired Home layout tokens. */
export const layout = {
  navigation: {
    /** Height of the app bottom tabs, excluding the device safe-area inset. */
    bottomTabsHeight: 72,
  },
  home: {
    header: {
      topPadding: 12,
      bottomPadding: 12,
      horizontalPadding: 16,
      searchGap: 14,
      actionGap: 18,
      actionTarget: 44,
    },
    search: {
      height: 36,
      borderWidth: 1,
      borderRadius: 4,
      horizontalPadding: 10,
      iconSize: 18,
      iconGap: 8,
    },
    categoryTabs: {
      height: 44,
      contentPaddingHorizontal: 12,
      tabPaddingHorizontal: 16,
      indicatorHeight: 2,
      indicatorSlotHeight: 4,
    },
    hero: {
      aspectRatio: 0.56,
    },
    categoryRail: {
      horizontalPadding: 16,
      verticalPadding: 12,
      gap: 16,
      itemWidth: 60,
      imageSize: 60,
      imageRadius: 4,
      labelMarginTop: 6,
      height: 104,
    },
    sectionHeader: {
      horizontalPadding: 16,
      verticalPadding: 14,
    },
    productRails: {
      horizontalPadding: 16,
      verticalPadding: 14,
      gap: 12,
      flash: {
        cardWidth: 140,
        imageWidth: 140,
        imageHeight: 175,
        imageRadius: 12,
        railHeight: 251,
        contentHorizontalPadding: 8,
        contentBottomPadding: 8,
        contentGap: 2,
      },
      trending: {
        cardWidth: 160,
        cardHeight: 200,
        cardRadius: 12,
        overlayPadding: 12,
        railHeight: 228,
      },
      deals: {
        cardWidth: 260,
        cardHeight: 90,
        imageSize: 90,
        cardRadius: 12,
        contentPadding: 10,
        railHeight: 118,
      },
    },
    ticker: {
      holdMilliseconds: 2600,
      exitDurationSeconds: 0.2,
      enterDurationSeconds: 0.24,
      slideDistance: 10,
    },
  },
} as const;
