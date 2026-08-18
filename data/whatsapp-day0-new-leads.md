# Wellness Voucher — Day 0 Broadcast, New Leads

> **SUPERSEDED, 18 Aug 2026.** The blast is now **one message for both emirates and all three
> audiences** (`broadcast` in `whatsapp-templates.json`), because drip messaging on a list this
> size is the expensive part. The two new-lead templates proposed below are **not being built**:
> they would add sends, not remove them. Kept for the reasoning, which still applies.
>
> **One thing below outlives this doc and contradicts the new blast copy.** The templates here were
> written **name-free on purpose**: respond.io display names are unusable, single characters,
> symbols, and one contact saved as "I want to know the location and the prices". The new blast
> opens with `Hi [Name]`. On the Respond segment that merge will produce garbage for a real share
> of the list, and a broken merge goes out worse than no name. Either drop the name from the blast,
> or send a name-free variant to the Respond segment only.

**Scope: Day 0 only.** The rest of the sequence is already in the approval pack.

## Already in the pack, nothing needed

| Template | Region | Stage |
|---|---|---|
| `broadcast_ad` | Abu Dhabi | Day 0, existing clients |
| `broadcast_dubai` | Dubai | Day 0, existing clients |
| `reminder_ad` / `reminder_dubai` | Both | 48 to 72h reminder |
| `bridge` | All | Mapping to voucher |
| `welcome_confirm_ad` / `welcome_confirm_dubai` | Both | Payment confirmation |
| `expiry_touch` | All | 30 days left |

## The gap

The two existing Day 0 broadcasts are written for regulars. Dawn's third audience segment, the GHL new leads from Facebook and Instagram who have never been in, has no Day 0 template. These two fill that, in the same format as the rest of the pack so they can drop straight into `whatsapp-templates.json`.

Both are name-free on purpose. Respond.io display names are unusable for personalisation: single characters, symbols, and one contact saved as "I want to know the location and the prices." A broken merge field goes out worse than no name.

---

## `broadcast_leads_ad`

**Label:** Day 0 broadcast — new leads  
**Region:** Abu Dhabi  
**Length:** 792 / 1024 characters

```
Hello, this is Tara Rose Salon. You reached out to us a while back, so we wanted to tell you about this one directly.

The Wellness Voucher is open until 30 September. It is not money off. You place your credit, we add more on top, and it becomes a plan rather than a one-off appointment. Three tiers, from AED 1,000, and the upper two split into four with Tabby at no extra cost.

All three are here: https://www.tararosesalon.com/en/ae/beauty-voucher/

Available at our Abu Dhabi salons, Mamsha al Saadiyat and Khalifa City A.

If you have not been in yet, your consultation is free and there is no obligation at the end of it. UAE water is hard and it changes what your hair will hold, so we would rather look properly first.

Reply here any time and we will help you choose. Shukran.
```

**Buttons:** `Tell me more` · `Book a consultation`

---

## `broadcast_leads_dubai`

**Label:** Day 0 broadcast — new leads  
**Region:** Dubai  
**Length:** 765 / 1024 characters

```
Hello, this is Tara Rose Salon. You reached out to us a while back, so we wanted to tell you about this one directly.

The Wellness Voucher is open until 30 September. It is not money off. You place your credit, we add more on top, and it is mapped around you from day one. Three tiers, from AED 1,000, and the upper two split into four with Tabby at no extra cost.

All three are here: https://www.tararosesalon.com/en/ae/beauty-voucher/

Available in Dubai. Beauty at Al Quoz; hair at Al Quoz and Motor City.

If you have not been in yet, your consultation is free and there is no obligation at the end of it. UAE water is hard and it changes what your hair will hold, so we would rather look properly first.

Reply here any time and we will help you choose.
```

**Buttons:** `Tell me more` · `Book a consultation`

---

## Notes

- Suppress anyone who also exists in Phorest or Respond. They should get the existing-client `broadcast_ad` or `broadcast_dubai` instead, not this.
- Anyone tagged as purchased drops out immediately.
- Free consultation and the hard water line are both deliberate. For a lead who has never been in, that is the actual offer. The voucher is secondary.
