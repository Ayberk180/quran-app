# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

## [0.3.0] — 2026-05-31

### Added — Supabase backend
- **Database schema** (`supabase/migrations/`) — 4 tables (`schools`, `profiles`,
  `lesson_progress`, `login_events`) + `auth_attempts` (rate limiting) +
  `instructor_roster` view. Sized for ~2 MB/year at 200 students.
- **Row-level security** — `0002_rls.sql` enforces per-school isolation;
  `auth_school_id()` / `auth_user_role()` `SECURITY DEFINER` helpers prevent
  RLS recursion. Service-role-only access on `auth_attempts`.
- **Auth Edge Functions**:
  - `pin-signin` — 6-digit student PIN → Supabase session via HMAC-SHA256
    deterministic password derivation (PIN + `STUDENT_AUTH_SECRET`). Includes
    per-IP rate limiter: 3 failed attempts → 60s lockout.
  - `add-student` — instructor-only flow that generates a non-blacklisted PIN
    (avoids `000000`, `123456`, etc.), creates the `auth.users` row, and
    inserts the profile. Rolls back the auth user if the profile insert fails.

### Added — UI
- **Sign-in screen** (`#/login`, `src/components/LoginView.jsx`) — kid-friendly
  4×3 numeric PIN pad for students with bilingual TR/EN labels; togglable
  instructor email/password form.
- **Student dashboard** (`#/me`, `src/components/StudentDashboard.jsx`) —
  welcome header, "current lesson" callout (lowest unpassed), 28-lesson grid
  with passed badges, sign-out, completion meta.
- **Instructor portal** (`#/instructor`, `src/components/InstructorView.jsx`) —
  roster table (name, current lesson, 7d / 30d login counts, last-seen) sourced
  from the `instructor_roster` view. Horizontal scroll on narrow screens.
  Action bar with "+ Add Student" and "Consent form" buttons.
- **Per-student detail** (`src/components/InstructorStudentDetail.jsx`) —
  click-to-toggle lesson grid (optimistic with rollback) + adaptive CSS bar
  chart (daily ≤30d, weekly otherwise) + range pills 7d/30d/90d/180d/1y.
- **Add Student modal** (`src/components/AddStudentForm.jsx`) — collects first
  name + optional last initial; required parental-consent checkbox; success
  panel shows the generated PIN once with a link to the printable card.
- **Printable PIN card** (`#/instructor/student/:id/print-card`) and bilingual
  **Parental Consent template** (`#/instructor/print-consent`) — plain pages
  with `@media print` rules; uses the browser's built-in PDF export.
- **Privacy page** (`#/privacy`, `src/components/PrivacyPage.jsx`) — public,
  bilingual, lists exactly what's stored and what isn't.
- **App header auth chip** — small "Sign in" / "My progress" / "Instructor"
  link in the home header that adapts to the current auth state.

### Added — Tokens, libs, docs
- `src/lib/supabase.js` — Supabase client singleton (gracefully no-ops without
  env vars).
- `src/lib/auth.js` — `signInWithPin`, `signInWithEmail`, `signOut`,
  `getProfile`, `onAuthChange`; records `login_events` on every successful
  sign-in; parses Edge Function error bodies for usable messages.
- `src/lib/progress.js` — student-side lesson progress fetch + `findCurrentLesson`.
- `src/lib/instructor.js` — roster, lesson-status upsert, login-event range queries.
- `src/lib/admin.js` — `addStudent` wrapper around the Edge Function.
- `supabase/README.md` — setup walkthrough (CLI link, secret, function deploys,
  RLS verification, full migrations checklist).
- `.env.local` is now gitignored.
- New dependency: `@supabase/supabase-js ^2.45.0`.

### Added — Design system
- `.lesson-card--current` and `.lesson-card--locked` modifiers (the
  `--completed` modifier was added during the styling overhaul).
- Component CSS for PIN pad, modal, add-student form, print pages, instructor
  table + range pills + bar chart, privacy page, app footer auth link.

### Changed
- **Ottoman / Kilim visual system** — replaced the previous Mountain
  Scriptorium palette: warm parchment background (`#F9F6F0`), Iznik Blue
  (`#0B4F6C`), Madder Red kilim top-border (`#8B2635`), Saffron Gold accents
  (`#D4AF37`). New typography: Amiri (Arabic), Cinzel (English headings),
  Inter (UI). `vite.config.js` adds `cacheDir: 'node_modules/.vite'` to keep
  Vite cache inside the Linux filesystem under WSL.
- **Lesson cards** — square `aspect-ratio: 1/1` on desktop, unset on
  ≤768px; Iznik Blue border, subtle radial watermark, soft drop shadow.
- **Phrase tiles** — parchment background, faint Saffron Gold rest border,
  `translateY(-2px)` lift on hover, `filter: brightness(0) invert(1)` on
  `[data-playing="true"]` to turn black/red ink white over an Iznik Blue tile.
- **Lesson grid** — explicit responsive breakpoints (4 → 2 → 1 col).
- **PROJECT_BRIEF.md** — §2 rewritten to document the Supabase architecture;
  §10 reorganized into out-of-scope vs recently-implemented.
- **CLAUDE.md** — stack updated; new principles around RLS as the security
  boundary and minimum-PII storage.

---

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
