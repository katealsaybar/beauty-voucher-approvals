# Next session: reschedule the posting calendar, and make the dates a setting

Written 12 Aug 2026, at the end of the session that moved the campaign. Paste this whole file
into a fresh Claude Code session, or open one in `D:\WORK\Claude\claude-cowork-build` and say
*"read `wellness-voucher-approval-pack/docs/CALENDAR-RESCHEDULE-PROMPT.md` and do it"*.

> **STATUS, later on 12 Aug 2026. Jobs 1 and 2 are DONE. Job 3 is not, and it is the whole of
> what is left.**
>
> - **Job 1, one campaign clock** — done. `data/campaign-dates.js` holds `BV_WINDOW` and both
>   pages read it. `schedule.js` takes `OPEN`, `CLOSE_COPY` and its fifteen-day default from it
>   and prints the close rather than spelling it out.
> - **Job 2, the date toggle** — done. Every row carries an anchor, numbers and weekdays in body
>   text are tokens resolved at render, and the control sits in the calendar header using the
>   same classes as the automations clock. It flags a drifted close, a non-Monday opening, a
>   window too short for the plan, and the days with nothing planned in them.
> - **Job 3, replan the six weeks** — NOT done, and deliberately so: it is content work that
>   needs Hanneh and Tara rather than another pass over the data file. On the default window the
>   plan covers **20 of the 45 days** and there are **25 days, 31 August to 24 September, with no
>   plan at all**. The Calendar says so on the page, in the clock row and in the pillar mix panel.
>   Read Job 3 below, then add rows with `w: 2`, `w: 3` and so on and check the Mix panel.
>
> Read `README.md` § *One window, read by both pages, and a posting plan that moves with it*
> before starting. Two titles changed and are recorded there.

---

## What already happened, so you do not redo it

On 12 Aug 2026 the Wellness Voucher campaign was rescheduled. The window now **opens Monday
17 August 2026 and closes Wednesday 30 September 2026**, six weeks rather than three.

Two things were done and are finished. Do not repeat them:

1. **The date swap.** *28 August* became *30 September* in eighteen files: five nurture emails,
   two mapping emails, the eight WhatsApp templates, the landing and terms mockups, `index.html`,
   `pack/decide.js`, the emirate routing spec and the runbook. `data/automations-data.js` is
   GENERATED, so it was rebuilt with `python build/build-previews.py` rather than edited.
2. **The nurture arc was separated from the window.** Five emails cannot carry six weeks: fitted
   across the whole window they land eleven days apart and every urgency line in them is false for
   a month. So the arc is now a **fifteen-day countdown running at the end**, 15 to 30 September.
   Fifteen because that is the only window in which `nurture-4` ("Four days left") is literally
   true, which `automations/schedule.js` computes rather than remembers.

The nurture sends now land: **Tue 15 Sep · Sat 19 Sep · Wed 23 Sep · Sat 26 Sep · Wed 30 Sep.**

Read `README.md` § *Rescheduled to 17 August – 30 September (12 Aug 2026)* before you start. It
records the reasoning and it is the source of truth for what was decided.

---

## What is still broken

`data/calendar-data.js` was deliberately left on the old window rather than half-moved. It is now
the only thing in the pack describing a campaign that is not being run:

- **79 post rows, all dated 7 to 31 August 2026.** Eight of them sit on 28 August alone, the old
  closing day.
- A **"Closing week · 24 to 28 August"** block, including a daily countdown that says the window
  "genuinely closes on 28 August, so the number can be stated flatly".
- `CAL_CAMPAIGN.close` still reads `'2026-08-28'`; `launch` reads `'2026-08-10'`; the `today`
  fallback reads `'2026-08-07'`.
- One row's angle says *"Launch was 10 August, so the honest count is two weeks."*
- `calendar/calendar.js` opens the month grid on a hardcoded `var view = { y: 2026, m: 8 }`.

There is also a **29-day gap with no plan in it**: the window is live from 17 August but Lead
Nurture does not start until 15 September. The social calendar and the ads are what carry that
month. Filling it is the substance of this job, not a side effect of it.

---

## Job 1 — one campaign clock, not two

Right now `automations/schedule.js` holds the campaign dates and `data/calendar-data.js` holds its
own copy. They have already drifted once, which is why this file exists. Fix the cause:

Create **`data/campaign-dates.js`**, loaded by both pages before anything that reads dates, holding
the window and nothing else:

```js
const BV_WINDOW = {
  open:  '2026-08-17',   // the purchase window goes live
  close: '2026-09-30',   // written into the body of five nurture emails
  arc:   15              // days of nurture countdown, ending on close
};
```

Then have `schedule.js` and `calendar-data.js` read from it instead of carrying literals. Keep
`schedule.js`'s existing behaviour intact: the header control, the two modes, the `localStorage`
key `trs-bv-campaign-clock-v2`, the "Four days left" check. It works and it is verified. You are
changing where it gets `OPEN`, `DEFAULT` and `CLOSE_COPY` from, not how it reasons.

---

## Job 2 — the date toggle on the calendar

The calendar should move when the campaign moves, the way the automations page already does. But a
posting plan is not an arc of five emails: most rows are a weekly rhythm and a few are pinned to a
moment. So absolute dates come out and **anchors** go in.

Give every row an anchor instead of a bare `d`:

| Anchor | Means | Use it for |
|---|---|---|
| `{ a: 'open', o: 0 }` | *o* days after the window opens | launch week, the "Opens" beat, prep rows before it |
| `{ a: 'close', o: -4 }` | *o* days before the close (negative) | the closing week, every countdown row, the "Closes" beat |
| `{ a: 'flow', w: 2, n: 1 }` | the *n*th slot of week *w* of the run | the weekly rhythm in the middle, the rows that stretch |

Rules that make it honest, and each of them is the reason a row breaks if you skip it:

1. **A countdown row must be anchored to `close`, never to `flow`.** A post that says "four days
   left" and floats is a post that will one day lie. If a row's `hook`, `cta` or `angle` states a
   number of days, it is anchored to `close` and the number is **derived at render**, not typed.
2. **`flow` rows stretch, they do not multiply.** A longer window means more air between them, not
   silently repeated content. If the window gets long enough that the rhythm thins below the agreed
   cadence, say so on the page rather than inventing rows.
3. **Keep `d` as a computed field**, so `calendar.js`, the agenda, the notes widget anchors and
   `TRS_PIN_TARGETS` keep working unchanged. The pin selectors key off `.dlbl` and the date, so a
   row whose date is computed must still expose the same `d` string by the time `calendar.js`
   indexes `byDay`.
4. **The month grid must open on the month the window opens in**, derived, not the hardcoded
   `{ y: 2026, m: 8 }`.
5. **Notes already pinned to an August date will orphan.** Decide what happens to them and say it
   out loud on the page. Do not silently drop them.

Put the control in the calendar header, matching the automations one in look and wording. Reuse the
existing `.toprow-clock` / `.clockwrap` / `.clockinput` CSS patterns rather than inventing a second
visual language for the same idea.

---

## Job 3 — actually replan the six weeks

This is content work, not a date shift, and it is the part that needs Hanneh and Tara. 79 rows
currently cover 25 days. Six weeks at the agreed cadence is roughly 130 to 140 rows.

The cadence is already agreed and is written at the top of `calendar-data.js`. Hold it:

> Reels 4 to 5/wk · static 3 to 4/wk · Stories daily · TikTok 3 to 5/wk · Facebook 3/wk
> Education 30% · Transformation 25% · Behind the scenes 20% · Identity 15% · Community and
> Conversion 10%. One pillar per post, never blended.

`calendar.js` measures that mix live and flags any pillar more than six points off target, so check
the Mix panel after you write rows rather than trusting the count. Beats and prep rows are excluded
from the mix on purpose; do not "fix" that.

Shape for the six weeks, as a starting proposal rather than a decision:

- **Week 1 (17 to 23 Aug), launch.** Reuse the existing launch-week rows, re-anchored to `open`.
  They were written for a Monday launch and 17 August is a Monday, so most survive intact.
- **Weeks 2 to 5 (24 Aug to 20 Sep), the long middle.** This is the new writing and it is where a
  six-week campaign is won or lost. It cannot be four weeks of "buy now". Education and
  transformation carry it; conversion stays at its 5%.
- **Week 6 (21 to 30 Sep), the close.** Rebuild the existing "closing week" block against
  30 September, anchored to `close`, and align it with the nurture arc: the social countdown and
  `nurture-4` should not disagree about how many days are left on the same morning.

**Every row is a BRIEF, not finished copy.** The hook is a starting point for Hanneh, the caption is
written in Notion, and nothing publishes until it has passed the care standard and been approved.
Keep that contract.

---

## Constraints that are not negotiable

These are already enforced elsewhere in this repo and a brand review will bounce the work without
them. `.claude/rules/client-facing-content.md` is the rule; `trs-brand-guardian` is the doctrine.

- **Run `/brand-review` on every hook, angle and CTA before you call this done.** The rows are
  client-facing content. The specialist personas in this repo are brand-blind by design.
- **Em-dashes are banned everywhere, including in code comments.** Universal, no exemptions.
- **"Discount" is banned in any form, including negated.** The reframe is "not money off".
- **Credit is held against the emirate it was bought in and cannot cross.** Any row stating
  coverage, redemption or which salons says so per emirate, or does not say it at all.
- **Gifting the whole voucher is not carried by the Terms.** Gifting rows are written to the gift
  card only. Flagged: Tara can reopen this by amending term 7.
- **Four rows already carry a `flag`.** They must not be drafted until their decision lands.
  Preserve the flags; do not quietly resolve them.
- British English throughout.

---

## What NOT to touch

- `data/automations-data.js` — generated. Edit `emails/*.html` or `data/whatsapp-templates.json`,
  then run `python build/build-previews.py`.
- `automations/schedule.js`'s reasoning. Change only where it reads its dates from.
- The nurture arc dates. They are set, verified and the emails are written against them.
- The Supabase sign-off block at the foot of `calendar.js`. `ANCHOR` must stay word-for-word in step
  with Decision 16 in `index.html`, or an approval lands on nothing.

---

## Verify before you call it done

```bash
python build/build-previews.py
```

Then serve the pack and check, do not assume:

- `grep -rn "28 August\|2026-08-28\|10 August" data/calendar-data.js` returns nothing.
- The Calendar page opens on **September 2026** by default, with **Opens** on 17 Aug and
  **Closes** on 30 Sep tagged in the grid.
- The Mix panel shows no pillar more than six points off target.
- The countdown rows in the final week agree with the nurture arc dates above.
- No console errors on `calendar/calendar.html`, `automations/automations.html` and `index.html`.
- Moving the close in the new control moves the closing week with it, and does NOT move launch week.

Then update `README.md`: the § *Rescheduled to 17 August – 30 September* section ends by saying the
calendar was left on the old window. That paragraph becomes untrue the moment this lands, so
rewrite it rather than appending to it.
