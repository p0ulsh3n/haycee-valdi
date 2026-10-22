#!/usr/bin/env bash
set -u

project_root="${1:-/mnt/s/haycee-mobile-app-valdi}"
target='//:haycee_mobile_app_valdi_app_hotreload'
project_marker='haycee_mobile_app_valdi'
rm -f /tmp/haycee-mobile-app-valdi-hotreload.stop

find_hot_reload_pids() {
  ps -eo pid=,args= | awk -v target="$target" -v marker="$project_marker" '
    ($0 ~ /node \/usr\/local\/bin\/valdi hotreload/ && index($0, target)) ||
    ($0 ~ /bazelisk .*build/ && index($0, target)) ||
    ($0 ~ /\/bazel .*build/ && index($0, target)) ||
    ($0 ~ /run_hotreloader\.sh/ && index($0, marker)) ||
    ($0 ~ /valdi_compiler/ && $0 ~ /--monitor/ && index($0, marker)) ||
    ($0 ~ /ts_bin_wrapper/ && index($0, marker)) ||
    ($0 ~ /compiler\/companion/ && index($0, marker)) ||
    ($0 ~ /dev-tcp-relay\.py/ && index($0, marker)) {
      print $1
    }
  '
}

terminate_matching_processes() {
  local signal="$1"
  local pids
  pids="$(find_hot_reload_pids)"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill "-$signal" $pids 2>/dev/null || true
  fi
}

stale_pids="$(find_hot_reload_pids)"
if [[ -n "$stale_pids" ]]; then
  # shellcheck disable=SC2086
  kill -TERM $stale_pids 2>/dev/null || true
  sleep 2
  terminate_matching_processes KILL
fi

# Keep the Bazel server/cache alive between hot-reload restarts. The Valdi
# compiler and relay processes above are the stale workers that must be cleared;
# shutting Bazel down here forces a full multi-minute repository re-analysis on
# every normal restart.
