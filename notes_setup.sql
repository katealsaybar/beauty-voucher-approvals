-- Beauty Voucher Approval Pack — revision notes + suggestions
-- Run in Supabase: Dashboard -> SQL Editor -> New Query -> paste -> Run.
-- Project: vlqvefsaxztitcbhirxt
--
-- THIS IS THE CANONICAL FILE. Idempotent — re-run it any time. It explicitly drops the
-- policies from BOTH earlier versions of this schema (the first anon one, and the
-- magic-link one), so running it now is what puts the database in the right state.
--
-- Two channels, same as the CWD knowledgebase widgets this is copied from:
--   approval_notes       — a revision request pinned to a specific part of the pack (a
--                          section, a T&C clause, one open decision). Threaded replies.
--                          Open -> Actioned.
--   approval_suggestions — a standalone idea not tied to one line. Title + description,
--                          with its own flat discussion thread.
--                          Pending -> Accepted / Declined / Archived.
--
-- ACCESS: none. Deliberately (decided 2026-08-07). Sign-in was built and then dropped —
-- a magic link means Tara and Emma have to go to their inbox and back before they can
-- type a sentence, and they simply wouldn't. Instead the reader picks a name from a
-- toggle in the header, and that is the only identity there is.
--
-- What that means, stated plainly so nobody is surprised later:
--   * anyone who has the page URL can read and post, and can post under any of the three
--     names. There is no way around that without a login.
--   * the only server-side guard on identity is that author_name must be one of the three
--     names below — enough to keep junk out, not enough to prove who wrote something.
--   * the pack is served from a public URL, so the notes are as private as that URL is.
-- Fine for three colleagues reviewing one document for three weeks. Not fine for
-- anything client-facing, confidential, or long-lived. Don't reuse these tables for that.

-- Who can be picked in the header toggle. Keep in sync with REVIEWERS in notes-widget.js.
create or replace function public.is_reviewer_name(n text)
returns boolean
language sql
immutable
as $$
  select n in ('Tara', 'Emma', 'Hanneh', 'Kate');
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

-- Left over from the magic-link version. Harmless, unused, and kept rather than dropped
-- so re-running this file never destroys a column that might hold data.
alter table public.approval_notes add column if not exists author_email text;

create index if not exists approval_notes_pack_id_idx on public.approval_notes (pack_id);
create index if not exists approval_notes_anchor_id_idx on public.approval_notes (anchor_id);
create index if not exists approval_notes_parent_id_idx on public.approval_notes (parent_id);
create index if not exists approval_notes_resolved_idx on public.approval_notes (resolved);
create index if not exists approval_notes_archived_idx on public.approval_notes (archived);

alter table public.approval_notes enable row level security;
grant select, insert, update on public.approval_notes to anon, authenticated;

drop policy if exists approval_notes_select on public.approval_notes;
drop policy if exists approval_notes_insert on public.approval_notes;
drop policy if exists approval_notes_update on public.approval_notes;
drop policy if exists approval_notes_update_admin_only on public.approval_notes;
drop policy if exists approval_notes_update_own_text on public.approval_notes;

create policy approval_notes_select on public.approval_notes
  for select
  to anon, authenticated
  using (true);

-- Shape guards only: a recognised name, sane lengths, and replies locked once the parent
-- thread is marked actioned (mirrors the UI, which hides the reply box and says "Reopen it
-- above" instead).
--
-- NOTE: the exists-check must qualify the outer row as `approval_notes.parent_id`, not a
-- bare `parent_id`. Because this table has its own parent_id column, an unqualified
-- reference inside "from public.approval_notes p" resolves to the SUBQUERY's p.parent_id
-- instead of the row being inserted, which silently blocks every reply. (Same trap bit the
-- CWD comments table on 2026-07-29. Confirmed working here on 2026-08-07 by trying to
-- reply to a resolved thread over the REST API and getting the expected 42501.)
create policy approval_notes_insert on public.approval_notes
  for insert
  to anon, authenticated
  with check (
    public.is_reviewer_name(author_name)
    and char_length(body) between 1 and 4000
    and char_length(pack_id) between 1 and 120
    and (
      parent_id is null
      or exists (
        select 1 from public.approval_notes p
        where p.id = approval_notes.parent_id and p.resolved = false
      )
    )
  );

-- Anyone can edit a body, resolve, or archive. Without a login there is nobody to check
-- against, so the trigger below protects what it still can: identity, targeting,
-- threading and timestamps are immutable once posted.
create policy approval_notes_update on public.approval_notes
  for update
  to anon, authenticated
  using (true)
  with check (char_length(body) between 1 and 4000);

create or replace function public.approval_notes_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.pack_id is distinct from old.pack_id
     or new.pack_title is distinct from old.pack_title
     or new.anchor_id is distinct from old.anchor_id
     or new.anchor_label is distinct from old.anchor_label
     or new.parent_id is distinct from old.parent_id
     or new.author_name is distinct from old.author_name
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Only the note body, resolve state and archive state can be changed.';
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
-- what got actioned. A client DELETE matches zero rows and changes nothing (verified).

-- ============================================================================
-- 2. SUGGESTIONS — standalone ideas, not tied to one line
-- ============================================================================

create table if not exists public.approval_suggestions (
  id uuid primary key default gen_random_uuid(),
  pack_id text not null,
  -- section_context: which section they happened to be reading when it was raised. For
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
grant select, insert, update on public.approval_suggestions to anon, authenticated;

drop policy if exists approval_suggestions_select on public.approval_suggestions;
drop policy if exists approval_suggestions_insert on public.approval_suggestions;
drop policy if exists approval_suggestions_update on public.approval_suggestions;

create policy approval_suggestions_select on public.approval_suggestions
  for select
  to anon, authenticated
  using (true);

create policy approval_suggestions_insert on public.approval_suggestions
  for insert
  to anon, authenticated
  with check (
    public.is_reviewer_name(requester_name)
    and char_length(title) between 1 and 200
    and char_length(coalesce(description, '')) <= 4000
    and char_length(pack_id) between 1 and 120
    and status = 'pending'  -- always starts pending; deciding is a separate update
  );

create policy approval_suggestions_update on public.approval_suggestions
  for update
  to anon, authenticated
  using (true)
  with check (
    char_length(title) between 1 and 200
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
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Only the title, description and status can be changed.';
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
grant select, insert, update on public.approval_suggestion_notes to anon, authenticated;

drop policy if exists approval_suggestion_notes_select on public.approval_suggestion_notes;
drop policy if exists approval_suggestion_notes_insert on public.approval_suggestion_notes;
drop policy if exists approval_suggestion_notes_update on public.approval_suggestion_notes;

create policy approval_suggestion_notes_select on public.approval_suggestion_notes
  for select
  to anon, authenticated
  using (true);

-- Locks once the suggestion is decided (status != 'pending') — mirrors the UI, which hides
-- the note box and shows "Reset it to pending to add a note" instead. Resetting the status
-- reopens the discussion, same as reopening a note thread.
create policy approval_suggestion_notes_insert on public.approval_suggestion_notes
  for insert
  to anon, authenticated
  with check (
    public.is_reviewer_name(author_name)
    and char_length(body) between 1 and 4000
    and exists (
      select 1 from public.approval_suggestions s
      where s.id = approval_suggestion_notes.suggestion_id and s.status = 'pending'
    )
  );

create policy approval_suggestion_notes_update on public.approval_suggestion_notes
  for update
  to anon, authenticated
  using (true)
  with check (char_length(body) between 1 and 4000);

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
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Only the note body can be edited.';
  end if;
  return new;
end;
$$;

drop trigger if exists approval_suggestion_notes_guard_update_trigger on public.approval_suggestion_notes;
create trigger approval_suggestion_notes_guard_update_trigger
  before update on public.approval_suggestion_notes
  for each row
  execute function public.approval_suggestion_notes_guard_update();

-- The magic-link helpers, no longer referenced by any policy. Dropped so a future reader
-- doesn't mistake them for something still in force.
drop function if exists public.is_reviewer();
drop function if exists public.current_email();

-- No delete policy anywhere on purpose — same audit-trail reasoning throughout.
