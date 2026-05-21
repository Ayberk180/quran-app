"""
build-manifest.py
=================
Walks public/images/phrases/ and public/audio/phrases/, pairs files by ID,
and emits public/data/lessons.json.

Behavior:
    - Reads the existing lessons.json first and preserves human-edited fields
      (title, title_ar, description, transliteration, notes). Don't blow them
      away on regeneration.
    - Warns if an image has no matching audio (or vice versa). Does NOT silently
      drop them — surface the problem.
    - Sorts lessons and phrases by their numeric ID component.

Usage:
    python scripts/build-manifest.py

See PROJECT_BRIEF.md §4 (schema) and §5 step C.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
IMAGES_ROOT = REPO_ROOT / "public" / "images" / "phrases"
AUDIO_ROOT = REPO_ROOT / "public" / "audio" / "phrases"
MANIFEST_PATH = REPO_ROOT / "public" / "data" / "lessons.json"

IMAGE_EXTS = (".webp", ".png", ".jpg", ".jpeg")
AUDIO_EXTS = (".mp3", ".m4a", ".ogg", ".wav")

LESSON_DIR_RE = re.compile(r"^lesson-(\d+)$")
PHRASE_FILE_RE = re.compile(r"^phrase-(\d+)\.[^.]+$")

DEFAULT_MANIFEST_TITLE = "Masjid Quran Learning"
DEFAULT_MANIFEST_VERSION = 1


def load_existing_manifest() -> dict:
    """Load the current manifest so human-edited fields can be preserved."""
    if not MANIFEST_PATH.exists():
        return {"version": DEFAULT_MANIFEST_VERSION, "title": DEFAULT_MANIFEST_TITLE, "lessons": []}
    with MANIFEST_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def index_existing(manifest: dict) -> tuple[dict[str, dict], dict[str, dict[str, dict]]]:
    """Return (lessons_by_id, phrases_by_lesson_then_phrase) for quick lookup."""
    lessons_by_id: dict[str, dict] = {}
    phrases_by_lesson: dict[str, dict[str, dict]] = {}
    for lesson in manifest.get("lessons", []):
        lid = lesson.get("id")
        if not lid:
            continue
        lessons_by_id[lid] = lesson
        phrases_by_lesson[lid] = {p.get("id"): p for p in lesson.get("phrases", []) if p.get("id")}
    return lessons_by_id, phrases_by_lesson


def scan_dir(root: Path, valid_exts: tuple[str, ...]) -> dict[str, dict[str, str]]:
    """Return {lesson_id: {phrase_id: filename}} for files under `root`.

    Filenames are kept (not full paths) so callers can build absolute URLs
    rooted at /<images|audio>/phrases/<lesson_id>/<filename>.
    """
    out: dict[str, dict[str, str]] = {}
    if not root.exists():
        return out
    for lesson_dir in sorted(root.iterdir()):
        if not lesson_dir.is_dir():
            continue
        if not LESSON_DIR_RE.match(lesson_dir.name):
            continue
        lesson_id = lesson_dir.name
        phrases: dict[str, str] = {}
        for entry in sorted(lesson_dir.iterdir()):
            if not entry.is_file():
                continue
            if entry.suffix.lower() not in valid_exts:
                continue
            pm = PHRASE_FILE_RE.match(entry.name)
            if not pm:
                continue
            phrase_id = f"phrase-{int(pm.group(1)):03d}"
            if phrase_id in phrases:
                print(
                    f"WARN: duplicate phrase id {phrase_id} in {lesson_dir.name} "
                    f"({phrases[phrase_id]} and {entry.name}); keeping first",
                    file=sys.stderr,
                )
                continue
            phrases[phrase_id] = entry.name
        if phrases:
            out[lesson_id] = phrases
    return out


def predict_audio_filename(phrase_id: str) -> str:
    """When audio is missing, reserve the slot with a predicted .mp3 filename."""
    return f"{phrase_id}.mp3"


def merge_phrase(
    lesson_id: str,
    phrase_id: str,
    image_filename: str | None,
    audio_filename: str | None,
    existing: dict | None,
) -> dict:
    """Build a phrase entry, preserving transliteration/notes from `existing` when present."""
    if image_filename is not None:
        image_path = f"/images/phrases/{lesson_id}/{image_filename}"
    elif existing and existing.get("image"):
        image_path = existing["image"]
    else:
        image_path = ""

    if audio_filename is not None:
        audio_path = f"/audio/phrases/{lesson_id}/{audio_filename}"
    else:
        audio_path = f"/audio/phrases/{lesson_id}/{predict_audio_filename(phrase_id)}"

    return {
        "id": phrase_id,
        "image": image_path,
        "audio": audio_path,
        "transliteration": (existing or {}).get("transliteration", ""),
        "notes": (existing or {}).get("notes", ""),
    }


def merge_lesson(
    lesson_id: str,
    number: int,
    phrases: list[dict],
    existing: dict | None,
) -> dict:
    return {
        "id": lesson_id,
        "number": number,
        "title": (existing or {}).get("title") or f"Lesson {number}",
        "title_ar": (existing or {}).get("title_ar", ""),
        "description": (existing or {}).get("description", ""),
        "phrases": phrases,
    }


def build() -> dict:
    existing_manifest = load_existing_manifest()
    existing_lessons, existing_phrases = index_existing(existing_manifest)

    images = scan_dir(IMAGES_ROOT, IMAGE_EXTS)
    audio = scan_dir(AUDIO_ROOT, AUDIO_EXTS)

    all_lesson_ids = sorted(set(images.keys()) | set(audio.keys()))
    lessons_out: list[dict] = []

    for lesson_id in all_lesson_ids:
        number = int(LESSON_DIR_RE.match(lesson_id).group(1))
        image_map = images.get(lesson_id, {})
        audio_map = audio.get(lesson_id, {})
        existing_lesson = existing_lessons.get(lesson_id)
        existing_phrase_map = existing_phrases.get(lesson_id, {})

        all_phrase_ids = sorted(set(image_map.keys()) | set(audio_map.keys()))
        phrases_out: list[dict] = []

        for phrase_id in all_phrase_ids:
            image_filename = image_map.get(phrase_id)
            audio_filename = audio_map.get(phrase_id)

            if image_filename is None:
                print(f"WARN: audio without image — {lesson_id}/{phrase_id}", file=sys.stderr)
            if audio_filename is None:
                print(f"WARN: no audio for {lesson_id}/{phrase_id}", file=sys.stderr)

            phrases_out.append(
                merge_phrase(
                    lesson_id,
                    phrase_id,
                    image_filename,
                    audio_filename,
                    existing_phrase_map.get(phrase_id),
                )
            )

        lessons_out.append(merge_lesson(lesson_id, number, phrases_out, existing_lesson))

    return {
        "version": existing_manifest.get("version", DEFAULT_MANIFEST_VERSION),
        "title": existing_manifest.get("title", DEFAULT_MANIFEST_TITLE),
        "lessons": lessons_out,
    }


def main() -> int:
    manifest = build()
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MANIFEST_PATH.open("w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    lesson_count = len(manifest["lessons"])
    phrase_count = sum(len(l["phrases"]) for l in manifest["lessons"])
    print(
        f"wrote {MANIFEST_PATH.relative_to(REPO_ROOT)}: "
        f"{lesson_count} lessons, {phrase_count} phrases",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
