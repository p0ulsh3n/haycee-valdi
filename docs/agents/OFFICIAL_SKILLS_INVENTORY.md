# Official Valdi skills inventory

## Sources

- Installed CLI: `@snap/valdi` 1.0.11, bundled registry with 16 entries.
- Reference checkout: `S:\valdi-official-reference`, commit `f26bee4dc170b6c929f71d4dd07d44e033f47176`, main registry with 28 entries.
- The project framework baseline is Valdi/Valdi_Widgets `beta-0.1.0`; the installed skill inventory was originally captured with CLI 1.0.11 and has not been regenerated from CLI 1.1.5.

## CLI-bundled skills

| Skill | Category | Installed for app/Codex | Installed by CLI |
|---|---|---:|---:|
| valdi-tsx | client | yes | Claude, Cursor |
| valdi-bazel | framework, client | yes | Claude, Cursor |
| valdi-testing | client | yes | Claude, Cursor |
| valdi-ios | framework, client | yes | Claude, Cursor |
| valdi-android | framework, client | yes | Claude, Cursor |
| valdi-polyglot-module | client | yes | Claude, Cursor |
| valdi-custom-view | client | yes | Claude, Cursor |
| valdi-overview | client | yes | Claude, Cursor |
| valdi-async | client | yes | Claude, Cursor |
| valdi-perf | client | yes | Claude, Cursor |
| valdi-component-tests | client | yes | Claude, Cursor |
| valdi-setup | client | yes | Claude, Cursor |
| valdi-migrate | client | yes | Claude, Cursor |
| valdi-inspect | client | yes | Claude, Cursor |
| valdi-cpp-runtime | framework-only | no | no |
| valdi-compiler | framework-only | no | no |

The project Codex adapter contains the 14 entries marked `yes`, preserving the official content
and test resources where bundled. The global Codex root contains the same 14 plus `valdi-expert`.

## Reference-main additions

The current reference registry contains additional client skills such as navigation, animations,
gestures, localization, error handling, preview, profile and mock workflows. They are documented
in `docs/valdi-reference/SOURCE_MANIFEST.json` but are not installed into this beta-pinned project
because their version availability was not established from the pinned release.

## Agent support

The Valdi CLI has adapters for Claude, Cursor, Copilot and a generic `.valdi/skills` adapter. It
does not expose a native Codex adapter. The Codex installation here is therefore an explicit
format adapter: official `skill.md` content was copied as `SKILL.md` into the active Codex skill
root and the project-local `.codex/skills/` tree. This distinction is recorded rather than
presented as native CLI support.
