# Valdi toolchain ledger

Generated/maintained for this workspace on 2026-10-19 (Africa/Abidjan).

## Pinned project state

- Project migration: Valdi/Valdi_Widgets `beta-0.1.0`, using Bazel bzlmod.
- CI CLI: `@snap/valdi` **1.1.5** (pinned in `.github/workflows/valdi-android-build.yml`).
- Workstation CLI observed before migration: `@snap/valdi` **1.0.11**; migration commands were run with the pinned **1.1.5** through `npm exec`.
- Bootstrap type: official `ui_application` template.
- Project name: `haycee_mobile_app_valdi`.
- Valdi version in `MODULE.bazel`: `beta-0.1.0`.
- Valdi_Widgets version in `MODULE.bazel`: `beta-0.1.0`.
- Bazel version: `7.2.1` (`.bazelversion`).
- Official reference checkout: `S:\valdi-official-reference`.
- Reference commit: `f26bee4dc170b6c929f71d4dd07d44e033f47176`.

## Migration validation status

The repository configuration has been migrated from legacy `WORKSPACE` dependency declarations to
the official `MODULE.bazel` archive overrides and Valdi custom registry for both beta-0.1.0
releases. Existing Linux C++ sandbox settings, which address the project's prior Skia module-map
build failure, were retained. A narrow local patch aligns beta-0.1.0's `projectsync` declared
resource outputs with the paths its compiler actually generates; it mirrors the later official rule
behavior and is applied through Bzlmod without modifying the reference checkout. `valdi projectsync`
passed in CI and locally in WSL for the app and its 11 Valdi dependencies using CLI 1.1.5. The
local run analyzed 34,553 targets and completed in 60.584 seconds; the project hot-reload
launcher now runs that pinned CLI through `npm exec`, avoiding the older global CLI.

GitHub Actions runs completed setup and `valdi projectsync`. Android analysis successively found a
missing root `@android_mvn`, missing direct `@rules_kotlin` visibility, a Bazel 7 Android SDK
provider `ClassCastException`, and (run `40110507670`) an unresolved `@androidsdk` in
`rules_kotlin`. The app now pins the beta-0.1.0 registry's `rules_kotlin` 1.9.0 metadata in a small
app-owned registry overlay, retaining the official source archive and patches while adding the
hermetic SDK extension to the registry module metadata. This is needed because Bazel resolves
module extensions from registry `MODULE.bazel`, not from a patched archive copy. Run
`40111984208` then passed analysis and compiled 7,740 of 12,448 actions before failing: Bazel used
Java source level 11 for rules_android tools that contain Java `record` declarations. The pinned
Valdi beta-0.1.0 `.bazelrc` sets `tool_java_language_version=17` while keeping app source at 11; the
workspace now matches that setting. The user requested that active GitHub Actions builds be stopped
in favor of local builds. Runs `40114842078`, `40112200561`, and `40114849843` reached the
`cancelled` terminal state. No Android APK output has been confirmed for the migrated configuration.
The app module build was attempted twice. The first attempt was interrupted when `C:` fell to about 20 MiB free.
A retry limited to two Bazel jobs reached 1,863 of 5,182 actions before `C:` fell to about 1.3 GiB;
it was stopped to avoid exhausting the host disk. With user approval, `bazelisk clean` was run for
this workspace (without `--expunge`), removing compiled outputs while preserving downloaded
dependencies. Ubuntu's virtual disk still occupies about 66 GiB on `C:`; Windows denied
`Optimize-VHD` because this session lacks administrator rights, so the reclaimed guest space has
not yet been returned to the host. Do not claim the Android APK or module build passed until rerun
in CI or a Linux environment with adequate disk space and an Android SDK.

## Commands executed

| Command | Result |
|---|---|
| `valdi --help` | Passed; bootstrap, doctor, projectsync, lint, test and skills commands detected. |
| `valdi doctor --project --framework --json` | Executed in the bootstrapped workspace; 9 passed, 4 warnings, 5 failed. See `ENVIRONMENT_AUDIT.md`. |
| `valdi dev_setup` | Executed; CLI reported `Windows is not a supported operating system...aborting...` and did not install/configure dependencies. The CLI returned process code 0, so the message—not the code alone—is the evidence. |
| `valdi bootstrap -y -t ui_application -n haycee_mobile_app_valdi` | Official bootstrap executed. The CLI crashes while copying on volume `S:` (`0xC0000409`); the same official bootstrap completed file generation on `C:\Temp` and the generated files were copied into this workspace. Bazel verification remains blocked. |
| `valdi skills install --category=client` | Passed; 14 client skills installed for detected Claude/Cursor directories. |
| `valdi projectsync` | Passed locally in WSL with CLI 1.1.5 after applying the local Bzlmod compatibility patch; analyzed 34,553 targets and confirmed sync outputs for the app and 11 framework modules. |
| `bazelisk build --jobs=2 //modules/haycee_mobile_app_valdi:haycee_mobile_app_valdi` | Two attempts stopped for low host disk space; the last reached 1,863/5,182 actions with about 1.3 GiB free. Then ran targeted `bazelisk clean` (no `--expunge`); no success claimed. |
| Android arm64 app target | Run `40111984208` passed setup, `projectsync`, analysis and 7,740/12,448 actions, then failed because tool Java source level 11 could not compile Java records in rules_android. `.bazelrc` now uses tool Java 17. Subsequent runs were cancelled at the user's request. No APK verified. |
| `valdi lint check modules/haycee_mobile_app_valdi/src/App.tsx` | Pinned CLI 1.1.5 in WSL exited 1 after prompting to create a missing `.eslintrc`; no config was created. |
| `valdi test`, `valdi agent-check` | CLI 1.1.5 exposes both commands, and the module has a `:test` target. Not run because test/build actions may expand Bazel outputs while only about 5.1 GiB is free on `C:`. |

## Known limitations

- Windows is the current host. The official setup documentation provides macOS/Linux setup paths; no Windows support guarantee is inferred.
- Windows-native Bazel is not used; WSL Bazelisk 7.2.1 was used for `projectsync` and build attempts.
- The CLI doctor did not recognize Java/JAVA_HOME even though a Java 25 executable is present; Valdi's documented setup expects JDK 17/toolchain compatibility.
- Xcode and macOS are unavailable, so iOS/macOS builds are blocked and intentionally unclaimed.
- WSL Android SDK is present at `/home/darkk/Android/Sdk` (platforms 35/36, NDKs 25.2.9519653, 27.0.12077973, and 27.1.12297006). `scripts/start-valdi-hotreload.ps1` exports the build environment. No complete Valdi Android build or device install is claimed.
- At the 2026-10-24 audit, WSL's Bazel cache occupied about 25 GiB and Windows `C:` had about 5.1 GiB free. Because previous local Bazel builds nearly exhausted `C:`, do not start a full build until there is sufficient free host space; preserve the cache.
- WSL's VHDX needs offline compaction to return cleaned guest blocks to `C:`. `Optimize-VHD -Mode Quick` was attempted but Windows denied access without administrator rights.
- The CLI package contains Bazelisk 1.19.x and downloaded Bazel 7.2.1 to `S:\valdi-bazelisk-cache`; on Windows the CLI's POSIX `command -v` detection does not recognize it unless `BAZEL_BIN` is set explicitly. A direct Bazel startup then failed because the host ran out of disk space while loading the Java/native installation.
