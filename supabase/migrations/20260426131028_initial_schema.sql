-- ============================================================
-- Gastos en Pareja v2 — Initial Schema
-- ============================================================

-- ── ENUMS ────────────────────────────────────────────────────

create type couple_status as enum ('PENDING', 'ACTIVE');
create type member_role as enum ('OWNER', 'MEMBER');

-- ── COUPLES ──────────────────────────────────────────────────

create table couples (
  id         uuid primary key default gen_random_uuid(),
  status     couple_status not null default 'PENDING',
  created_at timestamptz not null default now()
);

-- ── COUPLE_MEMBERS ───────────────────────────────────────────

create table couple_members (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      member_role not null default 'MEMBER',
  joined_at timestamptz not null default now(),
  unique (couple_id, user_id)
);

-- ── INVITATIONS ──────────────────────────────────────────────

create table invitations (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references couples(id) on delete cascade,
  inviter_id  uuid not null references auth.users(id) on delete cascade,
  email       text not null,
  token       text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ── INCOMES ──────────────────────────────────────────────────

create table incomes (
  id        uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  amount    numeric(14, 2) not null check (amount >= 0),
  month     date not null,
  created_at timestamptz not null default now(),
  unique (couple_id, user_id, month)
);

-- ── INSTALLMENT_PURCHASES ────────────────────────────────────

create table installment_purchases (
  id                uuid primary key default gen_random_uuid(),
  couple_id         uuid not null references couples(id) on delete cascade,
  description       text not null,
  total_amount      numeric(14, 2) not null check (total_amount > 0),
  installments      int not null check (installments > 0),
  paid_installments int not null default 0 check (paid_installments >= 0),
  first_payment_date date not null,
  created_at        timestamptz not null default now(),
  constraint paid_lte_total check (paid_installments <= installments)
);

-- ── FIXED_EXPENSE_TEMPLATES ──────────────────────────────────

create table fixed_expense_templates (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references couples(id) on delete cascade,
  description text not null,
  amount      numeric(14, 2) not null check (amount > 0),
  due_day     int not null check (due_day between 1 and 31),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── FIXED_EXPENSE_INSTANCES ──────────────────────────────────

create table fixed_expense_instances (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references fixed_expense_templates(id) on delete cascade,
  couple_id   uuid not null references couples(id) on delete cascade,
  month       date not null,
  paid        boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (template_id, month)
);

-- ── VARIABLE_EXPENSES ────────────────────────────────────────

create table variable_expenses (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid not null references couples(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount      numeric(14, 2) not null check (amount > 0),
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

-- ── INDEXES ──────────────────────────────────────────────────

create index on couple_members (user_id);
create index on couple_members (couple_id);
create index on incomes (couple_id, month);
create index on installment_purchases (couple_id);
create index on fixed_expense_templates (couple_id);
create index on fixed_expense_instances (couple_id, month);
create index on variable_expenses (couple_id, date);
create index on invitations (token);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

alter table couples                 enable row level security;
alter table couple_members          enable row level security;
alter table invitations             enable row level security;
alter table incomes                 enable row level security;
alter table installment_purchases   enable row level security;
alter table fixed_expense_templates enable row level security;
alter table fixed_expense_instances enable row level security;
alter table variable_expenses       enable row level security;

create or replace function is_couple_member(p_couple_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from couple_members
    where couple_id = p_couple_id and user_id = auth.uid()
  );
$$;

-- couples
create policy "couples: read own" on couples
  for select using (is_couple_member(id));

-- couple_members
create policy "couple_members: read own couple" on couple_members
  for select using (is_couple_member(couple_id));

create policy "couple_members: insert self" on couple_members
  for insert with check (user_id = auth.uid());

-- invitations
create policy "invitations: owner can create" on invitations
  for insert with check (
    inviter_id = auth.uid() and is_couple_member(couple_id)
  );

create policy "invitations: read by token" on invitations
  for select using (true);

-- expenses / incomes — couple members only
create policy "incomes: couple members" on incomes
  for all using (is_couple_member(couple_id));

create policy "installment_purchases: couple members" on installment_purchases
  for all using (is_couple_member(couple_id));

create policy "fixed_expense_templates: couple members" on fixed_expense_templates
  for all using (is_couple_member(couple_id));

create policy "fixed_expense_instances: couple members" on fixed_expense_instances
  for all using (is_couple_member(couple_id));

create policy "variable_expenses: couple members" on variable_expenses
  for all using (is_couple_member(couple_id));
