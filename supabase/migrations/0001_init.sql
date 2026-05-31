-- Migration 0001: schema for student accounts, lesson progress, and login events
-- Apply via the Supabase SQL editor or `supabase db push`.
-- See ../README.md for setup steps.

-- ── schools ───────────────────────────────────────────────────────────────
create table schools (
  id          bigserial primary key,
  name        text        not null,
  created_at  timestamptz not null default now()
);

-- ── profiles (1:1 with auth.users) ────────────────────────────────────────
-- role: 1=student, 2=instructor, 3=admin
-- student_code: 6-char PIN, unique, null for instructors/admins
-- consent_collected_at: parental consent timestamp (students only)
create table profiles (
  id                    uuid        primary key references auth.users (id) on delete cascade,
  school_id             bigint      not null references schools (id),
  role                  smallint    not null check (role in (1, 2, 3)),
  first_name            text        not null,
  last_initial          char(1),
  student_code          char(6)     unique,
  consent_collected_at  timestamptz,
  created_at            timestamptz not null default now()
);

create index profiles_school_role_idx on profiles (school_id, role);

-- ── lesson_progress (instructor-managed, binary status) ───────────────────
-- status: 0=not_passed, 1=passed
-- Rows only exist for lessons an instructor has marked; absent row = not_passed.
create table lesson_progress (
  student_id  uuid        not null references profiles (id) on delete cascade,
  lesson_id   smallint    not null check (lesson_id between 1 and 999),
  status      smallint    not null default 0 check (status in (0, 1)),
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references profiles (id),
  primary key (student_id, lesson_id)
);

-- ── login_events (one row per successful sign-in) ─────────────────────────
-- user_id covers both students and instructors; filter by profiles.role in queries.
create table login_events (
  id            bigserial   primary key,
  user_id       uuid        not null references profiles (id) on delete cascade,
  signed_in_at  timestamptz not null default now()
);

create index login_events_user_signed_in_idx on login_events (user_id, signed_in_at desc);
