-- ============================================================
-- Fix: RLS circular dependency in couple_members SELECT policy
-- ============================================================
--
-- Problem: is_couple_member() is SECURITY DEFINER but lacks
-- SET row_security = off. When used in couple_members' SELECT
-- policy, it causes infinite recursion:
--   1. SELECT couple_members → RLS evaluates is_couple_member()
--   2. is_couple_member() SELECTs couple_members → RLS evaluates
--      is_couple_member() again → infinite loop → 0 rows returned
--
-- In Supabase CLI 2.95.x the postgres role no longer implicitly
-- bypasses RLS inside SECURITY DEFINER functions. Explicit
-- SET row_security = off is required.
-- ============================================================

-- Fix is_couple_member: add SET row_security = off so the inner
-- couple_members query bypasses RLS, breaking the circular chain.
create or replace function public.is_couple_member(p_couple_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = p_couple_id and user_id = (select auth.uid())
  );
$$;

-- Same fix for get_couple_member_profiles: its inner subquery on
-- couple_members would also hit the circular RLS without this.
create or replace function public.get_couple_member_profiles()
returns table (
  user_id   uuid,
  role      text,
  email     text,
  full_name text
)
language sql
security definer
set search_path = ''
set row_security = off
as $$
  select
    cm.user_id,
    cm.role::text,
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as full_name
  from public.couple_members cm
  join auth.users u on u.id = cm.user_id
  where cm.couple_id in (
    select couple_id from public.couple_members where user_id = (select auth.uid())
  );
$$;
