-- Wellness Voucher: closing the till to anonymous visitors
-- Run in Supabase: Dashboard -> SQL Editor -> New Query -> paste -> Run.
-- Project: vlqvefsaxztitcbhirxt
--
-- RUN AFTER: supabase_roles_setup.sql, voucher_issues_setup.sql, voucher_roles_fix.sql,
-- voucher_referrals.sql. Idempotent, so re-run it any time, and re-run it after any of
-- those four, because those four are the ones that hand grants out.
--
-- WHY THIS EXISTS
--   The till page and the log page were readable and usable by anybody who had the URL. The
--   reasoning was that reception stands at a till and should not have to sign in, and it was
--   defended by a noindex meta tag and by nobody knowing the path.
--
--   Neither of those is a control:
--     - the pack is served from a PUBLIC repository, so the path is in a browsable file
--       listing whatever the meta tag says, and the publishable key is in the page source;
--     - voucher_issues holds CLIENT NAMES. Confirmed readable anonymously on 20 August:
--       a plain select from a signed-out browser returned client_name and issued_by;
--     - issue_voucher() was callable anonymously, and a serial cannot be taken back. A
--       stranger, or a phone left open on a bus, could burn the sequence at any branch.
--
--   The two pages now require a session (shared/signin-gate.js). That is the sentence, not
--   the enforcement. THIS FILE is the enforcement: with no grant, the publishable key in a
--   console gets nothing. Both are needed, because a database refusing a request produces an
--   error nobody at a till can read.
--
-- WHY A SEPARATE FILE AND NOT JUST AN EDIT
--   Grants are additive. The four files above have been edited so they never grant anon
--   anything again, but editing them does not take back what anon was already given on a
--   database they have already run on. Only an explicit revoke does that, so it lives here,
--   once, where it can be read as a list.
--
-- WHAT REGRESSES, HONESTLY
--   Reception has to sign in once per salon machine with info@tararosesalon.com. The session
--   is kept in localStorage and refreshes itself, so it is once per machine, not once per
--   shift, but it IS a new step at the desk and the salons need the password. Every other
--   page in the pack stays open to anonymous reviewers, which is the whole point of the pack
--   and is not changed by anything here.

-- ---------------------------------------------------------------------------
-- 1. take it all back from anon
-- ---------------------------------------------------------------------------

-- Tables and views. Listed one per line rather than as a schema-wide revoke, because a
-- schema-wide revoke here would also close the notes and the dashboard, which are
-- deliberately open to anonymous reviewers.
revoke all on public.voucher_issues    from anon;
revoke all on public.voucher_counters  from anon;
revoke all on public.voucher_events    from anon;
revoke all on public.voucher_referrals from anon;
revoke all on public.voucher_log       from anon;

-- The only door in, and it was open. security definer means the function ignores the table
-- grants once it is running, so this EXECUTE grant was the whole of the write access.
revoke all on function public.issue_voucher(text,text,text,date,text,text) from anon;

-- Belt and braces: default privileges, in case a future object is created by a role that
-- grants to anon automatically.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon;

-- ---------------------------------------------------------------------------
-- 2. and again in the policies
-- ---------------------------------------------------------------------------
--
-- A policy with no `to` clause applies to every role, so `using (true)` read as "anybody".
-- With the grants gone that is already unreachable, but a policy that says anybody while
-- meaning signed-in is the kind of line somebody later trusts. Say the true thing twice.

drop policy if exists voucher_issues_select on public.voucher_issues;
create policy voucher_issues_select on public.voucher_issues
  for select to authenticated using (true);

drop policy if exists voucher_counters_select on public.voucher_counters;
create policy voucher_counters_select on public.voucher_counters
  for select to authenticated using (true);

drop policy if exists voucher_events_select on public.voucher_events;
create policy voucher_events_select on public.voucher_events
  for select to authenticated using (true);

drop policy if exists voucher_referrals_select on public.voucher_referrals;
create policy voucher_referrals_select on public.voucher_referrals
  for select to authenticated using (true);

-- The permissive insert policy from the first version of voucher_issues_setup.sql, dropped
-- by name in case that file has been re-run since voucher_roles_fix.sql tightened it. This
-- is the one that let anyone with the URL mark a real voucher VOIDED.
drop policy if exists voucher_events_insert on public.voucher_events;

-- ---------------------------------------------------------------------------
-- 3. check it landed
-- ---------------------------------------------------------------------------
--
-- Expect ZERO rows. Anything listed here is still reachable without signing in.
--   select table_name, privilege_type
--     from information_schema.role_table_grants
--    where grantee = 'anon'
--      and table_name in ('voucher_issues','voucher_counters','voucher_events',
--                         'voucher_referrals','voucher_log');
--
-- Expect ZERO rows. Anything listed here is a policy that still applies to every role.
--   select tablename, policyname, roles
--     from pg_policies
--    where tablename like 'voucher_%' and roles = '{public}';
--
-- Expect anon to hold no EXECUTE on the function. Expect ZERO rows.
--   select grantee, privilege_type
--     from information_schema.routine_privileges
--    where routine_name = 'issue_voucher' and grantee = 'anon';
--
-- The real test is not SQL. Open the till page in a private window. It must show "Sign in
-- first" and the counter must never appear.
