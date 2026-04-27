create or replace function public.create_couple_for_user(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid;
begin
  select couple_id into v_couple_id
  from public.couple_members
  where user_id = p_user_id
  limit 1;

  if v_couple_id is not null then
    return v_couple_id;
  end if;

  insert into public.couples (status)
  values ('PENDING')
  returning id into v_couple_id;

  insert into public.couple_members (couple_id, user_id, role)
  values (v_couple_id, p_user_id, 'OWNER');

  return v_couple_id;
end;
$$;
