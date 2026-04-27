-- Permite que cualquier usuario autenticado cree una pareja.
-- Sin esta policy, el INSERT falla con RLS aunque el usuario esté logueado.
create policy "couples: authenticated can create" on public.couples
  for insert with check ((select auth.uid()) is not null);
