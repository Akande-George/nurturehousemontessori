-- The five Montessori age bands.
--
-- The age_group enum held three bands (0–2, 3–6, 7–9). Montessori schools use
-- five: 0–1.5, 1.5–3, 3–6, 6–9, 9–12. primary_3_6 and lower_7_9 already cover
-- 3–6 and 6–9 (the app labels lower_7_9 as 6–9), so only three values are new.
--
-- infant_0_2 stays: Postgres can't drop an enum value, and a 0–2 child can't be
-- split between Nido and Toddler Community automatically. The student form no
-- longer offers it; existing rows keep showing as "Infant (0–2)".
--
-- ADD VALUE can't run inside a transaction block alongside a use of the new
-- value — this file only adds them, so it is safe to paste and run as-is.

alter type public.age_group add value if not exists 'nido_0_1_5' before 'infant_0_2';
alter type public.age_group add value if not exists 'toddler_1_5_3' before 'primary_3_6';
alter type public.age_group add value if not exists 'upper_9_12' after 'lower_7_9';
