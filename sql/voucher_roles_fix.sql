-- Wellness Voucher: who is allowed to change a voucher's history
-- Run in Supabase: Dashboard -> SQL Editor -> New Query -> paste -> Run.
-- Project: vlqvefsaxztitcbhirxt
--
-- RUN THESE FIRST, in this order:
--   1. sql/supabase_roles_setup.sql   creates public.profiles and public.is_admin(uuid)
--   2. sql/voucher_issues_setup.sql   the tables this file tightens
-- Unlike voucher_issues_setup.sql, this file DOES need is_admin(), because this is where
-- the admin-only rules live. Idempotent, so re-run it any time.
--
-- WHY THIS EXISTS: A BUG IN THE FILE BEFORE IT
--   voucher_issues_setup.sql granted anon INSERT on voucher_events and let the policy accept
--   any of the three kinds. So anyone reaching the public site could mark a voucher VOIDED,
--   and a voided voucher is one reception will refuse at the till. That is the opposite of
--   what was asked for: salon staff look, Kate is the only one who takes something away.
--
--   Nothing is lost by tightening it now. voucher_events is append-only and nobody has
--   written to it yet.
--
-- THE THREE LEVELS
--
--   ANONYMOUS (reception at the till, not signed in)
--     issue a voucher, read the log. Cannot write to voucher_events at all. Reception's job
--     is to create cards, never to retire one.
--
--   SIGNED IN, NOT ADMIN (info@tararosesalon.com, the salon staff account)
--     read the log. Nothing else. Same power as anon, but with a name attached to the
--     session, which is the point of giving the salons their own login rather than the URL.
--
--   ADMIN (kate@tararosesalon.com)
--     the only account that can record anything against a voucher after it was issued:
--     a completed referral, an archive, a void.
--
-- WHY ARCHIVE AND VOID ARE SEPARATE
--   Archive means "stop showing me this row", a tidying action with no consequence for the
--   client. Void means "this card is dead, refuse it at the till". Collapsing them into one
--   button is how a tidy-up ends with a client being turned away at the desk, so they are
--   two kinds, and only the second one changes what reception does.

-- ---------------------------------------------------------------------------
-- 1. 'archived' becomes a kind in its own right
-- ---------------------------------------------------------------------------

alter table public.voucher_events drop constraint if exists voucher_events_kind_check;
alter table public.voucher_events
  add constraint voucher_events_kind_check
  check (kind in ('referral_completed','voided','archived','note'));

-- One archive per voucher, same shape as the referral and void guards.
create unique index if not exists voucher_events_one_archive
  on public.voucher_events (issue_id) where kind = 'archived';

-- ---------------------------------------------------------------------------
-- 2. take the write away from anon
-- ---------------------------------------------------------------------------

revoke insert on public.voucher_events from anon;
grant  select on public.voucher_events to anon, authenticated;
grant  insert on public.voucher_events to authenticated;

-- The old policy accepted any kind from anybody. Both earlier names are dropped explicitly
-- so re-running this file leaves exactly one insert policy behind.
drop policy if exists voucher_events_insert       on public.voucher_events;
drop policy if exists voucher_events_insert_admin on public.voucher_events;

-- public.is_admin(auth.uid()) reads public.profiles, which the browser cannot set. This is the line
-- that actually enforces it; hiding the button in the UI is only convenience.
create policy voucher_events_insert_admin on public.voucher_events
  for insert to authenticated
  with check (
    public.is_admin(auth.uid())
    and kind in ('referral_completed','voided','archived','note')
    and exists (select 1 from public.voucher_issues i where i.id = issue_id)
  );

-- ---------------------------------------------------------------------------
-- 3. the log view is NOT defined here, on purpose
-- ---------------------------------------------------------------------------
--
-- It used to be, and that was a trap. public.voucher_log was defined in BOTH this file and
-- voucher_referrals.sql, so whichever ran last won. Running them in the documented order was
-- fine; running this one afterwards silently dropped the referral columns and the log page
-- lost its friend counting with no error anywhere.
--
-- sql/voucher_referrals.sql is now the only file that defines the view. Run it after this
-- one. If the log page says referral tracking is not set up, that is this trap being sprung,
-- and re-running voucher_referrals.sql is the whole fix.

-- ---------------------------------------------------------------------------
-- 4. check it landed
-- ---------------------------------------------------------------------------
-- Expect exactly one row, voucher_events_insert_admin.
--   select policyname from pg_policies
--    where tablename = 'voucher_events' and cmd = 'INSERT';
--
-- Expect anon to have NO insert on voucher_events. Expect zero rows.
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_name = 'voucher_events' and grantee = 'anon' and privilege_type = 'INSERT';
