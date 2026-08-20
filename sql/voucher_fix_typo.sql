-- Wellness Voucher: letting a mistyped name be corrected, and nothing else
-- Run in Supabase: Dashboard -> SQL Editor -> New Query -> paste -> Run.
-- Project: vlqvefsaxztitcbhirxt
--
-- Run supabase_roles_setup.sql, voucher_issues_setup.sql, voucher_roles_fix.sql and
-- voucher_referrals.sql first. Idempotent.
--
-- WHY THIS EXISTS
--   Reception types the client's name at the till and until now nothing could change it.
--   That was deliberate, on the reasoning that a voucher's history should not be quietly
--   rewritten. It was also wrong about one thing: a name is not history. It is a fact about
--   a person, and a typo in it is not an event worth preserving. "Jamie Chastian" on the
--   card and "Jamie Chastain" in Phorest is exactly the mismatch the log exists to prevent.
--
-- WHAT IS CORRECTABLE, AND WHAT IS NOT
--   client_name and client_contact are correctable. They do not change what the card is.
--
--   branch, seq, tier, purchase_date and the two expiry dates are NOT, and this file does
--   not grant them. Each one changes what the card MEANS rather than who it belongs to:
--   the branch is inside the serial, the tier sets the value and the validity, and the dates
--   are what the client was told. A card with the wrong tier is not a typo, it is a
--   different card, and the honest fix is to void it and issue a new one.
--
-- HOW THE NARROWING WORKS
--   Two mechanisms, not one, because RLS alone cannot restrict WHICH columns an update
--   touches. The column-level GRANT decides the columns; the policy decides the person.
--   Attempting to update seq fails on privileges before any policy is consulted, so a
--   sequence still cannot be rewritten even by an admin, which is what keeps the serial
--   trustworthy.

-- Columns, not the table. `grant update (a, b)` is the whole reason this is safe.
grant update (client_name, client_contact) on public.voucher_issues to authenticated;

drop policy if exists voucher_issues_update_admin on public.voucher_issues;
create policy voucher_issues_update_admin on public.voucher_issues
  for update to authenticated
  using      (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- check it landed
-- ---------------------------------------------------------------------------
-- Expect exactly two rows, client_name and client_contact. If seq or tier appear here,
-- stop and do not use this file.
--   select column_name from information_schema.column_privileges
--    where table_name = 'voucher_issues' and privilege_type = 'UPDATE'
--      and grantee = 'authenticated';
