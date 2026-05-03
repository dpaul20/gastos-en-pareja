-- Add shared-vs-individual ownership flag for variable expenses
alter table variable_expenses
  add column if not exists is_shared boolean not null default true;

create index if not exists variable_expenses_couple_shared_date_idx
  on variable_expenses (couple_id, is_shared, date);
