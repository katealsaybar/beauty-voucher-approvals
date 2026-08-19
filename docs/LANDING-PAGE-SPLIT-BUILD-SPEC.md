# Landing page split: one Wellness Voucher page per emirate

**For:** LID (web build) · **From:** Kate Alsaybar · **Date:** 10 August 2026
**Live page being replaced:** `/en/ae/beauty-voucher/`
**Drawn in full:** `website-mockups/voucher-landing/voucher-landing.html` — switch emirate in the
header, then press **Show what changes** to outline every block that moves.

---

## 1. What we are asking for, in one paragraph

The live page sells one voucher across all four salons. It cannot: an Abu Dhabi voucher does not
spend in Dubai, and Motor City is a hair salon with no beauty menu, so a single page promises
things two of the four salons cannot deliver. Split it into **two pages, one per emirate**, each
promising only what its own salons do. Same three tiers, same prices, same everything else on the
page. Fifteen blocks change, one section is new on the Dubai page, and one sentence is wrong on
both today. The mockup now draws the **whole** page, not only the changed parts, so pressing
**Show what changes** over it is the fastest way to see where *not* to touch.

## 2. URLs

| Page | URL |
|---|---|
| Abu Dhabi | `/en/ae/beauty-voucher/abu-dhabi/` |
| Dubai | `/en/ae/beauty-voucher/dubai/` |

**Do not 301 the old URL.** `/en/ae/beauty-voucher/` is already carried in ads, emails and the
WhatsApp broadcast, and we cannot recall those. Keep it live as a two-button chooser, *Abu Dhabi*
or *Dubai*, that sends her to the right page. A redirect would land half the audience on the wrong
promise.

## 3. What does NOT change

Do not rebuild these. They are identical on both pages and unchanged from the live page:

- The three tiers and their prices: Dip Your Toes AED 1,000 · Season of You AED 2,500 ·
  All-In VIP Year AED 4,500. **Nothing here changes what she pays.** What changes is what each
  page promises she can spend it on.
- Founder story · press strip · the four shifts · gallery · reviews · reserve form.
- Type, spacing, colour: the live site's own design system, unchanged.

---

## 4. The fifteen blocks that change

Exact copy for both pages. Copy these across as written; every line has been through brand review.

### 4.1 Hero

| | Abu Dhabi | Dubai |
|---|---|---|
| **Title line** | Abu Dhabi | Dubai |
| **Availability band** | Available at Mamsha al Saadiyat and Khalifa City A | Available in Dubai at Al Quoz and Motor City |

**Lede, Abu Dhabi:**
> For eleven years we have looked after women across our two Abu Dhabi salons. You never miss your
> colour. What you skip is the facial, the treatment, the hour that is only yours. So we built
> three prepaid Wellness Vouchers: you place credit on your plan, we add a Self-Care Bonus on
> top pointed at exactly the part you keep putting off. Not money off. A plan.

**Lede, Dubai:** identical, with *"our two Abu Dhabi salons"* → *"our two Dubai salons"*.

### 4.2 Coverage section, "Where your credit spends"

**Abu Dhabi heading:** Two salons, *the full menu at both.*
**Dubai heading:** Two salons. Hair at both, *beauty at Al Quoz.*

**Abu Dhabi lede:**
> Your credit spends on any service, up to your credit value: hair, colour, beauty, treatments and
> facials, at either Abu Dhabi salon. It is a spending cap, so anything above your credit is
> settled at the till.

**Dubai lede:**
> Your credit spends on any service, up to your credit value. Hair at both Al Quoz and Motor City.
> Beauty services and the Signature Relaxing Facial at Al Quoz. It is a spending cap, so anything
> above your credit is settled at the till.

**The two coverage cards, Abu Dhabi** — both salons carry the same four rows, all Yes:

| Row | Mamsha al Saadiyat | Khalifa City A |
|---|---|---|
| Hair, colour, keratin and treatments | Yes | Yes |
| Nails, waxing, threading, lashes, brows | Yes | Yes |
| Massage | Yes | Yes |
| Facials, the full menu including deep cleanse and LED | Yes | Yes |

**The two coverage cards, Dubai** — these are not the same as each other, which is the whole
reason for the split:

| Row | Al Quoz | Motor City *(kicker: "Dubai · a hair salon")* |
|---|---|---|
| Hair, colour, keratin and treatments | Yes | Yes |
| Nails, waxing, threading, lashes, brows | Yes | No |
| Massage | Yes | No |
| Signature Relaxing Facial | Yes | — |
| Deep cleanse and clinical facials, LED | Abu Dhabi only | — |
| Facials | — | No |

### 4.3 Tier cards, two rows and the button

Everything on the three tier cards is identical across both pages **except** the Self-Care Bonus
line on the upper two tiers, and where the button goes.

| | Abu Dhabi | Dubai |
|---|---|---|
| **Season of You**, bonus row (AED 350) | A birthday facial of your choice, or a scalp and hair treatment with a blowdry | A birthday Signature Relaxing Facial with lifting massage at Al Quoz, or a scalp and hair treatment with a blowdry |
| **All-In VIP Year**, bonus row (AED 750) | A birthday facial of your choice and a scalp and hair treatment with a blowdry | A birthday Signature Relaxing Facial with lifting massage at Al Quoz and a scalp and hair treatment with a blowdry |
| **Button on all three tiers** | `Claim Dip Your Toes` / `Claim Season of You` / `Claim VIP Year` → straight to that tier's payment link | `Claim: choose your salon` → jumps to the salon picker (4.4) |

The gift row reads **"3 × AED 100 to gift, one card each for three friends, sent in your name"**
(and 5 × AED 100 on VIP) on
both pages. It IS "3 × AED 100": Phorest holds nine gift card products and the friend
vouchers are individual AED 100 cards, one per friend. (Corrected 18 Aug, Decision 13.
This line previously said the opposite.)

### 4.4 Dubai salon picker — NEW SECTION, Dubai page only

Sits between the tiers and the salon list. It exists because Al Quoz and Motor City have
**separate payment links**, so the page has to ask before it can send her anywhere.

> **One more thing before you pay**
> ## Which Dubai salon *is yours?*
> Your credit sits with the salon you choose, so tell us where you will be spending it. You can
> still visit both for hair.

Two cards, each ending in a button:

| | Al Quoz | Motor City |
|---|---|---|
| Address | Arenco Warehouse 10, Al Quoz 1 | Daytona House, Unit LB 03, Motor City |
| Hours · phone | 9:00am–8:00pm daily · +971 4 457 2309 | 9:00am–8:00pm daily · +971 4 324 6613 |
| What it does | Hair and the full beauty menu | Hair only |
| Button | Continue with Al Quoz | Continue with Motor City |

### 4.5 Salon list

Abu Dhabi lists its two salons. Dubai lists its two, and carries one extra paragraph underneath:

> Deep cleanse and clinical facials and LED are at our Abu Dhabi salons. Your Dubai credit does not
> travel there, so we say it here rather than at the till.

### 4.6 "The honest part", step two

Common line on both pages, with a per-emirate tail:

- **Abu Dhabi:** …on every card above. *At either Abu Dhabi salon, the plan is the same.*
- **Dubai:** …on every card above. *Hair at both Dubai salons; beauty at Al Quoz.*

### 4.7 FAQ

**Abu Dhabi gains one question:**
> **Can I use my Abu Dhabi credit in Dubai?**
> This voucher is for Mamsha al Saadiyat and Khalifa City A. Our Dubai salons run their own
> voucher, so if Dubai is where you visit, start there instead. Ask us and we will point you to the
> right one before you pay.

**Dubai gains two:**
> **What if I want a deep cleanse or clinical facial?**
> Those are done at our Abu Dhabi salons. In Dubai your credit covers hair at both salons, and the
> full beauty menu plus the Signature Relaxing Facial at Al Quoz. If a clinical facial is what you
> are after, our Abu Dhabi voucher is the one for you.

> **Can I use it at both Dubai salons?**
> Yes for hair. Beauty is at Al Quoz, because Motor City is a hair salon.

### 4.8 Small print strip

**Abu Dhabi:**
> All figures are in UAE dirhams and include applicable value added tax. Your credit spends on any
> service at Mamsha al Saadiyat or Khalifa City A. It does not cover home care or the purchase of
> new hair extensions. On Season of You and All-In VIP Year, the Self-Care Bonus added on top is
> for beauty, treatments, keratin and blowdries. Dip Your Toes is paid in full. Season of You and
> All-In VIP Year can be split into four with Tabby, and the credit stays exactly the same.
> Vouchers are not refundable and not transferable, and run from the date of purchase.
> **Read the full terms and conditions.**

**Dubai:**
> All figures are in UAE dirhams and include applicable value added tax. Your credit spends on any
> service at Al Quoz, and on hair at Motor City. Beauty services and the Signature Relaxing Facial
> are at Al Quoz. Deep cleanse and clinical facials and LED are at our Abu Dhabi salons. Your
> credit does not cover home care or the purchase of new hair extensions. On Season of You and
> All-In VIP Year, the Self-Care Bonus added on top is for beauty, treatments, keratin and
> blowdries. Dip Your Toes is paid in full. Season of You and All-In VIP Year can be split into
> four with Tabby, and the credit stays exactly the same. Vouchers are not refundable and not
> transferable, and run from the date of purchase. **Read the full terms and conditions.**

### 4.9 The salon addresses open Google Maps

Not a link on a mint pill. The mint pill on this page means *"this is the thing that takes your
money"*, and four more of them for directions would compete with the one that does. The mockup
points at a Maps search per salon, which works today and never expires. If we can get the four
**Google Business Profile** links, swap those in instead so she lands on our own listing.

---

### 4.10 Reserve form: two fields change, and neither looks different

The form is the block most likely to be built wrong, because nothing about it *looks* changed.

**Add a hidden `emirate` field**, set from the page she is on: `abu-dhabi` or `dubai`. Nothing
writes this today. Everything downstream reads it, which is why the Day 0 message currently cannot
know which promise it is allowed to make. This one field is the whole fix.

**On the Dubai page, add "Which Dubai salon?" as a required field.** Al Quoz and Motor City have
separate payment links, so the form cannot route her without it. Pre-fill it if she already chose
in the picker, but keep the field: a woman who scrolls straight to the form must never be sent
back up the page.

Everything else on the form is unchanged: first name, WhatsApp number, email, which voucher,
the gift and Tabby checkboxes, the two consent boxes, and the data-controller paragraph.

### 4.11 "After you reserve", step 2

Dubai only, gains a tail: *Your credit goes on your account**, at the Dubai salon you chose***.

### 4.12 "Your credit is protected" card

It says the credit stays yours, which is true, without saying *where* it stays, which is the one
thing a split voucher has to be straight about. Add one sentence:

- **Abu Dhabi:** …not clawed back, not conditional. *It sits with your Abu Dhabi salons.*
- **Dubai:** …not clawed back, not conditional. *It sits with the Dubai salon you chose.*

### 4.13 Footer, the "Voucher terms" link

Points at the single shared `/en/ae/terms-and-conditions/` today. There are two sets of terms now.
Point each page at its own, and label it: **Voucher terms · Abu Dhabi** / **Voucher terms · Dubai**.
Otherwise she reads the other emirate's rules in the one place she goes looking for rules.

### 4.14 "Dip Your Toes is cash" → "paid in full"

Not an emirate change, a correctness one, and it is on both pages twice: the Tabby block and the
fine print. **"Cash"** reads as *card not accepted*, which is not true and not what the till does.
The FAQ already says **paid in full**. One wording, all three places.

### 4.15 What deliberately does NOT change

Press strip · the promises strip · "Why the voucher exists" · the founder quote and My Why story ·
the four shifts · the belief quote · the gallery · three ways to say yes · reviews · the Confidence
Promise wording · payment security. Drawn in the mockup so the page reads whole, with no diff
outline, which is the fastest way to see where **not** to touch.

One line inside that list is worth naming, because it looks like a mistake and is not.
**"Eleven years, four salons"** in the Recognition block stays on both pages. It is a credential
about the business over eleven years, which is true and worth saying. It is not a claim about
where this voucher spends, which is what every other four-salon line on the page was doing wrongly.

---

## 5. One sentence that is wrong on the live page today

The live page carries **"spends on any service at any of our four salons."** No voucher can deliver
that. Replace on both new pages with the line already live in two of our emails:

> Every tier spends on any service, up to your credit value, at the salons named on your voucher.

Keep *"up to your credit value"* — without it the sentence reads as unlimited free services. The
same string is being fixed in `nurture-3` and `welcome-2` at the same time, so all four assets say
one thing.

## 6. Payment links: the count doubles on Dubai

| Page | Links needed |
|---|---|
| Abu Dhabi | 3, one per tier |
| Dubai | **6**, three tiers × two salons |

The salon picker chooses which set of three she reaches. This is the dependency most likely to
hold the build: **the payment links are not live yet** (owner: Emma / Simran). The pages can be
built and staged without them, but they cannot go live.

## 7. Two decisions that change wording on the page

Both are open, and both appear on the page as words rather than as settings, so they are worth
settling before build rather than after:

1. **Can existing clients buy a voucher?**
2. **The exact per-visit colour cap.**

Reply in the pack's **Open Decisions** section.

## 8. The terms and conditions are split the same way

The **"Read the full terms and conditions"** link at the foot of both pages points at a T&C that
is itself split per voucher, so the two are built together, not one after the other. Drawn in full
in `website-mockups/terms/terms.html`, same controls: switch voucher in the header, and
**Show what changed** marks every clause that moved.

What changed from the 7 August draft: term 2 is split per emirate and now names **Motor City**,
which the draft left out and which would have stopped Dubai clients redeeming there. Term 3 is new
and holds the credit to the emirate it was bought in. Term 5 spells out coverage per emirate.
Term 7 is rewritten to one gift card rather than several, to match what Phorest actually issues.
Term 9 names the right birthday facial for each emirate. Everything else is unchanged.

**Term 10 is not final.** Cancellations is shown twice, option A and option B. Build the rest and
leave term 10 until we confirm which one, so the terms and the cancellation policy do not end up
saying different things.

Two things are deliberately *not* in the terms yet, and both are the same open decisions as
section 7: the per-visit colour cap, and whether existing clients can buy. If either is a rule
clients are held to, it belongs in term 5 rather than only on the page.

## 9. The Al Quoz facial has one name, and this is it

Settled 11 August against the salon's own live price list, not by preference:

> **Signature Relaxing Facial with Lifting Massage** — AED 350, 45 minutes
> `/en/ae/services/face/facial-treatments/`

The AED 350 is the same AED 350 the birthday treat is valued at on the tier tables, which is the
check that this is the right service and not a similarly named one.

Some of our internal notes and messages had been calling it **"the Relaxation Facial"**, which is
not a service we sell. Every instance has been corrected across the pages, the terms and this
spec. **Use the full name on the tier rows** (*a birthday Signature Relaxing Facial with lifting
massage at Al Quoz*) and the short form *Signature Relaxing Facial* everywhere else, which is how
the price list itself reads.

Do not reintroduce "Relaxation Facial". If it turns up in a caption, an email or a press note, it
came from an older copy of something.
