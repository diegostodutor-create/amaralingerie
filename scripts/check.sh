#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

"$repo_root/scripts/build.sh" "$tmp_dir/site"
cmp "$repo_root/src/index.html" "$repo_root/index.html"
cmp "$repo_root/src/index.html" "$tmp_dir/site/index.html"

python3 - "$repo_root/src/index.html" "$tmp_dir/app.js" <<'PY'
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

source = Path(sys.argv[1]).read_text(encoding="utf-8")

class DocumentCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.viewport = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            if attrs["id"] in self.ids:
                raise SystemExit(f"duplicate id: {attrs['id']}")
            self.ids.add(attrs["id"])
        if tag == "meta" and attrs.get("name") == "viewport":
            self.viewport = "viewport-fit=cover" in attrs.get("content", "")

document = DocumentCheck()
document.feed(source)
required = {"login", "app", "side", "mobileMenuBtn", "mobileBackdrop", "loadWarning"}
missing = sorted(required - document.ids)
if missing:
    raise SystemExit("missing required ids: " + ", ".join(missing))
if not document.viewport:
    raise SystemExit("mobile viewport configuration is missing")

scripts = re.findall(r"<script>(.*?)</script>", source, flags=re.DOTALL)
Path(sys.argv[2]).write_text("\n".join(scripts), encoding="utf-8")
PY

node --check "$tmp_dir/app.js"
node "$repo_root/tests/refresh-all.test.js"
node "$repo_root/tests/catalog-crud.test.js"
node "$repo_root/tests/quality-navigation.test.js"
