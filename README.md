# Masjid Quran Learning App

A simple, offline-capable web app for kids to learn Quranic phrases with audio. Built as a PWA, with a path to native mobile via Capacitor.

## Status

🚧 In setup. See `PROJECT_BRIEF.md` for the full plan.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## How it works

- All phrase images and audio clips are static files under `public/`.
- `public/data/lessons.json` describes lessons and links each phrase to its image + audio.
- The app reads the manifest, renders tappable buttons, and plays audio on tap.
- Service worker caches everything for offline use after the first visit.

## Documentation

- **`PROJECT_BRIEF.md`** — full project spec, architecture, conventions, build phases.
- **`CLAUDE.md`** — instructions for Claude Code when working in this repo.

## Asset pipeline

The PDF book is sliced into per-phrase images, then matched with pre-recorded audio. See `PROJECT_BRIEF.md` §5.

```bash
# After dropping the source PDF into assets-source/book.pdf:
python scripts/slice-pdf.py
python scripts/build-manifest.py
python scripts/optimize-assets.py
```

## License

TBD. The app code can be open. The recorded audio and book images may not be — confirm permissions before publishing.
