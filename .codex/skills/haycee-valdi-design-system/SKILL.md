---
name: haycee-valdi-design-system
description: Build or change any Haycee Valdi screen or component using the shared design system first, extending it when a reusable token or pattern is missing.
---

# Haycee Valdi design-system-first workflow

Use this skill for every app UI task: new screens, visual changes, layout, typography, interaction states, sheets, navigation surfaces, cards, loading and feedback. This is a required implementation rule for the whole app, not an optional styling preference.

## Mandatory workflow

1. Read [`docs/design-system/component-catalog.md`](../../../docs/design-system/component-catalog.md) and inspect the live exports in `modules/haycee_mobile_app_valdi/src/design-system/index.ts`. The code is authoritative if the catalog and implementation differ; update both when the system changes.
2. Search the design-system module and existing product/domain components for a pattern that already solves the need. Reuse and compose it before proposing another implementation.
3. Read `.codex/skills/valdi-expert/SKILL.md` for Valdi work. Also read `.codex/skills/haycee-valdi-buttons/SKILL.md` for labeled action buttons and `.codex/skills/haycee-valdi-idempotency/SKILL.md` for taps, navigation, sheets, dialogs, forms, async actions, and pagination.
4. If a required reusable token or pattern is missing, add it to the design system **before composing the screen that needs it**. Define its semantics and defaults, implement a reusable component/token in `src/design-system`, export its public API from `src/design-system/index.ts`, document it in `docs/design-system/component-catalog.md` (and a focused design-system guide when needed), then use it in the screen. Complete this in the same task; do not leave the UI using a temporary local substitute.
5. Build screens by composing the shared system. Screen files may own page-specific content and composition, but must not redefine an existing shared color, font, radius, spacing, button, sheet, tab, badge, card pattern, loading behavior, or feedback surface.
6. Confirm all new Valdi APIs, properties and lifecycle behavior against the pinned official source and generated API index. Keep the implementation native Valdi TSX and within the existing Bazel module.
7. Apply accessibility, idempotency, no-bounce scrolling, safe-area and performance rules from the shared components and their skills. Add or update documentation alongside any design-system change.
8. Validate with the smallest supported Valdi check when available; report blocked checks accurately.

## Shared-system rules

- Use semantic tokens from `src/design-system/tokens/` for colors, spacing/layout, radius, typography, and scrolling. Do not introduce raw app palette values or one-off spacing/font/radius values where a shared token or semantic variant belongs. If the design needs a genuinely new value, create a named token first.
- Use `DSButton` for every labeled action and only its global `cta`, `black`, `neutral`, or `outline` variants. Do not build a screen-local button skin. Follow the button skill for semantic choice.
- Use shared navigation, `BottomSheet` options/surface, sheets, tabs/chips, `Hairline`, `RadioSelection`, `Ticker`, `Tooltip`, `TransientFeedback`/`SnackBar`, `InAppBanner`, product components and loading primitives where appropriate. See the catalog for purpose and boundaries.
- Preserve Montserrat faces and typography scales from the shared typography tokens. The default text case is uppercase; override it deliberately through `transformText`/`textCase` rather than hand-transforming labels.
- Reuse shared money formatting, navigation guards, identity formatting and scroll attributes instead of cloning their behavior.
- Extend existing components with explicit optional props when the behavior is a general capability. Keep screen-specific content in its feature component and avoid turning every feature into a global abstraction.
- A feature UI that cannot be expressed with current shared primitives is a design-system gap. Resolve that gap first, then build the feature with the new shared primitive.

## Completion checklist

- Existing tokens/components were searched and reused where suitable.
- Any genuine design-system gap was filled before screen composition; public exports and the catalog were updated.
- Labeled actions use `DSButton`; interactive actions follow the idempotency skill.
- No duplicated screen-local design primitive or unexplained raw visual token remains.
- Valdi API evidence and validation status are recorded when relevant.
