# Audience segmentation: who the Wellness Voucher goes to

**Status:** Emma-Louise's parameters from the 18 August leadership call, written up so Bell can run
the Phorest export and David can import it. **Not signed off by Tara yet.** Section 3 is the list of
things nobody on the call could answer, and Bell should not pull until they are answered, because
each one changes the size of the list by a lot.

**Owners:** Bell exports from Phorest. David imports to GHL and reports the size back.
**Deadline pressure:** Bell is off Thursday, and Tara travels Thursday.

---

## 1. There are two audiences, not one

The call split these deliberately, on cost.

| | Email blast | WhatsApp blast |
|---|---|---|
| **Who** | The entire database. No segmentation filter. | The segment in section 2 only. |
| **Why** | Email costs effectively nothing, so filtering only loses reach. | WhatsApp is charged per message and scales fast. |
| **Size** | 14,818 contacts carry an email address across all branches. | Unknown until the Phorest export lands. |
| **Risk** | GHL has never sent a bulk blast, so domain reputation is untested. **Stagger the send.** | Meta allows one marketing message per contact per 24 hours, and if another brand gets there first, ours is not delivered. |

Note on the 14,818: that is contacts-with-an-email, **not** customers. Much of it is people who
enquired once and never came in. Do not present it as a customer count to anyone.

---

## 2. The WhatsApp segment, as agreed on the call

**Include** a contact if she meets all of these:

1. At least one visit to **Al Quoz, Mamsha al Saadiyat or Khalifa City A** in **2024** (see 3.1, the
   date window is the first thing to confirm).
2. **Hair only.** She has taken hair services and never a beauty service (see 3.2, this is the one
   that needs a real decision).
3. Or she is **dormant**, or a **new contact who never converted**. These are separate slices from
   rule 2, not the same people.

**Exclude:**

4. The **top 50 clients by beauty revenue.** Sending money off to the highest beauty spenders was
   explicitly rejected on the call: it discounts revenue that was coming anyway (see 3.3).
5. **Motor City clients**, judged unlikely to travel to Al Quoz (see 3.2, this collides with rule 2).
6. Anyone already carrying `voucher:paid`, `suppress:campaign`, or a `+973` Bahrain number. These are
   the pack's standing suppressions and they apply here too.

---

## 3. Four things Bell cannot guess. Answer before the export.

### 3.1 "2024" is twenty months ago

Today is August 2026. A 2024-visit filter selects women who have not been in for well over a year,
which is a **dormant** list, and it excludes every currently active client. If the intent was active
hair clients, the window is 2025 to 2026. If the intent was genuinely dormant, 2024 is right and rule
2 needs rewording, because an active hair-only client is not a 2024 visitor.

**Ask Emma-Louise: active hair clients, dormant clients, or two separate lists?** Two lists is the
honest answer, and it is also two different messages, which the two-message WhatsApp cap can just
about carry.

### 3.2 "Hair only" points straight at Motor City, and Motor City is excluded

The pack records this as final: **Motor City is hair only, no beauty at all.** Al Quoz does the full
beauty menu. So:

- **Every Motor City client is a hair-only client**, by force. There is no beauty there to book.
- Rule 2 therefore selects mostly Motor City, and rule 5 then deletes them.
- What survives in Dubai is only **Al Quoz clients who could book beauty and never did**, which is a
  much smaller pool than "hair-only clients" sounds like.

This is the single biggest risk to the list size. Abu Dhabi is unaffected: Saadiyat and Khalifa City A
both do beauty, so hair-only there is a real and meaningful segment.

**Ask Emma-Louise: does the Dubai list include Motor City or not?** If the reason for excluding them
was travel to Al Quoz, note that the Dubai voucher is valid at **both** Motor City and Al Quoz, so a
Motor City client can spend her credit on hair at her own branch without travelling anywhere.

### 3.3 The top-50 exclusion overlaps with rule 2 by definition

A hair-only client has no beauty revenue, so she cannot be in the top 50 by beauty revenue. The
exclusion only actually bites on the **dormant** slice, where beauty history does exist.

**Confirm two things:** that the exclusion is meant for the dormant slice, and whether 50 is per
emirate or across the whole business. Fifty across four branches is a much softer filter than fifty
per branch.

### 3.4 Decision 3 in the approval pack is still open

The pack still lists **"Existing vs new client eligibility: is it open to existing clients as
well as new? No final policy yet."** as an open decision for Tara. Rule 3 above targets new
never-converted contacts. If Tara lands on existing-only, that slice of the list disappears after it
has been exported, imported and paid for.

**This one is Tara's, and it is worth asking in the same call as the segmentation sign-off.**

---

## 4. What Bell exports from Phorest

Phorest is the only system holding visit history, service history and spend. GHL cannot work out
current-versus-dormant on its own, which is why this is a manual pull.

**Two files, split by emirate**, because there are two landing pages and two sets of WhatsApp
templates:

- `wellness-target-abu-dhabi.csv` — Mamsha al Saadiyat and Khalifa City A
- `wellness-target-dubai.csv` — Al Quoz, and Motor City only if 3.2 says so

**Columns, in this order:**

| Column | Why it is needed |
|---|---|
| `first_name` | Personalisation in the email. Not used in WhatsApp: respond.io display names are unusable. |
| `phone` | The WhatsApp send, in full international format. Match on phone, not email. |
| `email` | The email blast, and de-duplication against GHL. |
| `home_branch` | Sets `emirate:` on import, which is what picks the regional template and the right payment link. |
| `last_visit_date` | Proves the date window in 3.1 was applied. |
| `services_taken` | Proves hair-only in 3.2 was applied. Hair, beauty, or both. |
| `beauty_spend_total` | Lets David apply the top-50 exclusion in 3.3 without a second export. |

Send them to David directly, not through a group chat. These are client records.

---

## 5. What David does in GHL

Use the tag namespaces the pack already uses. Do not invent new shapes.

- `wellness:target` on every imported contact. That is the campaign bucket.
- `emirate:abu-dhabi` or `emirate:dubai`, read from `home_branch`. **The automations branch on this**,
  so a contact left on `emirate:unknown` gets the wrong template and a confirmation email with two
  blank branch buttons.
- Leave `voucher:paid`, `suppress:campaign` and the `+973` suppressions in place as filters on the
  send, not as deletions from the import.

De-duplicate against contacts that already exist in GHL before creating new ones, matching on
**phone first**. Matching on email alone creates a second contact who then gets nurtured to buy
something she already owns.

---

## 6. Report the size back before anyone sends

David quoted **3 to 7% conversion on WhatsApp in the UAE** as typical. The list size is what decides
whether this campaign hits its number, so it gets reported before the send, not after:

```text
Abu Dhabi list:      ____ contacts
Dubai list:          ____ contacts
At 3%:               ____ purchases
At 7%:               ____ purchases
Tier mix assumed:    AED 1,000 / 2,500 / 4,500
Revenue at 3% / 7%:  ____ / ____
```

If the combined base comes in around 500, say so plainly at that point rather than after the spend.
That was David's own warning on the call.

---

## 7. Sequence

1. Emma-Louise answers 3.1, 3.2 and 3.3. Tara answers 3.4.
2. Bell runs the export, both files, before Thursday.
3. David imports, tags, de-duplicates, reports the sizes in section 6.
4. WhatsApp templates go to Meta for approval. **They now carry the new product name**, so anything
   already submitted as "Beauty Voucher" or "Beauty Ritual Voucher" has to be resubmitted. Approval can take 24 hours.
5. Email blast goes out staggered. WhatsApp follows the approved templates, two messages maximum.
