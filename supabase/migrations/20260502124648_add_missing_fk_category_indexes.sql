create index if not exists fixed_expense_templates_category_id_idx
	on public.fixed_expense_templates (category_id);

create index if not exists installment_purchases_category_id_idx
	on public.installment_purchases (category_id);

create index if not exists variable_expenses_category_id_idx
	on public.variable_expenses (category_id);
