# ── Locate a headless-capable Chrome ─────────────────────────────────
# Sourced by check.sh and render.sh; leaves the binary in $CHROME.
#
# Anything Chromium-based that understands --headless=new works: Chrome,
# Chromium, Brave, Edge, or the copy Puppeteer unpacks into
# ~/.cache/puppeteer. To use a specific one:
#
#   CHROME=/path/to/chrome tools/check.sh banners/*.html
#
# Snap builds are picked last on purpose. They are confined and cannot
# read files outside your home directory, so they load the banner as a
# blank page and the check passes or fails for the wrong reason. If a
# snap is all you have and the tools misbehave, install a deb/rpm build
# or point CHROME at one.

_wc_snap=

if [ -z "$CHROME" ] || [ ! -x "$CHROME" ]; then
  CHROME=
  for _c in google-chrome-stable google-chrome chromium chromium-browser \
            brave-browser microsoft-edge; do
    if _p=$(command -v "$_c" 2>/dev/null); then
      # /snap/bin/chromium is a symlink to /usr/bin/snap, so test the
      # link and its target both.
      case "$_p:$(readlink -f "$_p" 2>/dev/null)" in
        *snap*) [ -n "$_wc_snap" ] || _wc_snap=$_p ;;
        *)      CHROME=$_p; break ;;
      esac
    fi
  done
fi

if [ -z "$CHROME" ]; then
  for _p in "$HOME"/.cache/puppeteer/chrome/*/chrome-linux64/chrome \
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
            "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    if [ -x "$_p" ]; then CHROME=$_p; break; fi
  done
fi

[ -n "$CHROME" ] || CHROME=$_wc_snap

if [ -z "$CHROME" ]; then
  echo "No Chrome or Chromium found on this machine." >&2
  echo "Install one, or point CHROME at it:  CHROME=/path/to/chrome $0 ..." >&2
  exit 1
fi

unset _c _p _wc_snap
