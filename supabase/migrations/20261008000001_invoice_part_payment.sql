-- Part payments on invoices: how much has actually been received, when the
-- remainder is due, and a free-text remark printed on the receipt.
--
-- "Part paid" is DERIVED (0 < amount_paid_cents < amount_cents) rather than
-- stored, so the invoice_status enum is untouched and every existing
-- unpaid/paid filter keeps working. An invoice flips to 'paid' only once the
-- balance reaches zero. RLS needs no change: these are columns on a table that
-- is already policied.

alter table public.invoices
  add column if not exists amount_paid_cents bigint not null default 0,
  add column if not exists balance_due_date date,
  add column if not exists payment_note text;

-- Anything already marked paid was, by definition, paid in full.
update public.invoices
   set amount_paid_cents = amount_cents
 where status = 'paid'
   and amount_paid_cents = 0;

-- A receipt must never show a negative payment or an overpayment.
alter table public.invoices
  drop constraint if exists invoices_amount_paid_range;

alter table public.invoices
  add constraint invoices_amount_paid_range
  check (amount_paid_cents >= 0 and amount_paid_cents <= amount_cents);
