-- Replace RLS policies that depend on is_couple_member() with inline EXISTS checks.
-- This allows removing the SECURITY DEFINER helper function from the public API surface.

drop policy if exists "incomes: couple members" on public.incomes;
create policy "incomes: couple members" on public.incomes
	for all
	using (
		exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.incomes.couple_id
				and cm.user_id = (select auth.uid())
		)
	)
	with check (
		exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.incomes.couple_id
				and cm.user_id = (select auth.uid())
		)
	);

drop policy if exists "installment_purchases: couple members" on public.installment_purchases;
create policy "installment_purchases: couple members" on public.installment_purchases
	for all
	using (
		exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.installment_purchases.couple_id
				and cm.user_id = (select auth.uid())
		)
	)
	with check (
		exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.installment_purchases.couple_id
				and cm.user_id = (select auth.uid())
		)
	);

drop policy if exists "fixed_expense_templates: couple members" on public.fixed_expense_templates;
create policy "fixed_expense_templates: couple members" on public.fixed_expense_templates
	for all
	using (
		exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.fixed_expense_templates.couple_id
				and cm.user_id = (select auth.uid())
		)
	)
	with check (
		exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.fixed_expense_templates.couple_id
				and cm.user_id = (select auth.uid())
		)
	);

drop policy if exists "fixed_expense_instances: couple members" on public.fixed_expense_instances;
create policy "fixed_expense_instances: couple members" on public.fixed_expense_instances
	for all
	using (
		exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.fixed_expense_instances.couple_id
				and cm.user_id = (select auth.uid())
		)
	)
	with check (
		exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.fixed_expense_instances.couple_id
				and cm.user_id = (select auth.uid())
		)
	);

drop policy if exists "variable_expenses: couple members" on public.variable_expenses;
create policy "variable_expenses: couple members" on public.variable_expenses
	for all
	using (
		exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.variable_expenses.couple_id
				and cm.user_id = (select auth.uid())
		)
	)
	with check (
		exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.variable_expenses.couple_id
				and cm.user_id = (select auth.uid())
		)
	);

drop policy if exists "categories: read sistema y propia pareja" on public.expense_categories;
create policy "categories: read sistema y propia pareja" on public.expense_categories
	for select using (
		public.expense_categories.couple_id is null
		or exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.expense_categories.couple_id
				and cm.user_id = (select auth.uid())
		)
	);

drop policy if exists "categories: pareja puede crear propias" on public.expense_categories;
create policy "categories: pareja puede crear propias" on public.expense_categories
	for insert with check (
		public.expense_categories.couple_id is not null
		and exists (
			select 1
			from public.couple_members cm
			where cm.couple_id = public.expense_categories.couple_id
				and cm.user_id = (select auth.uid())
		)
	);

revoke execute on function public.is_couple_member(uuid) from public;
revoke execute on function public.is_couple_member(uuid) from anon;
revoke execute on function public.is_couple_member(uuid) from authenticated;

drop function if exists public.is_couple_member(uuid);
