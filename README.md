# haycee_mobile_app_valdi

Minimal official Valdi UI application bootstrap. This repository contains setup and agent
infrastructure only; no product features have been added.

## Readiness

See [`docs/setup/PROJECT_READINESS.md`](docs/setup/PROJECT_READINESS.md) for the current status.
The current host is Windows and is marked **GO AVEC LIMITATIONS** because the official CLI setup
does not support Windows. Android packaging is delegated to GitHub Actions.

## Android CI

`.github/workflows/valdi-android-build.yml` runs on every push, pull request, or manual dispatch.
It installs the pinned Valdi CLI, prepares the Linux Android toolchain, synchronizes the workspace,
builds the Android APK, and uploads it as a workflow artifact. WSL is not required on the Windows
development machine.

Windows remains useful for editing and local ADB/device testing. GitHub Actions builds the APK;
hot reload still requires a local Valdi runtime connected to an Android device or emulator.

## Verified workflow

```powershell
pwsh -NoProfile -File scripts/valdi-environment-audit.ps1
pwsh -NoProfile -File scripts/refresh-valdi-reference.ps1
pwsh -NoProfile -File scripts/valdi-validate.ps1
```

The official source checkout is kept separately at `S:\valdi-official-reference`; its commit and
measured inventories are recorded under `docs/valdi-reference/`.

## Usage

All commands require `valdi` to be available on PATH.

Get auto completion in VSCode
```sh
valdi projectsync
```

Build and install iOS:
```sh
valdi install ios
```

Build and install Android:
```sh
valdi install android
```

Build and install MacOS:
```sh
valdi install macos
```

Start hot reloader:
```sh
valdi hotreload
```
