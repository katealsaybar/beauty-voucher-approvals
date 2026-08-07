-- Beauty Voucher Approval Pack — revision notes + suggestions
-- Run in Supabase: Dashboard -> SQL Editor -> New Query -> paste -> Run.
-- Project: vlqvefsaxztitcbhirxt
--
-- THIS IS THE CANONICAL FILE. It is idempotent — re-run it any time, including over the
-- earlier anon-access version of this schema (it drops those policies explicitly below).
--
-- Two channels, same as the CWD knowledgebase widgets this is copied from:
--   approval_notes       — a revision request pinned to a specific part of the pack (a
--                          section, a T&C clause, one open decision). Threaded replies.
--                          Open -> Actioned.
--   approval_suggestions — a standalone idea not tied to one line. Title + description,
--                          with its own flat discussion thread.
--                          Pending -> Accepted / Declined / Archived.
--
-- ACCESS: magic-link sign-in (Supabase Auth email OTP), restricted to the five addresses
-- in public.is_reviewer() below. The anon key can no longer read or write anything — it
-- can only be used to request a sign-in link. Authorship is taken from the JWT, not from
-- what the browser claims, so nobody can post as someone else.
--
-- The page content itself is NOT protected by any of this. RLS guards the notes data;
-- if index.html is served from a public URL, the pack is readable by anyone who has it.

-- ============================================================================
-- 0. WHO IS ALLOWED IN
-- ============================================================================
-- Keep this list in sync with REVIEWERS in notes-widget.js. The JS copy is only there to
-- show a friendly "you're not on the list" message — this function is the real gate.

create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'kate@tararosesalon.com',
    'tara@tararosesalon.com',
    'tararosegray@gmail.com',
    'tararosehairandbeauty@gmail.com',
    'emma-louise@tararosesalon.com'
  );
$$;

-- The signed-in user's own email, lowercased. Used to stamp and verify authorship.
create or replace function public.current_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- ============================================================================
-- 1. NOTES — pinned revision requests
-- ============================================================================

create table if not exists public.approval_notes (
  id uuid primary key default gen_random_uuid(),
  -- pack_id: which document the note belongs to (body[data-note-pack]). One table can
  -- serve several approval packs — filter by this.
  pack_id text not null,
  pack_title text not null,
  -- anchor_id/anchor_label: set when a note is pinned to a specific block rather than the
  -- pack as a whole. Both null = a general, pack-level note. anchor_label is a
  -- denormalized snapshot of that block's wording at post time, so the note still reads
  -- sensibly if the wording changes later. anchor_id is always "<sectionId>__<slug>" —
  -- the widget splits on "__" to work out which sidebar section a note belongs to.
  anchor_id text,
  anchor_label text,
  -- Replies are just another row pointing back at the note being replied to. One level
  -- deep only: a reply's own parent_id is always null, because the widget only ever shows
  -- a Reply control on top-level notes.
  parent_id uuid references public.approval_notes(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  resolved boolean not null default false,
  resolved_by_name text,
  resolved_at timestamptz,
  -- archived: a reversible "hide this" flag, deliberately NOT the same as resolved. For
  -- test/dummy rows. There is no delete policy anywhere in this file, so this is the safe
  -- way to get rid of noise. Archived rows are filtered out of the panel entirely.
  archived boolean not null default false
);

-- author_email: the verified identity from the JWT, added when this moved off anon
-- access. Nullable so the migration doesn't trip over rows written before sign-in
-- existed; new rows can't omit it, because the insert policy below requires it to match
-- the caller's own token.
alter table public.approval_notes add column if not exists author_email text;

create index if not exists approval_notes_pack_id_idx on public.approval_notes (pack_id);
create index if not exists approval_notes_anchor_id_idx on public.approval_notes (anchor_id);
create index if not exists approval_notes_parent_id_idx on public.approval_notes (parent_id);
create index if not exists approval_notes_resolved_idx on public.approval_notes (resolved);
create index if not exists approval_notes_archived_idx on public.approval_notes (archived);

alter table public.approval_notes enable row level security;

-- anon keeps nothing. Only a signed-in session can touch these tables.
revoke all on public.approval_notes from anon;
grant select, insert, update on public.approval_notes to authenticated;

-- Drop the previous wide-open anon policies if this project still has them.
drop policy if exists approval_notes_select on public.approval_notes;
drop policy if exists approval_notes_insert on public.approval_notes;
drop policy if exists approval_notes_update on public.approval_notes;

-- Any allowlisted reviewer sees every note.
create policy approval_notes_select on public.approval_notes
  for select
  to authenticated
  using (public.is_reviewer());

-- Post as yourself only: author_email must match your own token. Replies additionally
-- lock once the parent thread is marked actioned — mirrors the UI, which hides the reply
-- box and says "Reopen it above" instead.
--
-- NOTE: the exists-check must qualify the outer row as `approval_notes.parent_id`, not a
-- bare `parent_id`. Because this table has its own parent_id column, an unqualified
-- reference inside "from public.approval_notes p" resolves to the SUBQUERY's p.parent_id
-- instead of the row being inserted, which silently blocks every reply. (Same trap bit
-- the CWD comments table on 2026-07-29. Verified blocked-then-fixed here on 2026-08-07.)
create policy approval_notes_insert on public.approval_notes
  for insert
  to authenticated
  with check (
    public.is_reviewer()
    and lower(author_email) = public.current_email()
    and char_length(body) between 1 and 4000
    and char_length(author_name) between 1 and 80
    and char_length(pack_id) between 1 and 120
    and (
      parent_id is null
      or exists (
        select 1 from public.approval_notes p
        where p.id = approval_notes.parent_id and p.resolved = false
      )
    )
  );

-- Any reviewer can flip resolve/archive state on any note (all five are decision-makers
-- on this pack). The trigger below is what stops an update being used to rewrite history:
-- RLS controls which ROWS a policy applies to, not which COLUMNS.
create policy approval_notes_update on public.approval_notes
  for update
  to authenticated
  using (public.is_reviewer())
  with check (public.is_reviewer() and char_length(body) between 1 and 4000);

create or replace function public.approval_notes_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Identity, targeting, threading and timestamps are immutable once posted.
  if new.id is distinct from old.id
     or new.pack_id is distinct from old.pack_id
     or new.pack_title is distinct from old.pack_title
     or new.anchor_id is distinct from old.anchor_id
     or new.anchor_label is distinct from old.anchor_label
     or new.parent_id is distinct from old.parent_id
     or new.author_name is distinct from old.author_name
     or new.author_email is distinct from old.author_email
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Only the note body, resolve state and archive state can be changed.';
  end if;
  -- ...and the body itself is only the author's to edit. Anyone may still resolve or
  -- archive, which is why this check is on the body specifically rather than the row.
  if new.body is distinct from old.body
     and lower(coalesce(old.author_email, '')) is distinct from public.current_email()
  then
    raise exception 'Only the author can edit the text of a note.';
  end if;
  return new;
end;
$$;

drop trigger if exists approval_notes_guard_update_trigger on public.approval_notes;
create trigger approval_notes_guard_update_trigger
  before update on public.approval_notes
  for each row
  execute function public.approval_notes_guard_update();

-- No delete policy on purpose — the notes are the audit trail of what Tara asked for and
-- what got actioned. A client DELETE matches zero rows and changes nothing.

-- ============================================================================
-- 2. SUGGESTIONS — standalone ideas, not tied to one line
-- ============================================================================

create table if not exists public.approval_suggestions (
  id uuid primary key default gen_random_uuid(),
  pack_id text not null,
  -- section_context: which section she happened to be reading when she raised it. For
  -- reference only — a suggestion is deliberately NOT pinned the way a note is.
  section_context text,
  requester_name text not null,
  title text not null,
  description text,
  -- 'archived' is for stale/duplicate ideas where no real call was made — distinct from
  -- 'declined', which is an actual no. Archived suggestions are hidden from the panel.
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'archived')),
  created_at timestamptz not null default now(),
  actioned_by_name text,
  actioned_at timestamptz
);

alter table public.approval_suggestions add column if not exists requester_email text;

create index if not exists approval_suggestions_pack_id_idx on public.approval_suggestions (pack_id);
create index if not exists approval_suggestions_status_idx on public.approval_suggestions (status);

alter table public.approval_suggestions enable row level security;
revoke all on public.approval_suggestions from anon;
grant select, insert, update on public.approval_suggestions to authenticated;

drop policy if exists approval_suggestions_select on public.approval_suggestions;
drop policy if exists approval_suggestions_insert on public.approval_suggestions;
drop policy if exists approval_suggestions_update on public.approval_suggestions;

create policy approval_suggestions_select on public.approval_suggestions
  for select
  to authenticated
  using (public.is_reviewer());

create policy approval_suggestions_insert on public.approval_suggestions
  for insert
  to authenticated
  with check (
    public.is_reviewer()
    and lower(requester_email) = public.current_email()
    and char_length(title) between 1 and 200
    and char_length(coalesce(description, '')) <= 4000
    and char_length(requester_name) between 1 and 80
    and char_length(pack_id) between 1 and 120
    and status = 'pending'  -- always starts pending; deciding is a separate update
  );

create policy approval_suggestions_update on public.approval_suggestions
  for update
  to authenticated
  using (public.is_reviewer())
  with check (
    public.is_reviewer()
    and char_length(title) between 1 and 200
    and char_length(coalesce(description, '')) <= 4000
  );

create or replace function public.approval_suggestions_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.pack_id is distinct from old.pack_id
     or new.section_context is distinct from old.section_context
     or new.requester_name is distinct from old.requester_name
     or new.requester_email is distinct from old.requester_email
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Only the title, description and status can be changed.';
  end if;
  -- Status is anyone's to set (that's the decision). Wording stays with whoever raised it.
  if (new.title is distinct from old.title or new.description is distinct from old.description)
     and lower(coalesce(old.requester_email, '')) is distinct from public.current_email()
  then
    raise exception 'Only the person who raised a suggestion can edit its wording.';
  end if;
  return new;
end;
$$;

drop trigger if exists approval_suggestions_guard_update_trigger on public.approval_suggestions;
create trigger approval_suggestions_guard_update_trigger
  before update on public.approval_suggestions
  for each row
  execute function public.approval_suggestions_guard_update();

-- ============================================================================
-- 3. SUGGESTION DISCUSSION — flat notes under one suggestion
-- ============================================================================

create table if not exists public.approval_suggestion_notes (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.approval_suggestions(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.approval_suggestion_notes add column if not exists author_email text;

create index if not exists approval_suggestion_notes_suggestion_id_idx
  on public.approval_suggestion_notes (suggestion_id);

alter table public.approval_suggestion_notes enable row level security;
revoke all on public.approval_suggestion_notes from anon;
grant select, insert, update on public.approval_suggestion_notes to authenticated;

drop policy if exists approval_suggestion_notes_select on public.approval_suggestion_notes;
drop policy if exists approval_suggestion_notes_insert on public.approval_suggestion_notes;
drop policy if exists approval_suggestion_notes_update on public.approval_suggestion_notes;

create policy approval_suggestion_notes_select on public.approval_suggestion_notes
  for select
  to authenticated
  using (public.is_reviewer());

-- Locks once the suggestion is decided (status != 'pending') — mirrors the UI, which
-- hides the note box and shows "Reset it to pending to add a note" instead. Resetting the
-- status reopens the discussion, same as reopening a note thread.
create policy approval_suggestion_notes_insert on public.approval_suggestion_notes
  for insert
  to authenticated
  with check (
    public.is_reviewer()
    and lower(author_email) = public.current_email()
    and char_length(body) between 1 and 4000
    and char_length(author_name) between 1 and 80
    and exists (
      select 1 from public.approval_suggestions s
      where s.id = approval_suggestion_notes.suggestion_id and s.status = 'pending'
    )
  );

create policy approval_suggestion_notes_update on public.approval_suggestion_notes
  for update
  to authenticated
  using (public.is_reviewer())
  with check (public.is_reviewer() and char_length(body) between 1 and 4000);

create or replace function public.approval_suggestion_notes_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.suggestion_id is distinct from old.suggestion_id
     or new.author_name is distinct from old.author_name
     or new.author_email is distinct from old.author_email
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Only the note body can be edited.';
  end if;
  if new.body is distinct from old.body
     and lower(coalesce(old.author_email, '')) is distinct from public.current_email()
  then
    raise exception 'Only the author can edit the text of a note.';
  end if;
  return new;
end;
$$;

drop trigger if exists approval_suggestion_notes_guard_update_trigger on public.approval_suggestion_notes;
create trigger approval_suggestion_notes_guard_update_trigger
  before update on public.approval_suggestion_notes
  for each row
  execute function public.approval_suggestion_notes_guard_update();

-- No delete policy anywhere on purpose — same audit-trail reasoning throughout.
