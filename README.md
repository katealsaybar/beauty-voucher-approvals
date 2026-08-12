# Beauty Voucher: Approval Pack

Tara's sign-off pack for the Summer Beauty Ritual Voucher (UAE), with a notes and
suggestions layer on top so she can leave revisions directly on the document instead of
sending them back in WhatsApp.

The pack itself is [`index.html`](index.html), the original Cowork artifact, unchanged
apart from the logo and the includes for the widget.

## The front door (added 8 Aug 2026)

Opening the pack no longer drops you at the top of a long document. It opens on a fork:
pick your name, then choose one of two doors:

- **Just my decisions**: the open decisions, one full-screen card at a time.
- **Show me everything**: the pack exactly as it always was, sidebar and all.

Same pack behind both. The fork appears on **every** visit, not just the first, because the
whole point is that the decisions come before the reading, and a door that only opens once
stops doing that the moment someone reopens the tab.

**Why cards rather than a longer decisions section.** Three answers matter, not two:
*Approve*, *Change this*, and *Later*. "Change this" is the most common answer and the only
one that creates work, so it gets its own button and its own box rather than being folded
into a yes/no. On a phone you can swipe right to approve and left to defer, but the gesture
is a shortcut over the buttons, never the mechanism: a swipe cannot hold three answers.

**Kept deliberately small:** the finish line is always on screen (*4 of 16 · 12 left*), the
list is served in rounds of five so there are three completions instead of one, and your
place is remembered per person, so stopping halfway costs nothing.

**Everything lands in the notes table.** An approval posts a note pinned to that decision,
a change request posts your words, and finishing posts one summary row naming whatever is
still open. So the review reads the same whether it came through a card or the notes panel,
and there is still only one inbox.

### Who is asked what

Each decision carries a `data-owner` on its `.decision` block in `index.html`. That is the
whole mechanism: one attribute, comma-separated:

```html
<div class="decision" data-owner="Tara,Emma"><span class="num">1</span>…
```

| Who | Sees | Which | Why |
|---|---|---|---|
| **Tara** | 16 | all but 11 | she signs the pack off |
| **Emma** | 4 | 1 staff incentive, 2 colour credit cap, 5 Ritual Kit caps + trade cost, 17 Floor Briefing | the money, and the floor, since she coaches the team |
| **Hanneh** | 2 | 14 pillar mix, 15 gifting transferability | anything social |
| **Kate** | 1 | 11 the "five questions" count | a fact to confirm, not a call to make |

**Deciding is not executing.** `data-owner` means *your answer is needed*, not *you do the
work afterwards*. Kate actions decisions 6 and 11 and Hanneh redrafts against 14, but only
where a person's answer actually changes the outcome do they get a card. An earlier pass had
Emma on 4 and 13 and Kate on 6; all three were removed on audit (8 Aug) because the second
party those decisions actually need is Dawn or Belle, neither of whom is a reviewer here.

Decisions **14 to 17 were added on 8 Aug**. 14 and 15 were already written up in the
Posting Calendar section as "Needs from Tara" but had never been numbered, so they were in the pack
without being in anybody's list. Promoted, not restated: the working detail still lives in
those sections. 17 is the Floor Briefing sign-off, which is blocked until 1 lands.

**16 is the posting calendar itself**, and it is the odd one out: the only decision that can
also be answered from another page. 14 and 15 are arguments *inside* the plan; 16 is a yes to
the plan, which three weeks of Hanneh's drafting runs off. `calendar/calendar.html` carries the
same two buttons at the top of the page, writing to the same `anchor_id`, because that is the
tab she will actually be reading it in and an answer belongs where the thing being answered
is. The anchor is `decisions__` + a slug of the decision's `.q` text (see `decide.js`), and
the calendar page hardcodes the result: **reword that question and the constant in
`calendar/calendar.html` has to be reworded with it**, or the two stop being the same answer.

A decision with **no** `data-owner` shows for everybody. Forgetting the attribute makes a
decision over-visible rather than invisible, which is the safe way to fail: an extra card is
a nuisance, a decision nobody is ever shown is a launch.

Anyone with nothing assigned gets "nothing is waiting on you" and the browse door promoted,
rather than a wall of someone else's decisions.

**Two owners means two answers.** Progress is stored per name, so Tara approving a shared
decision does not clear it from Emma's queue, and vice versa; it stays on both lists until
both have answered. The card says so out loud, but deliberately does not show what the
other person answered: that would turn a second opinion into a rubber stamp.

`data-rec="…"` on the same block adds a pre-selected recommendation to the card, so the
reviewer confirms rather than composes. Only decisions 6, 14 and 16 have one so far; the rest show
"no recommendation: this one is genuinely open", which is honest but weak. **Filling these
in is the single highest-value edit left on this pack.**

## The two channels

Concept copied from the CWD knowledgebase widgets (Comments Widget + Suggestions Widget),
merged into one slide-in panel because this is one document rather than a whole site.

| | **Notes** | **Suggestions** |
|---|---|---|
| For | A revision to a specific line | An idea not tied to one line |
| Pinned to | A section, a T&C clause, or one open decision | Nothing, it just records which section she was on |
| Has | Threaded replies | A title, a description, its own discussion thread |
| States | Open → Actioned | Pending → Accepted / Declined / Archived |

Every section heading, all 22 T&C clauses and all 10 open decisions get a **Note** button
(42 pin points). On `calendar/calendar.html` the pin points are every date in the month grid
(anchored on the date, not on what is in the cell) and every post in the agenda. Both views
are rebuilt on a month change or a channel toggle, which throws the buttons away, so they
call `window.TRS_NOTES.refreshPins()` afterwards; it re-scans and skips whatever is already
pinned. The sidebar shows a count of open notes per section, and the floating
bubble shows open notes + pending suggestions combined.

## Files

`index.html` is the pack, and it is the only page you have to open; everything else is
reachable from its sidebar and its Overview board. But the pack is not the whole review.
Seven other pages carry the parts that cannot be read as a list, and they all share the same
`pack_id`, so notes left on any of them land in the same stream and show up in the dashboard.

### One folder per surface

Every review surface owns a folder, and that folder holds its markup, its styling and its
behaviour side by side. Nothing is inlined any more: each page's `<style>` block became
`<name>.css` and its script blocks became `<name>.js`, so a layout bug is one file to open
and a behaviour bug is another, instead of both being somewhere in a 900-line HTML file.

```text
beauty-voucher-approval-pack/
├── index.html                 the pack, and the only URL anyone needs
├── README.md                  this file
│
├── pack/                      index.html's own styling and the decision queue
│   └── pack.css · pack.js · decide.css · decide.js
│
├── website-mockups/           drawings of real tararosesalon.com pages
│   ├── voucher-landing/       voucher-landing.html · .css · .js
│   ├── confidence-mapping/    confidence-mapping.html · .css · .js
│   └── terms/                 terms.html · .css · .js
│
├── automations/               automations.html · .css · .js · schedule.js
├── runbook/                   runbook.html · .css · .js
├── calendar/                  calendar.html · .css · .js
├── ritual-kit/                ritual-kit.html · .css · .js
├── mapping-result/            mapping-result.html · .css · .js
├── dashboard/                 dashboard.html · .css · dashboard-app.js
│
├── shared/                    only what more than one surface uses
│   └── notes-widget · mail-preview · phone-view  (.css + .js)
├── data/                      automations-data · calendar-data · whatsapp-templates
├── emails/                    the thirteen email files, as pasted into GHL
├── assets/  auth/  sql/  docs/  build/
```

**Why `shared/` still exists.** A file lives in a segment folder when one surface uses it,
and in `shared/` when several do: the notes widget is on all nine pages, the mail preview on
four, the phone view on the three website mockups. `data/` works the same way, and
`automations-data.js` genuinely has two consumers, which is why it is not filed under
`automations/`.

**Paths.** Only `index.html` sits at the root. A segment folder reaches out with `../`, and
a website mockup, being one level deeper, uses `../../`. Two scripts no longer care:
`shared/mail-preview.js` and `pack/decide.js` resolve the logo from their own script URL
rather than the page's, because they are loaded from pages at three different depths.

| Where | What it is |
|---|---|
| `index.html` | The approval pack: sections, terms, open decisions |
| **`website-mockups/` · drawings of real pages** | |
| `voucher-landing/` | The two landing pages, one per emirate, drawn in the live site's own design system. Emirate switch, plus a diff mode that outlines every block whose wording moves between the two |
| `terms/` | The T&Cs split per voucher. Answers Flag 1 (Motor City), and puts Flag 2 in front of Tara as option A vs option B |
| `confidence-mapping/` | `/en/ae/confidence-mapping/` with the six copy swaps and eleven build fixes applied. Toggles between the live page and the edited one |
| **The other surfaces** | |
| `automations/` | The three GHL workflows as a node map, with every email and WhatsApp template on a real phone frame. `schedule.js` adds the campaign clock: set one start date and every Lead Nurture step picks up a real one, plus a **Timeline** lane that puts the whole window in date order |
| `mapping-result/` | Both ends of one quiz submission: the real email as it lands, and the 19 answers as they arrive on our side. Renders `EMAILS.journal` from `data/automations-data.js`, so it cannot drift from what is actually built |
| `calendar/` | All 79 posts to 31 August as a month, with a brief behind each one. Carries Decision 16's sign-off at the top and a note button on every date |
| `ritual-kit/` | The Home Ritual Kit decision tree, keyed to Stage 2 of the Confidence Map |
| `runbook/` | **Not a review page.** The kill switch, the Make error gates, the six failure modes with a contingency each, and who holds which login. The page you open while something is failing, so it is ordered by urgency and everything is on screen: nothing hovers, nothing expands, and it prints |
| `dashboard/` | Every note and suggestion across all of the above, in one list |
| **`shared/` · used by more than one** | |
| `notes-widget.css` / `.js` | The notes and suggestions panel. Plain script, no build step, on every page |
| `mail-preview.css` / `.js` | The two handsets (Galaxy S25 at 360px, iPhone 16 Pro at 402px) and the email-client chrome. Used by `automations/`, `mapping-result/` and the phone view |
| `phone-view.css` / `.js` | The **Desktop / Phone** switch on the three website mockups. Self-installing: include both after the page's own style and script and it finds the header and the `.browser > .site`. Needs `mail-preview.*` loaded first |
| **`data/` · content** | |
| `automations-data.js` | **Generated. Do not edit.** `EMAILS` and `WA`, consumed by `automations/` and `mapping-result/` |
| `calendar-data.js` | The 79 posting-calendar rows |
| `whatsapp-templates.json` | The eight WhatsApp templates, with the longer drafts kept for reference |
| **The rest** | |
| `emails/` | The thirteen email HTML files, with real `{{merge_field}}` tokens. This is what gets pasted into GHL |
| `sql/supabase_roles_setup.sql` | Profiles and `is_admin()`. Run it first, after creating the editor account |
| `sql/notes_setup.sql` | The notes and suggestions tables. Run it second |
| `build/build-previews.py` | Regenerates `data/automations-data.js` from `emails/*.html` + `data/whatsapp-templates.json`. Run it after editing either |
| `docs/EMIRATE-ROUTING-BUILD-SPEC.md` | The emirate field design and what can and cannot land by Monday |
| `docs/CONFIDENCE-MAPPING-FIELD-SPEC.md` | The nineteen quiz fields, their types, and the two-ended test |
| `auth/` | The sign-in page and `supabase-client.js`, which owns the client and the session. **Every page that runs the notes widget or the dashboard has to load `supabase-client.js`**, after the Supabase CDN script and before its own. Miss it on one page and that page is permanently signed out: `window.TRS` never exists, so `canEdit()` is always false and the editor controls never appear, whoever is signed in. That was the state of every page but the sign-in page until 8 Aug 2026. Each page also needs `data-auth-root` on `<body>` (`""` at the root, `"../"` one folder down, `"../../"` for `website-mockups/<name>/`) so the links back to the pack resolve |
| `assets/` | Logos, cropped from `static_html/assets/5.png` and `6.png` |

Nothing on a mockup is live. They are drawings of pages, and no mockup has ever written to
the GHL account or the website: every change they show still has to be made by hand.

### Phone view

The three website mockups (`voucher-landing`, `terms`, `confidence-mapping`) carry a
**Desktop / Phone** switch in their sticky header, and remember which one you last used.
Phone view re-renders the mocked page inside an iframe that is a real 360 or 402 CSS px
wide, not a transform, not a hand-written second layout, because the mobile layout is
driven by the page's own `@media(max-width:820px)` rules and a media query only answers to
a real viewport. Chrome's address bar is drawn at the top on Android and Safari's at the
bottom on iOS, which is what decides whether a sticky CTA gets covered.

The header switches (emirate, live-vs-edited, show-what-changed) keep working in phone
view, and so does the emirate picker drawn inside the website mockup itself. The notes
widget's own **Note** button stays on the desktop view, because its panel inside a 360px shell is
unusable.

The mockups' 📌 annotations do come through, and they open **beside the handset, not in
it**. A note about the page is not part of the page, so it has no business taking up room
on the client's screen. The icon stays in the frame because it is what marks which part of
the page the note is about; the tap is posted out to the host page, which draws the note in
the pack's amber next to the phone, top-aligned with the screen. Escape or × closes it.

Links inside the phone are sorted by what they mean. A link to **another mockup** is part
of what a client walks through, so it stays in the handset and carries `?pv=1`, which
tells that page it is being read inside a phone: it drops its review header, its "You
are" bar, its own switch and the browser chrome, and renders as the site alone. A link to
the approval pack, the ritual kit tree or an email file is a **review** link, not a client
one, so it opens in its own tab instead. `?pv=1` only strips anything when the page is
genuinely inside a frame, so pasting that URL into a tab still gives you the full mockup.

Each mockup carries a `@media(max-width:520px)` block that re-proportions the mocked page
for a handset: 96px section padding down to ~40, the 14px uppercase eyebrow down to 10.5
so it stops running to three lines, display type to 31px, and the site header down to one
row (the website mockup's header keeps the brand and the emirate picker; "Where you book"
and the header's Reserve pill come off, because the two buttons already say the first and
the hero carries the second at twice the size). 520 rather than 820 on purpose: a tablet
has the room for the desktop proportions and reads better with them. Each block also keeps
a fallback for the 📌 popovers: in phone view the note is drawn outside the handset, but if
someone opens a mockup **directly** on a real phone there is no outside, so there the
popover becomes a sheet at the bottom of the screen rather than a 260px tooltip that a
360px screen would clip.

The salon addresses on the website mockup are **links to Google Maps**, not pills: the mint
pill on that page means "this takes your money", and four more of them for directions would
compete with the one that does. They use the `maps/search/?api=1&query=` URL scheme, which
needs no key, never expires, and opens the Maps app on a phone. Swap in the four Google
Business Profile links when we have them.

It earned its keep on day one: the T&C tier table was 512px wide at 360, dragging every
clause on the page sideways with it. Fixed in all three mockups the same way the pack
already does it, by letting a wide table scroll inside its own box.

### The campaign clock (added 10 Aug 2026)

`automations/automations.html` drew the arc as *Day 0 · Day 2 · Day 4 · Day 6 · Day 8*, which is
how GHL thinks about it and not how anyone planning a campaign does. Set the dates in the header
and every Lead Nurture step picks up a real one. It is remembered per browser.

**Two dates, not one, because there are two ways to move a campaign.** The first version had only
a start and derived the close from it, which quietly assumed the close was the thing allowed to
move. It is not: *30 September* is written into the body of all five nurture emails. So the header
carries a start, a close, and a switch for which one gives way:

- **Keep the close, fit the arc.** The close stays put and the five sends spread across whatever
  window is left — a later start means a tighter arc, an earlier one means more air. The copy
  keeps its promise. This is the default.
- **Keep the arc, move the close.** The eight-day arc stays exactly as drawn and the two dates
  travel together. The close comes off 30 September and the copy in five files has to change, which
  is Tara's call rather than a build setting.

Squeeze the window far enough and two sends land on the same morning. That is allowed and then
said out loud, in the header and on the affected Timeline row, rather than silently clamped.

**Two clocks, and keeping them apart is the whole point.** Lead Nurture is a broadcast: everybody
gets Day 0 on the same morning, so its steps carry real dates. The Welcome Pack and Confidence
Mapping start when *she* pays or submits, so a calendar date on those steps would be a lie and
they carry offsets instead (`Same minute`, `+1–2 days`). Two women who pay a week apart are on the
same rung at different times.

The new **Timeline** lane merges the dated steps into one column in date order, which is the
question anyone running the window actually has — *what goes out on Thursday* — and no workflow
tab answers it.

**It found two things the day it was built,** which is the argument for it existing:

1. **Day 8 has to land on the close**, because all five nurture emails name that date in their body
   and `nurture-5` says the window "closes tonight". The Monday-in-August deadline in the build
   specs is a *build* deadline, not a send date. Move the close and the header says how far off
   the copy it now is.
2. **`nurture-4` is titled "Four days left" and goes out two days before the close on the arc as
   drawn.** Either the email moves earlier, or the copy reads "Two days left", or the window
   stretches. The gap is now computed rather than asserted, so the lane names the third option
   exactly: **a fifteen-day window** puts that send four days out, making the locked headline true
   with no copy change at all. That is the only setting in which it is true, so check this line
   first whenever the arc moves.

### Rescheduled to 17 August – 30 September (12 Aug 2026)

The window now **opens Monday 17 August and closes Wednesday 30 September**. Six weeks, not three.
That is one date swap and one structural decision, and they are not the same size of change.

**The swap.** *28 August* became *30 September* in eighteen files: five nurture emails, two mapping
emails, the eight WhatsApp templates, the landing and terms mockups, the approval pack itself,
`pack/decide.js` and the emirate routing spec. `data/automations-data.js` is generated, so it was
rebuilt with `python build/build-previews.py` rather than edited; the longest WhatsApp body is 862
of the 1024 characters Meta allows, so nothing came close to failing submission.

**The decision.** Five emails cannot carry six weeks. Fitted across the whole window they land
eleven days apart and every urgency line in them is false for a month. So the purchase window and
the nurture arc were separated: the window is one span, the arc is a **fifteen-day countdown that
runs at the end of it**, 15 to 30 September. Fifteen because that is the one window where "Four
days left" is literally true, which is finding 2 above, now used rather than just reported.

Three consequences worth carrying forward:

- The header control is labelled **"First nurture send"**, not "Campaign starts". Since the
  reschedule those are two different days a month apart.
- `OPEN` is a new constant and **nothing in the arc hangs off it**. It is displayed, and the
  Timeline names the run-up as a decision, so a reviewer does not read the gap as a mistake.
- The `localStorage` key was bumped to `trs-bv-campaign-clock-v2`. Any browser that had set a
  date under the old key held an August arc that is no longer the campaign, and it would have
  silently overridden every default above.

**The calendar was moved next, and made a setting rather than a date swap** (same day, see the
section below). It was deliberately left out of the swap above rather than half-moved, because
79 rows dated into August is not a find and replace.

**"Day 4" stays the name of a step, not a count.** Once the arc has been fitted to a longer or
shorter window, Day 4 may be the third morning or the seventh. The date underneath moves; the day
number does not, because every node title on the canvas says Day 4 and the file is called
`nurture3`. Renaming those from the clock would make the map disagree with itself.

The day offsets live in one table at the top of `schedule.js`, not scattered across the workflow
nodes, so the schedule is one thing you can read and correct. The file is a layer over the map,
not a rewrite of it: it paints onto steps that already exist, and removing its one `<script>` tag
returns the page to exactly what it was.

### One window, read by both pages, and a posting plan that moves with it (12 Aug 2026)

The reschedule above exposed the real fault: `automations/schedule.js` held the campaign dates and
`data/calendar-data.js` held its own copy of them. They drifted the moment the campaign moved, and
for a day the pack described two different campaigns in two tabs. Three things were done about it.

**One source for the dates.** `data/campaign-dates.js` holds `BV_WINDOW` (`open`, `close`, `arc`)
and nothing else. Both pages load it before anything that reads a date. `schedule.js` takes `OPEN`,
`CLOSE_COPY` and its fifteen-day default from it, and every line on that page that quotes the close
now prints it rather than spelling it out, so moving the window in one file cannot leave the page
quoting a date that is in no email.

**Rows carry anchors, not dates.** Every row in `calendar-data.js` is now `{ a: 'open', o: 4 }`,
`{ a: 'flow', w: 1, o: 2 }` or `{ a: 'close', o: -4 }`. `calendar.js` turns that into the same `d`
string everything downstream already reads, so the grid, the agenda, the note pins and the
sign-off block are untouched. Two rules hold it honest, and both are written at the top of the
data file:

- **A countdown row is anchored to `close`, never to `flow`,** and the number in it is a token
  (`{Days}`, `{n}`, `{closeDow}`, `{elapsed}`) worked out at render from where the row lands. A
  number typed into a hook is a promise nothing is checking. Tokens are body text only, never
  titles: a note is pinned to a title, so a title that moves with the window loses its notes.
- **Flow rows stretch, they do not multiply.** One week of weekly rhythm is written and the window
  is six weeks, so the calendar reports the hole rather than repeating a week to fill it.

**The control.** Same two date inputs, same wording, same CSS classes as the campaign clock on the
Workflow View, because it is the same idea. What it sets is different and the line under it says
so: this one sets the **window**; the one on the automations page sets the **nurture arc**, which
is a fifteen-day countdown at the end of that window. They share a default and keep separate
overrides, because moving one is not a request to move the other. It flags four things: a close
that has drifted off the date written into five emails, an opening that is not a Monday (the
weekly rhythm rows were written for one and three name their weekday), a window too short for the
plan, and the days inside the window with nothing planned at all.

**What is still open, and it is the real work.** On the default window the plan covers **20 of the
45 days**: launch week, one week of rhythm, and the countdown into the close. **25 days, 31 August
to 24 September, carry no plan.** The Calendar says so in the clock row and again in the pillar mix
panel, which is written from the plan now rather than asserted. Filling it is content work at the
agreed cadence and it needs Hanneh and Tara, not another pass over the data file. Add weeks as
rows with `w: 2`, `w: 3` and so on, then check the Mix panel rather than trusting the count.

Two titles changed, because they carried a number that would drift: *"What closes on Friday, and
what does not"* is now *"What closes, and what does not"*, and *"Two days · two weeks of results in
ten seconds"* is now *"Two days · every result since the window opened"*. Any note pinned to those
two rows is pinned to the old title. Notes on every other row follow their post; notes pinned to a
**day** stay on the calendar date they were left on, which after a reschedule can look orphaned. It
is not gone, it is on that date, and the page says so.

### The runbook, and the note it put in seven emails (added 10 Aug 2026)

`runbook/` is the contingency layer. The two build specs say what to build; this says what to do
when it does not work. One rule runs through the kill switch: **stop the messaging, never the
money.** Stripe stays on through any incident, because a client who pays during one is a client
tagged late, while a client who cannot pay is revenue you do not get back plus a support
conversation you created yourself.

The error gates follow a second rule: **break on identity and money, ignore on convenience.** A
Make module that carries who she is or what she paid has to stop the run and be retried; a module
that writes a nicety must never cost her the parts that matter.

**The runbook changed an asset rather than just describing one.** Tabby is a unique link per
client and a till payment is a till payment: both are tagged by hand, and a branch tags within the
day. So a woman can be a paying client for several hours while the workflow still has her down as
a lead, and the sell email goes out on time regardless. Rather than engineer around that, the
seven **pre-purchase** emails now carry an "already placed your credit" note. Seven, not thirteen:
the four Welcome Pack emails are sent *after* she pays, so telling her to ignore the email if she
has paid would be nonsense, and `mapping-1` delivers her map while `mapping-3` asks her to book,
neither of which is a payment ask. Passed `/brand-review` on 10 Aug: 🟢 PASS, ship, with two polish
edits taken.

Four rows of the runbook's owner table are **amber**, which is not a formatting placeholder. It
means nobody has confirmed who holds that login, and the Stripe row is the one that matters: it is
both the row you would need at 9pm and the row that decides whether the nine payment links can be
checked at all.

## Setup

1. **Create the editor account.** Supabase → project `vlqvefsaxztitcbhirxt` →
   Authentication → Users → **Add user** → Create new user.
   Email `kate@tararosesalon.com`, a password you choose, and tick **Auto Confirm User** so
   there is no confirmation email to chase. Do this FIRST: step 2 promotes this account,
   and cannot promote an account that does not exist yet. The password is deliberately not
   written down in this repo, which is published to a public URL.
2. **Run the SQL.** SQL Editor → New Query → paste
   [`sql/supabase_roles_setup.sql`](sql/supabase_roles_setup.sql) → Run, then
   [`sql/notes_setup.sql`](sql/notes_setup.sql) → Run. Both are idempotent, so re-run
   them whenever the files change. The first one ends with a `select email, role` — it
   should show `kate@tararosesalon.com` as `admin`. If it shows nothing, step 1 was skipped.
3. **Open the pack and sign in** at `auth/index.html`. Every page carries a
   “Sign in to edit” link, and after signing in the header reads
   **Signed in as Kate · editor**. If it says **viewer**, the account exists but the
   role did not get set: re-run step 2.

No URL configuration is needed. Sign-in is email and password, not a magic link, so
Supabase never has to redirect back to the pack. It works on `localhost`, on the live URL,
and (unlike the magic-link version this replaced) it does not break when the pack moves.

## Who can do what

Two levels, and the split is deliberate.

| | Reviewers (Tara, Emma, Hanneh) | Editor (Kate, signed in) |
|---|---|---|
| Read the pack, the notes and the suggestions | yes | yes |
| Leave a note, reply, raise a suggestion | yes | yes |
| Mark a note actioned / reopen it | no | yes |
| Accept / decline a suggestion | no | yes |
| Archive and restore a row | no | yes |
| Edit the wording of a posted note | no | yes |

**Reviewers do not sign in.** They tap their name in the header and that is their identity.
That was a deliberate call: a magic link meant going to the inbox and back before typing a
sentence, and that meant nobody left a note at all. The cost is that authorship is not
proven for them — anyone with the URL can post under any of the four names. For four
colleagues reviewing one document for three weeks that is the right trade. It would not be
for anything client-facing or long-lived, so do not reuse these tables for that.

**The editor does sign in**, and that half IS enforced, by Postgres, not by the page. Every
`UPDATE` policy on the three tables calls `public.is_admin(auth.uid())`, and `anon` has no
`UPDATE` grant at all: an anonymous attempt to change a row comes back `42501 permission
denied`, whatever the browser does. The buttons are hidden to match, so nobody presses
something that would only fail.

While signed in, the four-name toggle disappears. The account is the identity, so notes,
replies and every “actioned by” line are filed as **Kate** with nothing to
remember to tap first.

### Adding another editor

Two places, both needed:

1. `public.profiles` → set that account's `role` to `admin` (Supabase dashboard, or
   `update public.profiles set role='admin' where email='…'`). This is the part that
   actually grants anything.
2. `EDITOR_NAMES` in [`auth/supabase-client.js`](auth/supabase-client.js) → map the
   email to one of the four reviewer names, so their actions are signed with a name rather
   than an email.

The reviewer names live in **five** places and all five must match. This said two until
10 Aug, which is how LID nearly shipped half-added:

1. `public.is_reviewer_name()` in `sql/notes_setup.sql` — the real check, and the only one
   that can actually reject a post. **Re-run the file after editing it.**
2. `REVIEWERS` in `shared/notes-widget.js` — the name toggle on every page
3. `REVIEWERS` in `pack/decide.js` — the front door's own list, which is separate
4. `--who-[name]` and the `[data-name]` rule in `shared/notes-widget.css`
5. the `[data-who]` and `[data-n]` rules in `pack/decide.css`

Miss 1 and the name appears but every post is rejected. Miss 2 or 3 and the person is
absent from one surface and present on the other. Miss 4 or 5 and they show with no colour,
which reads as a bug rather than a person.

**LID is on the list as of 10 Aug**, so the agency can leave notes and suggestions like
anyone else. They carry the palette's neutral sand rather than a fifth accent, because they
are the outside party and it should be visible at a glance whose comment is whose. No
decision is owned by LID, so the front door tells them nothing is waiting on them and
promotes the browse door, which is the right greeting for a reviewer who is here to read.

### What that protects, and what it does not

- **Editing is properly guarded.** Actioning, deciding, archiving and rewording all require
  a real session with `role = 'admin'`, checked in the database.
- **Authorship is not.** With no login for reviewers, `author_name` is shape-checked (it has
  to be one of the four names) and nothing more.
- **Nothing can be deleted from the browser, by anyone.** There is no delete policy on any
  of the three tables, so a client `DELETE` matches zero rows and changes nothing. The notes
  are the audit trail of what Tara asked for and what got actioned. Archive is the way to
  get rid of noise.
- **The pack itself is NOT protected.** RLS guards the notes data only. If `index.html` is
  served from a public URL, anyone with that URL can read the pack, staff incentive amounts
  included. Gating the page in JavaScript would not change that, since the raw file is still
  fetchable. If the content needs to be private, the hosting has to be private.
- **The session now survives closing the tab.** It is in `localStorage`, not
  `sessionStorage`. It had to change: every link out of `index.html` is
  `target="_blank" rel="noopener"`, and a noopener tab does not inherit `sessionStorage`, so
  signing in used to buy edit rights on exactly the page you signed in from. The
  shared-machine risk is covered instead by **Sign out** being on screen on every page.

## Archiving

Archive hides a row from everyone without deleting it: test rows, duplicates, ideas that
went nowhere. It is reversible, and both ends of it are in the page now — it used to be
a SQL job.

- **Archive** — the button on any note or suggestion, editor only.
- **Restore** — switch the panel filter (or the dashboard chip) to **Archived**, which
  only appears when signed in as the editor, and press Restore. A restored suggestion comes
  back as pending.

Archived rows never count towards the numbers on the pins, the sidebar or the dashboard
stats, so tidying up never moves a figure Tara is reading.

## Starting a fresh review round

`pack_id` comes from `data-note-pack` on `<body>` (currently `beauty-voucher-2026-08`).
Change it and the pack starts an empty thread, leaving the old round intact in the table.

## Local preview

```bash
python -m http.server 8757 --directory beauty-voucher-approval-pack
```
