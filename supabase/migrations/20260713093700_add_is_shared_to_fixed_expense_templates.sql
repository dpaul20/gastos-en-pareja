-- Allow fixed expense templates to be personal (owned by one member) instead of
-- shared. Mirrors the is_shared concept already present on variable_expenses.
--   is_shared = true  -> enters the proportional split (default, current behavior)
--   is_shared = false -> personal to owner_user_id, excluded from the split
alter table fixed_expense_templates
  add column is_shared boolean not null default true,
  add column owner_user_id uuid references auth.users(id) on delete set null;

-- A personal template must name its owner; a shared one must not.
alter table fixed_expense_templates
  add constraint fixed_template_owner_check
    check (
      (is_shared and owner_user_id is null)
      or (not is_shared and owner_user_id is not null)
    );
