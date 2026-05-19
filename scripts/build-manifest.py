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

# TODO (Phase 3): implement.
raise NotImplementedError("See PROJECT_BRIEF.md §5 step C.")
