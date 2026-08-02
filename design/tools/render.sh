#!/bin/bash
# ── Headless render of a banner to a pixel-exact PNG ─────────────────
#   tools/render.sh "banners/Call for Speakers.html" exports/cfs.png 1080 1080
#
# Why not just screenshot: headless=new reserves part of the window for
# browser UI, so we shoot taller than we need and crop to the banner box.
# The floating "Download PNG" pill is stripped from a temp copy first so
# it never lands in the image.
#
# Needs python3 with Pillow (pip install pillow) for the crop.
set -e
. "$(cd "$(dirname "$0")" && pwd)/find-chrome.sh"

SRC="$1"; OUT="$2"; W="${3:-1080}"; H="${4:-1080}"
[ -f "$SRC" ] || { echo "No such file: $SRC"; exit 1; }
mkdir -p "$(dirname "$OUT")"

DIR=$(dirname "$SRC")
TMP="$DIR/.render-$(basename "$SRC")"
trap 'rm -f "$TMP" "$OUT.raw.png"' EXIT

grep -v -e 'html-to-image' -e 'download-png.js' "$SRC" > "$TMP"

"$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=1 --virtual-time-budget=10000 \
  --window-size="$W,$((H + 200))" --screenshot="$OUT.raw.png" \
  "file://$(cd "$DIR" && pwd)/$(basename "$TMP")" >/dev/null 2>&1

python3 - "$OUT.raw.png" "$OUT" "$W" "$H" <<'PY'
import sys
try:
    from PIL import Image
except ImportError:
    raise SystemExit("render.sh needs Pillow for the crop:  pip install pillow")
raw, out, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(raw)
if im.size[0] < w or im.size[1] < h:
    raise SystemExit(f"viewport {im.size} smaller than banner {(w, h)}")
im.crop((0, 0, w, h)).save(out)
print(f"{out}  {Image.open(out).size[0]}x{Image.open(out).size[1]}")
PY
