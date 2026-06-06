-- Add requires_monthly_review flag to templates
alter table fixed_expense_templates
  add column requires_monthly_review boolean not null default false;

comment on column fixed_expense_templates.requires_monthly_review is
  'When true, each month''s generated instance starts as PENDING_CONFIRMATION until the user verifies the amount.';

-- Add status column to instances (text + CHECK — matches codebase convention, evolvable)
alter table fixed_expense_instances
  add column status text not null default 'CONFIRMED'
    constraint fixed_instance_status_check
      check (status in ('PENDING_CONFIRMATION', 'CONFIRMED'));

comment on column fixed_expense_instances.status is
  'PENDING_CONFIRMATION = amount unverified for this month; CONFIRMED = user-verified or auto-confirmed (template not flagged).';

-- Composite index for bulk-confirm queries and banner count
create index on fixed_expense_instances (couple_id, month, status);
