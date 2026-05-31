# Supabase Setup

This directory holds the database schema, RLS policies, and Edge Functions
that power student accounts, lesson-pass tracking, and instructor analytics.

## One-time project setup

1. **Create a Supabase project** at https://supabase.com (free tier is fine).
2. **Apply the migrations.** In the project dashboard → SQL Editor, paste and
   run each file in order:
   - `migrations/0001_init.sql` — creates 4 tables and indexes
   - `migrations/0002_rls.sql` — enables row-level security with policies
3. **Seed your school** (one-time). In the SQL Editor:
   ```sql
   insert into schools (name) values ('Your Masjid Name')
   returning id;
   -- Note the returned id; you'll use it in step 5.
   ```
4. **Create the first admin user** via Authentication → Users → Add user
   (Invite via email or Create with password). Note their UUID.
5. **Link the admin's auth user to a profile** (replace the UUID and school id):
   ```sql
   insert into profiles (id, school_id, role, first_name)
   values ('00000000-0000-0000-0000-000000000000', 1, 3, 'Admin');
   ```
6. **Copy your project URL and anon key** (Settings → API) into
   `quran-app/.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
   `.env.local` is gitignored — never commit it.

## Phase 2 setup — Edge Function for PIN sign-in

The `pin-signin` Edge Function exchanges a 6-digit student PIN for a Supabase
session. It needs one extra secret (used to derive deterministic per-student
auth passwords from PINs, kept server-side only).

1. **Install the Supabase CLI** (one-time):
   <https://supabase.com/docs/guides/local-development/cli/getting-started>

2. **Link the CLI to your project**:
   ```bash
   cd quran-app
   supabase login
   supabase link --project-ref <your-project-ref>
   ```
   Your project ref is the subdomain of your project URL
   (`xxxxxxxxxxxx` in `https://xxxxxxxxxxxx.supabase.co`).

3. **Set the secret** used to derive student passwords. Generate a long
   random string and store it:
   ```bash
   supabase secrets set STUDENT_AUTH_SECRET="$(openssl rand -hex 32)"
   ```
   This value must never change after students are created — changing it
   invalidates all existing PINs. Back it up.

4. **Deploy the functions**:
   ```bash
   supabase functions deploy pin-signin
   supabase functions deploy add-student
   ```
   `add-student` is Phase 5's "Add Student" handler — it generates the PIN,
   creates the auth.users row with the matching derived password, and inserts
   the profiles row. Both functions share the same `STUDENT_AUTH_SECRET`.

5. **Test instructor sign-in** (PIN sign-in is testable end-to-end only after
   Phase 5 builds the "Add Student" flow, which creates the auth.users row
   with the correct derived password):
   - Run `npm run dev` in `quran-app/`
   - Visit `http://localhost:5173/#/login`
   - Toggle to **Instructor sign-in** and use the email/password you created
     in step 4 of the one-time setup
   - On success you'll be redirected to `#/instructor` (placeholder page in
     Phase 2)

## Verifying RLS is working

Logged in as the admin, run in the SQL Editor:
```sql
select auth_school_id(), auth_user_role();
-- Should return your school id and role 3.
```

## Migrations checklist

Run these in order via the Supabase SQL Editor (or `supabase db push`):
- `migrations/0001_init.sql` — tables + indexes (Phase 1)
- `migrations/0002_rls.sql`  — RLS policies + helper functions (Phase 1)
- `migrations/0003_instructor_views.sql` — `instructor_roster` view (Phase 4)
- `migrations/0004_auth_attempts.sql` — PIN rate-limit table (Phase 6)

After any new migration, force PostgREST to pick up schema changes:
```sql
notify pgrst, 'reload schema';
```

See `/home/ayber/.claude/plans/warm-prancing-canyon.md` for the full plan.
