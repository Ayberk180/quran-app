# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

## [0.2.0] — 2026-05-21

### Added
- **React migration** — Converted from vanilla JS to React 19. New files:
  `src/main.jsx`, `src/App.jsx`, `src/components/LessonList.jsx`,
  `src/components/LessonView.jsx`, `src/components/PhraseButton.jsx`.
  Hash-based routing via `useState`/`useEffect` (no React Router dependency).
- **Tailwind CSS v4** — Added `@tailwindcss/vite` plugin. Mountain Scriptorium
  design tokens are exposed as Tailwind utilities via `@theme {}` (e.g.
  `bg-pine`, `text-stone`, `border-fleece`, `font-arabic`).
- **Image background removal** — `scripts/remove-bg.py`: batch processor that
  removes the cream/beige PDF background from all phrase PNGs using
  Euclidean RGB distance from the known background colour. Preserves both
  black and red Arabic ink with smooth anti-aliasing. 792 images processed.
- **`--remove-bg` flag for `slice-pdf.py`** — Future PDF slices can strip the
  background in one pass: `python scripts/slice-pdf.py --page N --remove-bg`.
- **PRODUCT.md** — Strategic design document: users, brand personality
  (Serene / Grounded / Timeless), Caucasus aesthetic direction, anti-references,
  design principles, and accessibility requirements.
- **DESIGN.md** — Design system reference: Mountain Scriptorium north star,
  OKLCH colour palette, typography rules, named design laws
  (Mountainside Pine Rule, Two-Voice Rule, No-Shadow Rule, etc.).
- **Lessons 02–28** — Phrase images for all remaining lessons added to
  `public/images/phrases/`.
- **Lesson 28 audio** — Audio files added to `public/audio/phrases/lesson-28/`.

### Changed
- **Vite upgraded** from v5 to v8 (required by `@vitejs/plugin-react` v6).
- **Design system rewrite** (`src/styles.css`) — Full OKLCH token set
  (`--pine`, `--fleece`, `--granite`, `--stone`, `--ridge`, `--ridge-2`),
  Amiri Quran typeface for Arabic content, lesson-number hero tiles (2.5rem /
  800 weight), bilingual labels throughout (Turkish first).
- **Phrase tile backgrounds** — Changed from `var(--fleece)` (cream) to
  `var(--ridge)` (near-white) so transparent images render without colour cast.
- **`public/manifest.json`** — `background_color` updated to `#fcfcfb`
  (tinted toward pine, matching Snow Ridge).
- **`scripts/slice-pdf.py`** — Added `--cols` documentation note for
  5-column pages; integrated `remove_background()` function.

### Removed
- `src/main.js`, `src/components/lesson-list.js`, `src/components/lesson-view.js`,
  `src/components/phrase-button.js` — replaced by their `.jsx` equivalents.
- Cream/warm `#app:has(.lesson-view)` background rule — removed because
  transparent phrase images made the fleece colour bleed through tile gaps.

### Fixed
- Lesson view cream background — phrase tiles and page background are now
  consistently Snow Ridge (near-white) regardless of route.

---

## [0.1.0] — Initial commit

- Vite + vanilla JS/HTML/CSS PWA skeleton.
- Hash-based router, manifest loader, lesson list, lesson view, phrase button stub.
- PDF slicing script (`scripts/slice-pdf.py`) with RTL grid, debug overlay,
  auto grid-bbox detection, WebP support.
- Service worker skeleton (offline caching not yet active).
- `lessons.json` manifest with lesson-01 phrases.
