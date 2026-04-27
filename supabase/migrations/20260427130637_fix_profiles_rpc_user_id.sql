-- Reemplaza la función anterior con versión que acepta user_id explícito
-- Evita depender de auth.uid() que no funciona con JWT ES256 en local
drop function if exists public.get_couple_member_profiles();

create or replace function public.get_couple_member_profiles(p_user_id uuid)
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
    select couple_id from public.couple_members where user_id = p_user_id
  );
$$;
