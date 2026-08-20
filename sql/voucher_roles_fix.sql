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
-- 3. the log the viewer reads
-- ---------------------------------------------------------------------------

-- Replaces the view from the first file, adding the archive state and a single text column
-- to search against, so the page can filter on name OR serial without two queries.
create or replace view public.voucher_log as
select
  i.id,
  'WV-' || i.tier || 'M-' || i.branch || '-' || lpad(i.seq::text, 4, '0') as main_serial,
  i.branch,
  case when i.branch in ('SAA','KCA') then 'Abu Dhabi' else 'Dubai' end as emirate,
  i.seq,
  i.tier,
  case i.tier when 'D' then 'Dip Your Toes'
              when 'S' then 'Season of You'
              when 'V' then 'All-In VIP Year' end as tier_name,
  case i.tier when 'D' then 1150 when 'S' then 3000 when 'V' then 5400 end as credit_aed,
  case i.tier when 'D' then 1    when 'S' then 3    when 'V' then 5    end as friend_cards,
  i.client_name,
  i.client_contact,
  i.purchase_date,
  i.main_expires_on,
  i.friend_expires_on,
  r.effective_on as referral_completed_on,
  r.expires_on   as referral_expires_on,
  (v.id is not null) as is_voided,
  v.detail       as void_reason,
  (a.id is not null) as is_archived,
  i.issued_by,
  i.created_at,
  -- One haystack for the search box. lower() here rather than in the page, so the index
  -- below can be used and the page does not have to know how to spell a serial.
  lower(i.client_name || ' ' ||
        'WV-' || i.tier || 'M-' || i.branch || '-' || lpad(i.seq::text, 4, '0') || ' ' ||
        coalesce(i.issued_by, '') || ' ' || i.branch) as search_text
from public.voucher_issues i
left join public.voucher_events r on r.issue_id = i.id and r.kind = 'referral_completed'
left join public.voucher_events v on v.issue_id = i.id and v.kind = 'voided'
left join public.voucher_events a on a.issue_id = i.id and a.kind = 'archived';

grant select on public.voucher_log to anon, authenticated;

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
