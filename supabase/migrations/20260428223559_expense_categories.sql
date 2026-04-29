-- ── EXPENSE CATEGORIES ────────────────────────────────────────
-- couple_id = NULL → categoría del sistema (visible para todos)
-- couple_id = id   → categoría personalizada de la pareja

create table public.expense_categories (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid references public.couples(id) on delete cascade,
  name       text not null,
  icon       text not null default '📦',
  color      text not null default '#6C5CE7',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

create index on public.expense_categories (couple_id);

-- Sistema predefinidas (couple_id = NULL)
insert into public.expense_categories (couple_id, name, icon, color, sort_order) values
  (null, 'Vivienda',        '🏠', '#6C5CE7', 1),
  (null, 'Servicios',       '💡', '#00B894', 2),
  (null, 'Comida',          '🛒', '#FDCB6E', 3),
  (null, 'Transporte',      '🚗', '#74B9FF', 4),
  (null, 'Salud',           '❤️',  '#E17055', 5),
  (null, 'Entretenimiento', '🎬', '#A29BFE', 6),
  (null, 'Educación',       '📚', '#55EFC4', 7),
  (null, 'Otros',           '📦', '#B2BEC3', 8);

-- FKs opcionales en las 3 tablas de gastos
alter table public.installment_purchases   add column category_id uuid references public.expense_categories(id);
alter table public.fixed_expense_templates add column category_id uuid references public.expense_categories(id);
alter table public.variable_expenses       add column category_id uuid references public.expense_categories(id);

-- RLS
alter table public.expense_categories enable row level security;

create policy "categories: read sistema y propia pareja" on public.expense_categories
  for select using (
    couple_id is null
    or public.is_couple_member(couple_id)
  );

create policy "categories: pareja puede crear propias" on public.expense_categories
  for insert with check (
    couple_id is not null
    and public.is_couple_member(couple_id)
  );
