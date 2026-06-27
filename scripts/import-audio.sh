#!/usr/bin/env bash
#
# import-audio.sh — pull recorded lesson zips into the app.
#
# Takes the lesson-XX.zip files the recording tool downloaded, and:
#   1. unzips them into assets-source/audio-raw/lesson-XX/   (staging, gitignored)
#   2. converts the webm clips to mp3 (64k mono) in public/audio/phrases/
#   3. rebuilds public/data/lessons.json so the app links the audio
#
# You do NOT need python on your PATH. Run it with bash:
#
#   bash scripts/import-audio.sh                       # uses the default source below
#   bash scripts/import-audio.sh "/some/other/folder"  # custom folder of lesson-*.zip
#
set -euo pipefail

REPO="/home/ayber/quran-app"
PY="$REPO/scripts/.venv/bin/python"
RAW="$REPO/assets-source/audio-raw"
SRC="${1:-/mnt/c/Users/Ayber/Downloads/cami/Quran app clips}"

echo "Source zips : $SRC"
echo "Staging into: $RAW"
mkdir -p "$RAW"

shopt -s nullglob
zips=("$SRC"/lesson-*.zip)
if [ ${#zips[@]} -eq 0 ]; then
  echo "No lesson-*.zip found in: $SRC" >&2
  exit 1
fi

for zip in "${zips[@]}"; do
  base="$(basename "$zip" .zip)"   # e.g. lesson-20
  dest="$RAW/$base"
  mkdir -p "$dest"
  "$PY" - "$zip" "$dest" <<'PYEOF'
import sys, zipfile
zp, dest = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(zp) as z:
    z.extractall(dest)
print(f"  unzipped {zp.split('/')[-1]} -> assets-source/audio-raw/{dest.split('/')[-1]}/")
PYEOF
done
echo "Staged ${#zips[@]} lesson zip(s)."

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "⚠ ffmpeg not installed — clips are staged but not converted."
  echo "  Install it:  sudo apt install ffmpeg     then re-run this script."
  exit 0
fi

echo "Converting webm → mp3 ..."
"$PY" "$REPO/scripts/optimize-assets.py"
echo "Rebuilding manifest ..."
"$PY" "$REPO/scripts/build-manifest.py"
echo "✅ Done. Audio is in public/audio/phrases/ and linked in public/data/lessons.json"
