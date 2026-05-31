-- Migration 0004: per-IP rate limiting for pin-signin
--
-- The pin-signin Edge Function writes/reads this table via service role.
-- No public-facing RLS policies — only the function can touch it.

create table auth_attempts (
  ip            text        primary key,
  fail_count    int         not null default 0,
  locked_until  timestamptz,
  updated_at    timestamptz not null default now()
);

alter table auth_attempts enable row level security;
-- No policies. RLS denies by default; the Edge Function uses service role to
-- bypass RLS. This keeps the attempts table opaque to authenticated clients.
