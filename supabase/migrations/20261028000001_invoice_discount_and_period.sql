-- Invoice discount and coverage period: allow schools to apply discounts
-- to invoices and specify the date range/term the invoice covers.

alter table public.invoices
  add column if not exists discount_cents bigint not null default 0,
  add column if not exists period_start date,
  add column if not exists period_end date;

-- Ensure discount cannot be negative
alter table public.invoices
  drop constraint if exists invoices_discount_cents_check;

alter table public.invoices
  add constraint invoices_discount_cents_check
  check (discount_cents >= 0);

