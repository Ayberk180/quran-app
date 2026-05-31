# Instructions for Claude Code

You are working on the **Masjid Quran Learning App**. Before doing anything else, read `PROJECT_BRIEF.md` in this directory — it is the source of truth for goals, architecture, conventions, and the work plan.

## Quick reference

- **Stack:** Vite + React 19 + Tailwind CSS v4. PWA with service worker. **Supabase backend** (Postgres + Auth + Edge Functions) for accounts and analytics.
- **Mobile path:** Capacitor wrapping the same codebase later. Don't write code that would block this.
- **Lesson data:** `public/data/lessons.json` is the runtime manifest. Schema in `PROJECT_BRIEF.md` §4.
- **Backend code:** `supabase/migrations/` (SQL) and `supabase/functions/` (Deno Edge Functions). See `supabase/README.md` for setup steps.
- **Asset pipeline:** Python scripts in `scripts/`. They run locally on the maintainer's machine, not in the browser.
- **Env vars:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (frontend) in `.env.local`; `STUDENT_AUTH_SECRET` (Edge Functions) via `supabase secrets set`. None are committed.

## Working principles

1. **Ask before adding dependencies.** Every package is future maintenance burden for a volunteer-run project.
2. **Don't break stable IDs.** `lesson-XX` and `phrase-YYY` IDs in `lessons.json` are referenced by `lesson_progress.lesson_id` in Supabase. Once shipped, never renumber.
3. **RTL-aware.** Arabic content reads right-to-left. The lesson layout should reflect that.
4. **Mobile-first.** Test at ~380px width before declaring UI done.
5. **Offline-capable for lessons.** The PWA must still play lessons after first load with no network. The backend (accounts, dashboards) requires connectivity by design.
6. **Minimum PII.** First name + optional last initial + a system-generated PIN are all we store about minors. No email, DOB, IP, or third-party tracking. Don't add fields without a documented reason.
7. **RLS is the security boundary.** Every Supabase table has RLS enabled. New columns or queries must be checked against the policies in `supabase/migrations/0002_rls.sql`. Service-role access is for Edge Functions only.

## Workflow

- Build in the phases laid out in `PROJECT_BRIEF.md` §7. Don't jump ahead.
- After each phase, the app should still be runnable (`npm run dev` works, no console errors).
- When in doubt about a UX decision, propose 2 options and explain the tradeoffs rather than picking silently.
- New SQL must go in a numbered file under `supabase/migrations/`. Don't edit existing migrations — add new ones.

## Things to flag, don't silently fix

- Audio files with no matching image (or vice versa) — surface in the build output, don't drop them.
- Phrase IDs that conflict with existing entries in `lessons.json`.
- Any new field that would store data on minors beyond what's listed in `supabase/README.md` and the privacy page (`src/components/PrivacyPage.jsx`). Discuss before adding.
- Schema changes that would affect existing `lesson_progress` rows — propose a migration plan first.

## When the user says "let's start Phase N"

Re-read `PROJECT_BRIEF.md` §7 for that phase's deliverables, then propose a step-by-step plan before writing code.
