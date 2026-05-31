# Project Brief: Masjid Quran Learning App

> This document is the source of truth for the project. It describes goals, architecture, conventions, and the work plan. Claude Code should read this first and reference it throughout the build.

---

## 1. Purpose

A web app (later mobile) for kids at our local masjid to learn Quranic phrases. Each phrase from the existing teaching book is shown as an image, and tapping it plays a recorded audio clip of the correct pronunciation. The app should:

- Replicate the structure of the existing physical book, lesson by lesson
- Let kids learn pronunciation independently when a teacher isn't standing over them
- Work offline (classrooms with bad wifi)
- Eventually run as an installable mobile app
- Be maintainable by a non-developer (volunteer)

This is a sadaqah jariyah project. Simplicity, reliability, and longevity matter more than fancy features.

---

## 2. Architecture Decisions

### Lesson content: static files
All phrase images and audio clips are static assets bundled with the app. The browser caches them after the first visit. Estimated total payload: **15–40 MB** for a full Qaida-style book (~200–400 phrases). Lesson playback works fully offline.

### Accounts & progress: Supabase backend (added 2026-05)
Student accounts, lesson-pass tracking, and login analytics live in a Supabase Postgres database. Row-level security policies enforce per-school isolation. The PWA continues to work offline for lesson playback; only sign-in and progress sync require connectivity.

- **Auth:** Supabase Auth — email/password for instructors and admins; PIN-based custom flow for students (COPPA-friendly, no child emails) via a Supabase Edge Function.
- **Schema:** four tables (`schools`, `profiles`, `lesson_progress`, `login_events`) plus an `auth_attempts` table for PIN rate limiting and an `instructor_roster` view for the dashboard. See `supabase/migrations/`.
- **Edge Functions:** `pin-signin` (rate-limited PIN → session exchange) and `add-student` (instructor-only student onboarding).
- **PII scope:** first name (+ optional last initial), 6-digit PIN, lesson statuses, login timestamps. **Not stored:** email, DOB, IP, photos, raw click events. Parental consent is captured on paper and recorded as a `consent_collected_at` timestamp.

### Stack
- **Vite** for dev server / bundler.
- **React 19 + Tailwind CSS v4** for the UI (migrated from vanilla JS in v0.2.0).
- **Progressive Web App (PWA)** with service worker for offline lesson playback and installability.
- **Supabase** (Postgres + Auth + Edge Functions) for accounts and analytics.

### Hosting
- **App:** Cloudflare Pages, Netlify, or GitHub Pages (static, free tiers).
- **Backend:** Supabase managed free tier — well within limits at the project's 50–200 student scale (under ~2 MB/year of data, the free tier offers 500 MB).

### Mobile path
When we want native apps later: wrap the same React codebase with **Capacitor**. The Supabase JS client works inside Capacitor unchanged.

---

## 3. File Structure

```
quran-app/
├── PROJECT_BRIEF.md              ← this file
├── CLAUDE.md                     ← instructions for Claude Code
├── README.md                     ← quick start for humans
├── .gitignore
├── package.json
├── vite.config.js
├── index.html                    ← app shell
│
├── src/
│   ├── main.js                   ← app entry point
│   ├── styles.css                ← global styles
│   ├── service-worker.js         ← PWA offline caching
│   ├── components/
│   │   ├── lesson-list.js        ← renders the list of lessons
│   │   ├── lesson-view.js        ← renders phrases inside a lesson
│   │   ├── phrase-button.js      ← single tappable phrase tile
│   │   └── audio-player.js       ← audio playback wrapper
│   └── lib/
│       ├── manifest.js           ← loads & validates lessons.json
│       ├── progress.js           ← localStorage progress tracking
│       └── audio-cache.js        ← preloads audio for current lesson
│
├── public/
│   ├── manifest.json             ← PWA manifest (icons, name, theme)
│   ├── icons/                    ← app icons for install
│   ├── data/
│   │   └── lessons.json          ← THE manifest: lessons + phrases
│   ├── images/
│   │   └── phrases/
│   │       ├── lesson-01/
│   │       │   ├── phrase-001.webp
│   │       │   └── phrase-002.webp
│   │       └── lesson-02/...
│   └── audio/
│       └── phrases/
│           ├── lesson-01/
│           │   ├── phrase-001.mp3
│           │   └── phrase-002.mp3
│           └── lesson-02/...
│
├── scripts/
│   ├── slice-pdf.py              ← cuts the PDF into per-phrase images
│   ├── build-manifest.py         ← generates lessons.json from folders
│   └── optimize-assets.py        ← compresses images & audio
│
└── assets-source/                ← original PDF + raw audio (not committed)
    ├── book.pdf
    └── audio-raw/
```

---

## 4. Data Schema

The single source of truth at runtime is `public/data/lessons.json`. The app reads this on load and builds the UI from it.

```json
{
  "version": 1,
  "title": "Masjid Quran Learning",
  "lessons": [
    {
      "id": "lesson-01",
      "number": 1,
      "title": "The Arabic Letters",
      "title_ar": "الحروف العربية",
      "description": "Individual letters, isolated form.",
      "phrases": [
        {
          "id": "phrase-001",
          "image": "/images/phrases/lesson-01/phrase-001.webp",
          "audio": "/audio/phrases/lesson-01/phrase-001.mp3",
          "transliteration": "alif",
          "notes": ""
        }
      ]
    }
  ]
}
```

**Conventions:**
- IDs are stable, kebab-case, zero-padded (`lesson-01`, `phrase-001`). Never reuse or renumber after release — progress tracking depends on these.
- Image and audio paths are absolute from the public root.
- `title_ar`, `transliteration`, and `notes` are optional and may be empty strings.
- Add fields by appending; never remove or rename existing fields without bumping `version`.

---

## 5. Asset Pipeline

This is the trickiest part of the project. The PDF needs to be sliced into one image per phrase, then matched up with the corresponding audio clip.

### Step A: Slice the PDF
`scripts/slice-pdf.py` should:
1. Convert each PDF page to a high-resolution PNG (use `pdf2image`, 300 DPI).
2. Detect phrase bounding boxes — likely via OpenCV: find contours of dark regions on the white page, group them into rows/columns based on the book's layout.
3. Crop each box and save as `public/images/phrases/lesson-XX/phrase-YYY.webp`.
4. Output a CSV the user can review & correct (page → phrase ID → coordinates) before the final crop.

**Realistic expectation:** automation will get ~80% of the way. The remaining 20% will need manual adjustment. Build the script with that in mind — make it easy to re-run on a single page after fixing the CSV.

### Step B: Place audio
Audio clips are already recorded. The user will manually drop each `.mp3` into `public/audio/phrases/lesson-XX/phrase-YYY.mp3`. Filenames must match the phrase IDs.

### Step C: Build the manifest
`scripts/build-manifest.py` walks the `public/images/phrases/` and `public/audio/phrases/` folders, pairs files by ID, and emits `public/data/lessons.json`. It should:
- Warn loudly if an image has no matching audio (or vice versa).
- Preserve any human-edited fields (titles, transliterations) — don't blow them away on regeneration. Easiest approach: read the existing `lessons.json` first and merge.

### Step D: Optimize
`scripts/optimize-assets.py` should:
- Convert images to WebP, target ~30–50 KB each.
- Re-encode MP3s to ~64 kbps mono (speech, not music — this is plenty).

---

## 6. UI / UX Notes

- **Audience is kids**, possibly ages 4–12. UI should be tappable on phones and tablets, big buttons, minimal text, clear visual feedback.
- **Phrase buttons** should briefly highlight or pulse while audio plays. No autoplay chaining unless explicitly opted in.
- **Lesson list** should be a simple grid or vertical list; show progress (e.g., a star or checkmark per completed lesson).
- **Right-to-left** layout for Arabic content. The lesson view should read right-to-left to match how the book is laid out.
- **No ads, no tracking, no external requests** beyond fetching the app's own assets.
- **Accessibility:** every audio button should have an `aria-label` (e.g., the transliteration).

---

## 7. Build Phases

Build in this order. Each phase should produce something runnable.

### Phase 1: Skeleton (no real assets)
- Vite project set up, `npm run dev` works.
- `index.html` loads, basic styles applied.
- `lessons.json` has 1–2 fake lessons with placeholder images & audio.
- Lesson list renders, clicking a lesson opens the lesson view, clicking a phrase plays its audio.

### Phase 2: PWA shell
- `manifest.json` with name, icons, theme color.
- Service worker caches the app shell + assets on first visit.
- App is installable and works offline.

### Phase 3: Asset pipeline
- `slice-pdf.py` produces images from a single test page.
- `build-manifest.py` generates a valid `lessons.json` from the folder contents.
- Iterate on PDF slicing until output is clean for the full book.

### Phase 4: Real content
- All lessons sliced, all audio in place.
- Manifest regenerated.
- Manual QA pass: every phrase plays the right audio.

### Phase 5: Polish
- Progress tracking (localStorage): mark phrases as "heard," count per lesson.
- Right-to-left lesson layout.
- Better visual feedback during playback.
- Optional: settings page (volume, autoplay toggle).

### Phase 6 (later): Mobile
- Wrap with Capacitor.
- Generate iOS + Android builds.
- Submit to stores if desired (this introduces ongoing maintenance — discuss before committing).

---

## 8. Conventions for Claude Code

- **Keep dependencies minimal.** Every package added is a future maintenance burden. Justify additions in commit messages.
- **No frameworks added without discussion.** If a feature seems to "need" React, propose it first.
- **Comment the why, not the what.** Especially in the asset pipeline scripts.
- **Test on a phone-sized viewport** before declaring any UI work done. This app's primary device is a parent's or teacher's phone.
- **Don't commit `assets-source/`** — it's gitignored. Source PDFs and raw audio stay local.
- **Don't break existing IDs in `lessons.json`.** Progress data in users' browsers is keyed off them.

---

## 9. Open Questions (decide before starting Phase 4)

- **Which book exactly?** Title, author, edition. Confirms which audio matches which phrase.
- **Audio reciter / qari?** Permission to redistribute the recordings? (Important — even for a free masjid app, redistributing someone else's recordings without permission is not okay.)
- **Languages on the UI?** English only, or English + Arabic + (Urdu / Bengali / Turkish / etc.)?
- **Right-to-left or left-to-right page order?** The book is RTL; the lesson list could go either way.
- **Who owns the deployment?** A volunteer's Cloudflare account? A masjid-owned account? Decide before pushing live.

---

## 10. Out of Scope (for now)

- Multi-tenant (other masjids using their own books)
- Quizzes, gamification beyond simple progress markers
- AI pronunciation grading (microphone input)
- Per-phrase activity tracking (click counts, time-on-phrase)
- Real-time collaborative views (instructor watching a student's screen)
- Mobile push notifications

### Recently moved IN scope (implemented 2026-05)

- Student accounts (PIN-based, COPPA-friendly)
- Cloud-synced lesson-pass tracking (binary passed / not-passed, instructor-managed)
- Instructor dashboard: student roster + login-frequency analytics over selectable date ranges
- Parental consent flow (printable bilingual form + `consent_collected_at` audit field)
- Per-IP rate limiting on PIN sign-in
