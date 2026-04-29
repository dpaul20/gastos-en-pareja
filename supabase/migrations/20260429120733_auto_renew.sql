-- Auto-renovación de compras en cuotas.
-- Si auto_renew = true y se completan todas las cuotas,
-- el sistema crea automáticamente una nueva compra idéntica.
alter table public.installment_purchases
  add column auto_renew boolean not null default false;
