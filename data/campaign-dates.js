// The campaign window. One file, read by both pages, so the dates cannot drift apart again.
//
// Written 12 Aug 2026. Before this file, automations/schedule.js held the window and
// data/calendar-data.js held its own copy of it. They drifted the first time the campaign
// moved: the automations map went to 30 September and the calendar stayed on 28 August, and
// for a day the pack described two different campaigns. This is the fix for the cause.
//
// Load it BEFORE anything that reads a date:
//   <script src="../data/campaign-dates.js"></script>
//
// What each date is, because the three are not interchangeable:
//
//   open   The purchase window goes live. The social plan hangs off this: launch week is
//          measured forward from it and the weekly rhythm runs from the week after.
//
//   close  The last day to buy. This one is not a preference. "30 September" is written into
//          the body of all five nurture emails and nurture-5 says the window closes tonight,
//          so moving it means rewriting copy in five files. Both pages say so out loud when
//          it is moved rather than letting it move quietly.
//
//   arc    How many days of nurture countdown run into the close. Fifteen, because that is
//          the only window in which nurture-4 ("Four days left") is literally true, which
//          schedule.js computes rather than remembers. It is a length, not a date.
//
// The two pages each keep their own override in localStorage, and that is deliberate rather
// than an oversight. The automations clock sets the NURTURE ARC, which is a fifteen-day
// countdown at the end of the window. The calendar clock sets the WINDOW ITSELF. They are two
// different spans and a reviewer moving one is not asking to move the other. What they share
// is this file: the default both of them reset to, and the close that both of them measure
// their copy against.

/* eslint-disable */

const BV_WINDOW = {
  open:  '2026-08-17',   // the purchase window goes live
  close: '2026-09-30',   // written into the body of five nurture emails
  arc:   15              // days of nurture countdown, ending on close
};
