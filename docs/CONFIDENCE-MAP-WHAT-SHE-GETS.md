# After she submits the Confidence Map: what she receives, and what we ask her to do next

**Status:** for Kate and Dawn. Written 18 August off Dawn's WhatsApp asks: *"can we add a CTA here after
confidence map is taken, book your consultation?"* and *"those who fill it out should be sent a copy of
their answers."*

**Why this phase was empty:** she answered six stages, the page said "we will send it", and then nothing
in the pack described what actually arrives or what she does next. The quiz was a data capture with no
return leg.

---

## 1. What lands in her inbox

There are two different things people mean by "her Confidence Map", and the pack quietly conflates them:

| | **Her answers** | **Her map** |
|---|---|---|
| What it is | What she ticked, in her words | What we read from it: treatments, home care, the visit rhythm |
| Whose it is | Hers | Ours |
| Exists today | No | Yes, `emails/mapping-1-journal.html` |

Dawn asked for the first one. The pack only built the second one.

**Recommendation: one email, both, in that order.** Her answers first, verbatim, then what we read from
them. Leading with her own words is what earns the read, and it proves we listened before we
recommended. Leading with our interpretation makes it feel like a quote.

---

## 2. Who sends it, and this is the part that has changed

With **Make.com on hold** and LID wiring the answers to `info@tararosesalon.com`, nothing writes
`map:completed` into GHL. So the GHL workflow that would have sent `mapping-1-journal` **does not
fire**. If we do nothing, she gets nothing.

**Recommendation: Gravity Forms 21 sends it, on its own.** Form 21 has a user notification built in. It
goes to the email address she just typed, it fires on submit, and it cannot fail on an integration that
does not exist yet. One notification to configure, no Make, no GHL.

**The consequence to accept:** a Gravity Forms notification is plainer than the branded template. It can
carry the logo and the voice, but it will not look like `mapping-1-journal`. That is the correct
trade: **an email that arrives beats a beautiful one that waits on a build.** When Make comes back,
`mapping-1-journal` follows as the second touch and the GF email stays as the receipt.

**Timing: immediately.** She has just spent six stages on it. A delay of hours reads as an autoresponder;
a delay of days reads as nobody looked.

---

## 3. The CTA: one, not two

The mockup currently shows two pills, "Book your consultation" and "Cannot come in yet? Book a Zoom".

**Recommendation: keep one button, demote Zoom to a text link underneath.**

- Hair has to be **seen and felt**. A consultation over video is a fallback, and offering it as an equal
  button invites the easier click from someone who could have come in.
- Two buttons of equal weight split the action and reduce both. One clear ask converts better.
- Zoom still needs to exist, because a large share of this campaign's audience has **never been in** and
  may be choosing a salon, not booking one.

**Where the button points.** The emails already deep-link to per-branch WhatsApp numbers with `wa.me/`.
Use the same pattern, prefilled: *"I have finished my Confidence Map and I would like to book my
consultation."*

Why WhatsApp rather than a booking system:
- **Zero build.** The numbers are live in respond.io today.
- It lands with a human who can open `info@tararosesalon.com` and read her answers before replying,
  which is exactly what the Confidence Map is for.
- It matches the "reply and we will help" pattern already going out in the blast.

If Phorest has a bookable free-consultation service, that is better still, because it lands in the diary
without a person in the middle. **Not GHL calendar:** stylists have no GHL access, so a booking that
lives only in GHL is invisible to the people who have to honour it.

---

## 4. One thing to fix while this is open

`emails/welcome-3-confidence-mapping.html` says the Home Ritual Kit **"cannot be released until we have
mapped you"**. That was already a gate presented as a favour. Now that the kit is an **allowance she
partly pays for**, it reads worse: we are withholding something she is contributing to until she fills
in a form.

**Recommendation:** change it from a condition to a reason. The mapping is what makes the kit hers
rather than generic, so the honest line is that we would rather map her first than hand her a standard
bag. Same outcome, no hostage.

---

## 5. What I need decided

| # | Decision | Owner |
|---|---|---|
| 1 | One email with **her answers then her map**, sent by **Gravity Forms 21 on submit** | Kate, with Dawn |
| 2 | **One CTA**, "Book your consultation", Zoom as a text link | Kate |
| 3 | Button points at the **per-branch `wa.me` number**, unless Phorest can take a free-consultation booking | Dawn to confirm which number is which branch |
| 4 | Reword the Home Ritual Kit gate in `welcome-3` | Kate |
