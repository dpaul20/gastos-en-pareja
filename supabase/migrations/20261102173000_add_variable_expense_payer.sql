ALTER TABLE public.variable_expenses
  ADD COLUMN paid_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.variable_expenses.paid_by_user_id IS
  'User who paid this variable expense. NULL means the payer is not recorded; user_id remains the user who created the expense.';

CREATE INDEX idx_variable_expenses_paid_by
  ON public.variable_expenses(paid_by_user_id);

-- Existing rows intentionally remain NULL: user_id identifies who recorded
-- the expense, not necessarily who paid it.
