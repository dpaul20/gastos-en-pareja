-- Add default categories from original product vision (idempotent)
insert into public.expense_categories (couple_id, name, icon, color, sort_order)
select null, 'Seguros', '🛡️', '#5C7CFA', 9
where not exists (
  select 1
  from public.expense_categories ec
  where ec.couple_id is null
    and lower(ec.name) = 'seguros'
);

insert into public.expense_categories (couple_id, name, icon, color, sort_order)
select null, 'Supermercado', '🧺', '#00B894', 10
where not exists (
  select 1
  from public.expense_categories ec
  where ec.couple_id is null
    and lower(ec.name) = 'supermercado'
);

insert into public.expense_categories (couple_id, name, icon, color, sort_order)
select null, 'Carnes', '🥩', '#E17055', 11
where not exists (
  select 1
  from public.expense_categories ec
  where ec.couple_id is null
    and lower(ec.name) = 'carnes'
);

insert into public.expense_categories (couple_id, name, icon, color, sort_order)
select null, 'MercadoLibre', '📦', '#FDCB6E', 12
where not exists (
  select 1
  from public.expense_categories ec
  where ec.couple_id is null
    and lower(ec.name) = 'mercadolibre'
);
