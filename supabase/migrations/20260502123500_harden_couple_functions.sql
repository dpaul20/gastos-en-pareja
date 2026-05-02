-- Keep SECURITY DEFINER helpers off the public Data API surface.
-- Client code now uses server-side access for couple creation and profile lookup.
-- NOTE: is_couple_member() is still referenced by several RLS policies and
-- cannot be dropped until those policies are migrated off it.

drop policy if exists "couples: read own" on public.couples;
create policy "couples: read own" on public.couples
  for select using (
    exists (
      select 1
      from public.couple_members cm
      where cm.couple_id = public.couples.id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists "couple_members: read own couple" on public.couple_members;
create policy "couple_members: read own couple" on public.couple_members
  for select using (
    exists (
      select 1
      from public.couple_members self_member
      where self_member.couple_id = public.couple_members.couple_id
        and self_member.user_id = (select auth.uid())
    )
  );

drop policy if exists "invitations: owner can create" on public.invitations;
create policy "invitations: owner can create" on public.invitations
  for insert with check (
    inviter_id = (select auth.uid())
    and exists (
      select 1
      from public.couple_members cm
      where cm.couple_id = public.invitations.couple_id
        and cm.user_id = (select auth.uid())
    )
  );

revoke execute on function public.create_couple_for_user(uuid) from public;
revoke execute on function public.create_couple_for_user(uuid) from anon;
revoke execute on function public.create_couple_for_user(uuid) from authenticated;

revoke execute on function public.get_couple_member_profiles(uuid) from public;
revoke execute on function public.get_couple_member_profiles(uuid) from anon;
revoke execute on function public.get_couple_member_profiles(uuid) from authenticated;
grant execute on function public.get_couple_member_profiles(uuid) to service_role;