-- Feature 3 (Cards): reusable card entity a couple can create once and
-- reference from multiple installment purchases. payment_day/closing_day are
-- both nullable — a card can exist with no payment_day set yet, and a
-- purchase can reference a card without one (falls back to the manual
-- paid_installments counter, see installments.ts).
create table cards (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references couples(id) on delete cascade,
  name         text not null,
  payment_day  int check (payment_day between 1 and 31),
  closing_day  int check (closing_day between 1 and 31),
  created_at   timestamptz not null default now()
);

create index on cards (couple_id);

alter table cards enable row level security;

-- Matches the inline EXISTS pattern used by every other couple-scoped table
-- since the shared is_couple_member() helper was removed (see
-- 20260502124411_inline_is_couple_member_policies.sql).
create policy "cards: couple members" on cards
  for all
  using (
    exists (
      select 1
      from couple_members cm
      where cm.couple_id = cards.couple_id
        and cm.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from couple_members cm
      where cm.couple_id = cards.couple_id
        and cm.user_id = (select auth.uid())
    )
  );

-- Optional link from a purchase to a reusable card. Deliberately NOT
-- backfilled from the existing free-text `credit_card` column — legacy
-- purchases keep displaying their free-text value and stay on the manual
-- counter until a user explicitly assigns a card (spec: "Legacy Free-Text
-- Card Compatibility").
alter table installment_purchases
  add column card_id uuid references cards(id) on delete set null default null;
