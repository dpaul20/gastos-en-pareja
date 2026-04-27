-- Función SECURITY DEFINER que retorna los miembros de la pareja del usuario actual
-- con su email y nombre de Google OAuth (desde auth.users.raw_user_meta_data)
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
