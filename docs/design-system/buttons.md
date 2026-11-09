# Haycee button styles

Use `DSButton` from `src/design-system` for app actions so each screen reuses the same semantic appearance, label treatment, disabled/loading behavior, and single-flight async handling.

## Four shared styles

| Variant | Appearance | Use |
| --- | --- | --- |
| `cta` | Brand purple fill, white extra-bold label | The primary action that moves the current task forward. Example: “Suivre le vendeur” in LiveFollow. |
| `black` | Black fill, white extra-bold label | A meaningful filled secondary action that offers another valid path. |
| `neutral` | Light neutral fill, black extra-bold label and icon | An already-active state, such as “Suivi” or “Sélectionné”. Do not use it as a generic secondary action. |
| `outline` | White fill, subtle neutral border, black semibold label | Cancel, close, skip, or defer. Example: “Pas maintenant” in LiveFollow. |

### Selection rule

Choose by the action's role, not by the screen where the button appears. In a group with one main action and one cancellation/deferral, pair `cta` with `outline`. Use `black` for a second meaningful action. Use `neutral` when the button communicates that a toggleable state is already active. Normally show only one `cta` per action group.

Use these four variants for labeled action buttons throughout the app. Icon-only controls, tabs/chips, steppers, and gesture surfaces have their own components.

Use `size="fullWidth"` for side-by-side sheet actions, `size="compact"` for the seller profile action (36 × 96), and the default `standard` size elsewhere. A row can pass `marginLeft` and `marginRight` to preserve its spacing. Set `textCase="none"` for labels whose casing is part of the copy, such as “Suivre” and “Pas maintenant”; the design system otherwise defaults to uppercase.

```tsx
<DSButton title="Continuer" variant="cta" onTap={this.continue} />
<DSButton title="Fermer" variant="black" onTap={this.close} />
<DSButton title="Suivi" variant="neutral" size="compact" onTap={this.toggleFollow} />
<DSButton title="Pas maintenant" variant="outline" onTap={this.dismiss} />
```

`DSButton` delegates to `AsyncActionButton`: return a promise from asynchronous callbacks to get single-flight behavior and pending state. Synchronous state actions can return `void`. Keep validation and handler-level idempotency in place for actions that can also be triggered elsewhere. Dense shared controls may override `width` and `height` while keeping one of the four semantic variants; do not define a second button skin for them. Contextual surfaces may pass semantic `surfaceColor` and `labelColor` tokens. Use `interactionDisabled` when an invisible or transitioning control must reject taps without switching to the disabled appearance. Use `iconAlignment="fixedLeading"` when a changing label must not move its leading icon inside a fixed-width button. When a leading icon and label need a small optical baseline correction, use the optional `labelTranslationY` on `DSButton` instead of shifting the whole button or introducing a screen-local label.

Disabled and loading are separate states: a disabled button blocks taps and uses the disabled appearance, but does not show a spinner. The spinner appears only while an action is actually pending (`loading` or the async callback's returned promise).
