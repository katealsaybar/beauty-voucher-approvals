# Caps and allowances: the two numbers the pack has been waiting for

**Status:** for the coordinators' meeting, 19 August. Kate's proposals, not yet approved.
**Why it is urgent:** both numbers are currently **blank in client-facing copy.** Four emails and the
T&Cs say larger colour is "covered up to a set amount per visit", and the runbook tells reception
*"tell her the number before she sits down."* There is no number. Nothing can ship into a salon like
that, because the first client who asks gets a different answer at every branch.

---

## 1. Colour cap

**The rule, in one line:** the credit covers **AED 700 of colour per visit**, on every tier. All-In VIP
Year additionally gets **one visit a year at AED 1,500**, flagged when she books.

| What she is having | Typical price | Credit covers | She settles at the till |
|---|---|---|---|
| Root touch-up, toner, gloss | 350 to 500 | all of it | **nothing** |
| Core colour and cut | 650 to 850 | 700 | 0 to 150 |
| Premium or signature colour | 1,000 to 1,400 | 700 | 300 to 700 |
| Major colour, **All-In VIP Year, once a year** | 1,200 to 1,500 | 1,500 | **nothing** |

**Why 700 and not the tiered 500 / 700 / 1,200 the Playbook proposed:**

- **700 clears a full Core colour service**, which is the AED 650 to 850 band most clients sit in. So
  the cap is invisible to the majority, and a cap nobody meets does not generate arguments.
- **It stops the one thing that actually loses money:** two premium colours at 1,400 against a 3,000
  credit, which is the whole credit gone on the lowest-margin service in the salon.
- **Two numbers, not a matrix.** Reception cannot run tier-by-service rules at a busy till. Every
  extra number is a wrong answer waiting to be given.
- **The 1,500 for VIP Year is not generosity, it is honesty.** The WhatsApp blast going out says
  All-In VIP Year has "one major colour in". Without that line the copy is a promise we break.

**Deliberately not proposed: per-year caps on Tiers 1 and 2.** Nobody will track a yearly total across
visits, so a rule like that is enforced by whoever happens to remember. Per visit is checkable.

**Where the number lands once approved:** `emails/mapping-4-tiers.html`, `nurture-3`, `welcome-2`,
the T&C larger-colour term, `index.html`, and the runbook line that tells reception to say it out loud.

---

## 2. Home Ritual Kit: from gift to allowance

**The change, in one line:** the kit stops being a gift we hand over and becomes **an allowance she
spends on products, and she settles anything above it.** Same mechanic as the voucher itself.

| Tier | Cap before (shelf) | as % of what she paid | **Allowance now** | as % | Cash saved per sale (trade at 50%) |
|---|---|---|---|---|---|
| Dip Your Toes | 350 | 35% | **100** | 10% | ~125 |
| Season of You | 650 | 26% | **250** | 10% | ~200 |
| All-In VIP Year | 1,050 | 23% | **450** | 10% | ~300 |

Slot counts are unchanged: 2, 4 and 6. The prescription is what makes the kit feel considered, not
the price of it.

**Why this is better than simply cutting the caps**

The kit is the more expensive half of the giveaway, and it is worth understanding why. The credit
uplift costs the **delivery cost** of an extra service. The kit costs **cash out of the door**: product
leaves the building at trade cost whether she values it or not. So per dirham given away, the kit is
the expensive one, and it is the right thing to cut first.

Making it an allowance changes three things at once:

1. **Unredeemed allowance is not spent.** A gift is a cost the moment it is packed. An allowance is a
   cost only when she uses it.
2. **The top-up is new retail at full margin.** A 250 allowance against a 400 basket is 150 of retail
   revenue that did not exist before, from a client who is already standing at the till.
3. **It makes the existing rule make sense.** The credit has always excluded home care. Now there is a
   reason for that, instead of it reading as a restriction: home care has its own allowance.

**The trade-off, stated plainly:** the perceived value of the offer drops. The kit used to read as a
free AED 1,050 of product on the top tier. It now reads as AED 450 towards products. If the offer
needs that headline value back, the honest place to find it is the service credit, not the kit.

**The input still missing:** the real **trade cost** of the products. Decision 5 in the pack, owned by
Emma, never supplied. The cash-saved column above assumes trade is 50% of shelf. If it is 35% or 60%,
these numbers should move.

---

## 3. What changed in the repo already

Applied on 18 August, so the tool and the terms match this document:

- `ritual-kit/ritual-kit.js` — caps are 100 / 250 / 450. The staff-facing bar no longer says "over the
  cap, swap an item down". It now says **"she pays AED X at the till"**, and it says to tell her before
  the bag is built.
- **T&Cs, both `index.html` and the mockup** — ritual kits were removed from the "complimentary gifts
  have no cash value" clause, because an allowance has a value and the two statements contradicted each
  other. A new clause covers the allowance: the amount per tier, that the difference is payable on
  collection, that it cannot be spent on services and the service credit cannot be spent on home care,
  and that the unused part has no cash value and ends with the voucher.

**Not applied, because it is not mine to decide:** the colour cap. Every mention of it still reads "a
set amount per visit". Approve 700 / 1,500 tomorrow and it goes in everywhere in one pass.

---

## 4. What the meeting needs to produce

| # | Decision | Owner |
|---|---|---|
| 1 | Colour cap: **700 per visit, 1,500 once a year on VIP Year** — yes or a different number | Coordinators, then Emma |
| 2 | Kit allowance: **100 / 250 / 450** — yes or a different number | Emma |
| 3 | The real trade cost of the kit products, so number 2 can be checked rather than assumed | Emma |
| 4 | Whether the offer needs its headline value replaced now that the kit is smaller | Tara |
