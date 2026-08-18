# Emirate routing, build spec

**For:** whoever owns the GoHighLevel build
**From:** Kate Alsaybar, 7 August 2026
**Campaign:** Wellness Voucher window. Purchase closes 30 September 2026. Target launch Monday 10 August 2026.

## The boundary, stated once

Nothing in this document has been built. The live GHL account was not touched and cannot be
touched from here. This is a specification plus an updated drawing in the approval pack
(`automations/automations.html`). Every If/Else, field and tag named below has to be created by hand in
GHL by whoever owns that account. Where this spec says "does", read "must be made to do".

---

## Part 1. Three contradictions, resolved before any building

The brief asked for these to be surfaced rather than designed around. Two of the three
resolve differently from the way the map currently reads.

### 1.1 What actually feeds Lead Nurture? Both, and that is the problem

**The evidence.** The trigger node says "Reserve form submitted, Voucher reserve form", and
its tip says a tier field routes Dip Your Toes into Workflow A and Season of You / VIP into
Workflow B. But the Day 0 WhatsApp is titled "Initial broadcast", the `bv:lead` tag node
talks about "audience" and "the whole synced database", and the emails themselves settle it:
`nurture-1` closes on **"Reserve my tier"**, `nurture-3` on **"Choose my tier"**, both
pointing at `{{voucher_url}}`.

**So the copy contradicts the trigger.** If she had genuinely just submitted a reserve form
carrying a tier, Day 0 would not open by asking her to reserve a tier, and Day 4 would not
lay out three tiers for her to choose between. The emails are written for a woman who has
done nothing yet. That is a broadcast audience, not a form submitter.

**What this means:** two different populations have been merged into one workflow.

| Population | Where she comes from | What she needs | Can she carry a hidden field? |
|---|---|---|---|
| **A. Broadcast** | Segmented, consented existing contacts. Has done nothing. | The full 8-day arc as written. | **No.** There is no form. |
| **B. Reserve form** | Inbound, has already picked a tier and asked to hold it. | A human within 2 hours and a payment link. Not an 8-day arc that asks her to choose a tier she already chose. | Yes. |

**Recommendation, and it needs your yes before anything is built:** for this window treat
Lead Nurture as **broadcast-fed**, because that is what all five emails are written for.
Reserve-form submitters get a contact-centre task and the correct Stripe link, and do **not**
enter the arc. That is a trigger change plus one task, not a rebuild, and it can land Monday.

**Why this decides everything downstream:** a broadcast to existing contacts cannot carry a
hidden emirate field. So for population A the emirate has to be **derived from Phorest home
or last-visited branch and stamped onto the segment before the workflow ever runs**. That is
good news, not bad: it is a spreadsheet job on the import file, not workflow logic, and it
can be done this weekend.

### 1.2 How many emails need splitting? None. Two need a wording change

I read all thirteen. The picture is much better than the brief assumed, because two of them
have already solved this and are the pattern to copy.

| Email | State today | Action |
|---|---|---|
| `mapping-4-tiers` | **Already neutral.** Body reads "at the salons named on your voucher", plus a `{{voucher_availability_line}}` merge field for the emirate specifics. Corrected 7 Aug, comment at line 66. | Populate the merge field |
| `welcome-4-expiry-touch` | **Already neutral.** "at the salons named on your voucher". | None |
| `welcome-1-confirmation` | **Already parametrised, not split.** Uses `{{branch_a_name}}`, `{{branch_b_name}}`, `{{branch_a_url}}`, `{{branch_b_url}}`. Comment at line 43 says "GHL conditional on the voucher region". | Populate the merge fields |
| `nurture-3-three-tiers-plainly` | **Wrong.** Line 107: "Every tier spends on any service at any of our four salons." | 1 string |
| `welcome-2-what-your-credit-covers` | **Wrong twice.** Line 41 body, and line 21 the hidden preheader, which is what shows in her inbox list. | 2 strings |
| Other 8 | Emirate-neutral already. `nurture-2` says "The facial" generically, which is deliverable in both emirates (Al Quoz does the Signature Relaxing Facial), so it stays. | None |

Every one of the thirteen also carries the group footer "Tara Rose Salon Group. Mamsha al
Saadiyat, Khalifa City A, Motor City, Al Quoz". **Leave it.** That is a letterhead, not a
redemption promise, and term 3 now governs where credit spends.

**So: zero emails need splitting. Two need three strings changed.**

#### The argument for emirate-neutral, since you asked me to make it where it holds

1. **It is already proven in this campaign.** Two emails do it with one sentence and one
   merge field. This is not a new approach, it is finishing an existing one.
2. **T&C term 3 is what makes it accurate.** "At the salons named on your voucher" used to be
   vague. Now that term 3 holds the credit to the emirate it was bought in, that sentence
   points at a document that is definitive. The legal wording arrived and made the cheap
   copy solution the correct one.
3. **Splitting doubles the maintenance for ever.** 13 assets become 26. Every typo fix is two
   edits, every QA pass is two reads, and every one of the eleven email nodes across three
   workflows needs a variant selector above it, which is eleven more If/Else nodes rather than
   the three in this spec.
4. **Cost.** Neutral: 3 strings, 4 merge fields, `python build-previews.py`, roughly an hour,
   lands Monday. Split: 13 new files authored, QA'd and pasted into GHL, plus 11 extra
   branches. One to two days minimum, and it does not land Monday.

#### Where neutral does not hold, and must not be forced

**WhatsApp.** Meta fixes quick-reply button labels at template level and they cannot carry
merge fields. `welcome_confirm_ad` has to physically say "Mamsha al Saadiyat" and "Khalifa
City A" on its buttons; `welcome_confirm_dubai` has to say "Al Quoz" and "Motor City". So
WhatsApp **must** stay split, and already is. The clean line is:

> **Buttons force a split. Body copy does not.** Email stays one asset per message and reads
> the emirate from a field. WhatsApp stays two templates per message and is chosen by an
> If/Else.

### 1.3 The Welcome Pack tip: neither broken in production, nor an undrawn data source

It is a third thing. **The asset was authored against a variable that was specified in writing
and never created.**

The intent is documented in the email source itself, `welcome-1-confirmation.html:43`:

> "BRANCH CHOICE. GHL conditional on the voucher region: show the Abu Dhabi pair to an Abu
> Dhabi voucher and the Dubai pair to a Dubai voucher. Never show all four, two of them are
> not redeemable on her voucher."

And again at `mapping-4-tiers.html:66`, for the coverage line. The WhatsApp side solved the
same problem by hardcoding two templates, which is why the tip's claim is **true of the
templates and false of the workflow**: `welcome_confirm_ad` genuinely only offers the two
Abu Dhabi salons, but no node anywhere can choose it over the Dubai one.

What does not exist is **"voucher region"**. No tag, no field, nothing writes it, nothing
reads it.

**Is it broken in production?** It cannot be, because it is not in production. These three
workflows are drawings in an approval pack, and the pack's own banners list what still has to
be built. Built as drawn, it would fail on the first send: GHL would either send one variant
to everybody, or the merge fields would render **blank**, which is the nastier failure because
it does not error. `{{branch_a_name}}` unpopulated gives you a payment confirmation with two
empty buttons.

**One thing to check that I could not:** whether an older single-voucher welcome message is
live in the account right now, listing all four salons. That is a question for whoever holds
the GHL login, and it is a check, not an accusation.

**And the tip's wording is being corrected** in `automations/automations.html` as part of this change, so
the map stops claiming a capability that depends on an unbuilt field.

---

## Part 2. Where the emirate is captured, per entry path

| Entry path | What writes the value | When | How much to trust it |
|---|---|---|---|
| **Website reserve form** | Hidden `emirate` field, populated from the header emirate picker's current state at submit. The GHL form/webhook maps it to the contact field and mirrors the tag. | At submit | **Certain.** She chose it, and the whole page changed with her choice, so she cannot reach a Claim button without having passed it. |
| **Confidence Mapping quiz** | The existing `Locale` hidden field, read for the first time. | At submit | **Unverified, and must be verified before it is used.** Nobody knows what `Locale` currently contains. If it holds a language or country code rather than an emirate, it is not a source at all and the form needs a real question. Until someone opens the form and looks, treat every mapping lead as unknown. |
| **Broadcast to existing contacts** | Derived from Phorest home branch, falling back to last-visited branch, and stamped on the CSV **before import**. Not derived in-workflow. | Before the workflow runs | **High** for anyone with a visit history. Unknown for anyone without one, and those stay unknown rather than getting a guess. |
| **Reception / manual** | Reception sets `emirate` at the same moment it sets `branch:[x]`. | At checkout | **Certain.** |
| **Payment (all paths)** | The Stripe link she paid through. Nine links, three per paying branch. | At payment | **Certain for emirate, unreliable for branch.** See 4.1. |

**Direction of derivation matters.** `branch` to `emirate` is always safe and should be a
standing fallback rule: Saadiyat and Khalifa City A give Abu Dhabi, Al Quoz and Motor City
give Dubai. `emirate` to `branch` is not derivable and must never be guessed.

---

## Part 3. Tag and field design

Your starting position was: `emirate:abu-dhabi | emirate:dubai` is the routing field, set
early, cheap and reversible; `branch:[x]` stays the fulfilment field, set at or after payment
and more precise; do not overload one field with both jobs.

**The separation is right and I am not arguing with it.** The mechanism needs two amendments.

### 3.1 Amendment one: emirate has to be a FIELD, not only a tag

This is the important one. GHL merge fields read **custom fields**, not tags. The emails need
to *read* the emirate to render `{{voucher_availability_line}}` and `{{branch_a_name}}`. If
emirate exists only as a tag, the emails cannot see it, and you will end up splitting all
thirteen after all, which is exactly the outcome Part 1.2 avoids.

| Object | Type | Values | Read by |
|---|---|---|---|
| `emirate` | Custom field, single select | `abu-dhabi` · `dubai` · `unknown` | **Source of truth.** Emails, merge fields, and the If/Else conditions |
| `emirate:abu-dhabi` / `emirate:dubai` / `emirate:unknown` | Tags | mirror of the field | Segment building, and eyeballing a contact record |
| `emirate_source` | Custom field, text | see 3.2 | The conflict rule |
| `branch:[x]` | Tag, unchanged | `branch:saadiyat` · `branch:kca` · `branch:alquoz` · `branch:motorcity` | Fulfilment, kit despatch, priority slots, reporting |

Have the If/Else test the **field**, and treat the tag as a human convenience that the same
action sets alongside it. That way there is one authority and the mirror can drift without
breaking any routing.

### 3.2 Amendment two: add a provenance field, `emirate_source`

One text field, values: `picker` · `quiz` · `phorest` · `reception` · `payment` · `asked`.

**Why it is not optional:** the conflict rule in Part 4 cannot be written without it. "The
payment wins" is the right answer when we inferred her emirate from a 2024 visit, and a
serious problem when she picked it herself on the page two days ago and was shown a voucher
on the strength of that choice. Same conflict, two completely different phone calls. One
field is the whole cost of telling them apart.

### 3.3 What not to do

- Do not put emirate values on the `branch:` tag. Reporting reads `branch:` and will break.
- Do not set the field without the tag or the tag without the field. One action, both.
- Do not write `emirate` from a phone number. `+971` covers the whole country and does not
  distinguish Abu Dhabi from Dubai. There is no signal there. (An earlier note in the pack
  suggested defaulting to Abu Dhabi "if she is on an Abu Dhabi number". That is not a thing
  and it is corrected by this spec.)

---

## Part 4. Where the If/Else goes, per workflow

Named against the existing node titles in `automations/automations.html`. All three are drawn in the map
as of this commit.

### 4.1 Lead Nurture (A / B)

**Insert `If/Else · Emirate known?` after `If/Else · Consent + filters`, before `Email · Day 0`.**

Order matters and it is deliberate: **consent first, emirate second.** Asking a woman which
emirate she is in is still a message. Sending it to someone who has not consented is exactly
what the PDPL gate exists to prevent, so the emirate branch has to sit inside the consented
path, not above it.

| Branch | Condition | What happens |
|---|---|---|
| Abu Dhabi | `emirate = abu-dhabi` | Day 0 and Day 2 WhatsApp send `broadcast_ad` / `reminder_ad`. Emails render the Abu Dhabi availability line. |
| Dubai | `emirate = dubai` | `broadcast_dubai` / `reminder_dubai`. Dubai availability line. |
| Unknown | `emirate = unknown` or empty | Neutral path, see Part 5. |

**Also insert `WhatsApp · Which emirate?` on the unknown branch, before `Email · Day 0`.** New
template, copy in Appendix A item 4. Its two buttons write the field and move her onto a
regional branch from Day 2 onward.

Everything below the If/Else inherits the branch. The Day 0 and Day 2 pills in the map still
show both regional variants in their peek panel, because reading both side by side is useful;
the If/Else above them is what picks one at send.

### 4.2 Welcome Pack

**Insert `If/Else · Emirate from payment` immediately after `Trigger: Tag added voucher:paid`,
before `Email 1 · immediately`.**

The Stripe link is the proof. Nine links, three per paying branch:

| Links | Emirate | Branch |
|---|---|---|
| `…5wI01` `…5wI02` `…5wI03` | **Abu Dhabi, certain** | **Unknown.** Saadiyat has no working Stripe, so its clients pay through the Khalifa City link. A KCA payment means Abu Dhabi, not KCA. |
| `…eEo13` `…eEo14` `…eEo15` | Dubai, certain | Al Quoz |
| `…0VO1E` `…0VO1F` `…0VO1G` | Dubai, certain | Motor City |

| Branch | Condition | What happens |
|---|---|---|
| Agrees | Payment emirate = `emirate` field | Set `emirate_source: payment`, continue. Regional sends proceed. |
| Missing | `emirate` empty or `unknown` | Set the field from the payment link, `emirate_source: payment`, continue. This is a clean fill, not a conflict. |
| Disagrees | Payment emirate ≠ `emirate` field | **Hold both regional sends.** Raise the task below. |

**Insert `Task · Emirate mismatch` on the disagrees branch.** See Part 6.

### 4.3 Confidence Mapping

**Insert `If/Else · Locale → emirate` after `Add tags: map:completed`, before `Email · minute 0`.**

| Branch | Condition | What happens |
|---|---|---|
| Usable | `Locale` resolves to an emirate | Set the field, `emirate_source: quiz`. |
| Unusable | anything else, including empty | `emirate: unknown`, `emirate_source: asked`, neutral path. |

**Blocked on a check.** Somebody has to open the Confidence Mapping form and read what
`Locale` actually contains before this branch means anything. If it is a language or country
code, the branch is decoration and the form needs a real "where will you be spending it"
question, which is a website change and not a Monday item.

---

## Part 5. The unknown-emirate path

**Recommendation: do both. Send a neutral variant immediately, and ask in the same breath.
Never hold the arc waiting for an answer.**

The two options in the brief were framed as alternatives, and they are not. Holding the Day 0
send until she answers costs you the opening of an 8-day arc inside an 18-day window, for a
question many contacts will simply not answer. Sending neutral costs nothing, because the
neutral copy already exists as a pattern in two live emails.

| Step | Unknown branch behaviour |
|---|---|
| Day 0 email | Sends immediately. Neutral coverage line, no emirate named, no facial type named. |
| Day 0 WhatsApp | `WhatsApp · Which emirate?` instead of a regional broadcast. Two buttons. |
| She taps a button | Field set, `emirate_source: asked`. She joins that regional branch from Day 2 onward. |
| She never answers | Stays neutral for the whole arc. She is not excluded and she is not lied to. |

**What the neutral variant must never do:** name a salon, name a facial type, or say "any
service at any of our salons". It says her credit spends on any service up to its value at the
salons on her voucher, and it asks which emirate is hers.

---

## Part 6. The conflict rule

She is tagged `emirate:dubai` and pays through an Abu Dhabi Stripe link. Which wins?

**The payment wins on emirate, always.** The tag was a routing guess. The payment is the
transaction that created the voucher, and under term 3 the credit is held to the emirate it
was bought in. There is nothing to argue about on the data.

**But it is never a silent re-tag.** She was shown one voucher and holds another. Under term 3
that is a refund conversation.

1. Set `emirate` to the payment emirate. Set `emirate_source: payment`.
2. **Hold both regional sends** (the branch pair in Email 1, and the regional welcome
   WhatsApp) until the task closes.
3. Raise `Task · Emirate mismatch`: human contact within 2 hours, before her first
   redemption, which is the window term 3 explicitly invites her to use.
4. Severity comes from `emirate_source`:
   - was `picker` → **escalate.** She chose the emirate herself and was sold against that
     choice. This is the one that becomes a complaint.
   - was `phorest` → **light.** We inferred it from her history and the inference was wrong.
     Confirm and move on.
   - was `quiz` or `asked` → medium. She answered a question, so check she understood it.

**Not a conflict: the Saadiyat case.** A Saadiyat client paying through the Khalifa City link
is a branch ambiguity inside one emirate. Emirate agrees, so nothing holds. Set
`emirate: abu-dhabi`, leave `branch:` to the Welcome Pack buttons, and note that Stripe will
show the payment under KCA, which the pack already flags to Belle and finance.

---

## Part 7. Cross-emirate clients

Lives in Dubai, works in Abu Dhabi. Rule:

> **One voucher, one emirate, chosen by her. The credit is held to its emirate. Her
> relationship with us is not.**

She is welcome in any of the four salons for anything she is paying for herself. Only the
voucher credit is held.

**Fix it at capture, not in the copy.** The question is **"Where will you be spending your
credit?"**, never "Where do you live?" That single change handles the entire cross-emirate case
at source, and it is already the phrasing the Dubai salon picker uses on the website mockup:
"Your credit sits with the salon you choose, so tell us where you will be spending it."
Carry the same sentence up to the emirate picker.

**Wording must not read as absolute.** Do not write "Your credit can only be used in Abu
Dhabi." Write the Appendix A item 3 line. No client-facing string in this spec contains the
word "only".

**One case to decide rather than assume:** a client who genuinely wants hair in both emirates
on one voucher. There is no mechanism for a split voucher and inventing one three days before
launch would be wrong. Leave it as a contact-centre judgement under term 3, and log how often
it comes up. If it is common, it is a decision for the next window.

---

## Part 8. Contacts already mid-flight when this ships

For this campaign the answer is short: **nothing is live, so nobody is mid-flight.** The real
risk is the one after launch.

**GHL does not retro-apply a new node.** A contact already past the insertion point continues
from where she is and never sees the new If/Else. So the failure mode is: ship routing on
Monday, find a problem, amend on Wednesday, and Wednesday's fix silently misses everyone who
entered on Monday and Tuesday.

**Rule: do not amend a live routing branch mid-window.** If routing has to change after
launch:

1. Pause new entries to v1.
2. Build the corrected version as a **separate v2 workflow**.
3. Let v1 drain.
4. Point the trigger at v2.

**And for anyone stranded without an emirate**, run a one-off backfill rather than re-running
the arc:

- Stamp `emirate` from Phorest on the affected segment.
- A small catch-up workflow sends only the emirate ask, and only to contacts with
  `emirate:unknown` and an active nurture. Nobody receives Day 0 twice.
- Anyone already holding `branch:[x]` with no emirate gets it derived from the branch. That
  direction is safe.

---

## Part 9. How to test without sending anything to a real client

1. **Build in a copy, not the live workflow.** Duplicate it and set the trigger to a tag no
   real contact carries, `test:emirate-routing`. Do not point a test build at the live form.
2. **Eight seed contacts cover every branch.** Team numbers and `+test` email aliases only.

   | # | `emirate` | Consent | Pays | Exercises |
   |---|---|---|---|---|
   | 1 | abu-dhabi | yes | AD link | Happy path AD |
   | 2 | dubai | yes | Al Quoz link | Happy path DXB |
   | 3 | unknown | yes | n/a | Neutral + the ask |
   | 4 | abu-dhabi | no | n/a | Email-only path |
   | 5 | unknown | no | n/a | Email-only, neutral |
   | 6 | dubai | yes | **AD link** | **Conflict, escalate** |
   | 7 | abu-dhabi | yes | **Motor City link** | **Conflict, light** |
   | 8 | empty | yes | KCA link | Clean fill from payment, Saadiyat case |

3. **Set every wait to 1 minute in the test copy** so the whole 8-day arc runs in ten
   minutes. Change them back before go-live. The waits are fixed-date, which is a nuisance
   here and a known dependency at launch.
4. **Submit the WhatsApp templates first.** Meta approval is not instant and a rejection
   restarts the clock. An unapproved template does not send, and the step sits in the
   workflow with nothing to send and no warning. This is the item most likely to miss Monday.
5. **Test the merge fields, not just the branching.** Send each email to a contact with
   `emirate` set and to one with it empty. **An unpopulated GHL merge field renders blank, not
   as an error.** A payment confirmation with two empty buttons is the failure you are looking
   for, and it will not appear in any log.
6. **Use Stripe test mode against all nine links,** so payment to emirate is proven per link
   rather than assumed. This is the only way to catch a mistyped link mapping.
7. **Check `emirate_source` is written on every path.** If it is empty anywhere, the conflict
   rule silently downgrades to guesswork.

---

## Part 10. What lands by Monday 10 August, and what does not

Today is Friday 7 August. One weekend. Window closes 30 September.

### Lands by Monday

| Item | Owner | Notes |
|---|---|---|
| `emirate` and `emirate_source` custom fields | GHL owner | Minutes |
| Three If/Else nodes plus the two field-setting actions | GHL owner | A few hours |
| `Task · Emirate mismatch` and its 2-hour SLA | GHL owner + contact centre | |
| The three email string fixes, then `python build-previews.py` | Kate | Appendix A items 1 and 2 |
| `voucher_availability_line`, `branch_a_name`, `branch_a_url`, `branch_b_name`, `branch_b_url` as GHL custom values per emirate | GHL owner | Copy already approved in the pack's Campaign Copy section, reuse verbatim |
| Hidden `emirate` field on the website reserve form | Marish / web | Only if the form is editable this weekend |
| Phorest-derived emirate stamped on the broadcast segment | Kate | CSV job on the import file |

### Does not land by Monday, with the fallback

| Item | Why | Fallback |
|---|---|---|
| **A new Meta-approved WhatsApp template for the emirate ask** | Meta review is hours to a day and a rejection restarts it | **Hold the unknown-emirate cohort out of the Day 0 WhatsApp entirely and send them the neutral email only.** Email needs no Meta approval. The email's existing WhatsApp CTA opens a chat, and once she writes to us first the 24-hour service window opens and we can reply freely with no template at all. Clean, and it uses a rule Meta already gives us. |
| **The `Locale` audit** on the Confidence Mapping form | Nobody has looked at what the field contains | Treat every mapping lead as `emirate:unknown` for this window. Add a real question to the form when there is time. |
| **Website emirate picker writing to GHL** | Depends on who can edit the site this weekend | If the picker cannot write the field, reserve-form leads are `unknown` and take the neutral path. Nothing breaks, the routing is just less accurate. |
| **Phorest → GHL webhook** | Pre-existing standing dependency, unchanged | Reception applies `voucher:redeemed` at the till by hand, as already flagged. |

### Blocking, needs an answer today

**Part 1.1: is Lead Nurture broadcast-fed or form-fed?** This decides whether a hidden field
is even available and therefore how the emirate is captured for the largest population. It
cannot be built around and it cannot wait until Monday.

---

## Appendix A. Client-facing copy

Reviewed against locked doctrine by `trs-brand-guardian` v3.2 on 7 August 2026. Scored 84/100,
one blocker found and fixed, soft fixes folded in. Everything below is the post-review version.

### 1. Neutral coverage line, replacing "any service at any of our four salons"

Used in `nurture-3-three-tiers-plainly.html:107`, `welcome-2-what-your-credit-covers.html:41`,
**and the live landing page** `/en/ae/beauty-voucher/`, which carries the same wrong promise
and was missing from my first list. Not new copy: this is the exact sentence already live in
`mapping-4-tiers` and `welcome-4-expiry-touch`, so the value is consistency across four assets.

> Every tier spends on any service, up to your credit value, at the salons named on your voucher.

Second person, for `welcome-2`:

> Simply put, your credit spends on any service, up to its value, at the salons named on your voucher. Colour, cuts, treatments, styling, whatever your plan calls for.

Cheap fix worth folding into the same edit: the very next sentence in both files says "home
care products". Client copy never frames home care as products. Make it "The only two things
it never covers are **home care** and the purchase of new hair extensions."

### 2. `welcome-2` hidden preheader

Currently line 21: "Any service at any of our four salons. Two exceptions." This is what shows
in her inbox list, so it matters as much as the body.

> Any service at the salons named on your voucher. Two exceptions.

### 3. Cross-emirate line, so nothing reads as absolute

> Your credit sits with the salons on your voucher. You are always welcome at the others. Your credit stays where you placed it.

### 4. WhatsApp, the emirate ask

New template. Body 222 characters against Meta's 1,024. Buttons 9 and 5 against 25.
`[Name]` is the `{{1}}` variable, per the convention in `whatsapp-templates.json` `_readme`.

> Hi [Name], the Wellness Voucher is open until 30 September. There is one for our Abu Dhabi salons and one for our Dubai salons. Tell us where you will be spending your credit and we will send you the right one.

Buttons: `Abu Dhabi` · `Dubai`

### 5. Website emirate picker

Label:

> Where will you be spending your credit?

Options: Abu Dhabi · Dubai. Sub-line:

> Your credit sits with the salons you choose, so tell us where you will be spending it. You are always welcome at the others.

### 6. Contact-centre opening line, emirate mismatch after payment

The tail is hedged to match term 3 word for word. Term 3 says "we will do our best to put it
right", so the spoken line cannot promise more than that to a woman who has already paid.

> Hi [Name], congratulations on placing your credit. One thing to check before your first visit, so nothing is a surprise: your payment came through our {{paid_emirate}} salons, and your credit sits there. Is that where you were planning to spend it? If not, tell us now and we will do our best to put it right.

`{{paid_emirate}}` must exist as a GHL custom field before this reaches the desk, or the line
reads "our  salons".

---

## Appendix B. Two things found in passing, outside this spec's scope

1. **Voice mix in a live template.** `whatsapp-templates.json` `broadcast_dubai` opens
   "something **we** made for our regulars" and closes "reply here and **I** will help you
   choose", in both the submitted body and the longer draft. Mixing "we" and "I" in one voice
   block is an automatic brand fail. Check `broadcast_ad` for the same thing. Fix: "and we
   will help you choose."
2. **One line for Tara.** "Any service" is still slightly wide for the Dubai voucher, since
   term 2 rules out deep cleanse, clinical facials and LED in Dubai and holds beauty to Al
   Quoz. Tightening to "any service on their menu" would close it, but it is a simultaneous
   change across four assets, so it is her call rather than a copy edit.
