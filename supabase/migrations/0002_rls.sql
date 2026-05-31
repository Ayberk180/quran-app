-- Migration 0002: row-level security policies and helper functions
-- Apply after 0001_init.sql.

-- ── Helper functions ─────────────────────────────────────────────────────
-- SECURITY DEFINER lets these read profiles without triggering its own RLS
-- (avoiding infinite recursion when a policy calls them).
create or replace function auth_school_id()
returns bigint
language sql stable security definer
set search_path = public, pg_temp
as $$
  select school_id from profiles where id = auth.uid();
$$;

create or replace function auth_user_role()
returns smallint
language sql stable security definer
set search_path = public, pg_temp
as $$
  select role from profiles where id = auth.uid();
$$;

-- ── Enable RLS on all public tables ──────────────────────────────────────
alter table schools         enable row level security;
alter table profiles        enable row level security;
alter table lesson_progress enable row level security;
alter table login_events    enable row level security;

-- ── schools ──────────────────────────────────────────────────────────────
-- Authenticated users can read only their own school. Writes are service-role only.
create policy schools_select_own
  on schools for select to authenticated
  using (id = auth_school_id());

-- ── profiles ─────────────────────────────────────────────────────────────
-- Read own profile, or any profile in the same school if you're staff (role 2 or 3).
-- Writes are service-role only (creation happens via Edge Functions).
create policy profiles_select_self_or_school
  on profiles for select to authenticated
  using (
    id = auth.uid()
    or (school_id = auth_school_id() and auth_user_role() in (2, 3))
  );

-- ── lesson_progress ──────────────────────────────────────────────────────
-- Students read only their own rows. Staff at the same school read all and write.
create policy lesson_progress_select_self_or_school
  on lesson_progress for select to authenticated
  using (
    student_id = auth.uid()
    or (
      auth_user_role() in (2, 3)
      and exists (
        select 1 from profiles p
        where p.id = lesson_progress.student_id
          and p.school_id = auth_school_id()
      )
    )
  );

create policy lesson_progress_insert_by_staff
  on lesson_progress for insert to authenticated
  with check (
    auth_user_role() in (2, 3)
    and exists (
      select 1 from profiles p
      where p.id = lesson_progress.student_id
        and p.school_id = auth_school_id()
    )
  );

create policy lesson_progress_update_by_staff
  on lesson_progress for update to authenticated
  using (
    auth_user_role() in (2, 3)
    and exists (
      select 1 from profiles p
      where p.id = lesson_progress.student_id
        and p.school_id = auth_school_id()
    )
  )
  with check (
    auth_user_role() in (2, 3)
    and exists (
      select 1 from profiles p
      where p.id = lesson_progress.student_id
        and p.school_id = auth_school_id()
    )
  );

-- ── login_events ─────────────────────────────────────────────────────────
-- Any signed-in user can record their own login. Staff can read all events in
-- their school; students see only their own.
create policy login_events_insert_self
  on login_events for insert to authenticated
  with check (user_id = auth.uid());

create policy login_events_select_self_or_school
  on login_events for select to authenticated
  using (
    user_id = auth.uid()
    or (
      auth_user_role() in (2, 3)
      and exists (
        select 1 from profiles p
        where p.id = login_events.user_id
          and p.school_id = auth_school_id()
      )
    )
  );
