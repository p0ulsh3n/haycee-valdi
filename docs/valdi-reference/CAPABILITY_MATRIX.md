# Valdi capability matrix

Reference commit: `f26bee4dc170b6c929f71d4dd07d44e033f47176`

| Capability | Evidence | Windows host | Android | iOS/macOS |
|---|---|---|---|---|
| TSX components and native template elements | `docs/api/api-reference-elements.md`, `docs/docs/core-component.md` | source index only | documented | documented; build blocked |
| Bazel module/app build | `docs/docs/workflow-bazel.md`, generated `WORKSPACE` | blocked: Bazel/Windows host | not run | not run |
| Official client skills | `ai-skills/registry.json`, `.codex/skills/` | installed | applicable | applicable |
| Android install/build | CLI `valdi install android` | blocked until Bazel/Java setup | device/emulator not established | n/a |
| iOS/macOS install/build | CLI and official setup docs | unavailable: no macOS/Xcode | n/a | blocked: no macOS/Xcode |
| CLI/web target | official CLI references and source | not assumed; verify target first | not a mobile runtime claim | not a mobile runtime claim |
