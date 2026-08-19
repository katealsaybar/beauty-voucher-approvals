# Caps and allowances: both settled

**Status:** settled by Kate on 19 August, and applied across the repo in the same pass.
**What changed from the version that went into the meeting:** the colour cap was not approved at a
number, it was dropped. A cap could not survive the checkout model, so a list replaced it. The kit
allowance was approved as it stood, and the copy moved instead.

---

## 1. Colour: no cap, a three-step ladder

**The rule, in one line:** there is **no per-visit colour cap.** Colour runs on the salon's own
three-step plan ladder, and each voucher reaches one step further than the one below it. Every
voucher includes everything on the steps beneath it.

| Step | Blonde | Brunette | The services | Dip Your Toes | Season of You | All-In VIP Year |
|---|---|---|---|---|---|---|
| 1 | **Soft** | **Polished** | Root retouch, all-over and single-process colour, toner, gloss, tonal maintenance | **Yes** | **Yes** | **Yes** |
| 2 | **Signature** | **Dimensional** | Balayage and freehand placement, highlights and foils, grey blending, multi-tonal depth | No | **Yes** | **Yes** |
| 3 | **Transformation** | **Luxury** | Full transformation, colour correction and removal, high lift, fantasy colour | No | No | **Yes** |

Cuts, blow-dry and styling, keratin and smoothing, and bond, strength, hydration and scalp
treatments are **not on this ladder at all**. They are covered on every voucher.

**Why the AED 700 cap was dropped rather than approved at some number**

- **Nothing could enforce it.** Jumera's checkout is a deposit that depletes. There is no per-visit
  ceiling in that mechanic to hang a cap on, so enforcing one means reception doing a sum per client
  at a busy till, which is the exact thing she ruled out as operationally risky. A rule nobody can
  enforce is enforced by whoever happens to remember it, which is the same as not having one.
- **A ladder is read, not calculated.** It gives the same answer every time, from every branch, from
  anyone on the floor. That was always the real requirement behind wanting numbers rather than a matrix.
- **The credit was already the cap.** She can never spend past 1,150, 3,000 or 5,400.
- **It gives every tier something to buy.** A cap only ever took something away. Season of You now
  buys balayage and highlights; All-In VIP Year buys correction and high lift.

**Why these names, and not a list written from scratch**

Soft / Signature / Transformation and Polished / Dimensional / Luxury are the locked plan-tier names
in Tara's own Blonde System and Brunette System pages, and the floor already books against them.
An earlier draft of this rule invented a service list and got it wrong: it made **all-over colour** a
top-tier service when it is the **entry** step of the brunette menu, which would have pushed the most
ordinary brunette client into the top voucher. Building on the existing ladder removes that whole
class of mistake.

**The thing the floor has to get right:** the Self-Care Bonus does not buy colour on any tier. The
Terms restrict it to beauty, treatments, keratin and blowdries, and always did. So a VIP Year client
has AED 4,500 of colour headroom, not 5,400, and a Season of You client has 2,500, not 3,000.

**Still to confirm, and it is Belle's:** a spot check that the six plan names match the booking system
at all four branches.

---

## 2. Home Ritual Kit: from gift to allowance

**The change, in one line:** the kit stops being a gift we hand over and becomes **an allowance she
spends on products, and she settles anything above it.** Same mechanic as the voucher itself.

| Tier | Cap before (shelf) | as % of what she paid | **Allowance now** | as % | Cash saved per sale (trade at 50%) |
|---|---|---|---|---|---|
| Dip Your Toes | 350 | 35% | **100** | 10% | ~125 |
| Season of You | 650 | 26% | **200** | 8% | ~225 |
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
2. **The top-up is new retail at full margin.** A 200 allowance against a 534 basket is 334 of retail
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

- `ritual-kit/ritual-kit.js` caps are 100 / 200 / 450. The staff-facing bar no longer says "over the
  cap, swap an item down". It now says **"she pays AED X at the till"**, and it says to tell her before
  the bag is built.
- **T&Cs, both `index.html` and the mockup** — ritual kits were removed from the "complimentary gifts
  have no cash value" clause, because an allowance has a value and the two statements contradicted each
  other. A new clause covers the allowance: the amount per tier, that the difference is payable on
  collection, that it cannot be spent on services and the service credit cannot be spent on home care,
  and that the unused part has no cash value and ends with the voucher.

Applied on 19 August, in one pass, once the colour rule was settled:

- **Every "a set amount per visit" is gone, and the ladder went in behind it.** `emails/mapping-4-tiers.html`, `nurture-3`,
  `welcome-2`, the landing page lede and tier cards, the "No surprises at the till" step, the
  Confidence Promise strip, term 5 of the T&C mockup, and the Floor Briefing. The tier rule went in
  behind each one.
- **The landing page tier cards now differ**, where Season of You and All-In VIP Year previously
  shared a lead line. Tier 1 reads "three things it does not cover", not two.
- **Term 10 lost its A/B fork.** Dawn's lighter clause governs and the detailed Cancellation Policy
  section of the pack came out to match, so the pack states the rule once.

---

## 4. What is left

| # | Item | Owner |
|---|---|---|
| 1 | Spot check that the six plan names match the booking system at each branch | Belle |
| 2 | The real trade cost of the kit products, so the allowance is checked rather than assumed | Emma |

Settled 19 August and no longer open: the colour cap (dropped, replaced by the tier list), the kit
allowance (100 / 200 / 450, Season of You corrected from 250; copy reads *towards* rather than *your kit*), the headline value
(the allowance was already inside the totals, so only Season of You moves, to 3,850), and the
cancellation wording (Dawn's clause).
