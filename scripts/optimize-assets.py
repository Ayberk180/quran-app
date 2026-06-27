"""
optimize-assets.py
==================
Compresses recorded audio (and, later, images) to web-friendly sizes.

Targets:
    - Audio: MP3, mono, ~64 kbps. Speech doesn't need stereo or high bitrate.
    - Images: WebP, ~30-50 KB each, quality ~80.  [TODO — not yet needed]

Audio flow:
    The admin recording tool (#/record) downloads one lesson-XX.zip per lesson of
    browser recordings (webm/opus). The maintainer unzips it into
        assets-source/audio-raw/lesson-XX/phrase-YYY.webm
    and runs this script. It transcodes each clip to
        public/audio/phrases/lesson-XX/phrase-YYY.mp3
    Then `python scripts/build-manifest.py` links them by ID into lessons.json.

Usage:
    python scripts/optimize-assets.py            # transcode all new/changed audio
    python scripts/optimize-assets.py --force    # re-transcode even if up to date

Idempotent: skips a clip when its mp3 is newer than the source. Safe to re-run.

Dependencies:
    ffmpeg (system binary, not pip)

See PROJECT_BRIEF.md §5 step D.
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
AUDIO_RAW_ROOT = REPO_ROOT / "assets-source" / "audio-raw"
AUDIO_OUT_ROOT = REPO_ROOT / "public" / "audio" / "phrases"

# Browser-recorded / hand-supplied intermediates we accept as input.
RAW_AUDIO_EXTS = (".webm", ".ogg", ".m4a", ".wav", ".mp3")

LESSON_DIR_RE = re.compile(r"^lesson-(\d+)$")
PHRASE_FILE_RE = re.compile(r"^phrase-(\d+)\.[^.]+$")

AUDIO_BITRATE = "64k"


def find_ffmpeg() -> str:
    """Locate the ffmpeg binary or exit with a helpful message."""
    exe = shutil.which("ffmpeg")
    if not exe:
        print(
            "ERROR: ffmpeg not found on PATH. Install it (e.g. `sudo apt install ffmpeg`\n"
            "or `brew install ffmpeg`) and re-run.",
            file=sys.stderr,
        )
        sys.exit(1)
    return exe


def transcode_audio(ffmpeg: str, src: Path, dst: Path) -> None:
    """Transcode one clip to mp3, 64 kbps mono. Overwrites dst."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg,
        "-y",                # overwrite output
        "-loglevel", "error",
        "-i", str(src),
        "-ac", "1",          # mono
        "-b:a", AUDIO_BITRATE,
        "-map_metadata", "-1",  # strip metadata
        str(dst),
    ]
    subprocess.run(cmd, check=True)


def process_audio(ffmpeg: str, force: bool) -> tuple[int, int]:
    """Walk the raw-audio tree and transcode clips. Returns (written, skipped)."""
    written = 0
    skipped = 0

    if not AUDIO_RAW_ROOT.exists():
        print(
            f"No raw audio at {AUDIO_RAW_ROOT.relative_to(REPO_ROOT)} — nothing to do.\n"
            "Unzip a lesson-XX.zip from the recording tool into "
            "assets-source/audio-raw/lesson-XX/ first.",
            file=sys.stderr,
        )
        return written, skipped

    for lesson_dir in sorted(AUDIO_RAW_ROOT.iterdir()):
        if not lesson_dir.is_dir() or not LESSON_DIR_RE.match(lesson_dir.name):
            continue
        lesson_id = lesson_dir.name

        # If a phrase has multiple raw takes (different extensions), keep one and
        # warn — don't silently pick at random.
        by_phrase: dict[str, Path] = {}
        for entry in sorted(lesson_dir.iterdir()):
            if not entry.is_file() or entry.suffix.lower() not in RAW_AUDIO_EXTS:
                continue
            pm = PHRASE_FILE_RE.match(entry.name)
            if not pm:
                continue
            phrase_id = f"phrase-{int(pm.group(1)):03d}"
            if phrase_id in by_phrase:
                print(
                    f"WARN: multiple raw takes for {lesson_id}/{phrase_id} "
                    f"({by_phrase[phrase_id].name} and {entry.name}); using the first",
                    file=sys.stderr,
                )
                continue
            by_phrase[phrase_id] = entry

        for phrase_id, src in sorted(by_phrase.items()):
            dst = AUDIO_OUT_ROOT / lesson_id / f"{phrase_id}.mp3"
            if (
                not force
                and dst.exists()
                and dst.stat().st_mtime >= src.stat().st_mtime
            ):
                skipped += 1
                continue
            transcode_audio(ffmpeg, src, dst)
            written += 1
            print(
                f"  {src.relative_to(REPO_ROOT)} -> {dst.relative_to(REPO_ROOT)}",
                file=sys.stderr,
            )

    return written, skipped


def main() -> int:
    parser = argparse.ArgumentParser(description="Transcode recorded audio to mp3.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-transcode even when the mp3 is already up to date.",
    )
    args = parser.parse_args()

    ffmpeg = find_ffmpeg()
    written, skipped = process_audio(ffmpeg, args.force)

    print(
        f"audio: {written} transcoded, {skipped} up-to-date.\n"
        "Next: run `python scripts/build-manifest.py` to link them into lessons.json.",
        file=sys.stderr,
    )

    # TODO: image optimization (WebP, ~30-50 KB). Images currently come straight
    # from slice-pdf.py + remove-bg.py and don't yet need a separate pass here.
    return 0


if __name__ == "__main__":
    sys.exit(main())
