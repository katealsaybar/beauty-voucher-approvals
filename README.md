# Beauty Voucher — Approval Pack

Tara's sign-off pack for the Summer Beauty Ritual Voucher (UAE), with a notes and
suggestions layer on top so she can leave revisions directly on the document instead of
sending them back in WhatsApp.

The pack itself is [`index.html`](index.html) — the original Cowork artifact, unchanged
apart from the logo and the includes for the widget.

## The two channels

Concept copied from the CWD knowledgebase widgets (Comments Widget + Suggestions Widget),
merged into one slide-in panel because this is one document rather than a whole site.

| | **Notes** | **Suggestions** |
|---|---|---|
| For | A revision to a specific line | An idea not tied to one line |
| Pinned to | A section, a T&C clause, or one open decision | Nothing — just records which section she was on |
| Has | Threaded replies | A title, a description, its own discussion thread |
| States | Open → Actioned | Pending → Accepted / Declined / Archived |

Every section heading, all 22 T&C clauses and all 10 open decisions get a **Note** button
(42 pin points). The sidebar shows a count of open notes per section, and the floating
bubble shows open notes + pending suggestions combined.

## Files

| File | What it is |
|---|---|
| `index.html` | The approval pack |
| `notes-widget.css` | Widget styling, themed off the pack's own CSS variables |
| `notes-widget.js` | Widget logic — plain script, no build step |
| `notes_setup.sql` | Run once in Supabase before any of this works |
| `assets/` | Logos, cropped from `static_html/assets/5.png` and `6.png` |

## Setup

1. **Run the SQL.** Supabase → project `vlqvefsaxztitcbhirxt` → SQL Editor → New Query →
   paste [`notes_setup.sql`](notes_setup.sql) → Run. It is idempotent, so re-run it
   whenever the file changes.
2. **Point Auth at wherever the pack is hosted.** Supabase → Authentication → URL
   Configuration. Set **Site URL** to the pack's address, and add every address it will be
   opened from to **Redirect URLs**, e.g.:
   - `http://localhost:8757/` (local preview)
   - the live URL, once there is one

   Magic links to any address not on that list are rejected by Supabase, so this step is
   not optional.
3. Open the pack and sign in.

**Sign-in needs a hosted URL**, even just `localhost`. A magic link cannot redirect back to
a `file://` path, so opening the HTML straight off disk lets you *read* the pack but not
sign in. Use the preview command at the bottom.

## Who can get in

Magic link (Supabase Auth email OTP) — type your email, click the link, no password. The
allowlist is five addresses:

| | |
|---|---|
| `kate@tararosesalon.com` | Kate |
| `tara@tararosesalon.com` | Tara |
| `tararosegray@gmail.com` | Tara |
| `tararosehairandbeauty@gmail.com` | Tara |
| `emma-louise@tararosesalon.com` | Emma-Louise |

Tara's three addresses all display as "Tara", so her notes read consistently whichever one
she signs in with.

The list lives in **two places** and they must match: `public.is_reviewer()` in
`notes_setup.sql` (the real gate, enforced by Postgres) and `REVIEWERS` in
`notes-widget.js` (only so a non-reviewer gets a clear message instead of a link that goes
nowhere). To add someone, edit both and re-run the SQL.

### What that protects, and what it does not

- **Authorship is verified.** Every insert must carry an `author_email` matching the
  caller's own token, so nobody can post as someone else. Only the author can edit their
  own wording; any reviewer can mark a note actioned or decide a suggestion.
- **`anon` has nothing.** The publishable key in the page source can only request a
  sign-in link — it can no longer read or write a single row.
- **Nothing can be deleted from the browser, by anyone.** There is no delete policy on any
  of the three tables, so a client `DELETE` matches zero rows and changes nothing. Notes
  and suggestions are the audit trail of what Tara asked for and what got actioned.
- **The pack itself is NOT protected.** RLS guards the notes data only. If `index.html` is
  served from a public URL, anyone with that URL can read the pack — staff incentive
  amounts included. Gating the page in JavaScript would not change that, since the raw
  file is still fetchable. If the content needs to be private, the hosting has to be
  private.

To hide a row instead of deleting it — a test row, a duplicate — archive it. Archived rows
are filtered out of the panel entirely, for both channels:

```sql
update public.approval_notes set archived = true where id = '...';
update public.approval_suggestions set status = 'archived' where id = '...';
```

Un-archiving is SQL too (`archived = false`, or `status = 'pending'`), since the panel
can't see archived rows to offer a button on them.

## If this grows

The CWD originals use a `public.profiles` table with roles (`public.is_admin()`) rather
than a hardcoded email list. That is the pattern to move to if this ever needs more than a
handful of named reviewers, or if "who can decide" stops being the same set as "who can
comment" — right now all five reviewers can resolve notes and decide suggestions.

## Starting a fresh review round

`pack_id` comes from `data-note-pack` on `<body>` (currently `beauty-voucher-2026-08`).
Change it and the pack starts an empty thread, leaving the old round intact in the table.

## Local preview

```bash
python -m http.server 8757 --directory beauty-voucher-approval-pack
```
