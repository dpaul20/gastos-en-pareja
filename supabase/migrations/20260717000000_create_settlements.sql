-- Settlements (settlements-and-pending-bills, PR5 / Phase 4a): records real
-- money movements between partners, layered strictly on top of expense
-- attribution (see architecture/settlements-and-pending-bills/design D3).
-- calculateMonthlyBalance never reads this table — a separate pure module
-- (src/lib/utils/settlement.ts) folds it on top of that function's output.
--
-- Purely additive — AGENTS.md §11's backup-table machinery is not triggered
-- (no data deleted, no destructive migration). Timestamp chosen to be
-- strictly later than 20260716000000_add_awaiting_bill.sql (PR1), which
-- already occupies the slot the design doc's own draft timestamp collided
-- with.
create table settlements (
  id            uuid primary key default gen_random_uuid(),
  couple_id     uuid not null references couples(id) on delete cascade,
  month         date not null,
  from_user_id  uuid not null references auth.users(id) on delete cascade,
  to_user_id    uuid not null references auth.users(id) on delete cascade,
  amount        numeric not null check (amount > 0),
  paid_on       date not null,
  note          text,
  created_by    uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  constraint settlement_distinct_parties check (from_user_id <> to_user_id)
);

comment on table settlements is
  'Real money movements recorded between couple members for a given month. Directional (from -> to), editable and deletable by either member. Never read by calculateMonthlyBalance — see src/lib/utils/settlement.ts for how it layers on top.';

create index on settlements (couple_id, month);

alter table settlements enable row level security;

-- Matches the inline EXISTS pattern used by every other couple-scoped table
-- since the shared is_couple_member() helper was removed (see
-- 20260502124411_inline_is_couple_member_policies.sql). Either member of the
-- couple may insert/update/delete — "either member records, editable,
-- deletable" (spec) needs no extra rule beyond couple membership.
create policy "settlements: couple members" on settlements
  for all
  using (
    exists (
      select 1
      from couple_members cm
      where cm.couple_id = settlements.couple_id
        and cm.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from couple_members cm
      where cm.couple_id = settlements.couple_id
        and cm.user_id = (select auth.uid())
    )
  );
