-- ================================================================
-- Gastos en Pareja — Test Seed
-- Ejecutar con: npx supabase db reset
-- Login: persona_a@test.local / password123
--        persona_b@test.local / password123
-- ================================================================

do $$
declare
  auth_iid    uuid    := '00000000-0000-0000-0000-000000000000';
  uid_a       uuid    := '00000000-0000-0000-0000-000000000001';
  uid_b       uuid    := '00000000-0000-0000-0000-000000000002';
  cid         uuid    := '00000000-0000-0000-0000-000000000010';
  cur_month   date    := date_trunc('month', current_date)::date;
  prev_month  date    := (date_trunc('month', current_date) - interval '1 month')::date;
  st_pending  text    := 'PENDING_CONFIRMATION';
  st_confirmed text   := 'CONFIRMED';

  tpl_alquiler uuid;
  tpl_netflix  uuid;
  tpl_internet uuid;
  tpl_expensas uuid;
  tpl_seguro   uuid;

  cat_vivienda  uuid;
  cat_servicios uuid;
  cat_entret    uuid;
  cat_comida    uuid;
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
      'persona_a@test.local',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Deivy G.","avatar_url":null}',
      now(), now(), '', '', '', ''
    ),
    (
      auth_iid, uid_b,
      'authenticated', 'authenticated',
      'persona_b@test.local',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Lucía M.","avatar_url":null}',
      now(), now(), '', '', '', ''
    );

  -- ── COUPLE ─────────────────────────────────────────────────────
  insert into couples (id, status) values (cid, 'ACTIVE');

  insert into couple_members (couple_id, user_id, role) values
    (cid, uid_a, 'OWNER'),
    (cid, uid_b, 'MEMBER');

  -- ── CATEGORIES (resolve system IDs) ────────────────────────────
  select id into cat_vivienda  from expense_categories where name = 'Vivienda'        and couple_id is null;
  select id into cat_servicios from expense_categories where name = 'Servicios'       and couple_id is null;
  select id into cat_entret    from expense_categories where name = 'Entretenimiento' and couple_id is null;
  select id into cat_comida    from expense_categories where name = 'Comida'          and couple_id is null;

  -- ── INCOMES ────────────────────────────────────────────────────
  -- Mes actual
  insert into incomes (couple_id, user_id, amount, month) values
    (cid, uid_a, 450000, cur_month),
    (cid, uid_b, 350000, cur_month);

  -- Mes anterior (para historial)
  insert into incomes (couple_id, user_id, amount, month) values
    (cid, uid_a, 430000, prev_month),
    (cid, uid_b, 340000, prev_month);

  -- ── INSTALLMENT PURCHASES (cuotas) ─────────────────────────────
  insert into installment_purchases
    (couple_id, description, total_amount, installments, paid_installments, first_payment_date, auto_renew, category_id)
  values
    (cid, 'MacBook Pro M3', 250000, 12,  3, cur_month - interval '3 months', false, null),
    (cid, 'Smart TV Samsung', 120000, 6,  2, cur_month - interval '2 months', false, cat_entret),
    (cid, 'Heladera Whirlpool', 180000, 18, 5, cur_month - interval '5 months', false, cat_vivienda),
    (cid, 'Nintendo Switch', 80000, 24, 0, cur_month, true, cat_entret);

  -- ── FIXED EXPENSE TEMPLATES ────────────────────────────────────
  insert into fixed_expense_templates
    (id, couple_id, description, amount, due_day, active, category_id, requires_monthly_review)
  values
    (gen_random_uuid(), cid, 'Alquiler',         39259,  1,  true, cat_vivienda,  true),
    (gen_random_uuid(), cid, 'Netflix',           5499,   15, true, cat_entret,    true),
    (gen_random_uuid(), cid, 'Internet + Cable',  8900,   10, true, cat_servicios, false),
    (gen_random_uuid(), cid, 'Expensas',          12500,  5,  true, cat_vivienda,  true),
    (gen_random_uuid(), cid, 'Seguro auto',       15000,  20, true, null,          false);

  -- Recuperar IDs individualmente para poder asignar status correcto por instancia
  select id into tpl_alquiler from fixed_expense_templates where couple_id = cid and description = 'Alquiler';
  select id into tpl_netflix  from fixed_expense_templates where couple_id = cid and description = 'Netflix';
  select id into tpl_internet from fixed_expense_templates where couple_id = cid and description = 'Internet + Cable';
  select id into tpl_expensas from fixed_expense_templates where couple_id = cid and description = 'Expensas';
  select id into tpl_seguro   from fixed_expense_templates where couple_id = cid and description = 'Seguro auto';

  -- ── FIXED INSTANCES — mes actual ───────────────────────────────
  -- requires_monthly_review = true → PENDING_CONFIRMATION
  -- requires_monthly_review = false → CONFIRMED
  insert into fixed_expense_instances (template_id, couple_id, month, paid, status) values
    (tpl_alquiler, cid, cur_month, false, st_pending),
    (tpl_netflix,  cid, cur_month, false, st_pending),
    (tpl_internet, cid, cur_month, false, st_confirmed),
    (tpl_expensas, cid, cur_month, false, st_pending),
    (tpl_seguro,   cid, cur_month, true,  st_confirmed);

  -- ── FIXED INSTANCES — mes anterior (todas confirmadas y pagas) ─
  insert into fixed_expense_instances (template_id, couple_id, month, paid, status) values
    (tpl_alquiler, cid, prev_month, true, st_confirmed),
    (tpl_netflix,  cid, prev_month, true, st_confirmed),
    (tpl_internet, cid, prev_month, true, st_confirmed),
    (tpl_expensas, cid, prev_month, true, st_confirmed),
    (tpl_seguro,   cid, prev_month, true, st_confirmed);

  -- ── VARIABLE EXPENSES — mes actual ─────────────────────────────
  insert into variable_expenses (couple_id, user_id, description, amount, date, is_shared, category_id) values
    (cid, uid_a, 'Super Vea',       12500, cur_month + 2, true,  cat_comida),
    (cid, uid_b, 'Farmacia',         3200, cur_month + 3, false, null),
    (cid, uid_a, 'Nafta',            8000, cur_month + 4, false, null),
    (cid, uid_b, 'Pizza delivery',   4500, cur_month + 5, true,  cat_comida),
    (cid, uid_a, 'Cine',             3800, cur_month + 5, true,  cat_entret),
    (cid, uid_b, 'Mercado Libre',   15000, cur_month + 1, true,  null);

  -- ── VARIABLE EXPENSES — mes anterior ───────────────────────────
  insert into variable_expenses (couple_id, user_id, description, amount, date, is_shared, category_id) values
    (cid, uid_a, 'Super Coto',      18000, prev_month + 10, true,  cat_comida),
    (cid, uid_b, 'Restaurante',      9500, prev_month + 15, true,  cat_comida),
    (cid, uid_a, 'Netflix regalo',   2000, prev_month + 20, false, cat_entret);

end $$;
