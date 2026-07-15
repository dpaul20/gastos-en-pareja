-- Bug 1 (Leak A) / R3-B + R3-D: sparse per-month manual correction of a card
-- cuota's displayed installment number. installmentNumberForMonth()
-- (src/lib/utils/installments.ts) checks for a row here FIRST, before
-- falling back to the auto-advance computation — a manual value always wins
-- for that specific (purchase, month) pair and persists across later views
-- (spec: "Manual correction persists").
create table installment_month_overrides (
  id                 uuid primary key default gen_random_uuid(),
  purchase_id        uuid not null references installment_purchases(id) on delete cascade,
  couple_id          uuid not null references couples(id) on delete cascade,
  month              date not null,
  installment_number int not null check (installment_number > 0),
  created_at         timestamptz not null default now(),
  unique (purchase_id, month)
);

alter table installment_month_overrides enable row level security;

create policy "installment_month_overrides: couple members" on installment_month_overrides
  for all
  using (
    exists (
      select 1
      from couple_members cm
      where cm.couple_id = installment_month_overrides.couple_id
        and cm.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from couple_members cm
      where cm.couple_id = installment_month_overrides.couple_id
        and cm.user_id = (select auth.uid())
    )
  );
