# Project readiness

Status: **GO AVEC LIMITATIONS**

## CI execution model

The Windows host is used for source editing and optional local Android/ADB testing. Ubuntu WSL
24.04 is also present on the current workstation and can host the VS Code Valdi language server
and local Linux tools; this does not by itself establish official Windows/WSL build support. Keep
VS Code attached to WSL when resolving Bazel-generated module paths. See
`.codex/skills/haycee-vscode-wsl/SKILL.md` and
`.codex/skills/haycee-valdi-build/SKILL.md` for the shared workflow. GitHub Actions remains the
reproducible Android build path: `.github/workflows/valdi-android-build.yml` installs the pinned
Valdi CLI and Linux Android dependencies, runs `valdi projectsync`, builds an arm64 Android APK,
and uploads it as an artifact. A successful workflow run is required before claiming that the
remote Android build passes.

The official minimal Valdi application structure and agent/reference infrastructure are present.
The repository dependency configuration has been migrated to Valdi/Valdi_Widgets `beta-0.1.0`
using bzlmod. Do not treat the migration as fully build-verified until the pinned CLI 1.1.5
`projectsync` and Android build complete successfully.

## Environment

Windows 11 Professional x64, PowerShell 7.6.5, Node.js 24.19.0, npm 11.17.0, Git 2.52.0,
Git LFS 3.7.1, Android SDK/ADB present, no Xcode, and no Bazel/Bazelisk recognized on the Windows
host. WSL has a separate toolchain/PATH and must be audited independently. See
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
With CLI 1.1.5, beta-0.1.0 `valdi projectsync` passed after a local Bzlmod patch corrected the
resource output paths declared by the pinned rule. The Android APK build is still blocked because
WSL has no Linux Android SDK configured. A separate app-module build was interrupted at 2,824 of
5,182 actions when free space on `C:` fell to about 20 MiB; no Bazel cache was deleted. Therefore,
the dependency and projectsync migration is verified, while the migration is not yet fully
build-verified.
The previously generated validation report still has 2 passes and 5 fail-or-blocked checks; it has
not been regenerated with the migrated CLI. The current migration run confirms that projectsync
passes, but the module build is not yet complete: a two-job retry was stopped at 1,863/5,182
actions when C: had about 1.3 GiB free. A targeted Bazel clean was then run with user approval;
Windows denied offline VHDX compaction without administrator rights. GitHub Actions runs through
`40111984208` passed dependency setup, `valdi projectsync`, and Android analysis, then reached
7,740/12,448 build actions before Javac rejected Java `record` declarations under tool source level
11. The app pins Valdi beta-0.1.0's rules_kotlin 1.9.0 and supplies an app-owned registry overlay
with the hermetic SDK extension in module metadata. `.bazelrc` now matches the pinned Valdi tool
source level 17 while retaining app source level 11. The next CI run must verify the APK; it remains
unverified. No iOS/macOS build is declared on this Windows host.
`.github/workflows/valdi-validation.yml` provides a static evidence CI gate only.

## Next action

Use a supported macOS or Linux build environment (or verify an approved WSL/remote setup), ensure
Bazel/Bazelisk and the Valdi-compatible Java toolchain are available, rerun the validation script,
then begin product work only inside the generated module structure.
