#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
site_dir="${1:-$repo_root/_site}"
version="$(git -C "$repo_root" rev-parse --short=12 HEAD 2>/dev/null || date +%s)"

rm -rf "$site_dir"
mkdir -p "$site_dir"
cp "$repo_root/src/index.html" "$site_dir/index.html"
touch "$site_dir/.nojekyll"

# Publica um identificador de versão separado do HTML. O navegador consulta este
# arquivo com cache desativado para detectar imediatamente uma nova publicação.
printf '{"version":"%s"}\n' "$version" > "$site_dir/version.json"

# Injeta no HTML publicado uma proteção contra cache antigo, especialmente útil
# no Safari/Chrome mobile e quando o app foi salvo na tela inicial.
python3 - "$site_dir/index.html" "$version" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
version = sys.argv[2]
html = path.read_text(encoding="utf-8")

head_marker = "<head>"
head_injection = """<head>\n<meta http-equiv=\"Cache-Control\" content=\"no-cache, no-store, must-revalidate\">\n<meta http-equiv=\"Pragma\" content=\"no-cache\">\n<meta http-equiv=\"Expires\" content=\"0\">\n<meta name=\"amara-build\" content=\"__VERSION__\">""".replace("__VERSION__", version)
if head_marker in html:
    html = html.replace(head_marker, head_injection, 1)

checker = r'''\n<script>\n(function(){\n  var BUILD='__VERSION__';\n  var KEY='amara_erp_build';\n  try { localStorage.setItem(KEY, BUILD); } catch(e) {}\n\n  async function checkForUpdate(){\n    try {\n      var response = await fetch('./version.json?ts=' + Date.now(), {\n        cache: 'no-store',\n        headers: {'Cache-Control':'no-cache'}\n      });\n      if(!response.ok) return;\n      var data = await response.json();\n      var latest = String(data.version || '');\n      if(!latest || latest === BUILD) return;\n\n      var url = new URL(window.location.href);\n      if(url.searchParams.get('v') === latest) return;\n      url.searchParams.set('v', latest);\n      window.location.replace(url.toString());\n    } catch(e) {\n      // Falha de rede não impede o uso offline/normal do sistema.\n    }\n  }\n\n  window.addEventListener('pageshow', checkForUpdate);\n  document.addEventListener('visibilitychange', function(){\n    if(document.visibilityState === 'visible') checkForUpdate();\n  });\n  setTimeout(checkForUpdate, 800);\n})();\n</script>\n'''.replace('__VERSION__', version)

body_marker = "</body>"
if body_marker in html:
    html = html.replace(body_marker, checker + body_marker, 1)
else:
    html += checker

path.write_text(html, encoding="utf-8")
PY

test -s "$site_dir/index.html"
test -s "$site_dir/version.json"
