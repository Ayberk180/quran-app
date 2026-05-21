"""
slice-pdf.py
============
Cuts the source PDF (assets-source/book.pdf) into one image per phrase and
writes them to public/images/phrases/lesson-XX/phrase-YYY.{png,webp}.

The book layout is uniform: every page is one lesson, laid out as a 7-row by
4-column grid of evenly-sized boxes with a brown border on a beige background.
Reading order is RTL — phrase 001 is the top-right cell, 004 is the top-left,
005 starts the second row from the right, etc. (Some pages use 5 columns;
pass --cols 5 for those.)

This is a maintainer tool, run locally. It is NOT shipped with the app.

Usage:
    # Test a single page (writes a debug overlay you can eyeball):
    python scripts/slice-pdf.py --page 1 --debug

    # Process a range or list:
    python scripts/slice-pdf.py --page 1-12
    python scripts/slice-pdf.py --page 1,3,5

    # Process the whole PDF:
    python scripts/slice-pdf.py --all

    # Override auto-detected grid bounds if the borders aren't being found:
    python scripts/slice-pdf.py --page 1 --debug \
        --margin-top 120 --margin-bottom 120 --margin-left 80 --margin-right 80

    # Fast iteration: --preview skips writing the 35 crops and only draws
    # the overlay. Add --gutter-x/-y for whitespace between cells, and
    # --inset-x/-y to trim inside each cell. Once the overlay looks right,
    # drop --preview and re-run with the same flags to write the crops.
    python scripts/slice-pdf.py --page 1 --preview \
        --margin-top 350 --margin-bottom 250 --margin-left 180 --margin-right 180 \
        --gutter-x 12 --gutter-y 14 --inset-x 8 --inset-y 6

Dependencies (install locally; not shipped):
    pip install -r scripts/requirements.txt
    # which is: pymupdf, pillow

Why geometric slicing instead of contour detection: the layout is a perfectly
regular grid, so dividing the grid bbox by rows/cols is reliable. We auto-detect
the outer grid bbox via a grayscale threshold + getbbox(), and you can override
with --margin-* if a particular page has stray ink outside the grid.
"""

from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

import fitz  # pymupdf
from PIL import Image, ImageDraw, ImageFont

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PDF = REPO_ROOT / "assets-source" / "book.pdf"
DEFAULT_OUTPUT_ROOT = REPO_ROOT / "public" / "images" / "phrases"
DEFAULT_DEBUG_DIR = REPO_ROOT / "assets-source" / "debug"


def parse_pages(spec: str, total: int) -> list[int]:
    """Parse a 1-indexed page spec like '1', '1-5', or '1,3,5' into a sorted list."""
    pages: set[int] = set()
    for chunk in spec.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        if "-" in chunk:
            lo, hi = chunk.split("-", 1)
            for p in range(int(lo), int(hi) + 1):
                pages.add(p)
        else:
            pages.add(int(chunk))
    out = sorted(p for p in pages if 1 <= p <= total)
    if not out:
        raise ValueError(f"no valid pages in spec {spec!r} for a {total}-page PDF")
    return out


def render_page(pdf_path: Path, page_index: int, dpi: int) -> Image.Image:
    """Render a single page (0-indexed) of the PDF as a PIL RGB image."""
    with fitz.open(pdf_path) as doc:
        page = doc.load_page(page_index)
        pix = page.get_pixmap(dpi=dpi, alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def detect_grid_bbox(img: Image.Image, threshold: int = 180) -> tuple[int, int, int, int]:
    """Return (left, top, right, bottom) of the dark-ink bounding box on the page.

    Brown borders are well below the threshold; beige background is well above.
    Pillow's getbbox() returns the bbox of non-zero pixels, so we threshold to
    a binary mask first (dark → 255, light → 0) and call getbbox() on that.
    """
    gray = img.convert("L")
    mask = gray.point(lambda p, t=threshold: 255 if p < t else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise RuntimeError("could not detect any dark pixels on this page — is the PDF blank?")
    return bbox


def compute_cells(
    grid_bbox: tuple[int, int, int, int],
    rows: int,
    cols: int,
    gutter_x: int,
    gutter_y: int,
    inset_x: int,
    inset_y: int,
) -> list[tuple[int, int, int, int, int]]:
    """Compute crop rectangles for each cell.

    Returns (phrase_number, left, top, right, bottom) per cell. RTL numbering:
    top-right is phrase 001, top-left is phrase 005, bottom-left is phrase 035.

    `gutter_x/y` carves whitespace between adjacent cells out of the grid
    before dividing into cells. `inset_x/y` then trims inside each cell to
    crop just past the brown border.
    """
    gl, gt, gr, gb = grid_bbox
    grid_w = gr - gl
    grid_h = gb - gt
    cell_w = (grid_w - (cols - 1) * gutter_x) / cols
    cell_h = (grid_h - (rows - 1) * gutter_y) / rows

    cells = []
    for r in range(rows):
        for c in range(cols):
            phrase_num = r * cols + (cols - 1 - c) + 1
            cell_left = gl + c * (cell_w + gutter_x)
            cell_top = gt + r * (cell_h + gutter_y)
            x0 = round(cell_left) + inset_x
            y0 = round(cell_top) + inset_y
            x1 = round(cell_left + cell_w) - inset_x
            y1 = round(cell_top + cell_h) - inset_y
            cells.append((phrase_num, x0, y0, x1, y1))
    cells.sort(key=lambda t: t[0])
    return cells


def remove_background(img: Image.Image) -> Image.Image:
    """Remove the cream/beige background, leaving ink on a transparent layer.

    Uses Euclidean RGB distance from the known background colour (~243,243,208)
    so both black ink (lum≈20) and red ink (lum≈80) are fully preserved.

    Thresholds:
      dist >= 60  → fully opaque (ink centre)
      dist <= 12  → fully transparent (background)
      between     → linear alpha interpolation (anti-aliasing edges)

    Output mode: RGBA.
    """
    bg_r, bg_g, bg_b = 243, 243, 208
    dist_opaque, dist_transp = 60, 12
    span = dist_opaque - dist_transp

    rgb = img.convert("RGB")
    out = rgb.convert("RGBA")
    pixels = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = ((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2) ** 0.5
            if dist >= dist_opaque:
                pixels[x, y] = (r, g, b, 255)
            elif dist <= dist_transp:
                pixels[x, y] = (r, g, b, 0)
            else:
                alpha = round((dist - dist_transp) / span * 255)
                pixels[x, y] = (r, g, b, alpha)
    return out


def save_crops(
    page_img: Image.Image,
    cells: list[tuple[int, int, int, int, int]],
    out_dir: Path,
    use_webp: bool,
    remove_bg: bool = False,
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    ext = "webp" if use_webp else "png"
    for phrase_num, x0, y0, x1, y1 in cells:
        crop = page_img.crop((x0, y0, x1, y1))
        if remove_bg:
            crop = remove_background(crop)
        out_path = out_dir / f"phrase-{phrase_num:03d}.{ext}"
        if use_webp:
            crop.save(out_path, format="WEBP", quality=90, method=6)
        else:
            crop.save(out_path, format="PNG", optimize=True)


def write_debug_overlay(
    page_img: Image.Image,
    cells: list[tuple[int, int, int, int, int]],
    grid_bbox: tuple[int, int, int, int],
    rows: int,
    cols: int,
    gutter_x: int,
    gutter_y: int,
    out_path: Path,
) -> None:
    overlay = page_img.copy()
    # Use a separate transparent layer for gutter shading so we don't smear
    # solid gray over the page when gutters are non-zero.
    shade_layer = Image.new("RGBA", overlay.size, (0, 0, 0, 0))
    shade = ImageDraw.Draw(shade_layer)

    gl, gt, gr, gb = grid_bbox
    grid_w = gr - gl
    grid_h = gb - gt
    cell_w = (grid_w - (cols - 1) * gutter_x) / cols
    cell_h = (grid_h - (rows - 1) * gutter_y) / rows

    # Light-gray fill on the gutter strips so the user can see if the
    # specified gutter matches the visible whitespace between cells.
    if gutter_x > 0:
        for c in range(cols - 1):
            x0 = round(gl + (c + 1) * cell_w + c * gutter_x)
            x1 = x0 + gutter_x
            shade.rectangle((x0, gt, x1, gb), fill=(150, 150, 150, 110))
    if gutter_y > 0:
        for r in range(rows - 1):
            y0 = round(gt + (r + 1) * cell_h + r * gutter_y)
            y1 = y0 + gutter_y
            shade.rectangle((gl, y0, gr, y1), fill=(150, 150, 150, 110))

    overlay = Image.alpha_composite(overlay.convert("RGBA"), shade_layer).convert("RGB")
    draw = ImageDraw.Draw(overlay)

    # Outer grid bbox in blue, cells in red.
    draw.rectangle(grid_bbox, outline=(0, 80, 200), width=4)

    try:
        # Pillow ships DejaVuSans on most platforms; fall back to default if not.
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", size=48)
    except OSError:
        font = ImageFont.load_default()

    for phrase_num, x0, y0, x1, y1 in cells:
        draw.rectangle((x0, y0, x1, y1), outline=(220, 30, 30), width=3)
        label = f"{phrase_num:03d}"
        # Label sits just inside the top-left of each cell.
        draw.text((x0 + 8, y0 + 4), label, fill=(220, 30, 30), font=font)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    overlay.save(out_path, format="PNG", optimize=True)


def process_page(
    pdf_path: Path,
    page_number: int,  # 1-indexed
    args: argparse.Namespace,
) -> None:
    page_img = render_page(pdf_path, page_number - 1, args.dpi)

    # Apply manual margin overrides where provided; only run auto-detect if
    # at least one edge is unspecified (it's slow-ish and unreliable when the
    # page has ink outside the grid).
    page_w, page_h = page_img.size
    needs_auto = any(
        v is None
        for v in (args.margin_left, args.margin_top, args.margin_right, args.margin_bottom)
    )
    if needs_auto:
        al, at, ar, ab = detect_grid_bbox(page_img)
    else:
        al = at = ar = ab = 0  # unused
    grid_bbox = (
        args.margin_left if args.margin_left is not None else al,
        args.margin_top if args.margin_top is not None else at,
        (page_w - args.margin_right) if args.margin_right is not None else ar,
        (page_h - args.margin_bottom) if args.margin_bottom is not None else ab,
    )

    cells = compute_cells(
        grid_bbox, args.rows, args.cols,
        args.gutter_x, args.gutter_y,
        args.inset_x, args.inset_y,
    )

    lesson_id = f"lesson-{page_number:02d}"
    out_dir = Path(args.output_root) / lesson_id

    print(
        f"page {page_number:>3} → {lesson_id}: "
        f"grid={grid_bbox} gutter=({args.gutter_x},{args.gutter_y}) "
        f"inset=({args.inset_x},{args.inset_y}) cells={len(cells)}"
    )

    if not args.preview:
        save_crops(page_img, cells, out_dir, use_webp=args.webp, remove_bg=args.remove_bg)
        print(f"           crops → {out_dir.relative_to(REPO_ROOT)}")
    else:
        print(f"           crops skipped (--preview)")

    if args.debug or args.preview:
        debug_path = DEFAULT_DEBUG_DIR / f"{lesson_id}-overlay.png"
        write_debug_overlay(
            page_img, cells, grid_bbox,
            args.rows, args.cols, args.gutter_x, args.gutter_y,
            debug_path,
        )
        print(f"           overlay → {debug_path.relative_to(REPO_ROOT)}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pdf", type=Path, default=DEFAULT_PDF, help=f"path to source PDF (default: {DEFAULT_PDF.relative_to(REPO_ROOT)})")
    ap.add_argument("--page", default="1", help="page spec: N, N-M, or N,M (1-indexed). Default: 1")
    ap.add_argument("--all", action="store_true", help="process every page (overrides --page)")
    ap.add_argument("--dpi", type=int, default=300)
    ap.add_argument("--rows", type=int, default=7)
    ap.add_argument("--cols", type=int, default=4)

    ap.add_argument("--margin-top", type=int, default=None, help="manual override of auto-detected grid top edge")
    ap.add_argument("--margin-bottom", type=int, default=None, help="manual override of auto-detected grid bottom edge")
    ap.add_argument("--margin-left", type=int, default=None)
    ap.add_argument("--margin-right", type=int, default=None)

    ap.add_argument("--gutter-x", type=int, default=0, help="horizontal whitespace between adjacent cells, in pixels (default: 0)")
    ap.add_argument("--gutter-y", type=int, default=0, help="vertical whitespace between adjacent rows, in pixels (default: 0)")

    ap.add_argument("--inset", type=int, default=None, help="shorthand: sets both --inset-x and --inset-y")
    ap.add_argument("--inset-x", type=int, default=4, help="pixels to crop inside the cell border, horizontally (default: 4)")
    ap.add_argument("--inset-y", type=int, default=4, help="pixels to crop inside the cell border, vertically (default: 4)")

    ap.add_argument("--preview", action="store_true", help="skip writing the 35 crops; only render the overlay (implies --debug). Fast iteration.")
    ap.add_argument("--debug", action="store_true", help="also write a numbered overlay PNG to assets-source/debug/")
    ap.add_argument("--webp", action="store_true", help="save .webp at quality 90 instead of .png")
    ap.add_argument("--remove-bg", action="store_true", help="remove the cream background from each crop, leaving ink on a transparent layer")
    ap.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    args = ap.parse_args()

    if args.inset is not None:
        args.inset_x = args.inset
        args.inset_y = args.inset

    if not args.pdf.exists():
        print(f"error: PDF not found at {args.pdf}", file=sys.stderr)
        return 1

    with fitz.open(args.pdf) as doc:
        total_pages = doc.page_count

    if args.all:
        page_numbers = list(range(1, total_pages + 1))
    else:
        try:
            page_numbers = parse_pages(args.page, total_pages)
        except ValueError as e:
            print(f"error: {e}", file=sys.stderr)
            return 1

    for pn in page_numbers:
        process_page(args.pdf, pn, args)

    return 0


if __name__ == "__main__":
    sys.exit(main())
