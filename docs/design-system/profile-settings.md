# Profile settings

The profile toolbar's final preferences icon opens `ProfileSettingsScreen`. Keep its destinations
separate from `Mon compte`: this screen owns personal account details, sign-in/security controls,
notification delivery preferences, language, appearance, legal documents and sign-out confirmation.
The notification inbox remains under `Mon compte` and is not the same thing as notification
preferences.

## Composition

- Reuse `ProfileAccountMenu` for sectioned navigation rows and `DSSwitch` for binary preferences.
- Use `RadioSelection` for single-choice settings and the shared `DSButton` variants for labeled
  actions. Use `AlertDialog` for the destructive sign-out confirmation.
- Keep all settings page surfaces on semantic background/text/radius/typography tokens. Layout
  dimensions live under `layout.settings`.
- The six navigable option pages use `ProfileSettingsDestinationScreen`; sign-out is a confirmation
  action from the settings list.

## Current integration boundaries

Settings are held in app memory for the current session. Profile-field edits, language selection,
appearance choice and preference toggles are not synced to a service or persisted across launches.
The app currently renders its light palette globally; the appearance page shows both theme previews
but selecting dark does not recolor other screens. Biometric/2-step controls and Wallet PIN changes
need their authentication services. The legal page lists the two documents but does not invent or
publish legal copy; official text and URLs must be supplied before those links become live. Sign-out
confirmation remains a UI flow until an authentication session service is connected.
