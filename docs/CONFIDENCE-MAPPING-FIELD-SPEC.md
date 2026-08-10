# Confidence Mapping: field, tag and note spec

**Written 8 August 2026.** Companion to `EMIRATE-ROUTING-BUILD-SPEC.md`, which this document
closes one open question in.

**Boundary, stated once and it holds for everything below.** Nothing here has been built.
The live GHL account has not been touched and the live website has not been changed. Every
table is a specification for someone with access to build by hand. What *was* done is
**read-only inspection of the public Confidence Mapping page**: no form was submitted, no
account was logged into, and no data was sent anywhere.

---

## Part 0: The question that had to be answered first, and the answer

> Is the Confidence Mapping form a GHL-native form embedded on the page, or a custom site
> form posting to the GHL API or an inbound webhook?

### It is neither. It is **Gravity Forms 21 on WordPress**, and it posts to WordPress.

Read off `https://www.tararosesalon.com/en/ae/confidence-mapping/` on 8 Aug 2026:

| Evidence | Value |
|---|---|
| Form element | `<form id="gform_21" class="confidence-form" method="post">` |
| Posts to | `/en/ae/confidence-mapping/#gf_21`, **its own WordPress page**, not GHL |
| Submission method | `gform_submission_method = iframe` (Gravity Forms AJAX) |
| Field naming | `input_1`, `input_4`, `input_8` … `input_26`, Gravity Forms convention |
| GHL-native form iframe | **None.** No `leadconnector` or `msgsndr` iframe anywhere on the page |
| GHL scripts present | `external-tracking.js`, the chat widget, `libphonenumber`, `loader.js`, **tracking and chat only, no form capture** |

There is also a second, separate form, `<form id="cmForm">` with 77 inputs, which is the quiz
itself. It is never submitted. A bridge script reads it and copies the answers into the
Gravity Form's hidden fields.

### What that means for the build

**Field mapping is not close to free. Every one of the 19 answers needs an explicit
destination, and there is an extra hop that nobody has verified.**

```
   quiz (#cmForm)          bridge script          Gravity Forms 21          GHL
   radios + checkboxes  →  syncAll() copies    →  hidden fields 8–26   →   ??? 
   [VERIFIED WORKING]      [VERIFIED WORKING]     [VERIFIED POPULATED]     [UNVERIFIED]
```

The first three hops are confirmed working: I watched the hidden fields hold live values on
an untouched page load. **The fourth hop is the one nobody can account for.** Gravity Forms
does not talk to GHL on its own; something has to carry the entry across: a GF webhook, a
Zapier/Make scenario, or a plugin. Whatever it is, it is server-side and invisible from the
page, and **it is the actual reason nobody can say whether the 17 fields are stored.**

So the first job is not "map the fields". It is **"find the bridge, or discover there isn't
one"**. Part 4 says how to tell in about ten minutes.

---

## Part 1: The nineteen fields, exactly as the form sends them

The bridge script defines the map, so these are not inferred:

```js
var GF = {route:8, pain:9, confidence:10, history_bad:11, goal:12, change:13, base:14,
          status:15, hennakeratin:16, condition:17, routine:18, homecare:19, detox:20,
          occasion:21, wellbeing:22, supplements:23, homecare_tier:24, locale:25,
          source_page:26};
```

Three names in the approval pack are **wrong** and will not match if used as keys:
`colour_status` is `status`, `henna_keratin` is `hennakeratin`, `home_care` is `homecare`.

| # | GF field | Admin label | Allowed values (complete) | GHL custom field | Tag? |
|---|---|---|---|---|---|
| 8 | `route` | Route | `blonde` `brunette` `colour` `gloss` `cut` `length` `restore` `not-sure` | `cm_route` · Single Select | **Yes** `route:[x]` |
| 9 | `pain` | Pain (comma list) | comma list of: `dry` `breakage` `scalp` `curls` `buildup` `want-smooth` `brassy` `flat` `fade-fast` `colour-fix` `shape-outgrown` `no-hold` `want-length` | `cm_pain` · **Single Line Text** (see Part 2) | **Yes**, one `pain:[x]` per value |
| 10 | `confidence` | Confidence | `recent` `months` `long` `never` | `cm_confidence` · Single Select | No |
| 11 | `history_bad` | History bad | `recent` `past` `no` | `cm_history_bad` · Single Select | No |
| 12 | `goal` | Goal | `maintain` `refresh` `transform` `fix` `guide` | `cm_goal` · Single Select | No |
| 13 | `change` | Change | `shedding` `weaker` `greying` `texture` `none` | `cm_change` · Single Select | No |
| 14 | `base` | Base | `blonde` `brunette` `red` `grey` `mixed` `not-sure` | `cm_base` · Single Select | No |
| 15 | `status` | Colour status | `coloured` `natural` `growing-out` `highlights` | `cm_colour_status` · Single Select | No |
| 16 | `hennakeratin` | Henna / keratin | `henna` `keratin` `both` `no` `not-sure` | `cm_henna_keratin` · Single Select | No |
| 17 | `condition` | Condition (1-5) | `1` `2` `3` `4` `5` | `cm_condition` · **Text, not Number** (see Part 2) | No |
| 18 | `routine` | Routine | `heat-daily` `wash-go` `air-dry` `protective` `varies` | `cm_routine` · Single Select | No |
| 19 | `homecare` | Home care | `salon` `supermarket` `mix` `not-sure` `minimal` | `cm_homecare` · Single Select | No |
| 20 | `detox` | Detox | `regular` `sometimes` `rarely` `never` | `cm_detox` · Single Select | No |
| 21 | `occasion` | Occasion | `wedding` `holiday` `photos` `fresh` `none` | `cm_occasion` · Single Select | No |
| 22 | `wellbeing` | Wellbeing | `great` `variable` `low` `exhausted` | `cm_wellbeing` · Single Select | No |
| 23 | `supplements` | Supplements | `regular` `sometimes` `no` `unsure` | `cm_supplements` · Single Select | No |
| 24 | `homecare_tier` | Home care tier | `protect` `maintain` `full` | `cm_homecare_tier` · Single Select | **Yes** `tier:[x]` |
| 25 | `locale` | Locale | **a language tag, see Part 5** | `cm_locale` · Text | **No, and never as emirate** |
| 26 | `source_page` | Source page | e.g. `en/ae/confidence-mapping` | `cm_source_page` · Text | No |

`route` and `homecare_tier` are **computed by the bridge**, not asked. They are derived from
the answers, which is why they can be trusted to always hold one of a known set.

### On the starting position: custom fields for all 19, tags only for route / pain / emirate

**Agreed on all 19 as custom fields, with no exceptions**, including `locale` and
`source_page`. They cost nothing, and `locale` is worth storing precisely so it is visible
that it is useless (Part 5).

**Tags: one addition, and a defence of pain.** The rule that keeps this from becoming tag
soup is *tag it only if something branches or segments on it*. That gives four, not three:

- `route:[x]`: the contact-centre task and every downstream message key off it. **Yes.**
- `pain:[x]`: this is not one tag, it is a genuine multi-select, typically two or three.
  It is also the only dimension anyone actually segments a broadcast on ("everyone whose
  colour fades"). **Keep it.** Thirteen *possible* values is not tag soup; thirteen separate
  *dimensions* would be.
- `emirate:[x]`: routing. **Yes**, but see Part 5: the quiz cannot currently supply it.
- `tier:[x]`: **the addition.** The Home Ritual Kit decision tree (Open Decision 5) keys off
  exactly this value, and whoever packs the kits needs to filter a list by it. A merge field
  cannot be filtered on; a tag can. Three values, so it costs almost nothing.

**The other fifteen stay fields only.** They are read on a call and merged into an email.
Nothing branches on `supplements`.

---

## Part 2: Field types, and the two that will bite

**`pain` must be Single Line Text. Not Multi Select, not Dropdown.**

The form sends one string: `brassy,fade-fast,dry`. A GHL **Dropdown / Single Select** field
validates against its option list, does not find that string, and **stores nothing**. The
value is dropped and the contact shows blank. A **Multi Select** may accept it but will
either take the whole string as one unrecognised option or split it unpredictably depending
on how the bridge posts it.

Worst case length is **112 characters** (all thirteen values, comma-joined), so a single-line
text field holds it comfortably with no truncation risk. Keep the raw comma string in the
field for merging, and let the tags carry the structured version.

**`condition` must be Text, not Number.** It is a 1–5 rating, and a Number field in GHL will
happily store `2`, but an unanswered question sends an **empty string**, and an empty string
into a numeric field is the classic silent-drop. Text stores `""` harmlessly.

**Everything unanswered sends `""`, not null.** `val()` returns `''` when nothing is checked.
Any field configured to reject blanks will drop the whole value. Nothing should be required.

---

## Part 3: The silent failure mode

**A GHL custom field must exist, and its key must match exactly, before the form posts. If
it does not, the value is dropped and nothing anywhere reports an error.** No failed
webhook, no warning on the contact, no entry in a log. The contact is created, the name and
email land, and the seventeen answers quietly are not there.

This is almost certainly why nobody can say whether the fields are being stored today.

Three specific ways it bites here:

1. **Create the fields first, then test.** Fields created *after* a submission do not
   back-fill. Any test run before the fields exist proves nothing and has to be repeated.
2. **The key is not the label.** GHL generates a key from the label at creation time and then
   never changes it. Renaming a field later leaves the old key in place, so the bridge keeps
   posting to a key whose label now says something else.
3. **Case and separators matter.** `cm_pain` and `cm_Pain` are different keys.

---

## Part 4: How to verify, rather than assume

Ten minutes, and it localises the fault instead of guessing at it. **This requires GHL and
WordPress access, which this document's author does not have.**

**Step 1: create all 19 fields** from the table in Part 1. Nothing below is valid until
they exist.

**Step 2: submit one real test entry** from the live page, using a test email and a test
number nobody will call. Answer *every* question, and pick a deliberately distinctive
combination you will recognise: `occasion = wedding`, `supplements = no`, `condition = 2`.

**Step 3: read the two ends and compare.** This is the whole diagnostic:

| Where you look | What it tells you |
|---|---|
| **WordPress → Forms → Entries → form 21** | Did the *form* capture the answers? Fields 8–26 should all hold values. |
| **GHL → the test contact** | Did the *bridge* carry them? |

- Values in **GF but not GHL** → the form is fine, **the bridge is the problem**. Either it
  does not exist, or its field mapping is incomplete. Most likely outcome.
- Values missing in **GF too** → the bridge script did not run. Check that the quiz was
  actually completed, since `syncAll()` fires on answer change.
- Values in **both** → it already works and the pack's "not drawn" column is only a drawing
  gap, not a data gap. Say so loudly, because it changes what has to be built.

**Step 4: check the emptiest case.** Submit a second entry answering only the required
fields. Confirm the blank hidden fields do not error the whole submission.

---

## Part 5: `locale` is not the emirate, and never was

**This closes the open question in `EMIRATE-ROUTING-BUILD-SPEC.md` (Part 2, and the blocker
at the foot of that document), and it closes it in the direction the spec warned about.**

From the bridge script, verbatim:

```js
var lang = (document.documentElement.getAttribute('lang') || 'en-ae').toLowerCase();
set(GF.locale, lang);
```

`locale` is the **`lang` attribute of the `<html>` element**. On the live page today it is
**`en-us`**. Its fallback is `en-ae`.

It is a language tag. It is not an emirate, it has never been an emirate, and it cannot
become one: it does not vary by where the woman is or where she will visit. Every single
lead carries the same value.

**So the pack is wrong on this point and must be corrected.** The claim that "`locale` is
collected and discarded, that is the emirate the voucher workflows need and cannot find"
is not true. There is nothing to recover. The corresponding `If/Else · Locale → emirate`
node was drawn on a premise that does not hold.

### What to do instead

| | | |
|---|---|---|
| **For Monday** | Every Confidence Mapping lead is `emirate:unknown`, and picks up the emirate from the WhatsApp ask already drawn in Lead Nurture. | No website change. Lands. |
| **The real fix** | Add a real question to the quiz, *"Which salon will you be visiting?"*, as a 20th hidden field `emirate`, written straight through. | A website change. **Will not land by Monday.** |
| **The free one, later** | If the landing pages split per emirate (see the website mockup), `source_page` starts carrying the emirate on its own: `en/ae/beauty-voucher/dubai`. It already works this way; it just has nothing to distinguish yet. | Comes free with the split. |

Recommendation: **the Monday fallback now, the quiz question in the same release as the
emirate landing-page split**, so the website is only opened once.

---

## Part 6: The contact note

Reception opens a task, not a field list. Nineteen custom fields in the sidebar is not
something anyone reads while a phone is ringing. The note is what actually gets read, so it
is ordered the way a person would want it on a call, not the way the form collects it.

Written to the contact as a **note** at the same moment the fields are set, before the
contact-centre task is created.

### Layout

```
CONFIDENCE MAP · {{contact.first_name}} · {{date}}

WHAT SHE CAME FOR
  {{cm_route}} · she says she wants: {{cm_goal}}

WHAT SHE SAID IS WRONG
  {{cm_pain}}

BEFORE YOU PROMISE ANYTHING
  Colour now: {{cm_base}}, {{cm_colour_status}}
  Condition:  {{cm_condition}} out of 5
  Henna or keratin: {{cm_henna_keratin}}
  ⚠ If this says henna, keratin or both: a strand test comes first. Say so on the call.

HER LIFE AROUND IT
  Styling: {{cm_routine}} · Home care: {{cm_homecare}} · Detox: {{cm_detox}}
  Coming up: {{cm_occasion}}

HER, NOT HER HAIR
  Last felt confident: {{cm_confidence}}
  A salon experience that was hard to move past: {{cm_history_bad}}
  How she is in herself: {{cm_wellbeing}} · Supplements: {{cm_supplements}}
  Also noticing: {{cm_change}}

WHERE SHE IS
  Emirate: {{emirate}}   ← ask if this says unknown, before quoting any facial

Home care tier: {{cm_homecare_tier}} · From: {{cm_source_page}}
```

Why in that order:

- **What she came for** first, because it is the only line reception needs before speaking.
- **What she said is wrong** second, in her words, because repeating it back is the whole
  promise of the page: *we diagnose first and recommend second*.
- **Before you promise anything** third, and it is deliberately not called "her hair". It
  exists for one line: **henna or keratin means a strand test comes first**, and that is the
  single thing on this call that can go expensively wrong if it is missed.
- **Her, not her hair** near the end because it is context for tone, not for the booking. If
  she has a bad salon experience she has not moved past, that changes *how* the call opens,
  not what is offered.
- **Emirate** last and flagged, because until Part 5 is built it will say `unknown`, and
  reception must not quote a deep-cleanse facial to a Dubai client.

**The values will read as raw keys** (`fade-fast`, `heat-daily`) unless the bridge maps them
to sentences on the way in. That is a genuine choice, not an oversight: raw keys are honest
and cannot silently mistranslate, and reception learns thirteen words quickly. If they should
read as English, the mapping table belongs in the bridge, and it is one more thing that can
drift out of sync with the quiz. **Recommendation: ship raw keys, and revisit only if
reception says they are struggling.**

---

## Part 7: What is drawn, and what has to be built by hand

Drawn in `automations/automations.html` as of 8 Aug, **all of it is a drawing:**

- `Update Contact Fields · 19 answers`
- `Add tags · route + pain + tier`
- `Note to contact · her answers in reading order`
- `If/Else · Emirate` (redrawn: locale cannot supply it)
- the contact-centre task, now with the note attached

To be built by hand, in this order:

| # | Work | Where | Blocked on |
|---|---|---|---|
| 1 | **Find the GF → GHL bridge**, or establish there isn't one | WordPress + GHL | Access. **Everything below depends on this.** |
| 2 | Create the 19 custom fields | GHL | Nothing |
| 3 | Map all 19 in the bridge | wherever the bridge is | 1 and 2 |
| 4 | Verify by the two-ended test in Part 4 | both | 3 |
| 5 | Add the four tag actions | GHL workflow | 2 |
| 6 | Add the note action | GHL workflow | 2 |
| 7 | Attach the note to the contact-centre task | GHL workflow | 6 |
| 8 | Add the real emirate question to the quiz | website | a release |

**Only steps 2, 5, 6 and 7 are plausible by Monday 10 August**, and only if step 1 comes back
quickly. Step 1 is the risk: if there is no bridge at all, then no Confidence Mapping answer
has ever reached GHL, and that is a bigger conversation than this campaign.

---

## Appendix: Three things found while reading the page that are not in the audit

1. **The consent tickbox is still `required`.** Field 5 carries
   `gfield_contains_required`, confirming the PDPL problem flagged in the pack is live as of
   8 Aug and has not been fixed.
2. **"Journal" appears in two more places than the audit lists**: both client-facing, both
   on the form itself: the consent label reads *"Send me my **Journal** and helpful hair
   guidance"*, and the submit button reads *"Send my **Journal** →"*. The Copy 4 naming fix
   is incomplete without these two.
3. **The page `<title>` is still** *"Confidence Mapping · A diagnosis, not a commitment ·
   Tara Rose"*. Copy 2 changes the hero line to "A direction, not a commitment", but the title
   tag carries the same words and is not on the audit's list. It is also what shows in a
   Google result.
