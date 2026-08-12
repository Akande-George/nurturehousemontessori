-- Invoice upgrade: short human-readable invoice numbers (e.g. NHMS/0826/007),
-- itemised line items + tax, and school bank/payment details for the invoice footer.

alter table public.invoices
  add column if not exists invoice_no text,
  add column if not exists line_items jsonb not null default '[]'::jsonb,
  add column if not exists tax_cents bigint not null default 0;

alter table public.schools
  add column if not exists bank_name text,
  add column if not exists bank_account_name text,
  add column if not exists bank_account_number text;

-- Generates "PREFIX/MMYY/NNN" where PREFIX is the school-name initials (max 4),
-- MMYY comes from the issue date, and NNN is a per-school monthly sequence.
create or replace function public.set_invoice_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text;
  mmyy text;
  seq int;
begin
  if new.invoice_no is not null then
    return new;
  end if;

  select left(string_agg(upper(left(w.word, 1)), '' order by w.ord), 4)
    into prefix
    from public.schools s
    cross join lateral unnest(string_to_array(s.name, ' ')) with ordinality as w(word, ord)
   where s.id = new.school_id
     and w.word ~ '^[A-Za-z]';

  if prefix is null or prefix = '' then
    prefix := 'INV';
  end if;

  mmyy := to_char(coalesce(new.issued_at, now()), 'MMYY');

  select coalesce(max(split_part(i.invoice_no, '/', 3)::int), 0) + 1
    into seq
    from public.invoices i
   where i.school_id = new.school_id
     and i.invoice_no like prefix || '/' || mmyy || '/%'
     and split_part(i.invoice_no, '/', 3) ~ '^\d+$';

  new.invoice_no := prefix || '/' || mmyy || '/' || lpad(seq::text, 3, '0');
  return new;
end;
$$;

drop trigger if exists invoices_set_invoice_no on public.invoices;
create trigger invoices_set_invoice_no
  before insert on public.invoices
  for each row execute function public.set_invoice_no();

-- Backfill numbers for invoices issued before this migration.
with numbered as (
  select i.id,
         to_char(i.issued_at, 'MMYY') as mmyy,
         s.name as school_name,
         row_number() over (
           partition by i.school_id, date_trunc('month', i.issued_at)
           order by i.issued_at, i.id
         ) as rn
    from public.invoices i
    join public.schools s on s.id = i.school_id
   where i.invoice_no is null
)
update public.invoices u
   set invoice_no = coalesce(
         (select left(string_agg(upper(left(w.word, 1)), '' order by w.ord), 4)
            from unnest(string_to_array(n.school_name, ' ')) with ordinality as w(word, ord)
           where w.word ~ '^[A-Za-z]'),
         'INV')
       || '/' || n.mmyy || '/' || lpad(n.rn::text, 3, '0')
  from numbered n
 where u.id = n.id;

create unique index if not exists invoices_school_invoice_no_idx
  on public.invoices (school_id, invoice_no);
