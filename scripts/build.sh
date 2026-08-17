#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
site_dir="${1:-$repo_root/_site}"

rm -rf "$site_dir"
mkdir -p "$site_dir"
cp "$repo_root/src/index.html" "$site_dir/index.html"
touch "$site_dir/.nojekyll"
test -s "$site_dir/index.html"
