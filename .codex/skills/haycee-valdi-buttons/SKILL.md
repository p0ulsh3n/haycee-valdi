---
name: haycee-valdi-buttons
description: Choose and apply Haycee's four shared button styles in Valdi screens and components.
---

# Haycee Valdi button system

Use this skill whenever creating, changing, or reviewing a labeled action button in the Haycee Valdi app. The four variants are app-wide design-system styles, not styles owned by a particular screen.

## Choose the variant by the action's role

- **`cta`**: the primary action that advances or completes the current task, such as Continue, Save, Follow, or Send. Make the intended next step visually dominant. In an action group, normally use one CTA.
- **`black`**: a meaningful filled secondary action that offers another valid path. Use it when the action deserves a filled treatment but is not the primary next step. Do not use it for a simple dismissal.
- **`neutral`**: a filled, already-active state, such as Followed, Selected, or Enabled. Change to this variant when the state is active; do not use it as a generic alternative to `black` or `outline`.
- **`outline`**: a low-emphasis exit or deferral action, such as Cancel, Close, Not now, or Skip. For the common primary-plus-cancel pair, use `cta` plus `outline`.

If a screen's intent does not fit these roles, first choose the closest semantic role without inventing a fifth variant. Keep the four names and their meaning consistent across screens.

## Implementation requirements

1. Use `DSButton` from `src/design-system` for labeled action buttons. The public variants are exactly `cta`, `black`, `neutral`, and `outline`.
2. Do not create screen-local color, border, radius, typography, or disabled-state styles for a button that can use one of these variants. Use `size="standard"`, `"compact"`, or `"fullWidth"`; use the component's existing layout overrides only when the parent layout needs a specific size or row spacing.
3. Keep icon contrast consistent: `cta` and `black` use white icons/text; `neutral` and `outline` use dark icons/text. Override icon tint only when the actual surface requires it for contrast.
4. Keep casing intentional. `DSButton` defaults to the design-system uppercase rule; pass `textCase="none"` when the supplied copy should retain its authored casing.
5. Set `disabled` from real validation or pending state. Pass `loading` for async progress and return the action's promise so `AsyncActionButton` provides its single-flight guard. Keep a handler-level guard for effects also reachable elsewhere, as required by `haycee-valdi-idempotency`.
6. Preserve accessible button labels, including an explicit `accessibilityLabel` when the visible title is not descriptive enough.
7. Icon-only controls, tabs/chips, quantity steppers, and gesture surfaces are not labeled action buttons; keep their specialized components and do not force them into `DSButton`.

## Reference

See [`docs/design-system/buttons.md`](../../../docs/design-system/buttons.md) for the variant decision table, current appearances, and usage examples. The component and its types are exported from `modules/haycee_mobile_app_valdi/src/design-system/index.ts`.
