# Haycee Valdi development environment (Windows, WSL2, and Linux)

This guide records the toolchain required to edit, build, install, and hot-reload this repository's Android app, using the versions and scripts currently pinned in the repository.

## Current pinned versions

| Tool or framework | Version used by this repository | Source of truth |
|---|---:|---|
| Valdi CLI | `@snap/valdi@1.1.5` | `scripts/valdi-hotreload.sh`, `scripts/start-valdi-hotreload.ps1`, `.github/workflows/valdi-android-build.yml` |
| Valdi framework | `beta-0.2.1` | `MODULE.bazel` |
| Valdi Widgets | `beta-0.2.1` | `MODULE.bazel` |
| Bazel | `8.2.1` (selected by Bazelisk) | `.bazelversion` |
| Java | JDK 17 | local launcher sets `JAVA_HOME`; CI uses Java 17 for Bazel tools |
| Node.js | `22.x` recommended and used by CI; Valdi CLI requires Node 18 or later | `.github/workflows/valdi-android-build.yml`, official Valdi install guide |
| Android ABI built for local device refresh | `arm64-v8a` | `scripts/start-valdi-hotreload.ps1` |
| Local helper NDK path | `25.2.9519653` | `scripts/start-valdi-hotreload.ps1`, `scripts/valdi-hotreload.sh` |

On the current WSL workstation, SDK platforms `android-35` and `android-36`, build-tools `34.0.0`, `35.0.0`, `36.0.0`, and NDKs `25.2.9519653`, `27.0.12077973`, and `27.1.12297006` are present. This is a workstation inventory, not a list of required parallel versions; the helper explicitly selects NDK `25.2.9519653`.

The current WSL workstation was observed with Node `18.19.1`; npm reported an engine warning for a dependency requiring Node `20` or `22+`. For a new setup, use Node `22.x` to match CI and avoid that warning. The scripts pin the Valdi CLI version independently of any global Valdi installation.

## Which machine runs what

### Windows host with Ubuntu WSL2

Windows runs PowerShell, Windows ADB, Python for the relay, and optionally VS Code. Ubuntu WSL runs Node/npm, the Valdi CLI, Bazelisk, Java, and the Linux build tools. The APK build itself runs inside WSL; Windows-native Bazel is not used.

For VS Code diagnostics, install the **WSL** extension and open the repository from a WSL terminal with `code .`. Run `valdi projectsync` in that same WSL distribution. Windows-local TypeScript language services may not resolve Bazel-generated Linux paths correctly.

### Linux host

Linux can run the same Valdi CLI and Bazel build directly. Use the host's native Android `adb` and ensure the Android device is authorized. The Windows PowerShell launcher and its WSL-to-Windows TCP relay are Windows-specific; on Linux, start Valdi hot reload directly from the repository root.

Windows is a development host here, not a Valdi build target. Building iOS or macOS apps requires a supported macOS/Xcode environment.

## Windows and WSL2 setup

### 1. Install or verify WSL2 and Ubuntu

In an elevated PowerShell window, if WSL is not already installed:

```powershell
wsl.exe --install --distribution Ubuntu-24.04
```

Complete Ubuntu's first-run user setup, then verify the distro is WSL2:

```powershell
wsl.exe --list --verbose
```

The repository helper defaults to the distro name `Ubuntu-24.04`.

### 2. Install Windows-side tools

- Windows PowerShell (`powershell.exe` is sufficient for the checked-in launcher).
- Python 3 available as `python.exe` in `PATH`; the helper uses it for the TCP relay.
- [Android SDK Platform Tools for Windows](https://developer.android.com/tools/releases/platform-tools), with `adb.exe` in `PATH` or at `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`.
- Optional: VS Code and the Microsoft **WSL** extension.

Enable Developer options and USB debugging on the Android phone, connect it by USB, accept its RSA authorization prompt, then verify from PowerShell:

```powershell
adb.exe devices
```

The device must show state `device`, not `unauthorized` or `offline`.

### 3. Install Linux-side tools inside Ubuntu

Open Ubuntu (not a Windows-only terminal) and install the base packages documented by Valdi, plus the shared-library package needed by the current Linux Swift toolchain:

```bash
sudo apt-get update
sudo apt-get install -y npm openjdk-17-jdk watchman adb libfontconfig1-dev zlib1g-dev libncurses6
```

Install Node.js `22.x` **inside Ubuntu** using an approved Node version manager or the official Node.js Linux distribution. Confirm `node --version` prints `v22.x` and `npm --version` succeeds. Do not rely on Windows Node being on WSL's PATH.

Install the pinned Valdi CLI and let it configure Linux dependencies and Bazelisk:

```bash
npm install --global @snap/valdi@1.1.5
valdi dev_setup
```

`valdi dev_setup` may request `sudo`, installs JDK 17/Watchman/ADB and build libraries as needed, downloads Bazelisk into `~/.valdi/bin`, and updates the shell profile. Restart the shell or load the profile after setup.

Set/verify the expected Java and Bazelisk paths:

```bash
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
export PATH="$HOME/.valdi/bin:$PATH"
java -version
valdi --version
bazelisk --version
valdi doctor
```

`bazelisk --version` should report Bazel `8.2.1`, selected from this checkout's `.bazelversion`.

### 4. Android SDK and NDK

Valdi's official Linux setup says a manual Android SDK/NDK installation is not required for Bazel builds: Bazel fetches the toolchains it needs. ADB is still required to install and debug on a phone.

The checked-in Windows/WSL launcher additionally exports these workstation paths:

```text
ANDROID_HOME=/home/<linux-user>/Android/Sdk
ANDROID_SDK_ROOT=/home/<linux-user>/Android/Sdk
ANDROID_NDK_HOME=/home/<linux-user>/Android/Sdk/ndk/25.2.9519653
```

The helper also exposes Windows `adb.exe` to WSL through `/tmp/adb`. On the machine where the script is used, either install the SDK/NDK at the configured paths or update the helper paths consistently. Do not copy another developer's `/home/...`, Windows username, drive letter, or SDK path blindly.

## Prepare this checkout

Run all Valdi and Bazel commands from the repository root, inside the Linux environment that owns the Bazel workspace. For this workstation the Windows checkout is `S:\haycee-mobile-app-valdi`, mounted in WSL as `/mnt/s/haycee-mobile-app-valdi`.

```bash
cd /mnt/s/haycee-mobile-app-valdi
valdi doctor
valdi projectsync
```

For a checkout at another path, use `wslpath -u '<Windows checkout path>'` or the native Linux path and adjust the Windows launcher constants. `scripts/start-valdi-hotreload.ps1` currently assumes `S:`, `/mnt/s/haycee-mobile-app-valdi`, the distro `Ubuntu-24.04`, and the Android SDK/NDK paths above.

## Build the Android arm64 APK

The Windows helper's `-RefreshApk` mode is the recommended local build/install route when using this workstation setup:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "S:\haycee-mobile-app-valdi\scripts\start-valdi-hotreload.ps1" -RefreshApk
```

It builds `//:haycee_mobile_app_valdi_app_android` for `arm64-v8a`, copies the APK to the Windows temp directory, installs/updates it on the selected ADB device, then starts the hot-reload daemon. Keep the PowerShell window open while hot reload is in use; Ctrl+C stops it.

For a Linux-native build, from the repository root:

```bash
"$HOME/.valdi/bin/bazelisk" build //:haycee_mobile_app_valdi_app_android \
  --snap_flavor=platform_development \
  --copt=-DANDROID_WITH_JNI \
  --repo_env=VALDI_PLATFORM_DEPENDENCIES=android \
  --define=client_repo_arm64=true \
  --define=client_repo_arm32=false \
  --define=client_repo_x86_64=false \
  --android_platforms=@snap_platforms//os:android_arm64 \
  --fat_apk_cpu=arm64-v8a \
  --android_cpu=arm64-v8a
```

The expected output is `bazel-bin/haycee_mobile_app_valdi_app_android.apk`. This device-specific build intentionally excludes ARMv7 and x86_64 ABIs.

### Why Swift appears in an Android build

Bazel also builds tools that run on the build host. Valdi's `local_valdi_compiler` is one such host tool and contains Swift modules; log entries marked `[for tool]` mean “compiled for Ubuntu so the build can run this tool,” not “compiled into an iOS app.” The app target remains Android arm64, and the resulting artifact is an APK.

## Hot reload without rebuilding the APK

After the debug APK is installed, ordinary TS/TSX edits are served by Valdi hot reload. For this repository, the Windows helper starts the debug target and maintains the ADB/WSL TCP relays:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "S:\haycee-mobile-app-valdi\scripts\start-valdi-hotreload.ps1"
```

The script selects a connected device automatically (the first ready device if several are attached). It clears stale project-specific Valdi workers and enforces a single running launcher instance. Keep one launcher window open; do not start a second copy. If multiple devices are attached, specify one:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "S:\haycee-mobile-app-valdi\scripts\start-valdi-hotreload.ps1" -DeviceId "<adb-serial>"
```

Run `adb.exe devices` first if discovery fails. Use `-RefreshApk` after native Android/resource/Bazel changes or if the app is not installed. `-ResetHotReloadCache` is available for a stale Valdi TypeScript hot-reload cache; it is not a Bazel cache cleanup. A normal TS/TSX hot-reload iteration does not require reinstalling the APK.

On Linux with a device visible to native ADB, run:

```bash
valdi hotreload --debug --target //:haycee_mobile_app_valdi_app_hotreload
```

## Disk use, caches, and slow first builds

- Bazel stores downloads and build outputs under the Linux user's cache (normally `~/.cache/bazel`) inside Ubuntu's virtual disk. On a Windows/WSL setup, that virtual disk consumes host disk space, commonly on `C:`.
- The first build after installing/updating toolchains can take a long time while Bazel downloads and compiles dependencies. Later builds reuse the action cache when versions, flags, and inputs are unchanged.
- Keep the cache between builds. Do not run `bazel clean`, `bazel clean --expunge`, or delete Bazel cache directories just to address a slow build or a single failed action.
- Check both Linux free space (`df -h /`) and Windows host free space before a cold build. Leave enough space for Bazel outputs and the APK; do not start a build when the host disk is nearly full.
- If a build fails, diagnose the first compiler/linker error. Later messages such as `checking cached actions`, missing APK copy, or install failure may be consequences of that first error.

## Known Linux runtime compatibility packages

The Linux Swift toolchain used by the current Valdi compiler needs `libncurses.so.6`; on Ubuntu 24.04 this is supplied by `libncurses6`. The first local build failed at Swift startup when this shared library was absent. Verify it with:

```bash
ldconfig -p | grep 'libncurses.so.6'
```

The GitHub Actions workflow separately checks/provides `libtinfo.so.5` for its LLVM compatibility path. `libtinfo.so.5` and `libncurses.so.6` are different shared libraries; keep the CI workflow's compatibility step when changing the runner/toolchain.

The official Valdi `.bazelrc` also disables Clang's `nullability-extension` warning for both target and host C++ compilation. This repository mirrors those `-Wno-nullability-extension` flags because upstream Abseil headers use `_Nullable`, `_Nonnull`, and `_Null_unspecified`, and the toolchain treats warnings as errors.

## Version checks before asking for help

Run these from the intended environment and include the output with the **first** error from the build:

```bash
cat /etc/os-release
node --version
npm --version
java -version
valdi --version
"$HOME/.valdi/bin/bazelisk" --version
ldconfig -p | grep -E 'libncurses\.so\.6|libtinfo\.so\.5' || true
df -h /
```

For Windows/WSL device issues, also include `wsl.exe --list --verbose` and `adb.exe devices`.

## References

- Pinned framework versions: [`MODULE.bazel`](../../MODULE.bazel)
- Bazel version: [`.bazelversion`](../../.bazelversion)
- Android CI build and Linux compatibility setup: [`.github/workflows/valdi-android-build.yml`](../../.github/workflows/valdi-android-build.yml)
- Windows/WSL device and hot-reload launcher: [`scripts/start-valdi-hotreload.ps1`](../../scripts/start-valdi-hotreload.ps1)
- WSL hot-reload command: [`scripts/valdi-hotreload.sh`](../../scripts/valdi-hotreload.sh)
- Valdi official setup docs for the pinned reference checkout: [installation guide](https://github.com/Snapchat/Valdi/blob/beta-0.2.1/docs/INSTALL.md), [Linux setup](https://github.com/Snapchat/Valdi/blob/beta-0.2.1/docs/setup/linux_setup.md)
