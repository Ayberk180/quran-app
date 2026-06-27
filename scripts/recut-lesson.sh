#!/usr/bin/env bash
#
# recut-lesson.sh — re-cut one lesson's phrase images from the book PDF.
#
# You do NOT need python on your PATH or to activate anything — this calls the
# project's venv Python by full path. Run it with `bash`:
#
#   bash scripts/recut-lesson.sh 20            # PREVIEW: draws an overlay to eyeball
#   bash scripts/recut-lesson.sh 20 --write    # WRITE:   actually saves the crops
#
# Pages 21 and 28 are 5-column; pass --cols 5, e.g.:
#   bash scripts/recut-lesson.sh 21 --write --cols 5
#
# To change the framing (move letters up/down, etc.), edit the numbers in the
# "KNOBS" block below, run a preview, look at the overlay, then run with --write.
#
set -euo pipefail

# ── KNOBS (tweak these, then preview) ──────────────────────────────────────
# To slide the crop DOWN  (letters higher in the tile): raise MARGIN_TOP, lower MARGIN_BOTTOM.
# To slide the crop UP    (letters lower  in the tile): lower MARGIN_TOP, raise MARGIN_BOTTOM.
# INSET_Y trims top & bottom inside each tile (raise it to clip a border/footer line).
MARGIN_TOP=585
MARGIN_BOTTOM=475
MARGIN_LEFT=302
MARGIN_RIGHT=302
GUTTER_X=10
GUTTER_Y=12
INSET_X=12
INSET_Y=28
# ───────────────────────────────────────────────────────────────────────────

REPO="/home/ayber/quran-app"
PY="$REPO/scripts/.venv/bin/python"
SLICER="$REPO/scripts/slice-pdf.py"

if [ $# -lt 1 ]; then
  echo "Usage: bash scripts/recut-lesson.sh <lesson-number> [--write] [extra slice-pdf flags]" >&2
  echo "  e.g. bash scripts/recut-lesson.sh 20            (preview)" >&2
  echo "       bash scripts/recut-lesson.sh 20 --write    (save crops)" >&2
  exit 1
fi

PAGE="$1"; shift
WRITE=0
EXTRA=()
for arg in "$@"; do
  if [ "$arg" = "--write" ]; then WRITE=1; else EXTRA+=("$arg"); fi
done

LESSON_ID="$(printf 'lesson-%02d' "$PAGE")"
OVERLAY="$REPO/assets-source/debug/${LESSON_ID}-overlay.png"

ARGS=(
  --page "$PAGE"
  --margin-top "$MARGIN_TOP" --margin-bottom "$MARGIN_BOTTOM"
  --margin-left "$MARGIN_LEFT" --margin-right "$MARGIN_RIGHT"
  --gutter-x "$GUTTER_X" --gutter-y "$GUTTER_Y"
  --inset-x "$INSET_X" --inset-y "$INSET_Y"
  --remove-bg
)

if [ "$WRITE" -eq 1 ]; then
  "$PY" "$SLICER" "${ARGS[@]}" ${EXTRA[@]+"${EXTRA[@]}"}
  echo "✅ wrote crops → public/images/phrases/${LESSON_ID}/"
else
  "$PY" "$SLICER" --preview "${ARGS[@]}" ${EXTRA[@]+"${EXTRA[@]}"}
  echo "👀 preview only. Open the overlay to check the grid:"
  echo "   $OVERLAY"
  # On WSL, pop it open in Windows automatically if we can.
  if command -v explorer.exe >/dev/null 2>&1 && command -v wslpath >/dev/null 2>&1; then
    explorer.exe "$(wslpath -w "$OVERLAY")" >/dev/null 2>&1 || true
  fi
  echo "   When it looks right, re-run with --write to save the crops."
fi
