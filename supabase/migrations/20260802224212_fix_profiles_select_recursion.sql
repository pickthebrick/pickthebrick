-- The original profiles_select policy queried public.profiles from inside its
-- own USING clause (to check "am I a captain/admin") which re-triggers RLS on
-- profiles for that subquery, recursing infinitely (Postgres error 42P17).
-- public.current_role() (from the functions migration) is SECURITY DEFINER and
-- owned by postgres, which bypasses RLS internally, so it doesn't recurse.

drop policy if exists "profiles_select" on public.profiles;

create policy "profiles_select" on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.current_role() in ('captain', 'admin')
  );
