-- Migration 0006: allow instructors/admins to update student names
-- Staff (role 2 or 3) may update first_name and last_name on student (role 1)
-- profiles within their own school. All other columns remain service-role only.

create policy profiles_update_name_by_staff
  on profiles for update to authenticated
  using (
    role = 1
    and school_id = auth_school_id()
    and auth_user_role() in (2, 3)
  )
  with check (
    role = 1
    and school_id = auth_school_id()
    and auth_user_role() in (2, 3)
  );
