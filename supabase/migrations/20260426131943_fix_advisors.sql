-- ============================================================
-- Fix security and performance advisors
-- ============================================================

-- ── SECURITY: fix is_couple_member search_path ───────────────
-- Prevents search_path injection by setting it explicitly.
-- Use schema-qualified names inside the function body.

create or replace function public.is_couple_member(p_couple_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = p_couple_id and user_id = (select auth.uid())
  );
$$;

-- ── PERFORMANCE: RLS policies — wrap auth.uid() in (select) ──
-- Prevents re-evaluation of auth.uid() for every row scanned.

drop policy if exists "couple_members: insert self" on public.couple_members;
create policy "couple_members: insert self" on public.couple_members
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "invitations: owner can create" on public.invitations;
create policy "invitations: owner can create" on public.invitations
  for insert with check (
    inviter_id = (select auth.uid())
    and public.is_couple_member(couple_id)
  );

-- ── PERFORMANCE: missing indexes on foreign keys ─────────────

create index if not exists incomes_user_id_idx
  on public.incomes (user_id);

create index if not exists invitations_couple_id_idx
  on public.invitations (couple_id);

create index if not exists invitations_inviter_id_idx
  on public.invitations (inviter_id);

create index if not exists variable_expenses_user_id_idx
  on public.variable_expenses (user_id);
