ALTER TABLE fixed_expense_instances
  ADD COLUMN amount_override numeric(14,2);

COMMENT ON COLUMN fixed_expense_instances.amount_override IS
  'Per-month override of fixed_expense_templates.amount. NULL = use template default.';
