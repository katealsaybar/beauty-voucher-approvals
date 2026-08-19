# Audience segmentation: who the Wellness Voucher goes to

**Status:** Emma-Louise's parameters from the 18 August leadership call, written up so Bell can run
the Phorest export and David can import it. **Section 1 was replaced by Kate on 19 August:** email
and WhatsApp now go to the same single list. The rest is **not signed off by Tara yet.** Section 3 is
the list of things nobody on the call could answer, and Bell should not pull until they are answered,
because each one changes the size of the list by a lot.

**Owners:** Bell exports from Phorest. David imports to GHL and reports the size back.
**Deadline pressure:** Bell is off Thursday, and Tara travels Thursday.

---

## 1. One audience, both channels

**Decided by Kate, 19 August. This replaces the two-audience split agreed on 18 August.** Email and
WhatsApp both go to **Belle's list and nothing else.**

The 18 August call split them on cost: email to the entire database because sending it is nearly free,
WhatsApp to the segment because it is charged per message. Belle spotted what that split actually did.
The **top spender exclusion existed on WhatsApp only**, so the women it removed received the offer by
email regardless, and the exclusion did nothing except make one list smaller. One list removes the
contradiction, and there is now one thing to export, import and de-duplicate instead of two.

| | Email | WhatsApp |
|---|---|---|
| **Who** | Belle's list, section 2. | Belle's list, section 2. The same women. |
| **Sends from** | GHL, the sending domain. | **GHL, Contact Centre sub-account.** Not respond.io. `058 155 9679` for both emirates. |
| **Size** | Unknown until the Phorest export lands, and the same number for both. | Same. |
| **Risk** | GHL has never sent a bulk blast, so domain reputation is untested. **Stagger the send.** | Meta delivers one marketing message per contact per 24 hours, which is why a broadcast entrant skips the Day 0 WhatsApp. |

**What this gives up, said plainly.** 14,818 contacts carry an email address across all branches, and
email costs **AED 0.004** per send, so the reach just dropped was effectively free. Against that: the
14,818 is contacts-with-an-email, **not** customers, and much of it is people who enquired once and
never came in, so it was never worth what the number suggests. If the list comes back small, the
option is a second **email-only** send to the remainder after launch, not reopening the split now.

**One list, still two sends.** The list is single, the WhatsApp send is not. It splits by emirate at the
point of sending, because the templates already do: `_ad` names Mamsha al Saadiyat and Khalifa City A,
`_dxb` names Motor City and Al Quoz, and Meta fixes those button labels at template level. So the export
Bell produces carries an **emirate** column and David splits on it at import, rather than Bell producing
two files. One export, two audiences inside it, two sends, **one sending number**.

**Overlap is now total, by design.** Everyone on the list gets both channels. That was Belle's original
concern and it is accepted: at AED 0.004 against AED 0.17, the cost of the overlap sits almost entirely
on the WhatsApp side, where it was always going to sit.

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
5. **Motor City clients.** Deliberate, confirmed by Kate on 19 August. Not an oversight in the export.
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

### 3.2 Motor City. Answered: the exclusion is deliberate

**Confirmed by Kate, 19 August. Motor City is out on purpose and the export is correct as delivered.**
Nobody needs to chase a missing file.

Worth keeping straight, because these are two different things and someone downstream will conflate them:

- **Who we contact** excludes Motor City.
- **Where the voucher works** does not. The Dubai voucher is valid at **both Al Quoz and Motor City**,
  and the landing page, the Stripe links and the tier table all say so.

So a Motor City client who hears about the campaign from a friend, a poster or the website can still buy
and still redeem at her own branch. **Do not let anyone "tidy up" the copy by removing Motor City from
the voucher terms to match the contact list.** The list is a targeting decision; the terms are a promise.

The consequence to expect: Dubai is **286 WhatsApp contacts and 246 email contacts** against Abu Dhabi's
2,624 and 1,385. The Dubai lane is small by design, so do not read it later as a Dubai underperformance.

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
- `wellness-target-dubai.csv`: Al Quoz only. Motor City is excluded on purpose, see 3.2.

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
