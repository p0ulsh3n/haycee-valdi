# Haycee Valdi application rules

This repository is a minimal application bootstrapped by the official Snapchat Valdi CLI.
The pinned framework imports are recorded in `WORKSPACE`; keep Valdi and Valdi_Widgets versions
coherent with that file.

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
- Do not modify the Valdi source checkout to implement application features.
- Do not add product features, navigation, networking layers, design systems or marketplace/live
  functionality as part of workspace setup.

## Reference and agent workflow

1. Read the relevant official skill under `.codex/skills/`.
2. Query `docs/valdi-reference/API_INDEX.json` and follow its `source` pointer.
3. Confirm the import and signature in the pinned/reference source before coding.
4. Make the smallest module-scoped change.
5. Run `pwsh -File scripts/valdi-validate.ps1` or the narrower Valdi command available.
6. Update documentation only when the verified source/version evidence changes.

`docs/valdi-reference/SOURCE_MANIFEST.json` is the version ledger. The reference checkout is
outside this application tree and must remain read-only during application development.
