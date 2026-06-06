-- ================================================================
-- Gastos en Pareja — Seed con datos reales
-- Ejecutar con: npx supabase db reset
-- Login: deivy@test.local / password123
--        analia@test.local / password123
-- ================================================================

do $$
declare
  auth_iid    uuid    := '00000000-0000-0000-0000-000000000000';
  uid_a       uuid    := '00000000-0000-0000-0000-000000000001';  -- Deivy
  uid_b       uuid    := '00000000-0000-0000-0000-000000000002';  -- Analía
  cid         uuid    := '00000000-0000-0000-0000-000000000010';
  cur_month   date    := date_trunc('month', current_date)::date;
  prev_month  date    := (date_trunc('month', current_date) - interval '1 month')::date;
  st_pending  text    := 'PENDING_CONFIRMATION';
  st_confirmed text   := 'CONFIRMED';

  tpl_seg1    uuid;
  tpl_seg2    uuid;
  tpl_cable   uuid;
  tpl_aguas   uuid;
  tpl_guardia uuid;
  tpl_expensas uuid;
  tpl_epec    uuid;

  cat_vivienda  uuid;
  cat_servicios uuid;
begin

  -- ── USERS ──────────────────────────────────────────────────────
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    (
      auth_iid, uid_a,
      'authenticated', 'authenticated',
      'deivy@test.local',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Deivy","avatar_url":null}',
      now(), now(), '', '', '', ''
    ),
    (
      auth_iid, uid_b,
      'authenticated', 'authenticated',
      'analia@test.local',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Analía","avatar_url":null}',
      now(), now(), '', '', '', ''
    );

  -- ── COUPLE ─────────────────────────────────────────────────────
  insert into couples (id, status) values (cid, 'ACTIVE');

  insert into couple_members (couple_id, user_id, role) values
    (cid, uid_a, 'OWNER'),
    (cid, uid_b, 'MEMBER');

  -- ── CATEGORIES ────────────────────────────────────────────────
  select id into cat_vivienda  from expense_categories where name = 'Vivienda'  and couple_id is null;
  select id into cat_servicios from expense_categories where name = 'Servicios' and couple_id is null;

  -- ── INCOMES ───────────────────────────────────────────────────
  insert into incomes (couple_id, user_id, amount, month) values
    (cid, uid_a, 3210000, cur_month),
    (cid, uid_b, 1760000, cur_month),
    (cid, uid_a, 3210000, prev_month),
    (cid, uid_b, 1760000, prev_month);

  -- ── INSTALLMENT PURCHASES (cuotas) ───────────────────────────
  insert into installment_purchases
    (couple_id, description, total_amount, installments, paid_installments, first_payment_date, auto_renew, paid_by_user_id, category_id)
  values
    (cid, 'Aire Acondicionado', 1320004, 24, 21, cur_month - interval '21 months', false, uid_a, null),
    (cid, 'Ventiladores',        500475,  9,  5, cur_month - interval '5 months',  false, uid_a, null);

  -- ── FIXED EXPENSE TEMPLATES ───────────────────────────────────
  -- Deivy paga: Seguros x2, Cable, Aguas, Guardia, Expensas
  -- Analía paga: Epec
  insert into fixed_expense_templates
    (id, couple_id, description, amount, due_day, active, category_id, requires_monthly_review)
  values
    (gen_random_uuid(), cid, 'Seguros',          96991.00, 10, true, null,          false),
    (gen_random_uuid(), cid, 'Seguros (otro)',   70532.00, 10, true, null,          false),
    (gen_random_uuid(), cid, 'Cable',            40890.74, 15, true, cat_servicios, true),
    (gen_random_uuid(), cid, 'Aguas Cordobesas', 28847.06, 20, true, cat_servicios, true),
    (gen_random_uuid(), cid, 'Guardia',          48000.00,  5, true, cat_vivienda,  false),
    (gen_random_uuid(), cid, 'Expensas',         26292.00,  5, true, cat_vivienda,  true),
    (gen_random_uuid(), cid, 'Epec',             72375.10, 10, true, cat_servicios, true);

  select id into tpl_seg1     from fixed_expense_templates where couple_id = cid and description = 'Seguros';
  select id into tpl_seg2     from fixed_expense_templates where couple_id = cid and description = 'Seguros (otro)';
  select id into tpl_cable    from fixed_expense_templates where couple_id = cid and description = 'Cable';
  select id into tpl_aguas    from fixed_expense_templates where couple_id = cid and description = 'Aguas Cordobesas';
  select id into tpl_guardia  from fixed_expense_templates where couple_id = cid and description = 'Guardia';
  select id into tpl_expensas from fixed_expense_templates where couple_id = cid and description = 'Expensas';
  select id into tpl_epec     from fixed_expense_templates where couple_id = cid and description = 'Epec';

  -- ── FIXED INSTANCES — mes actual (todas pagas con pagador) ─────
  insert into fixed_expense_instances (template_id, couple_id, month, paid, paid_by_user_id, status) values
    (tpl_seg1,     cid, cur_month, true,  uid_a, st_confirmed),
    (tpl_seg2,     cid, cur_month, true,  uid_a, st_confirmed),
    (tpl_cable,    cid, cur_month, true,  uid_a, st_confirmed),
    (tpl_aguas,    cid, cur_month, true,  uid_a, st_confirmed),
    (tpl_guardia,  cid, cur_month, true,  uid_a, st_confirmed),
    (tpl_expensas, cid, cur_month, true,  uid_a, st_confirmed),
    (tpl_epec,     cid, cur_month, true,  uid_b, st_confirmed);

  -- ── FIXED INSTANCES — mes anterior ────────────────────────────
  insert into fixed_expense_instances (template_id, couple_id, month, paid, paid_by_user_id, status) values
    (tpl_seg1,     cid, prev_month, true, uid_a, st_confirmed),
    (tpl_seg2,     cid, prev_month, true, uid_a, st_confirmed),
    (tpl_cable,    cid, prev_month, true, uid_a, st_confirmed),
    (tpl_aguas,    cid, prev_month, true, uid_a, st_confirmed),
    (tpl_guardia,  cid, prev_month, true, uid_a, st_confirmed),
    (tpl_expensas, cid, prev_month, true, uid_a, st_confirmed),
    (tpl_epec,     cid, prev_month, true, uid_b, st_confirmed);

  -- ── VARIABLE EXPENSES ─────────────────────────────────────────
  insert into variable_expenses (couple_id, user_id, description, amount, date, is_shared, category_id) values
    (cid, uid_a, 'Verdulería', 15069.00, cur_month + 3, true, null);

end $$;
