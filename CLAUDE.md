# Instructions for Claude Code

You are working on the **Masjid Quran Learning App**. Before doing anything else, read `PROJECT_BRIEF.md` in this directory — it is the source of truth for goals, architecture, conventions, and the work plan.

## Quick reference

- **Stack:** Vite + vanilla JS/HTML/CSS, PWA with service worker, no backend.
- **Mobile path:** Capacitor wrapping the same codebase later. Don't write code that would block this.
- **Data source:** `public/data/lessons.json` is the runtime manifest. Schema is documented in `PROJECT_BRIEF.md` §4.
- **Asset pipeline:** Python scripts in `scripts/`. They run locally on the maintainer's machine, not in the browser.

## Working principles

1. **Ask before adding dependencies.** Every package is future maintenance burden for a volunteer-run project.
2. **Ask before adding a framework** (React, Vue, Svelte, etc.). The default answer is "no, vanilla JS is fine."
3. **Don't break stable IDs.** `lesson-XX` and `phrase-YYY` IDs in `lessons.json` are referenced by users' saved progress in `localStorage`. Once shipped, never renumber.
4. **RTL-aware.** Arabic content reads right-to-left. The lesson layout should reflect that.
5. **Mobile-first.** Test at ~380px width before declaring UI done.
6. **Offline-capable.** The PWA must work with no network after first load.
7. **No tracking, no analytics, no external fetches** beyond the app's own assets.

## Workflow

- Build in the phases laid out in `PROJECT_BRIEF.md` §7. Don't jump ahead.
- After each phase, the app should still be runnable (`npm run dev` works, no console errors).
- When in doubt about a UX decision, propose 2 options and explain the tradeoffs rather than picking silently.

## Things to flag, don't silently fix

- Audio files with no matching image (or vice versa) — surface in the build output, don't drop them.
- Phrase IDs that conflict with existing entries in `lessons.json`.
- Anything that would require a backend to implement — propose an offline alternative first.

## When the user says "let's start Phase N"

Re-read `PROJECT_BRIEF.md` §7 for that phase's deliverables, then propose a step-by-step plan before writing code.
