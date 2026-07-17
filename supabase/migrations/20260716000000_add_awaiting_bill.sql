-- Pending-bills (settlements-and-pending-bills, PR1): templates that must
-- wait for their invoice before an amount is known ("sin factura"). Purely
-- additive — AGENTS.md §11's backup-table machinery is not triggered (no
-- data deleted, no destructive migration). See decision
-- architecture/settlements-and-pending-bills/migration-strategy: the
-- existing requires_monthly_review column is deliberately NOT recycled or
-- renamed here — it stays dead, cleaned up in its own future migration.
alter table fixed_expense_templates
  add column awaits_bill boolean not null default false;

comment on column fixed_expense_templates.awaits_bill is
  'When true, each month''s generated instance starts as AWAITING_BILL with no amount until the bill is loaded (see fixed_expense_instances.status).';

-- Powers the "nuevo" pill (48h window) once a bill is loaded onto an
-- instance — see architecture/settlements-and-pending-bills/nuevo-pill.
alter table fixed_expense_instances
  add column billed_at timestamptz;

comment on column fixed_expense_instances.billed_at is
  'Set when an amount is loaded onto an AWAITING_BILL instance (status -> CONFIRMED). Drives the "nuevo" pill''s 48h visibility window.';

-- Widen the status CHECK to add AWAITING_BILL. Single transaction, drops a
-- CONSTRAINT (not data) — 20260606120000_add_fixed_review.sql is never
-- edited (fix-forward per AGENTS.md §11: never edit an applied migration).
alter table fixed_expense_instances
  drop constraint fixed_instance_status_check,
  add  constraint fixed_instance_status_check
    check (status in ('PENDING_CONFIRMATION', 'CONFIRMED', 'AWAITING_BILL'));

comment on column fixed_expense_instances.status is
  'PENDING_CONFIRMATION = amount unverified for this month (legacy, dead going forward); CONFIRMED = amount known and counted; AWAITING_BILL = amount unknown, excluded from all money totals until loaded.';
