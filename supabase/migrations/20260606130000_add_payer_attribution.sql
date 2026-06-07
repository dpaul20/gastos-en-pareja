ALTER TABLE public.fixed_expense_instances
  ADD COLUMN paid_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.installment_purchases
  ADD COLUMN paid_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.fixed_expense_instances.paid_by_user_id IS
  'User who physically paid this month''s fixed expense. NULL = unattributed (not credited to anyone). Set by toggleFixedExpenseInstance on paid, nulled on unpaid.';

COMMENT ON COLUMN public.installment_purchases.paid_by_user_id IS
  'Cardholder who pays every installment of this purchase (fixed at creation). NULL = unattributed. Defaults to creator.';

CREATE INDEX idx_fixed_expense_instances_paid_by ON public.fixed_expense_instances(paid_by_user_id);
CREATE INDEX idx_installment_purchases_paid_by ON public.installment_purchases(paid_by_user_id);

-- Down migration:
-- DROP INDEX IF EXISTS public.idx_installment_purchases_paid_by;
-- DROP INDEX IF EXISTS public.idx_fixed_expense_instances_paid_by;
-- ALTER TABLE public.installment_purchases DROP COLUMN paid_by_user_id;
-- ALTER TABLE public.fixed_expense_instances DROP COLUMN paid_by_user_id;
