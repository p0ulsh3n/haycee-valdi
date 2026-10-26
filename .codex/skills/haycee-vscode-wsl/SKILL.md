---
name: haycee-vscode-wsl
description: Set up or troubleshoot VS Code for this Valdi repository on Windows with Ubuntu WSL, especially TypeScript/TSX diagnostics caused by Bazel-generated paths.
---

# Haycee Valdi in VS Code + WSL

Use this skill when configuring VS Code for this repository on Windows/WSL, when many files show red TypeScript diagnostics despite a successful Valdi build, or when project synchronization does not update editor bindings.

## Key distinction

Valdi compilation and VS Code's TypeScript language server are separate checks. This repository's generated `modules/haycee_mobile_app_valdi/tsconfig.json` extends Valdi-generated configuration and resolves module bindings through Bazel output symlinks. In this setup, those symlinks can point into the WSL filesystem; a TypeScript server running as a Windows process may not resolve them. Do not assume every red underline is harmless: inspect its diagnostic after the editor is attached to WSL.

## Workflow

1. Keep source on the shared Windows drive if that is the existing checkout. Open a WSL terminal in the repository root (convert the actual Windows checkout path with `wslpath -u` when needed).
2. Confirm the VS Code **WSL** extension (`ms-vscode-remote.remote-wsl`) is installed. From the repository root in the intended distro, run `code .`; use the window whose remote indicator shows `WSL: <distro>`. Do not use a second Windows-local window for Valdi TSX diagnostics.
3. Run `valdi projectsync` from the repository root inside the same Linux distro that owns the Bazel workspace. The pinned CLI documents this as synchronizing VS Code bindings/project files; it regenerates module `tsconfig.json` paths. Never permanently hand-edit generated module tsconfig files to repair Bazel paths.
4. In the WSL VS Code window, run **TypeScript: Restart TS Server**. If diagnostics remain, inspect the **Problems** entry and **TypeScript** output channel. Fix genuine compiler errors rather than suppressing them.

For a fresh WSL environment, follow `.codex/skills/valdi-setup/SKILL.md` and the pinned CLI workflow before running `projectsync`. The CI workflow pins `@snap/valdi` to `1.1.5`; install/use that same CLI in WSL, run `valdi dev_setup`, and verify with `valdi doctor`. This repo's Linux scripts add `$HOME/.valdi/bin` to `PATH` because that is where Valdi's setup places Bazelisk. A Windows-installed CLI alone does not make Bazel available to WSL.

## Repository-specific checks

- The Valdi module is `modules/haycee_mobile_app_valdi`; its generated editor config is `modules/haycee_mobile_app_valdi/tsconfig.json`.
- Bazel output links (`bazel-*`, `bazel-out`) are generated and machine-local. Check the actual link names/targets in the current checkout instead of assuming underscores, hyphens, drive letters, distro names, or usernames.
- If a config extends a missing file or a generated import is unresolved, rerun `valdi projectsync` in WSL first. Do not commit generated `tsconfig.json` changes unless the repository intentionally starts tracking that file.
- A successful Valdi build confirms the Valdi compiler's result; it does not prove the VS Code language server is configured correctly. Conversely, stale editor diagnostics are not proof of a failed native build.

## Source of truth

The pinned official repository and commit are recorded in `docs/valdi-reference/SOURCE_MANIFEST.json`. Resolve that reference checkout on the current machine, then consult `docs/docs/command-line-references.md` and `npm_modules/cli/src/commands/projectsync.ts`. Keep the Valdi versions aligned with `MODULE.bazel`.
