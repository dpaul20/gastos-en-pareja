-- Allow per-month due_day overrides on fixed_expense_instances.
-- NULL means "inherit the template's due_day" — matches amount_override convention.
alter table fixed_expense_instances
  add column due_day int
    constraint fixed_instance_due_day_check
      check (due_day between 1 and 31);
