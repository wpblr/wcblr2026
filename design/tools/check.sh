#!/bin/bash
# ── Layout smoke test for a banner ───────────────────────────────────
#   tools/check.sh "banners/Call for Speakers.html"
#   tools/check.sh banners/*.html
#
# Loads the banner headless, injects tools/check.js, and prints what it
# found: content taller than the canvas, text clipped inside its box,
# anything sliding off the edge or under the gold marquee, broken images,
# fonts that fell back to Georgia/Arial. "CHECK OK" means none of that.
set -e
TOOLS=$(cd "$(dirname "$0")" && pwd)
. "$TOOLS/find-chrome.sh"

status=0
for SRC in "$@"; do
  [ -f "$SRC" ] || { echo "No such file: $SRC"; status=1; continue; }
  DIR=$(dirname "$SRC")
  TMP="$DIR/.probe-$(basename "$SRC")"
  cp "$TOOLS/check.js" "$DIR/.check.js"
  grep -v -e 'html-to-image' -e 'download-png.js' "$SRC" \
    | sed 's#</body>#<script src=".check.js"></script></body>#' > "$TMP"

  echo "── $(basename "$SRC")"
  result=$("$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --virtual-time-budget=12000 --window-size=1400,1400 \
    --dump-dom "file://$(cd "$DIR" && pwd)/$(basename "$TMP")" 2>/dev/null \
    | grep -oP '(?<=<title>).*?(?=</title>)' | head -1)
  rm -f "$TMP" "$DIR/.check.js"

  # check.js reports by rewriting the title, so a title that is not a
  # CHECK line means the probe never ran — usually $CHROME could not read
  # the file (a confined snap build is the usual culprit).
  case "$result" in
    *CHECK*) ;;
    *) result="CHECK-FAIL probe did not run. $CHROME could not load the banner;"
       result="$result try CHROME=/path/to/an/unconfined/chrome" ;;
  esac

  echo "   ${result:-CHECK-FAIL no result}" | sed 's/ | /\n     /g'
  case "$result" in *"CHECK OK"*) ;; *) status=1 ;; esac
done
exit $status
