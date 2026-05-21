"""
remove-bg.py
============
Removes the cream/beige background from all phrase PNG images, leaving only
the Arabic text (black and red ink) on a transparent background.

The source images were cropped from a PDF with a uniform cream background
(~RGB 248,248,218, luminance ≈245). Both black text (lum ≈20) and red text
(lum ≈80) sit well below a threshold of 220, so luminance thresholding
correctly preserves all ink regardless of colour.

Algorithm (per pixel):
    lum = 0.299·R + 0.587·G + 0.114·B
    lum ≥ 220  →  alpha = 0   (fully transparent — background)
    lum ≤ 30   →  alpha = 255 (fully opaque — ink centre)
    otherwise  →  alpha = round((220 − lum) / (220 − 30) * 255)
                  (linear interpolation — anti-aliasing edges)

Output format: RGBA PNG. Files are overwritten in-place; lessons.json paths
do not change.

Usage:
    # Dry run — count files without touching them:
    python scripts/remove-bg.py --dry-run

    # Sample first 5 images for visual spot-check:
    python scripts/remove-bg.py --sample 5

    # Process everything:
    python scripts/remove-bg.py

Dependencies: pillow (already in scripts/requirements.txt)
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
IMAGES_ROOT = REPO_ROOT / "public" / "images" / "phrases"

# Background colour of the source images (cream/beige from the PDF scan).
# Measured from phrase samples: ~RGB(243, 243, 208).
BG_R, BG_G, BG_B = 243, 243, 208

# Euclidean RGB distance thresholds from the background colour:
#   dist >= DIST_OPAQUE  → fully opaque (ink centre — black or red)
#   dist <= DIST_TRANSP  → fully transparent (background)
#   between              → linear interpolation (anti-aliasing edges)
#
# Using colour distance rather than luminance means red ink (which has high
# luminance) is treated the same as black ink — both are far from cream.
DIST_OPAQUE = 60
DIST_TRANSP = 12


def _color_dist(r: int, g: int, b: int) -> float:
    return ((r - BG_R) ** 2 + (g - BG_G) ** 2 + (b - BG_B) ** 2) ** 0.5


def remove_background(img: Image.Image) -> Image.Image:
    """Return a new RGBA image with the cream background made transparent.

    Uses Euclidean RGB distance from the known background colour so that both
    black ink (lum≈20) and red ink (lum≈80) are correctly preserved.
    Anti-aliasing edges are smoothly interpolated.
    """
    rgb = img.convert("RGB")
    out = rgb.convert("RGBA")
    pixels = out.load()
    w, h = out.size

    span = DIST_OPAQUE - DIST_TRANSP
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = _color_dist(r, g, b)
            if dist >= DIST_OPAQUE:
                pixels[x, y] = (r, g, b, 255)
            elif dist <= DIST_TRANSP:
                pixels[x, y] = (r, g, b, 0)
            else:
                alpha = round((dist - DIST_TRANSP) / span * 255)
                pixels[x, y] = (r, g, b, alpha)

    return out


def collect_images() -> list[Path]:
    """Return all phrase PNG files sorted by lesson then phrase number."""
    return sorted(IMAGES_ROOT.glob("lesson-*/phrase-*.png"))


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="report how many files would be processed without modifying any",
    )
    ap.add_argument(
        "--sample",
        type=int,
        metavar="N",
        default=None,
        help="process only the first N images (for visual spot-check)",
    )
    args = ap.parse_args()

    images = collect_images()
    if not images:
        print(f"error: no phrase images found under {IMAGES_ROOT.relative_to(REPO_ROOT)}", file=sys.stderr)
        print("  Make sure the images have been sliced from the PDF first.", file=sys.stderr)
        return 1

    if args.sample is not None:
        images = images[: args.sample]

    total = len(images)

    if args.dry_run:  # argparse stores --dry-run as args.dry_run
        print(f"Dry run: {total} image{'s' if total != 1 else ''} would be processed.")
        return 0

    processed = 0
    errors: list[tuple[Path, str]] = []

    for path in images:
        try:
            img = Image.open(path)
            result = remove_background(img)
            result.save(path, format="PNG", optimize=True)
            processed += 1
            if args.sample is not None:
                # Verbose output when sampling so the user can track progress
                print(f"  {path.relative_to(REPO_ROOT)}")
        except Exception as exc:  # noqa: BLE001
            errors.append((path, str(exc)))
            print(f"  ERROR {path.relative_to(REPO_ROOT)}: {exc}", file=sys.stderr)

    print(f"Processed {processed} image{'s' if processed != 1 else ''}.", end="")
    if errors:
        print(f"  {len(errors)} error{'s' if len(errors) != 1 else ''} (see above).")
        return 1
    else:
        print()
        return 0


if __name__ == "__main__":
    sys.exit(main())
