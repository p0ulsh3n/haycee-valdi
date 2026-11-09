# Haycee Valdi application rules

This repository is a minimal application bootstrapped by the official Snapchat Valdi CLI.
The pinned framework imports are recorded in `MODULE.bazel`; keep Valdi and Valdi_Widgets versions
coherent with that file. This app uses the official bzlmod configuration introduced with the
`beta-0.1.0` release; do not restore the legacy `WORKSPACE` dependency setup.

## Non-negotiable rules

- Valdi first: use the installed Valdi component model, native template elements, modules and
  Bazel rules. This is TSX syntax, not React or React Native.
- Do not invent APIs, imports, lifecycle methods, props, styles or CLI commands. Search the
  official reference at `S:\valdi-official-reference` and the generated indexes in `docs/` first.
- Before adding a component, service or dependency, search the official modules, examples and
  installed skills for an existing implementation.
- Prefer class-based Valdi components and the lifecycle documented for the pinned release. Do not
  introduce `useState`, `useEffect`, functional React components, React Native primitives or web
  CSS conventions unless a verified Valdi source explicitly supports the exact API.
- Keep platform claims explicit. Android, iOS and macOS availability must be supported by an
  official source for the version in use; Windows is a host limitation here, not a target claim.
- Preserve Bazel/module conventions. Run the applicable Valdi lint, test, agent-check and build
  commands whenever the local toolchain supports them, and record blocked commands honestly.
- For every labeled action button, follow `.codex/skills/haycee-valdi-buttons/SKILL.md` and use
  the global `DSButton` with one of exactly four variants: `cta`, `black`, `neutral`, or `outline`.
  Do not create screen-specific button styles for these actions. Specialized icon-only controls,
  tabs/chips, steppers, and gesture surfaces keep their dedicated components.
- Do not modify the Valdi source checkout to implement application features.
- Do not add product features, navigation, networking layers, design systems or marketplace/live
  functionality as part of workspace setup.
- Design-system-first UI is mandatory across the entire app. Before implementing or changing any
  screen, component, layout, visual style, interaction state, loading state, feedback, sheet, tab,
  card, or navigation UI, read `.codex/skills/haycee-valdi-design-system/SKILL.md` and
  `docs/design-system/component-catalog.md`, then inspect the public barrel and matching source.
  Reuse the existing design-system tokens/components. If the required reusable token or pattern
  does not exist, implement it in `src/design-system` first, export it when it is public, update
  the catalog and focused design-system guide, then compose the requested screen in the same task.
  No screen-local substitute, duplicated shared style, or temporary UI implementation may bypass
  this sequence.

## Reference and agent workflow

1. For any UI/design task, first read `.codex/skills/haycee-valdi-design-system/SKILL.md` and
   `docs/design-system/component-catalog.md`. Search and reuse the existing system; when a shared
   piece is missing, add it to the design system and catalog before using it in the screen.
2. Read the relevant official skill under `.codex/skills/`.
   For workstation/editor setup, also read `haycee-vscode-wsl`; for builds and validation,
   also read `haycee-valdi-build`.
3. For every labeled action button, read `.codex/skills/haycee-valdi-buttons/SKILL.md`, apply its
   variant decision rules, and use the shared `DSButton` component.
4. For any interactive screen or component with taps, navigation, buttons, dialogs/sheets,
   submissions, or pagination, read `.codex/skills/haycee-valdi-idempotency/SKILL.md` and apply
   its action-specific guard patterns.
5. Query `docs/valdi-reference/API_INDEX.json` and follow its `source` pointer.
6. Confirm the import and signature in the pinned/reference source before coding.
7. Make the smallest module-scoped change while keeping shared UI behavior in the design system.
8. Run `pwsh -File scripts/valdi-validate.ps1` or the narrower Valdi command available.
9. Update the component catalog and focused design-system documentation whenever the design system
   changes; update the Valdi reference documentation when verified source/version evidence changes.

`docs/valdi-reference/SOURCE_MANIFEST.json` is the version ledger. The reference checkout is
outside this application tree and must remain read-only during application development.
