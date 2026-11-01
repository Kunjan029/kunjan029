#!/usr/bin/env bash
# Run where framerusercontent.com is reachable. Never overwrites existing files.
# Usage: ./download-framer.sh /path/to/src/assets/projects
set -u
DEST="${1:?destination folder}"; mkdir -p "$DEST"
grep -v '^#' "$(dirname "$0")/framer-assets.tsv" | while IFS=$'\t' read -r name src size note; do
  case "$src" in local:*) echo "skip (your own file, copy manually) $name"; continue;; esac
  [ -e "$DEST/$name" ] && { echo "skip (exists) $name"; continue; }
  curl -fsSL "https://framerusercontent.com/images/$src" -o "$DEST/$name" && echo "ok $name ($size)" || echo "FAILED $name"
done
