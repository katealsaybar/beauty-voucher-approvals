-- Wellness Voucher Approval Pack: editor access (admin / viewer)
-- Run this ONCE in Supabase: Dashboard → SQL Editor → New Query → paste → Run.
-- Project: vlqvefsaxztitcbhirxt
-- Safe to re-run: it recreates the function/trigger/policies and never resets a role that
-- is already set.
--
-- Copied from the CWD knowledgebase pattern (sql/supabase_roles_setup.sql), cut down to
-- two roles because this pack only needs two.
--
-- ============================================================================
-- RUN ORDER: THIS MATTERS
-- ============================================================================
--   1. Create Kate's account FIRST:
--        Supabase Dashboard → Authentication → Users → Add user → Create new user
--        Email: kate@tararosesalon.com
--        Password: (the one Kate chose, set it here, in the dashboard)
--        Tick "Auto Confirm User" so there is no confirmation email to chase.
--   2. Then run this file. The last statement promotes that account to 'admin'.
--   3. Then run sql/notes_setup.sql, which is what actually locks editing down.
--
--   If you run sql/notes_setup.sql before step 1, NOBODY can resolve or archive anything,
--   including Kate. Nothing is lost: create the user, run this, and it works again.
--
--   The password is deliberately NOT in this file. This repo is published to a public
--   GitHub Pages URL; a password committed here would be readable by anyone.
--
-- ============================================================================
-- WHO CAN DO WHAT
-- ============================================================================
--                                              admin (Kate)   anonymous reviewer
--   Read the pack and the automations map           yes              yes
--   Read every note and suggestion                  yes              yes
--   Leave a note, reply, or raise a suggestion      yes              yes
--   Mark a note actioned / reopen it                yes              NO
--   Archive a note or a suggestion, and restore it  yes              NO
--   Accept / decline a suggestion                   yes              NO
--   Edit the wording of a posted note               yes              NO
--
--   So Tara, Emma and Hanneh keep full comment access; they just cannot move the state.
--   That is the point: they see Kate's progress through their own suggestions.
--
--   Enforcement lives in two files: this one (profiles + is_admin) and sql/notes_setup.sql
--   (the UPDATE policies on the three tables). Change a capability above and change both.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- re-runnable even if an earlier version of this table had a different role list
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'viewer'));

-- backfill a row for any account created before this table existed
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Security-definer helper. Querying profiles directly inside a profiles RLS policy raises
-- "infinite recursion detected in policy"; routing through a definer function that bypasses
-- RLS avoids it. (Same trap as the CWD version.)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

-- A signed-in user can read their own row, so the page can tell whether to show the edit
-- controls. Nobody can read anyone else's, and nobody can read this table anonymously.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin(auth.uid()));

-- Roles are changed in the Supabase dashboard, not from the browser. No update policy on
-- purpose: there is no admin UI in this pack, and one fewer write path is one fewer way to
-- accidentally hand someone edit rights.
drop policy if exists profiles_update_admin_only on public.profiles;

grant select on public.profiles to authenticated;
-- Explicit, because this project has been used for other things and a stale grant to anon
-- survives here whether or not this file ever hands one out. RLS already returns nothing to
-- anon (the policy above is `to authenticated`), so this is tidiness, not a fix.
revoke all on public.profiles from anon;

-- Make Kate the editor. Everyone else who ever signs in defaults to 'viewer'.
update public.profiles set role = 'admin' where email = 'kate@tararosesalon.com';

-- Sanity check: should return one row, role = admin. If it returns none, step 1 above was
-- skipped: create the user in Authentication → Users, then re-run this file.
select email, role from public.profiles order by role, email;
