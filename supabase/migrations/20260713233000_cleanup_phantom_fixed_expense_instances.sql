-- Bug 1 (Leak B) cleanup: before this release, ensureFixedExpenseInstances
-- and getMonthDate assigned fixed_expense_instances.month using each
-- runtime's own ambient local timezone (UTC on the Vercel server vs.
-- typically America/Argentina/Buenos_Aires on the client). That skew, plus
-- the missing "don't materialize before the template's own start month"
-- guard, could produce phantom instance rows for months earlier than the
-- template's creation month.
--
-- This release (see R3-A + Bug 1 Leak B fix) makes getMonthDate resolve the
-- month in a single fixed timezone (America/Argentina/Buenos_Aires) and adds
-- a created_at guard to ensureFixedExpenseInstances going forward. This
-- migration removes the PRE-EXISTING phantom rows using the SAME
-- normalization, so the predicate matches how months are assigned from now
-- on.
--
-- Deliberately conservative / SPARING: only rows that are still safe to drop
-- are removed —
--   * fi.paid = false          -> never touch a paid (settled) instance
--   * fi.due_day is null       -> never touch a row with a due-day override
--   * fi.amount_override is null -> never touch a row with an amount override
-- A row carrying any of those signals reflects real user data/edits and must
-- be preserved even if it predates the template's start month.
--
-- IRREVERSIBLE: this is a DELETE with no down-migration. Do not run against
-- production without a fresh backup/snapshot of fixed_expense_instances
-- taken immediately before applying it (see tasks.md 2.6).
delete from fixed_expense_instances fi
using fixed_expense_templates t
where fi.template_id = t.id
  and fi.month < date_trunc(
    'month',
    t.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires'
  )::date
  and fi.paid = false
  and fi.due_day is null
  and fi.amount_override is null;
