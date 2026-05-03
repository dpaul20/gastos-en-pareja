-- ============================================================
-- Fix: RLS circular dependency in couple_members SELECT policy
-- ============================================================
--
-- Problem: the "couple_members: read own couple" policy uses an
-- EXISTS subquery that queries couple_members itself, creating
-- infinite recursion -> PostgreSQL returns 0 rows -> auth breaks.
--
-- Fix: replace with a direct column check on the current row.
-- A user only needs to see their OWN couple_member row. Other
-- members are accessed via get_couple_member_profiles() which
-- is SECURITY DEFINER and bypasses RLS.
-- ============================================================

drop policy if exists "couple_members: read own couple" on public.couple_members;
create policy "couple_members: read own couple" on public.couple_members
  for select using (user_id = (select auth.uid()));