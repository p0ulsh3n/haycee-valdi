---
name: haycee-valdi-build
description: Build, test, validate, or retrieve the Android arm64 artifact for the Haycee Valdi application using this repository's actual Bazel targets and scripts.
---

# Haycee Valdi build and validation

Use this skill for module builds, Android APK builds, Valdi tests, hot-reload APK refreshes, or CI build failures in this repository. Also read `valdi-bazel` or `valdi-testing` for framework-wide rules; this skill supplies Haycee-specific targets and host workflow.

## Host and toolchain

- The Windows checkout may be built by GitHub Actions on Ubuntu. For local Linux/WSL builds, run Bazel and Valdi commands inside the Linux environment that owns the Bazel workspace, from the repository root.
- Check the distro, repository mount, JDK, Android SDK/NDK, Valdi CLI, and Bazelisk before building. Do not assume another contributor uses this machine's `S:` drive, `/mnt/s`, `Ubuntu-24.04`, `/home/darkk`, Android SDK path, or environment variables.
- If `valdi` or `bazelisk` is missing, follow the pinned `valdi-setup` workflow and `valdi doctor`; do not work around it by editing generated files or invoking a Windows CLI that cannot see Linux Bazel.
- The repository's Android GitHub workflow is `.github/workflows/valdi-android-build.yml`; inspect it before changing CI flags. It builds and uploads an arm64 APK. A CI artifact is not evidence that a local WSL build or device install has been tested.

## Useful repository targets

From the Linux repository root, after setup and `valdi projectsync`:

```bash
# Compile just the application Valdi module (fastest focused compiler check)
bazelisk build //modules/haycee_mobile_app_valdi:haycee_mobile_app_valdi

# Run module tests, if/when the module has test targets
valdi test --module haycee_mobile_app_valdi
```

The Android application target is `//:haycee_mobile_app_valdi_app_android`. The current Windows helper `scripts/start-valdi-hotreload.ps1 -RefreshApk` builds the development APK for arm64, installs/updates it on the selected ADB device, then starts the hot-reload process. It is a build-and-install workflow, not a build-only command. Inspect its parameters and environment before reusing it on another workstation; its current paths and Android environment reflect the configured Windows/WSL machine.

For the exact arm64 Bazel flags, use `.github/workflows/valdi-android-build.yml` for CI or `scripts/start-valdi-hotreload.ps1` for local device refresh. Keep flags consistent with those files; do not accidentally enable unused ABIs for a device-specific build.

## Validation and failure handling

- `pwsh -NoProfile -File scripts/valdi-validate.ps1` runs the repository's checks and writes `docs/setup/VALIDATION_RESULTS.{md,json}`. Report each pass, failure, and environment block accurately; these generated reports are not a substitute for a platform build.
- Preserve the Bazel cache. Do not run `bazel clean`, `clean --expunge`, or delete cache directories as a routine response to a slow build or one failed action. Diagnose the first failing action and compare the full Bazel command/configuration first.
- When a build fails, keep the first compiler/linker error and the exact target/flags. A later APK install message does not mean the build succeeded.
- When changing `.bazelrc` or platform compiler flags, verify the narrow module build and the relevant Android target where the toolchain permits. Report unavailable WSL/Bazel/SDK/JDK prerequisites instead of claiming success.
- For a new contributor, prefer the documented CI workflow when the local toolchain is not installed; do not claim Windows is an officially supported Valdi build host.
