#!/usr/bin/env bash
# Install repository hooks into the local git hooks dir (worktree-aware).
set -euo pipefail

force=0
[ "${1:-}" = "--force" ] && force=1

root=$(git rev-parse --show-toplevel)
# --git-common-dir points at the shared .git even inside a worktree.
# cd+pwd yields a POSIX absolute path (Git Bash friendly, no "D:" prefix issues).
hook_dir="$(cd "$(git rev-parse --git-common-dir)" && pwd)/hooks"
mkdir -p "$hook_dir"

for name in commit-msg pre-push; do
  src="$root/hooks/$name"
  if [ ! -f "$src" ]; then
    echo "[install] missing source hook: $src" >&2
    exit 1
  fi
  dest="$hook_dir/$name"
  if [ -e "$dest" ] && [ "$force" -eq 0 ]; then
    echo "[install] skip $name (exists; use --force to overwrite)"
    continue
  fi
  cp "$src" "$dest"
  chmod +x "$dest"
  echo "[install] installed $name -> $dest"
done
