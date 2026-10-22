#!/usr/bin/env bash
set -euo pipefail

export PATH=/tmp:/home/darkk/.valdi/bin:/usr/local/bin:/usr/bin:/bin

cd /mnt/s/haycee-mobile-app-valdi
cache_file="$(bazelisk info bazel-bin)/.valdi_build/hotreload/caches/companion/compilecache.db"

if [[ -f "$cache_file" ]]; then
  rm -f -- "$cache_file"
  echo "Removed stale Valdi hot reload cache: $cache_file"
else
  echo 'No Valdi hot reload cache found.'
fi
