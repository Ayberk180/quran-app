"""
optimize-assets.py
==================
Compresses images and audio to reasonable sizes for web delivery.

Targets:
    - Images: WebP, ~30-50 KB each, quality ~80.
    - Audio: MP3, mono, ~64 kbps. Speech doesn't need stereo or high bitrate.

Usage:
    python scripts/optimize-assets.py

Idempotent — safe to re-run. Skips files already at target size/format.

Dependencies:
    pip install pillow
    ffmpeg (system binary, not pip)
"""

# TODO (Phase 3): implement.
raise NotImplementedError("See PROJECT_BRIEF.md §5 step D.")
