# Project readiness

Status: **GO AVEC LIMITATIONS**

## CI execution model

The Windows host is used for source editing and optional local Android/ADB testing. Ubuntu WSL was
removed after setup because the Android build is now delegated to
`.github/workflows/valdi-android-build.yml`. That workflow installs the pinned Valdi CLI and Linux
Android dependencies, runs `valdi projectsync`, packages the Android APK, and uploads it as an
artifact. A GitHub Actions run is required before claiming that the remote Android build passes.

The official minimal Valdi application structure and agent/reference infrastructure are present.
Product development should wait until the build host/toolchain is moved to an officially supported
environment or Bazel/Java compatibility is resolved.

## Environment

Windows 11 Professional x64, PowerShell 7.6.5, Node.js 24.19.0, npm 11.17.0, Git 2.52.0,
Git LFS 3.7.1, Android SDK/ADB present, no Xcode, and no Bazel/Bazelisk recognized. See
[`ENVIRONMENT_AUDIT.md`](ENVIRONMENT_AUDIT.md) and the requirement-by-requirement
[`COMPLETION_AUDIT.md`](COMPLETION_AUDIT.md).

## Project

The official `ui_application` bootstrap generated `WORKSPACE`, `BUILD.bazel`, the root config
files, `modules/haycee_mobile_app_valdi/BUILD.bazel`, the generated `App.tsx`, and the resource
asset. The project is pinned to `beta-0.0.3` for Valdi and Valdi_Widgets.

## Reference and documentation

The official repository is available at `S:\valdi-official-reference` at commit
`f26bee4dc170b6c929f71d4dd07d44e033f47176`. The refresh script measured the documentation and API
index; see `docs/valdi-reference/COVERAGE_REPORT.md` and `SOURCE_MANIFEST.json`.

## Skills and agents

Fourteen official client skills are installed in `.codex/skills/` and the active user Codex skill
root, alongside the local `valdi-expert` skill. Specialized profiles are in `.codex/agents/`.
The CLI also installed the same official client skills for the detected Claude and Cursor config
directories. Framework-internal-only skills were inventoried but not installed for application work.

## Tests and checks

Run `pwsh -NoProfile -File scripts/valdi-api-self-test.ps1` to verify the searchable API evidence
and official client-skill installation, then run `pwsh -NoProfile -File scripts/valdi-validate.ps1`.
The latest validation run has 2 passes and 5 fail-or-blocked checks; non-zero checks remain
failures or environment blocks in the generated report. No iOS/macOS build is declared on this
Windows host. `.github/workflows/valdi-validation.yml` provides a static evidence CI gate only.

## Next action

Use a supported macOS or Linux build environment (or verify an approved WSL/remote setup), ensure
Bazel/Bazelisk and the Valdi-compatible Java toolchain are available, rerun the validation script,
then begin product work only inside the generated module structure.
