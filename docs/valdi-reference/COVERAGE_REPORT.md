# Valdi coverage report

Generated: 2026-10-20T00:05:55.7165371Z
Reference commit: `f26bee4dc170b6c929f71d4dd07d44e033f47176`

- Repository files excluding .git: **7721**
- Documentation files discovered and read: **164**
- Unreadable files: **0**
- Source files indexed: **3619**
- API evidence entries: **11836**
- Official skill registry entries: **28**
- Official client skills installed in project Codex adapter: **14**
- Official client skills installed in global Codex adapter: **14**

## Interpretation

The documentation inventory is exhaustive for Markdown files under `docs/`, `ai-skills/`, and the selected root guidance files at this checkout. The API index is a reproducible evidence index of public documentation headings, imports, exported TypeScript declarations and imports from selected public source roots; it is not a claim of complete semantic or private-runtime coverage.

## Omissions and limits

- Native behavior requiring macOS/Xcode, a configured Android toolchain, a device or an emulator was not executed on this Windows host.
- The application remains pinned to the CLI bootstrap release tags; the reference checkout is `main` and its commit is recorded above, so newer main-only APIs must not be assumed available.
- Framework-internal contributor skills are inventoried but intentionally not installed into the application agent profile.

