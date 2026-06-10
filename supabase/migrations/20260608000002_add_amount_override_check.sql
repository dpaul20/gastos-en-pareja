-- Enforce amount_override > 0 at the database level (REQ-Schema, fixed-expense-editable-amount).
-- The Server Action already validates this, but a CHECK adds defense-in-depth and matches the
-- codebase convention of expressing data-integrity invariants as constraints.
-- NULL is always allowed (NULL = use template default).
alter table fixed_expense_instances
  add constraint fixed_instance_amount_override_positive
    check (amount_override is null or amount_override > 0);
