#!/usr/bin/env bash
set -euo pipefail

export PATH=/tmp:/home/darkk/.valdi/bin:/usr/local/bin:/usr/bin:/bin
export ANDROID_HOME=/home/darkk/Android/Sdk
export ANDROID_SDK_ROOT=/home/darkk/Android/Sdk
export ANDROID_NDK_HOME=/home/darkk/Android/Sdk/ndk/25.2.9519653
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

windows_user="${1:-darkk}"
ln -sf "/mnt/c/Users/${windows_user}/AppData/Local/Android/Sdk/platform-tools/adb.exe" /tmp/adb

stop_marker='/tmp/haycee-mobile-app-valdi-hotreload.stop'
rm -f "$stop_marker"
on_interrupt() {
  touch "$stop_marker"
  exit 130
}
trap on_interrupt INT

cd /mnt/s/haycee-mobile-app-valdi
exec npm exec --yes --package=@snap/valdi@1.1.5 -- valdi hotreload --debug --target //:haycee_mobile_app_valdi_app_hotreload
