-- Invoice bank details: allow storing bank account details on individual
-- invoices, with fallback to the school's default bank details.

alter table public.invoices
  add column if not exists bank_name text,
  add column if not exists bank_account_name text,
  add column if not exists bank_account_number text;

