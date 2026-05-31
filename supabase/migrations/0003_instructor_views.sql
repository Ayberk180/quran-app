-- Migration 0003: instructor_roster view
-- Per-student aggregates for the instructor dashboard.
--
-- security_invoker = on means RLS on the underlying profiles, lesson_progress,
-- and login_events tables is enforced when querying the view — so an instructor
-- only sees students in their own school via the existing SELECT policies.

create or replace view instructor_roster
with (security_invoker = on)
as
select
  p.id,
  p.school_id,
  p.first_name,
  p.last_initial,
  p.student_code,
  p.created_at,
  -- Lowest unpassed lesson number (1-28). NULL once every lesson is passed.
  (
    select min(s.lesson_num)
    from generate_series(1, 28) as s(lesson_num)
    where not exists (
      select 1 from lesson_progress lp
      where lp.student_id = p.id
        and lp.lesson_id = s.lesson_num
        and lp.status = 1
    )
  ) as current_lesson,
  (
    select count(*)::int from lesson_progress lp
    where lp.student_id = p.id and lp.status = 1
  ) as passed_count,
  (
    select count(*)::int from login_events le
    where le.user_id = p.id
      and le.signed_in_at >= now() - interval '7 days'
  ) as logins_7d,
  (
    select count(*)::int from login_events le
    where le.user_id = p.id
      and le.signed_in_at >= now() - interval '30 days'
  ) as logins_30d,
  (
    select max(signed_in_at) from login_events le
    where le.user_id = p.id
  ) as last_seen
from profiles p
where p.role = 1;
