ALTER TABLE public.installment_purchases
  ADD COLUMN credit_card text;

COMMENT ON COLUMN public.installment_purchases.credit_card IS
  'Free-text card name as entered by the user (e.g. "Naranja Visa"). Nullable, no constraint.';

-- Down migration: ALTER TABLE public.installment_purchases DROP COLUMN credit_card;
