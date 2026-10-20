# Agent/API self-test

Reference commit: `f26bee4dc170b6c929f71d4dd07d44e033f47176`
API entries searched: **11836**

| Check | Status | Hits | Evidence |
|---|---|---:|---|
| Stateful component API | pass | 5 | docs/docs/glossary.md:154; docs/docs/migrate-from-flutter.md:96; src/valdi_modules/src/valdi/valdi_core/src/Component.ts:184 |
| Native template import | pass | 114 | docs/api/api-quick-reference.md:532; docs/api/api-style-attributes.md:54; docs/api/api-style-attributes.md:426 |
| Bazel module rule | pass | 2176 | docs/docs/stdlib-filesystem.md:175; src/valdi_modules/src/valdi/bridge_observables/src/types/BridgeError.d.ts:8; src/valdi_modules/src/valdi/bridge_observables/src/types/BridgeObservable.ts:11 |
| Cancelable async API | pass | 18 | docs/docs/stdlib-http.md:67; docs/docs/stdlib-http.md:78; docs/docs/stdlib-http.md:91 |
| Navigation API evidence | pass | 6 | docs/docs/migrate-from-flutter.md:325; docs/docs/start-from-react.md:350; src/valdi_modules/src/valdi/valdi_navigation/src/NavigationRoot.tsx:8 |
| Project external imports indexed | pass | 9 |  |
| Official client skills present | pass | 14 | installed=14; cli_bundle=14; main_registry=26 |

This test verifies searchability and source pointers; it does not replace a platform build or runtime test.
