# Project readiness

Status: **GO AVEC LIMITATIONS**

## CI execution model

The Windows host is used for source editing and optional local Android/ADB testing. Ubuntu WSL
24.04 is also present on the current workstation and has a Linux Android SDK, Bazelisk, and a
25 GiB Bazel cache; this does not by itself establish official Windows/WSL build support. Keep
VS Code attached to WSL when resolving Bazel-generated module paths. See
`.codex/skills/haycee-vscode-wsl/SKILL.md` and
`.codex/skills/haycee-valdi-build/SKILL.md` for the shared workflow. The GitHub Actions workflow
`.github/workflows/valdi-android-build.yml` installs the pinned Valdi CLI and Linux Android
dependencies, runs `valdi projectsync`, builds an arm64 Android APK, and uploads it as an artifact.
The user requested cancellation of active Android runs while switching to local builds. Runs
`40114849843`, `40114842078`, and `40112200561` are confirmed cancelled. No successful Android
artifact has been verified yet.

The official minimal Valdi application structure and agent/reference infrastructure are present.
The repository dependency configuration has been migrated to Valdi/Valdi_Widgets `beta-0.1.0`
using bzlmod. Do not treat the migration as fully build-verified until the pinned CLI 1.1.5
`projectsync` and Android build complete successfully.

## Environment

Windows 11 Professional x64, PowerShell 7.6.5, Node.js 24.19.0, npm 11.17.0, Git 2.52.0,
Git LFS 3.7.1, Android SDK/ADB present, no Xcode, and no Bazel/Bazelisk recognized on the Windows
host. WSL currently has Valdi CLI 1.0.11 on PATH, Bazelisk 1.26.0 selecting Bazel 7.2.1, a local
Android SDK, and about 25 GiB in `~/.cache/bazel`. At the latest check `C:` had about 5.1 GiB free;
previous local builds exhausted most of the available host space, so a full local build is still
pending. See
[`ENVIRONMENT_AUDIT.md`](ENVIRONMENT_AUDIT.md) and the requirement-by-requirement
[`COMPLETION_AUDIT.md`](COMPLETION_AUDIT.md).

## Project

The official `ui_application` bootstrap originally generated the project structure with
`WORKSPACE` and Valdi/Valdi_Widgets `beta-0.0.3`. The repository has since been migrated to the
official bzlmod layout: `MODULE.bazel` pins both dependencies to `beta-0.1.0`, `.bazelrc` points
to the matching Valdi custom registry, and the obsolete root `WORKSPACE` was removed. The Android
build and editor synchronization still require post-migration validation.

## Reference and documentation

The official repository is available at `S:\valdi-official-reference` at commit
`f26bee4dc170b6c929f71d4dd07d44e033f47176`. The refresh script measured the documentation and API
index; see `docs/valdi-reference/COVERAGE_REPORT.md` and `SOURCE_MANIFEST.json`.

## Skills and agents

Fourteen official client skills are installed in `.codex/skills/` and the active user Codex skill
root, alongside local `valdi-expert`, `haycee-vscode-wsl`, and `haycee-valdi-build` skills.
Specialized profiles are in `.codex/agents/`.
The CLI also installed the same official client skills for the detected Claude and Cursor config
directories. Framework-internal-only skills were inventoried but not installed for application work.

## Tests and checks

Run `pwsh -NoProfile -File scripts/valdi-api-self-test.ps1` to verify the searchable API evidence
and official client-skill installation, then run `pwsh -NoProfile -File scripts/valdi-validate.ps1`.
With CLI 1.1.5, beta-0.1.0 `valdi projectsync` passed locally in WSL on 2026-10-24 after a local
Bzlmod patch corrected the resource output paths declared by the pinned rule. The Linux Android
SDK is installed in WSL; the local hot-reload script exports its SDK/JDK paths for builds. A
separate app-module build was interrupted at 2,824 of 5,182 actions when free space on `C:` fell to
about 20 MiB; no Bazel cache was deleted. Therefore, dependency resolution and projectsync are
verified locally, while the Android app build is not yet verified.
The API/agent self-test passed 7/7 checks locally on 2026-10-24. The previously generated general
validation report still has 2 passes and 5 fail-or-blocked checks; it has not been regenerated with
the migrated CLI. The current migration run confirms that projectsync passes, but the module build
is not yet complete: a two-job retry was stopped at 1,863/5,182
actions when C: had about 1.3 GiB free. A targeted Bazel clean was then run with user approval;
Windows denied offline VHDX compaction without administrator rights. GitHub Actions runs through
`40111984208` passed dependency setup, `valdi projectsync`, and Android analysis, then reached
7,740/12,448 build actions before Javac rejected Java `record` declarations under tool source level
11. The app pins Valdi beta-0.1.0's rules_kotlin 1.9.0 and supplies an app-owned registry overlay
with the hermetic SDK extension in module metadata. `.bazelrc` now matches the pinned Valdi tool
source level 17 while retaining app source level 11. All active Android runs were cancelled at the
user's request. No local Android app build has been verified, so APK output remains unverified. No
iOS/macOS build is declared on this Windows host.
`.github/workflows/valdi-validation.yml` provides a static evidence CI gate only.

## Next action

Run the pinned CLI 1.1.5 workflow and the arm64 Android target locally after confirming sufficient
free space on `C:`. Preserve the existing Bazel cache; do not clean it to make room. Record the
result before claiming that the migration is fully build-verified.
