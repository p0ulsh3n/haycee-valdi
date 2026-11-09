# Media action sheets

Haycee provides two reusable, media-led bottom sheets:

- `FeatureDiscoverySheet` introduces or explains a feature in context.
- `UpsellSheet` presents a plan, offer, or upgrade.

They share the same content, media, action, layout, appearance, and dismissal options. Use
`FeatureDiscoverySheet` or `UpsellSheet` to make the product intent clear; do not create a new
sheet for each campaign or asset.

## Presentation

Import `FeatureDiscoverySheet` or `UpsellSheet`, `runNavigationAction`, and
`getBottomSheetNavigationOptions` from `src/design-system`. Use the navigation gate to keep
presentation single-flight, and the helper to control whether the presenting screen remains
visible behind the sheet:

```tsx
runNavigationAction(this.navigationController, () => {
  this.navigationController.present(
    FeatureDiscoverySheet,
    {
      eyebrow: 'NOUVEAU',
      title: 'Découvre les collections',
      message: 'Retrouve plus vite les articles qui te plaisent.',
      mediaUrl: 'https://example.invalid/collections.webp',
      mediaType: 'animated',
      primaryLabel: 'Découvrir',
      secondaryLabel: 'Plus tard',
      onPrimaryAction: this.openCollections,
    },
    {},
    {
      animated: true,
      wrapInPlatformNavigationController: false,
      ...getBottomSheetNavigationOptions({ transparentPageBackground: true }),
    },
  );
});
```

Set `transparentPageBackground: false` when the page behind the sheet should be opaque. This
presentation option belongs to `NavigationController.present`; the sheet cannot change it after
the route has been presented.

## Content and media

- `mediaAsset` or `mediaUrl` selects the hero media. `mediaPosterAsset` or `mediaPosterUrl` is an
  optional video poster.
- `mediaType` is `image` (default), `animated`, or `video`. Animated media uses Valdi's native
  `<animatedimage>`; Lottie and animated WebP are documented formats. GIF decoding depends on the
  codecs compiled into the pinned Valdi build, so do not assume every GIF will play. Load failures
  are handled and can show `mediaFallbackLabel`.
- Videos use Valdi's native `<video>`, start muted by default, and can be paused with
  `mediaAutoplay: false`. `mediaVolume` is clamped to 0–1 and `mediaPlaybackRate` to 0.25–2.
- `mediaAspectRatio` controls the hero frame. `mediaLoop` applies to animated images.
- `eyebrow`, `benefits` (up to five), and `footnote` are optional. Each benefit can contain a
  title, description, and optional icon.

## Actions, appearance, and dismissal

- `primaryLabel` is required; `secondaryLabel` is optional. Each action can be synchronous or
  return a promise. Repeated taps are blocked while an action is pending. A rejected promise keeps
  the sheet open and restores the actions so the user can retry. Optional leading icons and their
  sizes are `primaryIcon`/`primaryIconSize` and `secondaryIcon`/`secondaryIconSize`.
- Button tones are `brand`, `black`, `neutral`, and `light`; action layout is `vertical` by default
  or `horizontal`.
- `tone` is `light` by default or `dark`. Copy and button colors use Haycee design tokens.
- `sheetHeight` accepts Valdi points or a percentage string. `contentScrollable` defaults to false;
  enable it for copy/benefits that can exceed the available height. The action buttons remain fixed
  at the bottom.
- `showOverlay`, `overlayOpacity`, `showHandle`, `enableGestures`, `dismissOnOverlayTap`, and
  `roundBottomCorners` follow `BOTTOM_SHEET_DEFAULTS`. `showCloseButton` defaults to true.
- `onDismiss` can record dismissal or update the caller's eligibility state. The caller owns
  frequency/“show once” policy and durable storage; creating or dismissing a sheet does not itself
  persist campaign state.

## Valdi references

This component uses the pinned Valdi beta-0.2.1 API recorded in
`docs/valdi-reference/SOURCE_MANIFEST.json` (reference commit
`f26bee4dc170b6c929f71d4dd07d44e033f47176`). The confirmed native media APIs are documented in
`S:\valdi-official-reference\docs\docs\core-images.md`,
`S:\valdi-official-reference\docs\docs\core-video.md`, and
`S:\valdi-official-reference\docs\api\api-reference-elements.md`.
