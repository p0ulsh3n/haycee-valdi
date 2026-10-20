# Valdi toolchain ledger

Generated/maintained for this workspace on 2026-10-19 (Africa/Abidjan).

## Pinned project state

- CLI installed: `@snap/valdi` **1.0.11** (`valdi --version`).
- Bootstrap type: official `ui_application` template.
- Project name: `haycee_mobile_app_valdi`.
- Valdi import in `WORKSPACE`: `beta-0.0.3`.
- Valdi_Widgets import in `WORKSPACE`: `beta-0.0.3`.
- Official reference checkout: `S:\valdi-official-reference`.
- Reference commit: `f26bee4dc170b6c929f71d4dd07d44e033f47176`.

## Commands executed

| Command | Result |
|---|---|
| `valdi --help` | Passed; bootstrap, doctor, projectsync, lint, test and skills commands detected. |
| `valdi doctor --project --framework --json` | Executed in the bootstrapped workspace; 9 passed, 4 warnings, 5 failed. See `ENVIRONMENT_AUDIT.md`. |
| `valdi dev_setup` | Executed; CLI reported `Windows is not a supported operating system...aborting...` and did not install/configure dependencies. The CLI returned process code 0, so the message—not the code alone—is the evidence. |
| `valdi bootstrap -y -t ui_application -n haycee_mobile_app_valdi` | Official bootstrap executed. The CLI crashes while copying on volume `S:` (`0xC0000409`); the same official bootstrap completed file generation on `C:\Temp` and the generated files were copied into this workspace. Bazel verification remains blocked. |
| `valdi skills install --category=client` | Passed; 14 client skills installed for detected Claude/Cursor directories. |
| `valdi projectsync` | Not yet successful; Bazel is not available. |
| `valdi lint`, `valdi test`, `valdi agent-check` | Validation script recorded lint as blocked by missing recognized ESLint config, test as Bazel-blocked, and agent-check as unavailable in CLI 1.0.11. |

## Known limitations

- Windows is the current host. The official setup documentation provides macOS/Linux setup paths; no Windows support guarantee is inferred.
- Bazel/Bazelisk was not found on `PATH`, so bootstrap verification and Bazel targets cannot be claimed successful.
- The CLI doctor did not recognize Java/JAVA_HOME even though a Java 25 executable is present; Valdi's documented setup expects JDK 17/toolchain compatibility.
- Xcode and macOS are unavailable, so iOS/macOS builds are blocked and intentionally unclaimed.
- An Android SDK is present, but no complete Valdi Android build or device install is claimed.
- The CLI package contains Bazelisk 1.19.x and downloaded Bazel 7.2.1 to `S:\valdi-bazelisk-cache`; on Windows the CLI's POSIX `command -v` detection does not recognize it unless `BAZEL_BIN` is set explicitly. A direct Bazel startup then failed because the host ran out of disk space while loading the Java/native installation.
