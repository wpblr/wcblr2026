#!/bin/bash
# ── Preview the banner kit in a browser ──────────────────────────────
#   ./serve.sh            → serves on http://localhost:8420 and opens it
#   ./serve.sh 9000       → start from a different port
#
# Use this rather than opening the files directly: on file:// URLs Chrome
# taints the canvas with the local skyline image, and the "Download PNG"
# button fails with a security error. Over http:// it works.
#
# Ports below 1024 are root-only, so the default is 8420; if it is busy
# the next free port up is used.
cd "$(dirname "$0")" || exit 1
START="${1:-8420}"

if [ "$START" -lt 1024 ]; then
  echo "Port $START needs root. Pick something above 1024 (default is 8420)." >&2
  exit 1
fi

PORT=$(python3 - "$START" <<'PY'
import socket, sys
start = int(sys.argv[1])
for p in range(start, start + 25):
    s = socket.socket()
    try:
        s.bind(("127.0.0.1", p))
        print(p)
        break
    except OSError:
        continue
    finally:
        s.close()
else:
    sys.exit(f"no free port in {start}..{start + 24}")
PY
) || exit 1

command -v xdg-open >/dev/null && (sleep 1 && xdg-open "http://localhost:$PORT/" >/dev/null 2>&1) &
echo "WCBLR banner kit → http://localhost:$PORT/   (ctrl-c to stop)"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
