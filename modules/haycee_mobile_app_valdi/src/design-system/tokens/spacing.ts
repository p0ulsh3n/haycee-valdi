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
    /** Extra scrollable space that keeps the last tab item clear of the fixed navigation. */
    bottomTabContentPadding: 72,
  },
  seller: {
    videos: {
      columns: 3,
      horizontalPadding: 1,
      columnGap: 2,
      rowGap: 2,
      /** Poster width divided by height for the seller's short-video grid. */
      posterAspectRatio: 0.75,
    },
  },
  product: {
    stockIndicator: {
      progressHeight: 8,
      progressMinWidth: 48,
    },
    stockCountPill: {
      height: 20,
    },
    variantStockPreview: {
      headingHeight: 20,
      holdDurationMilliseconds: 4200,
      iconSize: 12,
      itemsPerPage: 2,
      lowStockThreshold: 5,
      rowHeight: 17,
      tickerHeight: 34,
      transitionDurationMilliseconds: 850,
    },
  },
  home: {
    header: {
      topPadding: 12,
      bottomPadding: 12,
      horizontalPadding: 16,
      searchGap: 10,
      actionGap: 12,
      actionTarget: 40,
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
    categoryDirectory: {
      columns: 3,
      horizontalPadding: 16,
      columnGap: 8,
      rowGap: 8,
      cardRadius: 16,
      cardPadding: 12,
      subcategoryThumbWidth: 64,
      subcategoryThumbHeight: 84,
      subcategoryLabelGap: 16,
      subcategoryRowGap: 18,
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
  live: {
    categoryTabsHeight: 44,
    categoryTabWidth: 144,
    feedHorizontalPadding: 12,
    feedTopPadding: 16,
    feedBottomPadding: 104,
    cardColumnGap: 8,
    cardRowGap: 22,
    panelAspectRatio: 0.75,
    panelRadius: 8,
    upcoming: {
      /** Wide event artwork area, sized in proportion to the device width. */
      heroAspectRatio: 1.18,
      countdownCellHeight: 56,
      reminderCardMinHeight: 82,
      sellerAvatarSize: 44,
    },
    viewer: {
      horizontalPadding: 16,
      headerButtonSize: 38,
      sellerAvatarSize: 32,
      /** Shared outline thickness for controls layered over Live video. */
      glassBorderWidth: 1,
      viewerBadgeGradientWidth: 2,
      chatHeight: 208,
      composerHeight: 40,
      productQuickAccessSize: 44,
      productCountBadgeSize: 18,
      actionButtonSize: 40,
      actionRailWidth: 56,
      productCardHeight: 148,
      productCardWidth: 312,
      productGlassHeight: 148,
      productImageHeight: 64,
      shippingIconSize: 14,
      productAutoAdvanceMilliseconds: 5000,
      wallet: {
        tabHeight: 44,
      },
    },
  },
} as const;
