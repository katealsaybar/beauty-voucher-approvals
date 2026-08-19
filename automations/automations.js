const ICON={
  trigger:'<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>',
  email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  wa:'<path d="M4 20l1.5-4A8 8 0 1 1 12 20a8 8 0 0 1-3.5-.8z"/>',
  wait:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  iff:'<path d="M6 3v6a3 3 0 0 0 3 3h6"/><circle cx="6" cy="4" r="2"/><circle cx="18" cy="12" r="2"/><path d="M18 14v3a3 3 0 0 1-3 3H9"/><circle cx="6" cy="20" r="2"/>',
  tag:'<path d="M20 12 12 4H5v7l8 8z"/><circle cx="8" cy="8" r="1.4"/>',
  task:'<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',
  goal:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>'
};
const COLOR={trigger:'#3E7A5E',email:'#3B6E8F',wa:'#25A55F',wait:'#B4823A',iff:'#8A6D3B',tag:'#A05C6E',task:'#46707C',goal:'#6E5BA0'};
const TYPELABEL={trigger:'Trigger',email:'Email',wa:'WhatsApp',wait:'Wait',iff:'If / Else',tag:'Add tag',task:'Task',goal:'Goal'};
const OPEN_ICON='<svg viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>';

/* Every step in the three workflows.
   emailKey -> a key in EMAILS (built from a real file in emails/)
   waKeys   -> one or more keys in WA. More than one renders the region switch.
   A step with BOTH gets two preview cards, because it really does send both. */
const WF=[
 /* ===== the blast, added 17 Aug =====
    This lane did not exist and the asset did. emails/beauty-voucher-email-blast.html sat in
    the folder for days referenced by nothing, which meant the workflow map could not answer
    the only question that matters about a blast: who receives it. It is the one send in this
    campaign that goes to a list built by hand rather than to a contact a workflow is already
    holding, so it is the one send where "who is in this" cannot be inferred from a tag. */
 {id:'blast',name:'Announcement blast',short:'Blast',sub:'awareness · runs from the day the window opens',
  audience:{
    to:'<b>One list, both channels.</b> Decided by Kate 19 August: email and WhatsApp go to <b>Belle&rsquo;s Phorest list and nothing else</b>. The 18 August call had split them, email to the whole database and WhatsApp to the segment, which put the top spender exclusion on one channel only and sent the offer to the excluded women by email anyway. The list is built by hand from Phorest, split Abu Dhabi and Dubai, and imported to GHL under <code>wellness:target</code>.',
    not:'<code>voucher:paid</code> &middot; <code>suppress:campaign</code> (DND and difficult clients) &middot; <code>+973</code> Bahrain numbers &middot; anyone already inside the nurture arc.',
    src:'Phorest, exported by Belle, because Phorest is the only system holding visit history, service history and spend. David imports and de-duplicates on <b>phone first</b>. Size is unknown until the export lands and the send cannot be sized or dripped before then. Costs, from GHL actuals: <b>AED 0.004 per email</b> and <b>AED 0.17 per WhatsApp marketing message</b>, so WhatsApp is roughly 44 times the cost per message and it is the only side worth throttling on spend.',
    warn:'The Respond CSV carries <b>no tags at all</b>, so no GHL filter can see whether she has already bought. That list has to be de-duplicated against the paid list <b>by hand, on the day of the send</b>. This is the reason the blast email no longer carries an "already placed your credit?" paragraph: the exclusion belongs here, as a step, not in the copy as an apology.'},
  nodes:[
   {t:'trigger',title:'Segment built by hand',sub:'three lists, not one database',tip:{ch:'Trigger',sub:'Three audiences, one send',
     note:'Not a form and not a tag: someone assembles this. Respond holds the long-term client data (2+ years) and only exports as a CSV of email addresses. GHL holds the newer contacts, roughly the last twelve months, plus the never-purchased leads from Facebook and Instagram. Most contacts are already synced into GHL per Bell, but the sync is <b>not real-time</b>, so the two sources overlap and the overlap is invisible until they are compared. Using Respond itself for the send was considered and dropped on cost; a Make.com scenario to sync Respond into GHL was discussed and is <b>not</b> confirmed as the path. Until it is, this step is a person with two exports and a spreadsheet.'}},
   {t:'iff',title:'If/Else · Already bought?',sub:'the gate that replaces the apology',branches:[{c:'stop',k:'exit',l:'voucher:paid → exit'},{c:'stop',k:'exit',l:'self:availed → exit, task'},{c:'',k:'carry',l:'no tag → continue'}],
    tip:{ch:'If / Else',sub:'Suppression, before anything sends',
     note:'This is the step the campaign was missing. Most clients are expected to buy <b>in salon</b>, tapping a card on the POS machine, and Tabby is <b>manual</b>: a coordinator or someone on Bell’s team has to tag her in GHL after payment, within the day. So <code>voucher:paid</code> is same-day at best, never real-time, and this gate is only as good as the tagging. Two consequences worth saying out loud. <b>One:</b> a woman who paid at the till this morning can still be in this afternoon’s send. <b>Two:</b> the Respond CSV has no tags, so this If/Else cannot see it at all and the de-duplication has to happen before import. The training document for the tagging is still an open action on David and Alissa.'}},
   {t:'iff',title:'If/Else · Consent + filters',sub:'Bahrain / suppress / consent',branches:[{c:'stop',k:'exit',l:'+973 or suppress → exit'},{c:'go',k:'carry',l:'consent → email + WhatsApp'},{c:'',k:'carry',l:'no consent → email only'}],
    tip:{ch:'If / Else',note:'Same PDPL gate as the nurture arc, and it has to run here too rather than only there, because this send reaches contacts the arc has never held. Bahrain numbers never enter: Bahrain has only just opened and its own voucher is a separate build. Consent decides the channel, not preference.'}},
   {t:'tag',title:'Add tag: bv:blast + source',sub:'respond / ghl-client / ghl-lead',
    tip:{ch:'Add tag',note:'One tag for the campaign and one for which of the three lists she came from. This is the only way the sold-voucher count can later be split by source, which is the question leadership will ask first. Without it, every purchase in the window looks like it came from nowhere.'}},
   {t:'email',title:'Email · the announcement',sub:'"You look after everyone else first"',emailKey:'blast',
    tip:{ch:'Email',sub:'The awareness blast',
     note:'Newsletter-style rather than plain text, with the three tiers, the Self-Care Bonus, the gift-card angle and the Confidence Promise, closing on <b>Reserve Your Voucher</b> into the landing page. Tara Rose has <b>never sent a marketing email before</b>, so this is the first thing this domain has ever sent at volume: it goes out on a drip across the window, not in one push, or the sending reputation is spent on the first send. Three image slots are still empty and waiting on the social media manager’s assets. The "already placed your credit?" block was removed on 17 Aug and its job moved to the suppression step above.'}},
   {t:'wait',title:'Drip · spread across the window',sub:'never the whole list at once',
    tip:{ch:'Wait',note:'Not a delay before a next message, a throttle on this one. Batch the list and let it go out gradually across the window rather than in a single push. Two separate reasons, and both of them bite on a first-ever send: email reputation on a domain with no sending history, and the fact that every reply lands on a human at the salon. The batch size cannot be set until the Phorest report gives the list size.'}},
   {t:'wa',title:'WhatsApp · voucher link',sub:'throttled · one message, both emirates',waKeys:['broadcast'],
    tip:{ch:'WhatsApp',sub:'The blast on WhatsApp',
     note:'Direct link to the wellness voucher page. Tara Rose’s WhatsApp has a strong sender reputation and a large volume sent at once is the fastest way to lose it, so this is throttled the same way the email is. <b>The copy exists as of 18 Aug</b> and it is <b>one message for both emirates</b>, because drip messaging on a list this size is the expensive part. It carries no branch names, so the emirate split happens on the landing page picker rather than in the message. It is the <b>same template as the nurture Day 0</b>, which means the two nodes are <b>one send, not two</b>: anyone who got it here must be suppressed from the Day 0 below, or she receives the same broadcast twice inside 24 hours and Meta drops the second one. A new template also means Meta approval before it can send at all.'}},
   {t:'iff',title:'If/Else · Did she come through?',sub:'what turns a name into a lead',branches:[{c:'go',k:'carry',l:'clicked or replied → bv:lead'},{c:'',k:'hold',l:'nothing → stays on the list'}],
    tip:{ch:'If / Else',note:'A click on the landing page, or a reply on WhatsApp, is what promotes her out of the blast list and into the nurture arc. Everyone else stays where they are and receives the arc anyway when it opens, because the arc is broadcast-fed. Drawn as a branch rather than left implied, because it is the join between the two lanes and it was the thing nobody could point to on the old map.'}},
   {t:'goal',title:'Hands off to Lead Nurture',sub:'Day 0 of the 15-day arc',
    tip:{ch:'Goal / handover',note:'The blast is awareness; the arc is the close. The arc opens on its own date and is fed by this same segment, which is why its trigger reads <em>broadcast segment</em> and not <em>reserve form</em>. Note the gap the clock in the header shows: the window opens well before the first nurture send, and this lane is what occupies that gap.'}},
   {t:'goal',title:'Exit on voucher:paid',sub:'→ Welcome Pack',
    tip:{ch:'Goal / exit',note:'Same universal exit as everywhere else. The moment the tag lands, however it lands, she stops being blasted and starts being welcomed.'}}
 ]},
 {id:'nurture',name:'Lead Nurture (A / B)',short:'Lead Nurture',sub:'pre-purchase · stops when she pays',
  audience:{
    to:'The same three blast segments, consented, who have <b>not</b> paid. Broadcast-fed, decided 17 Aug.',
    not:'<code>voucher:paid</code> (universal goal exit) &middot; <code>+973</code> &middot; <code>suppress:campaign</code> &middot; reserve-form submitters, who are handled by hand instead.',
    src:'The broadcast segment, not a form. Emirate is read from the Phorest stamp on the segment, because a broadcast cannot carry a hidden form field the way a form can.',
    warn:'A woman who fills in the reserve form does <b>not</b> belong in this arc: all five emails ask her to reserve or choose a tier, which is copy for someone who has done neither. Form submitters get a contact-centre task and the right Stripe link.'},
  nodes:[
   /* The trigger and the Day 0 title disagree, and the emails settle it: nurture1 closes on
      "Reserve my tier" and nurture3 on "Choose my tier", which is copy written for a woman who
      has done nothing yet. That is a broadcast audience, not a form submitter. Left drawn as
      it is, with the contradiction named, because it is Tara's call and not a drafting fix;
      see Part 1.1 of EMIRATE-ROUTING-BUILD-SPEC.md. */
   {t:'trigger',title:'Broadcast segment enters',sub:'settled 17 Aug: not the reserve form',tip:{ch:'Trigger',sub:'Broadcast-fed',flag:'SETTLED 17 AUG',note:'This was an open question for a week and it is now answered: <b>broadcast-fed</b>. It read "reserve form submitted" while Day 0 was titled "Initial broadcast" and all five emails asked her to reserve or choose a tier, which is copy for a woman who has done neither. Two populations had been merged into one trigger. The copy settled it. <b>What follows from the decision:</b> the segment is the one the blast lane builds, so the emirate has to come from the Phorest stamp on that segment rather than a hidden form field, because a broadcast cannot carry one. <b>Reserve-form leads are out of this arc entirely</b>: they already chose a tier, so they get a contact-centre task and the correct Stripe link, not eight days of being asked to choose. See Part 1.1 of EMIRATE-ROUTING-BUILD-SPEC.md.'}},
   {t:'tag',title:'Add tag: bv:lead',sub:'+ campaign:beauty-voucher-v2',tip:{ch:'Add tag',note:'Marks her as a campaign lead before payment. Audience is segmented + consented UAE contacts only, never the whole synced database.'}},
   {t:'iff',title:'If/Else · Consent + filters',sub:'Bahrain / suppress / consent',branches:[{c:'stop',k:'exit',l:'+973 or suppress → exit'},{c:'go',k:'carry',l:'consent → email + WhatsApp'},{c:'',k:'carry',l:'no consent → email only'}],tip:{ch:'If / Else',note:'PDPL gate. Bahrain numbers and suppress:campaign (DND, difficult clients) never enter. Consent decides the channel: this is law, not preference.'}},
   /* THE MISSING NODE. Deliberately below the consent gate, not above it: asking a woman which
      emirate she is in is still a message, so consent has to decide whether we may ask at all. */
   {t:'iff',title:'If/Else · Emirate known?',sub:'picks the regional variant',branches:[{c:'go',k:'skip',l:'abu-dhabi → AD set'},{c:'go',k:'skip',l:'dubai → Dubai set'},{c:'',k:'carry',l:'unknown → neutral + ask'}],tip:{ch:'If / Else',note:'TO BUILD. Reads the emirate contact FIELD, not the tag, because the emails need the same value to render their coverage line and GHL merge fields cannot read tags. Everything below inherits the branch: the Day 0 and Day 2 pills still show both variants so you can read them side by side, but this is what picks one at send. Nothing writes emirate yet: that is the website picker, the quiz Locale field, the Phorest stamp on the broadcast segment, or reception.'}},
   {t:'wa',title:'WhatsApp · Which emirate?',sub:'unknown branch only · not built yet',tip:{ch:'WhatsApp',sub:'The emirate ask',note:'Unknown-emirate branch only. Two buttons, Abu Dhabi and Dubai, which write the field and move her onto a regional branch from Day 2 onward. She still gets the neutral Day 0 straight away; the arc never waits for an answer. New template, so Meta has to approve it before it can send at all, and that is the single item most likely to miss Monday. Fallback: hold this cohort out of the Day 0 WhatsApp and send the neutral email only, whose WhatsApp CTA opens a chat, and once she writes first, the 24-hour service window lets us reply with no template.'}},
   {t:'email',title:'Email · Day 0',sub:'"You never skip your hair"',emailKey:'nurture1',tip:{ch:'Email',sub:'You never skip your hair',note:'Opening of the locked close-out arc. She never skips her hair; the voucher makes the visits she already makes worth more, with a Self-Care Bonus pointed at the part she keeps putting off. Not money off, a plan. Emirate-neutral as written, so it needs no variant.'}},
   {t:'iff',title:'If/Else · Already had the blast?',sub:'stops the same message twice',branches:[{c:'stop',k:'exit',l:'<code>bv:blast</code> → skip the WhatsApp'},{c:'',k:'carry',l:'never blasted → send it'}],tip:{ch:'If/Else',sub:'One send, not two',note:'Added 18 Aug, when the blast and this step became the <b>same template</b>. Meta allows one marketing message per contact per 24 hours, and if she already had this exact broadcast from the blast lane, the second copy is not delivered, it is just paid for. The email below is unaffected: email has no such cap and the Day 0 email is a different piece of copy.'}},
   {t:'wa',title:'WhatsApp · Day 0',sub:'Initial broadcast · one message, both emirates',waKeys:['broadcast'],tip:{ch:'WhatsApp',sub:'Initial broadcast',note:'One message for both emirates (Kate, 18 Aug). The campaign announcement, with the three ways in (reserve / gift / reply). Two regional variants, chosen by the emirate If/Else above: the buttons carry salon names, and Meta fixes button labels at template level, so WhatsApp has to stay split where email does not. The Abu Dhabi long version is over Meta\'s character limit; see the shortened one.'}},
   {t:'wait',title:'Wait · 2 days',sub:'skip if paid',tip:{ch:'Wait',note:'Fixed-date wait for this window (skip-if-passed). Rebuild as relative delay post-campaign.'}},
   {t:'email',title:'Email · Day 2',sub:'"The part you keep putting off"',emailKey:'nurture2',tip:{ch:'Email',sub:'The part of you that you keep putting off',note:'The emotional middle of the arc: the treatment she always means to do for herself and never books. The Self-Care Bonus is built for exactly that.'}},
   {t:'wa',title:'WhatsApp · Day 2',sub:'48–72h reminder · picked above',waKeys:['reminder_ad','reminder_dubai'],tip:{ch:'WhatsApp',sub:'48–72h reminder',note:'Gentle close-date reminder, never "pay now." Two regional variants, chosen by the same emirate If/Else. A contact who answered the emirate ask joins her regional branch here, at Day 2. Day 0 has already gone out neutral by then, which is the point.'}},
   {t:'wait',title:'Wait · to Day 4',sub:'skip if paid',tip:{ch:'Wait',note:'Holds until Day 4 of the arc.'}},
   {t:'email',title:'Email · Day 4',sub:'"The three tiers plainly"',emailKey:'nurture3',tip:{ch:'Email',sub:'The three tiers plainly',flag:'FIXED 17 AUG',flagOk:true,note:'Dip Your Toes 1,000 → 1,150 · Season of You 2,500 → 3,000 (+500 bonus) · All-In VIP Year 4,500 → 5,400 (+900 bonus). Tabby on the upper two, same credit. Spending cap, not unlimited. FIXED 17 AUG. Previously promised "any service at any of our four salons", which neither voucher can deliver. Now reads "at the salons named on your voucher", the neutral line, so the asset stays single rather than being split per region. The landing page was checked at the same time and does not carry that sentence: the only "four salons" left on it is the eleven-years credential, which is a fact about the business and not a claim about where this voucher spends.'}},
   {t:'wait',title:'Wait · to Day 6',sub:'skip if paid',tip:{ch:'Wait',note:'Holds until Day 6.'}},
   {t:'email',title:'Email · Day 6',sub:'"Four days left"',emailKey:'nurture4',tip:{ch:'Email',sub:'Four days left',note:'Real scarcity only, the close date. No fake countdowns.'}},
   {t:'wait',title:'Wait · to Day 8',sub:'skip if paid',tip:{ch:'Wait',note:'Holds until the final day.'}},
   {t:'email',title:'Email · Day 8',sub:'"Final day"',emailKey:'nurture5',tip:{ch:'Email',sub:'Final day',note:'Final day. The window closes tonight, 30 September. Credit placed as a plan for the year ahead.'}},
   {t:'iff',title:'If/Else · Client button',sub:"Belle's 3-way router",branches:[{c:'go',k:'carry',l:'"Tell me more" → intent:warm'},{c:'',k:'carry',l:'no button → continue'},{c:'stop',k:'exit',l:'"I already have mine" → self:availed'}],tip:{ch:'If / Else',note:'Each message carries tappable buttons. "Tell me more" tags intent:warm and escalates. "I already have mine" tags self:availed, stops the nurture and flags the contact centre to confirm the payment. No button pressed = the arc runs on. self:availed never auto-marks her paid. Labels are kept inside Meta\'s 25-character button cap.'}},
   {t:'goal',title:'Goal: Tag added voucher:paid',sub:'exit + start Welcome Pack',tip:{ch:'Goal / exit',note:'Universal exit. The moment voucher:paid lands (Stripe bridge, Tabby manual tag, or reception at the till), the whole nurture ends for her and the Welcome Pack begins.'}}
 ]},
 {id:'welcome',name:'Welcome Pack',short:'Welcome Pack',sub:'post-purchase · starts on voucher:paid',
  audience:{
    to:'Anyone carrying <code>voucher:paid</code>, whichever of the three ways applied it: Stripe online, a card tapped on the POS machine in salon, or Tabby.',
    not:'<code>voucher:redeemed</code> ends everything immediately. Never chase a woman who already booked.',
    src:'The Stripe bridge applies the tag automatically. In salon and on Tabby it is applied <b>by hand</b> by the coordinators and Bell&rsquo;s team, same day.',
    warn:'Bell and the salon coordinators expect <b>most</b> purchases to happen in salon, so most Welcome Packs will start from a manual tag. Every wait below counts from the moment someone remembered to tag her, not from when she paid. Nine Stripe accounts, not twelve: Khalifa City and Saadiyat share one, Motor City and Al Quoz have their own.'},
  nodes:[
   {t:'trigger',title:'Trigger: Tag added voucher:paid',sub:'any tier, any method',
    tip:{ch:'Trigger',
     note:'Fires the moment <code>voucher:paid</code> is applied, identically whichever of the three ways applied it.',
     rows:[['Stripe','the Make bridge, last module'],['Tabby','a manual tag &mdash; never reaches Make'],['At the till','reception, by hand']],
     make:'2-6',
     long:'Fires the moment voucher:paid is applied, identical whether from the Stripe→Make bridge, a manual Tabby tag, or reception at the till. The three are not equivalent in what they bring with them: the Stripe bridge writes the emirate, the tier and the credit onto the contact BEFORE it applies this tag, and the other two do not, which is why a hand-tagged contact reaches the next step with nothing for it to read.'}},
   /* Payment is the only emirate signal we can rely on. +971 covers the whole country, so the
      phone number tells you nothing; the Stripe link tells you everything. Note what it does
      NOT tell you: Saadiyat has no working Stripe, so its clients pay through the Khalifa City
      link and a KCA payment means Abu Dhabi, not KCA. Emirate reliable, branch not. */
   {t:'iff',title:'If/Else · Emirate from payment',sub:'the Stripe link is the proof',branches:[{c:'go',k:'skip',l:'agrees with field → continue'},{c:'',k:'skip',l:'empty → fill from the link'},{c:'stop',k:'carry',l:'disagrees → task, hold sends'}],
    tip:{ch:'If / Else',flag:'TO BUILD',
     note:'Nine Stripe links, three per paying branch, so the link she paid through names the emirate with certainty. <code>+971</code> covers the whole country; her phone number does not.',
     rows:[['T&amp;C term 3','the credit is held to the emirate it was bought in'],['So','the payment wins on emirate, every time'],['Empty field','a clean fill, holds nothing']],
     code:'&#8230;5wI01/02/03  &#8594; Abu Dhabi\n&#8230;eEo13/14/15  &#8594; Al Quoz     (Dubai)\n&#8230;0VO1E/F/G    &#8594; Motor City  (Dubai)',
     make:'2-2',
     long:'TO BUILD. Nine Stripe links, three per paying branch, so the link she paid through names the emirate with certainty: …5wI01/02/03 is Abu Dhabi, …eEo13/14/15 is Al Quoz, …0VO1E/F/G is Motor City. Under T&C term 3 the credit is held to the emirate it was bought in, so the payment wins on emirate every time and a disagreement is a refund conversation, not a silent re-tag. Filling an empty field from the payment is a clean fill and holds nothing.'}},
   {t:'task',title:'Task · Emirate mismatch',sub:'conflict branch only · call within 2h',tip:{ch:'Task',note:'Conflict branch only. She was shown one voucher and holds another, so a human calls before her first redemption, which is exactly the window term 3 invites her to use. Both regional sends are held until this closes. How hard the call is depends on emirate_source: if she picked the emirate herself on the website, escalate, because she was sold against her own choice. If we inferred it from her Phorest history, it is just a confirmation. Not a conflict at all: a Saadiyat client paying through the Khalifa City link, since the emirate agrees.'}},
   {t:'email',title:'Email 1 · immediately',sub:'Confirmation + Confidence Promise',emailKey:'welcome1',tip:{ch:'Email',sub:'Your voucher is confirmed',note:'Carries the Confidence Promise verbatim, once, plus the branch question so her kit and priority slots are pointed at the right salon. Already parametrised rather than split: it uses {{branch_a_name}} and {{branch_b_name}}, and the comment at line 43 asks for a "GHL conditional on the voucher region". That region has never existed as a field, so today these render BLANK: a confirmation with two empty buttons, and no error anywhere. This is the model for every other email: parametrise, do not duplicate.'}},
   {t:'wa',title:'WhatsApp · same minute',sub:'Confirmation + branch choice · Abu Dhabi / Dubai',
    waKeys:['welcome_confirm_ad','welcome_confirm_dubai'],
    branches:[{c:'go',k:'carry',l:'branch tapped → tag branch:[x]'},{c:'',k:'carry',l:'"Help me choose" → CC task'},{c:'stop',k:'carry',l:'no reply → ask again in Email 2'}],
    tip:{ch:'WhatsApp',sub:'Payment confirmation + branch choice',
      note:'Sent in the same minute as Email 1, so the confirmation reaches her wherever she looks first. Each template offers only the two salons on its own voucher, whereas the old version listed all four, two of which a Dubai client cannot use. Corrected 7 Aug: the templates are right, but nothing chose between them, so the claim held for the template and not for the workflow. The If/Else after the trigger is what picks one. Meta fixes button labels at template level and they cannot take a merge field, which is why this stays two templates while the emails stay one. The third button is the guide: "Help me choose" raises a contact-centre task instead of leaving her stuck.'}},
   /* The 8 Pillars Journal was built, shipped and then delivered by nothing at all: it is
      promised in the All-In VIP Year inclusions and appears in none of the fourteen emails
      and none of the workflow. This pair is where it belongs, a few hours after purchase,
      on its own rather than as a third message in the confirmation minute.

      READ THE FLAG BEFORE BUILDING IT. The branch reads tier:vip, and tier:[x] is written
      onto the contact by the Stripe bridge ONLY. In salon and on Tabby the tag is applied by
      hand and the tier is not, and Bell expects MOST purchases to happen in salon. Built as
      it stands, most VIP buyers fall down the else branch and never receive it, silently.
      The same gap already costs the Self-Care Bonus paragraph in Email 2 and the timing of
      the expiry touch, so the fix is one fix for three problems. */
   {t:'iff',title:'If/Else · All-In VIP Year?',sub:'the only tier-only asset in the pack',branches:[{c:'go',k:'carry',l:'tier:vip → send the journal'},{c:'stop',k:'skip',l:'any other tier → skip, silently'}],tip:{ch:'If / Else',flag:'TO BUILD',
     note:'Reads <code>tier:vip</code>. Nothing else in the Welcome Pack is tier-only, so this branch is the first thing that makes VIP feel different at the moment she pays.',
     rows:[['Reads','<code>tier:vip</code>'],['Written by','the Stripe bridge, last module'],['NOT written by','a manual tag at the till, or Tabby'],['Effect if missing','she falls to the else branch and hears nothing']],
     long:'The filter itself is safe: tier:[x] carries two different meanings in this build, the voucher tier from payment (dip / season / vip) and the home care tier from the Confidence Mapping (protect / maintain / full), but the two value sets do not overlap, so tier:vip is unambiguous. The problem is not ambiguity, it is absence. A contact tagged by hand at the till reaches this branch with no tier at all and takes the else path without an error, which is the worst way for it to fail: nothing to see in the logs, and the client simply never gets the thing she paid AED 4,500 for. Either the coordinators apply tier:[x] at the same moment they apply voucher:paid, or this branch reads something else that in-salon purchases actually carry.'}},
   {t:'email',title:'Email 1b · your 8 Pillars Journal',sub:'VIP only · +3 hours',flag:'TO WRITE',tip:{ch:'Email',sub:'Your 8 Pillars Journal',flag:'TO WRITE',
     note:'Does not exist yet. Fourteen emails are built and none of them mention the journal. Carries the link to <code>eight-pillars/eight-pillars.html</code>, which is a client-facing page and not a pack page.',
     rows:[['Sends to','<code>tier:vip</code> only'],['Timing','+3 hours after Email 1'],['Carries','the journal link, nothing else to do'],['Not gated on','the Confidence Mapping']],
     long:'Deliberately not gated on the mapping. The Home Ritual Kit is withheld until she is mapped and that is real policy, but the journal is not part of the kit: the VIP inclusions list it separately, beside the Reset Journal. Gating it would mean the highest-paying tier waits on a quiz for the one asset that is hers alone. Three hours rather than the same minute, so it does not arrive as a third message alongside the confirmation email and the WhatsApp. The page saves her answers to her own device and prints to PDF; nothing comes back to us, so there is no capture step to build behind it.'}},
   {t:'wait',title:'Wait · 1–2 days',sub:'',tip:{ch:'Wait',note:'Short pause before the value email.'}},
   {t:'email',title:'Email 2 · what your credit covers',sub:'the two exclusions',emailKey:'welcome2',tip:{ch:'Email',sub:'What your credit covers',flag:'FIXED 17 AUG',flagOk:true,note:'How the credit spends: any service up to the credit value, the two exclusions (home care, new extensions). The Self-Care Bonus paragraph shows only for Season of You / VIP. FIXED 17 AUG, in two places, and this was the worst of the thirteen: the body and the hidden preheader both promised "any service at any of our four salons". Both now read "at the salons named on your voucher", the neutral line, so the asset stays single rather than being split per region. The preheader mattered most: it is what she reads in her inbox list, next to the subject, before she opens anything.'}},
   {t:'wait',title:'Wait · to Day 5–7',sub:'',tip:{ch:'Wait',note:'Holds before the mapping push.'}},
   {t:'iff',title:'If/Else · booked or mapped?',sub:'suppress Email 3 if so',branches:[{c:'go',k:'skip',l:'booked/redeemed → skip'},{c:'',k:'carry',l:'not yet → send Email 3'}],tip:{ch:'If / Else',note:'Email 3 only sends if there is no map:booked, no voucher:redeemed, and no booking on record.'}},
   {t:'email',title:'Email 3 · Confidence Mapping push',sub:'only if not booked',emailKey:'welcome3',tip:{ch:'Email',sub:'Map your plan',note:'Invites her to do the free Confidence Mapping so her Home Ritual Kit can be personalised and released. The kit cannot be issued until the mapping is done.'}},
   {t:'goal',title:'On voucher:redeemed → Email 4',sub:'rebooking + referral',tip:{ch:'Goal / trigger',note:'Fires on her first redemption visit. Email 4 sets the rebooking rhythm and the refer-a-friend reward. Until the Phorest→GHL webhook exists, reception applies voucher:redeemed at checkout.'}},
   {t:'email',title:'Expiry touch · 30 days left',sub:'email + WhatsApp, both',emailKey:'expiry',waKeys:['expiry_touch'],tip:{ch:'Email + WhatsApp',sub:'30 days left on her credit',note:'Sent when her tier has 30 days left to run (so at 5, 8 or 11 months by tier), and only if the credit is not yet redeemed. Both channels, because this is where unredeemed-credit complaints live, and it must survive the campaign closing.'}},
   {t:'goal',title:'Hard exit: voucher:redeemed',sub:'stop everything',tip:{ch:'Goal / exit',note:'Redemption stops all welcome and nurture messaging immediately. Never chase a woman who already booked.'}}
 ]},
 {id:'mapping',name:'Confidence Mapping',short:'Confidence Mapping',sub:'quiz funnel · feeds the same Paid? hub',
  audience:{
    to:'Anyone who submits the Confidence Mapping quiz on the website, voucher or no voucher. Not restricted to buyers.',
    not:'<code>voucher:paid</code> or <code>map:booked</code>. Either one ends it, because booking always beats selling.',
    src:'Gravity Forms 21 on WordPress. <b>Make.com is on hold as of 18 Aug.</b> LID wires the answers straight to <code>info@tararosesalon.com</code>, so reception, stylists and beauticians can read them without a GHL login. Nothing reaches GHL automatically while that is the route.',
    warn:'<b>The shared-access problem is solved, and it moves a different one into view.</b> <code>info@tararosesalon.com</code> answers the original worry: the answers now reach receptionists, stylists and beauticians who will never log into GHL. But an inbox is not a tag. With Make.com on hold, <b>nothing writes <code>map:completed</code>, the nineteen fields or the <code>pain:</code> tags into GHL</b>, and every step drawn below that keys off them, the +24h bridge and the Home Ritual Kit routing included, has nothing to fire on. Until LID also writes back to GHL, treat this lane as <b>read the inbox and act by hand</b>. This quiz is also reused by the Junior Stylist campaign, so whatever is built here is built twice over.'},
  nodes:[
   /* Verified by reading the live page on 8 Aug, not inferred. It is Gravity Forms 21 on
      WordPress, NOT a GHL-native form, so nothing maps itself and every field below needs
      an explicit destination. Full evidence in CONFIDENCE-MAPPING-FIELD-SPEC.md.

      HOVER NOTES SHORTENED 8 Aug. Every step in this lane carried a paragraph in the hover
      panel, which is the one place nobody reads a paragraph: it is open for as long as a
      pointer rests there. Each tip is now a lead, the facts as rows, the one line of code or
      copy that settles it, and a jump to the Make module that does the work. Nothing was
      thrown away: the full note moved to `long`, which is what the modal shows on click. */
   {t:'trigger',title:'Trigger: Quiz submitted → Make.com',sub:'Gravity Forms 21 · webhook, not native',
    tip:{ch:'Trigger',flag:'TO BUILD',
     note:'Gravity Forms 21 on WordPress, not a GHL-native form, so nothing maps itself. A Make.com scenario carries the entry across.',
     rows:[['Form','<code>gform_21</code>, 19 hidden fields'],['Posts to','its own WordPress page'],['Bridge','a Make webhook, not built']],
     code:'GF&nbsp;21 &#9656;&#9656; Make webhook &#9656;&#9656; GHL contact\ninput_8&#8230;26      module 1       module 3',
     make:1,
     long:'Gravity Forms 21 on WordPress, not a GHL-native form. The bridge is now designed: a Make.com scenario, drawn in full on the Make.com bridge lane, which also says why Zapier and the existing GravityGHL Sync plugin were both ruled out. Three field names used elsewhere in the pack are wrong: it is status, hennakeratin and homecare, not colour_status, henna_keratin and home_care.'}},
   /* The node that was missing entirely: 17 of the 19 answers had no drawn destination. */
   {t:'tag',title:'Update Contact Fields · 19 answers',sub:'all nineteen, not two',
    tip:{ch:'Update Contact Field',flag:'TO BUILD',
     note:'One value per answer into a <code>cm_</code> custom field. Fields, not tags: a GHL merge field cannot read a tag, and these are the only thing an email can merge.',
     rows:[['Two types','get these wrong and they store nothing'],['Silent','no failed webhook, no warning anywhere']],
     code:'cm_pain       Single Line Text  &#8592; not Dropdown\ncm_condition  Text              &#8592; not Number',
     make:3,
     long:'TO BUILD. Nineteen Update Contact Field actions, one per answer, into cm_route, cm_pain, cm_confidence, cm_history_bad, cm_goal, cm_change, cm_base, cm_colour_status, cm_henna_keratin, cm_condition, cm_routine, cm_homecare, cm_detox, cm_occasion, cm_wellbeing, cm_supplements, cm_homecare_tier, cm_locale, cm_source_page. Fields, not tags, because a GHL merge field cannot read a tag and these are the only thing the email can merge. THE SILENT FAILURE: each field must exist in GHL and the key must match exactly BEFORE the form posts, or the value is dropped with no error anywhere: no failed webhook, no warning on the contact. Two types matter: cm_pain must be Single Line Text (it is a comma list up to 112 characters; a Dropdown validates against its options, fails to match and stores nothing), and cm_condition must be Text not Number (an unanswered question sends an empty string, which a numeric field rejects).'}},
   {t:'tag',title:'Add tags: map:completed',sub:'+ route + pain + tier',
    tip:{ch:'Add tag',
     note:'Four families only, on one rule: a tag exists where something <b>branches or segments</b> on it. The other fifteen answers stay fields.',
     rows:[['route:[x]','drives the task and every message'],['pain:[x]','2&ndash;3 each, the one broadcast segment'],['tier:[x]','the Ritual Kit list is filtered on it']],
     code:'add(\n split("pain:"+replace(pain;",";",pain:");",");\n "route:"+route; "tier:"+homecare_tier;\n "map:completed"; "source:confidence-mapping")',
     make:4,
     long:'Four tag families, on the rule that a tag exists only where something BRANCHES or SEGMENTS on it. route:[x] drives the contact-centre task and every message below. pain:[x] is a genuine multi-select, two or three per contact typically, and is the one dimension anyone segments a broadcast on. tier:[x] is new here: the Home Ritual Kit decision tree keys off exactly this value and whoever packs the kits has to filter a list by it, which a merge field cannot do. Plus map:completed and source:confidence-mapping. The other fifteen answers stay fields only, because nothing branches on supplements, so tagging it would be tag soup.'}},
   /* Reception opens a task, not a field list. The note is the thing that actually gets read
      at the moment the phone is ringing, so it is ordered for a call, not for the form. */
   {t:'task',title:'Note to contact · her answers',sub:'in the order you read them on a call',
    tip:{ch:'Add Note',flag:'TO BUILD',
     note:'One note, written the same moment as the fields and before the task, ordered for a person on a call rather than for the form.',
     rows:[['Raw keys','<code>fade-fast</code>, not a translated sentence'],['Layout','FIELD-SPEC Part 6']],
     code:'WHAT SHE CAME FOR   {{cm_route}}\nWHAT SHE SAID WRONG {{cm_pain}}\nBEFORE YOU PROMISE  henna/keratin &#8594; strand test\nHER LIFE AROUND IT  routine &#183; homecare &#183; detox\nHER, NOT HER HAIR   confidence &#183; wellbeing\nWHERE SHE IS        {{emirate}} &#8592; ask first',
     make:5,
     long:'TO BUILD. One formatted note written to the contact at the same moment the fields are set, and before the task below is created. Ordered for a person, not for the form: what she came for, then what she said is wrong in her own words, then the one thing that can go expensively wrong (HENNA OR KERATIN MEANS A STRAND TEST COMES FIRST), then her life around it, then her rather than her hair, then the emirate flagged if unknown. Full layout in CONFIDENCE-MAPPING-FIELD-SPEC.md Part 6. Values read as raw keys (fade-fast, heat-daily) rather than sentences, on purpose: a translation table in the bridge is one more thing that drifts out of sync with the quiz.'}},
   /* REDRAWN 8 Aug. The previous version of this node routed on Locale and was built on a
      premise that turns out to be false. See the tip. */
   {t:'iff',title:'If/Else · Emirate',sub:'the quiz cannot supply it',branches:[{c:'stop',k:'carry',l:'always → unknown'},{c:'',k:'carry',l:'→ ask on WhatsApp'}],
    tip:{ch:'If / Else',flag:'CORRECTED 8 AUG',
     note:'This used to read <b>Locale &#8594; emirate</b>. It cannot. Locale is the page&rsquo;s language tag, the same <code>en-us</code> for every lead, so there is nothing to recover.',
     rows:[['For Monday','every mapping lead is <code>emirate:unknown</code>'],['Then','the WhatsApp ask in Lead Nurture'],['Real fix','a 20th field, a website release']],
     code:'var lang = document.documentElement\n             .getAttribute(\'lang\');  // "en-us"\nset(GF.locale, lang);',
     make:2,
     long:'CORRECTED 8 AUG, AND THE ANSWER IS NO. This node used to read "Locale → emirate". The live bridge script sets Locale from the lang attribute of the html element: var lang = document.documentElement.getAttribute("lang"). Today that is en-us. It is a language tag. It is not an emirate, it has never been an emirate, and it cannot become one: every lead carries the same value regardless of where she is. So the pack\'s claim that "locale is the emirate we have been looking for, already collected and thrown away" is WRONG, and there is nothing to recover. For this window every mapping lead is emirate:unknown and takes the emirate from the WhatsApp ask in Lead Nurture. The real fix is a twentieth hidden field fed by a real question on the quiz, which is a website change and will not land by Monday. It should ship with the emirate landing-page split, so the site is only opened once.'}},
   {t:'email',title:'Email · minute 0',sub:'"Your Confidence Map is yours to keep"',emailKey:'journal',
    tip:{ch:'Email',sub:'Your Confidence Map is yours to keep',flag:'RETITLED 8 AUG',
     note:'Sent immediately, with her own answers reflected back and the &ldquo;yours to keep&rdquo; promise.',
     rows:[['Was','&ldquo;The Journal&rdquo;, which the email itself never says'],['Still wrong','the live form, in two places']],
     long:'RETITLED 8 AUG. This node used to be called "The Journal", which disagreed with the asset it sends: the email itself says "your Confidence Map" throughout, and the email is the one that is right under the Copy 4 naming fix. Worth knowing that the live FORM still says Journal in two client-facing places the audit does not list, the consent tickbox label and the submit button, so the naming fix is incomplete until those change too. Sent immediately, with her own answers reflected back and the "yours to keep" promise.'}},
   {t:'task',title:'Task · contact centre',sub:'first human contact ≤2h · note attached',
    tip:{ch:'Task',
     note:'First human contact within 2 hours: WhatsApp if she consented, a call otherwise. The description links the note above, so whoever rings has the whole map in front of them.',
     rows:[['The gap it closes','a first call made without her answers'],['The page promises','&ldquo;nothing in your plan is guessed&rdquo;']],
     make:6,
     long:'Creates a CC task: first human contact within 2 hours, WhatsApp if consented, call otherwise. NOW CARRIES HER ANSWERS: the task description links the contact note written two steps above, so whoever rings has the whole map in front of them rather than just route and top pain. This is the gap that mattered most: the page promises "we diagnose first and recommend second, so nothing in your plan is guessed", and a first human contact made without her answers is the one thing the page says we do not do.'}},
   {t:'wait',title:'Wait · 24 hours',sub:'if not booked',tip:{ch:'Wait',note:'Waits a day before the highest-leverage message.'}},
   {t:'iff',title:'If/Else · booked?',sub:'booking beats selling',branches:[{c:'go',k:'exit',l:'booked → goal map:booked'},{c:'',k:'carry',l:'not booked → bridge message'}],tip:{ch:'If / Else',note:'If she has booked, exit on map:booked. Otherwise send the mapping-to-voucher bridge.'}},
   {t:'wa',title:'WhatsApp · +24h bridge',sub:'email + WhatsApp, both',emailKey:'bridge',waKeys:['bridge'],tip:{ch:'WhatsApp + Email',sub:'Mapping-to-voucher bridge',note:'The highest-leverage message in the funnel. Locked copy (Handover Part 5.2), word for word in both channels.'}},
   {t:'wait',title:'Wait · to Day 3',sub:'gentle follow-up',tip:{ch:'Wait',note:'Holds until Day 3 for the gentle "chair kept warm" follow-up.'}},
   {t:'email',title:'Email · Day 3',sub:'"Your chair is still kept warm"',emailKey:'chair',tip:{ch:'Email',sub:'Your chair is still kept warm',note:'Gentle, no-pressure follow-up if not booked.'}},
   {t:'wait',title:'Wait · to Day 6',sub:'gentle follow-up',tip:{ch:'Wait',note:'Holds until Day 6 for the "three tiers plainly" follow-up.'}},
   {t:'email',title:'Email · Day 6',sub:'"The three tiers, plainly" · the model',emailKey:'tiers',
    tip:{ch:'Email',sub:'The three tiers, plainly',flag:'THE MODEL',
     note:'The one email already built the right way, and the pattern the other twelve should follow: one asset, parametrised, rather than two that drift apart.',
     rows:[['Body','&ldquo;at the salons named on your voucher&rdquo;'],['Specifics','a <code>{{voucher_availability_line}}</code> merge field'],['Today','that field is empty, so it renders blank']],
     code:'{{voucher_availability_line}}\n  &#8594; set one custom value per emirate\n  &#8594; blank is safe; wrong is not',
     long:'Lays the three tiers out plainly, no jargon, closes 30 September. Already fixed and worth copying: the body says "at the salons named on your voucher" and the emirate specifics sit in a {{voucher_availability_line}} merge field. Corrected 7 Aug, comment at line 66. The wording is safe in both emirates as it stands, but the merge field is not populated, so today the coverage block renders blank rather than promising the wrong facial. Set the custom value per emirate from the approved lines in the pack.'}},
   {t:'goal',title:'Goal: voucher:paid OR map:booked',sub:'exit',tip:{ch:'Goal / exit',note:'Either tag ends the workflow. Booking always beats selling.'}}
 ]}
];

/* ==========================================================================
   THE FOURTH LANE: the Make.com scenario that carries the quiz into GHL.

   It sits with the three GHL workflows because it is part of the same picture, but it is
   NOT a GHL workflow and is deliberately not drawn as one. A Make scenario is a horizontal
   chain of numbered modules with the filters sitting on the links between them, and drawing
   it any other way would leave whoever builds it translating the picture back before they
   could use it.

   Everything here is a specification. The Make account has not been opened, the WordPress
   feed does not exist, and the nineteen GHL fields have not been created. Where something
   WAS checked rather than assumed, the module says so and gives the date.
   ========================================================================== */
const MK_APP={
  hook :{label:'Webhooks',   c:'var(--mk-hook)',  mark:'<svg viewBox="0 0 24 24"><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg>'},
  tools:{label:'Tools',      c:'var(--mk-tools)', mark:'<svg viewBox="0 0 24 24"><path d="M14.6 6.1a3.9 3.9 0 0 0 5 5L15 15.7V20h-4.3L6.1 15.6a3.9 3.9 0 0 0 5-5z"/></svg>'},
  ghl  :{label:'GoHighLevel',c:'var(--mk-ghl)',   mark:'<span class="mkmark">HL</span>'},
  stripe:{label:'Stripe',    c:'var(--mk-stripe)',mark:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10.5h18"/><path d="M6.5 14.5h3"/></svg>'}
};
const MK_BADGE={
  instant:'<path d="M8 5v14l11-7z"/>',
  vars   :'<path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/>',
  upsert :'<path d="M12 5v14"/><path d="M5 12h14"/>',
  tag    :'<path d="M20 12 12 4H6v6l8 8z"/>',
  note   :'<path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h9"/>',
  check  :'<path d="m5 13 4 4 10-10"/>',
  back   :'<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>'
};

/* the nineteen, straight off the bridge script. Used in module 3 and nowhere else. */
const CM_FIELDS=[
  [8,'route','cm_route','Single Select'],
  [9,'pain','cm_pain','Single Line Text'],
  [10,'confidence','cm_confidence','Single Select'],
  [11,'history_bad','cm_history_bad','Single Select'],
  [12,'goal','cm_goal','Single Select'],
  [13,'change','cm_change','Single Select'],
  [14,'base','cm_base','Single Select'],
  [15,'status','cm_colour_status','Single Select'],
  [16,'hennakeratin','cm_henna_keratin','Single Select'],
  [17,'condition','cm_condition','Text'],
  [18,'routine','cm_routine','Single Select'],
  [19,'homecare','cm_homecare','Single Select'],
  [20,'detox','cm_detox','Single Select'],
  [21,'occasion','cm_occasion','Single Select'],
  [22,'wellbeing','cm_wellbeing','Single Select'],
  [23,'supplements','cm_supplements','Single Select'],
  [24,'homecare_tier','cm_homecare_tier','Single Select'],
  [25,'locale','cm_locale','Text'],
  [26,'source_page','cm_source_page','Text']
];

const MK_NOTE_LAYOUT=
'CONFIDENCE MAP &#183; {{1.first_name}} &#183; {{formatDate(now; "D MMM YYYY")}}\n'+
'\n'+
'WHAT SHE CAME FOR\n'+
'  {{1.route}} &#183; she says she wants: {{1.goal}}\n'+
'\n'+
'WHAT SHE SAID IS WRONG\n'+
'  {{1.pain}}\n'+
'\n'+
'BEFORE YOU PROMISE ANYTHING\n'+
'  Colour now: {{1.base}}, {{1.status}}\n'+
'  Condition:  {{1.condition}} out of 5\n'+
'  Henna or keratin: {{1.hennakeratin}}\n'+
'  &#9888; henna, keratin or both &#8594; a strand test comes first. Say so on the call.\n'+
'\n'+
'HER LIFE AROUND IT\n'+
'  Styling: {{1.routine}} &#183; Home care: {{1.homecare}} &#183; Detox: {{1.detox}}\n'+
'  Coming up: {{1.occasion}}\n'+
'\n'+
'HER, NOT HER HAIR\n'+
'  Last felt confident: {{1.confidence}}\n'+
'  A salon experience that was hard to move past: {{1.history_bad}}\n'+
'  How she is in herself: {{1.wellbeing}} &#183; Supplements: {{1.supplements}}\n'+
'  Also noticing: {{1.change}}\n'+
'\n'+
'WHERE SHE IS\n'+
'  Emirate: {{2.emirate}}   &#8592; ask if this says unknown, before quoting any facial\n'+
'\n'+
'Home care tier: {{1.homecare_tier}} &#183; From: {{1.source_page}}';

/* Scenario 2's receipt note. Short on purpose: this one is read at a till, not on a call. */
const MK_PAY_NOTE=
'VOUCHER PURCHASED &#183; {{formatDate(now; "D MMM YYYY, HH:mm")}}\n'+
'\n'+
'  Tier:     {{2.tier_name}}\n'+
'  Paid:     AED {{formatNumber(1.amount_total / 100; 0)}}\n'+
'  Credit:   AED {{2.credit}}\n'+
'  Runs to:  {{2.expiry}}\n'+
'\n'+
'  Bought in: {{2.emirate}}  &#8212; the credit is held to this emirate (T&amp;C term 3)\n'+
'  Usable at: {{2.branch_pair}}\n'+
'  Paid via:  Stripe, link {{1.payment_link}}\n'+
'\n'+
'If she asks to use it in the other emirate, that is a conversation before her\n'+
'first redemption, not a silent re-tag.';

const MAKE={
 scenarios:[
 {
  name:'Confidence Mapping &#8594; GoHighLevel',
  path:'tararosesalon.com &#183; Gravity Forms 21 &nbsp;&#9656;&nbsp; Make.com &nbsp;&#9656;&nbsp; GoHighLevel',
  chips:[
    {t:'ON HOLD 18 Aug &middot; LID owns this instead',warn:true},
    {t:'Scheduling: immediately, as data arrives'},
    {t:'7 operations per submission'},
    {t:'Sequential processing: on'}
  ],
  modules:[
  {app:'hook',badge:'instant',title:'Custom webhook',sub:'form 21 submits',
   peek:{
     lead:'No schedule. The scenario sits waiting and Gravity Forms posts one entry the moment she submits, so the contact centre sees her while she is still on the page.',
     rows:[['Runs','immediately, as data arrives'],['Carries','19 answers + name, email, phone'],['If GHL is slow','Make queues, nothing is lost']],
     code:'POST https://hook.eu2.make.com/&#8230;\ncontent-type: application/json'
   },
   cfg:[
    {h:'Module setup',fields:[
      ['Webhook name','<code>gf21-confidence-mapping</code>'],
      ['URL','<code>https://hook.eu2.make.com/&#8230;</code> &mdash; Make generates it; it is the one string you paste into WordPress'],
      ['Data structure','22 items, generated by Make from one live submission rather than typed by hand'],
      ['IP restrictions','the WordPress host only, so the URL is not an open door'],
      ['JSON pass-through','Off'],
      ['Max results per cycle','1']
    ]},
    {h:'Where this is wired, on WordPress',
     p:'Gravity Forms &#8594; Forms &#8594; <b>21</b> &#8594; Settings &#8594; <b>Webhooks</b> &#8594; Add New. Request URL is the Make URL above, Method <code>POST</code>, Request Format <code>JSON</code>, and the field map is <code>input_8</code> through <code>input_26</code> plus the name, email and phone fields.',
     warn:'<b>Checked in wp-admin on 8 Aug:</b> the Webhooks add-on is installed, and there is <b>no feed on form 21</b>. There is no Zapier feed either, and the GravityGHL Sync plugin is present, switched off and unscoped site-wide, which is why it was ruled out rather than turned on. Creating this one feed is the entire WordPress-side job.'},
    {h:'What arrives',code:
'{\n'+
'  "first_name":    "Noura",\n'+
'  "email":         "n@example.ae",\n'+
'  "phone":         "0501234567",\n'+
'  "route":         "blonde",\n'+
'  "pain":          "brassy,fade-fast,dry",\n'+
'  "condition":     "2",\n'+
'  "hennakeratin":  "no",\n'+
'  "homecare_tier": "maintain",\n'+
'  "locale":        "en-us",\n'+
'  "source_page":   "en/ae/confidence-mapping"\n'+
'}',
     p:'Ten of the twenty-two shown. Every unanswered question arrives as <code>""</code>, not null, which is why nothing downstream may be set to reject blanks.'}
   ]},

  {app:'tools',badge:'vars',title:'Set multiple variables',sub:'normalise + build tags',
   peek:{
     lead:'One comma string in, one tag array out. Everything after this stops caring about commas, and the emirate is set honestly to unknown here rather than guessed.',
     rows:[['Why here','GHL cannot split a comma list itself'],['emirate','hard-set to <code>unknown</code>, on purpose'],['Cost','1 operation, no connection needed']],
     code:'tags = add(\n split("pain:"+replace(pain;",";",pain:");",");\n "route:"+route; "tier:"+homecare_tier;\n "map:completed"; "source:confidence-mapping")'
   },
   cfg:[
    {h:'Variables',fields:[
      ['<code>phone_e164</code>','<code>if(startsWith(1.phone; "+"); 1.phone; "+971" + replace(1.phone; /^0/; ""))</code>'],
      ['<code>pain_tags</code>','<code>if(length(1.pain) &gt; 0; split("pain:" + replace(1.pain; ","; ",pain:"); ","); emptyarray)</code>'],
      ['<code>tags</code>','<code>add(2.pain_tags; "route:" + 1.route; "tier:" + 1.homecare_tier; "map:completed"; "source:confidence-mapping")</code>'],
      ['<code>emirate</code>','<code>"unknown"</code>'],
      ['<code>note_body</code>','the layout in module 5']
    ]},
    {h:'The pain trick, worked through',
     p:'GHL will happily take an array of tags. What it will not do is turn <code>brassy,fade-fast,dry</code> into three of them. Three string operations do it, and they belong here rather than in the GHL module, where they would be invisible.',
     code:
'in     "brassy,fade-fast,dry"\n'+
'replace(","; ",pain:")\n'+
'    &#8594; "brassy,pain:fade-fast,pain:dry"\n'+
'"pain:" + that\n'+
'    &#8594; "pain:brassy,pain:fade-fast,pain:dry"\n'+
'split(",")\n'+
'    &#8594; [pain:brassy, pain:fade-fast, pain:dry]',
     warn:'<b>The guard is not decoration.</b> If she ticks nothing, <code>pain</code> arrives as an empty string and the trick above produces a single tag reading <code>pain:</code> &mdash; on the contact, in the tag list, forever. The <code>if(length(&#8230;) &gt; 0)</code> is what stops it, and this is exactly the kind of fault nobody finds until someone filters a list and the counts are wrong.'},
    {h:'The emirate, and why it is a constant here',
     p:'The quiz cannot supply it. The bridge script on the live page sets <code>locale</code> from the <code>lang</code> attribute of the <code>&lt;html&gt;</code> element, which is <code>en-us</code> for every lead regardless of where she is. Writing <code>unknown</code> is the honest value, and the WhatsApp ask drawn in Lead Nurture is what fills it in.',
     code:'var lang = document.documentElement.getAttribute(\'lang\');\nset(GF.locale, lang);   // "en-us", every single time'}
   ]},

  {app:'ghl',badge:'upsert',title:'Create or Update a Contact',sub:'matched on phone',
   err:{t:'Error handler &#183; Break',s:'3 retries, then Incomplete Executions'},
   peek:{
     lead:'Matched on phone, so a client who has been to us before is updated rather than duplicated. This is where all nineteen answers land, and where they silently do not.',
     rows:[['Match on','phone in E.164, then email'],['Writes','19 <code>cm_</code> custom fields'],['If a field is missing','the value is dropped, no error']],
     code:'cm_pain       Single Line Text  &#8592; not Dropdown\ncm_condition  Text              &#8592; not Number'
   },
   cfg:[
    {h:'Module setup',fields:[
      ['Connection','GoHighLevel &#183; the Tara Rose sub-account, not the agency'],
      ['Action','Create or Update a Contact'],
      ['Match on','Phone &#8594; <code>{{2.phone_e164}}</code>, falling back to Email'],
      ['First name','<code>{{1.first_name}}</code>'],
      ['Email','<code>{{1.email}}</code>'],
      ['Phone','<code>{{2.phone_e164}}</code>'],
      ['Source','<code>Confidence Mapping</code>'],
      ['Tags','left empty here on purpose &mdash; module 4 does it, so there is one place to change them']
    ]},
    {h:'The nineteen custom fields',
     p:'One row per answer. The two highlighted are the two that will bite.',
     table:true},
    {h:'',warn:'<b>Create all nineteen in GHL before the first test.</b> A field created afterwards does not back-fill, so a test run before they exist proves nothing and has to be repeated. And the key is not the label: GHL generates the key once, at creation, and renaming the field later leaves the old key in place, so the scenario keeps posting to a key whose label now says something else. <code>cm_pain</code> and <code>cm_Pain</code> are two different fields.'},
    {h:'Error handler',
     p:'A <b>Break</b> directive on this module: retry 3 times, 15 minutes apart, then park the run in Incomplete Executions where it can be replayed by hand. GHL rate-limits, and a run that is rejected and then quietly discarded is a woman whose answers never arrived and nobody knew.'}
   ]},

  {app:'ghl',badge:'tag',title:'Add Contact Tags',sub:'route + pain + tier',
   peek:{
     lead:'Four families, from the array module 2 built. Tags are for what branches or gets segmented; the other fifteen answers stay as fields and are read, not filtered.',
     rows:[['Contact ID','<code>{{3.id}}</code>'],['Tags','<code>{{2.tags}}</code>'],['Typical','six or seven tags on one contact']],
     code:'[pain:brassy, pain:fade-fast, pain:dry,\n route:blonde, tier:maintain,\n map:completed, source:confidence-mapping]'
   },
   cfg:[
    {h:'Module setup',fields:[
      ['Connection','the same GoHighLevel connection as module 3'],
      ['Contact ID','<code>{{3.id}}</code>'],
      ['Tags','<code>{{2.tags}}</code> &mdash; the array, mapped whole, not typed']
    ]},
    {h:'Why only four families',
     p:'The rule that keeps this from turning into tag soup: a tag exists where something <b>branches or segments</b> on it. <code>route:[x]</code> drives the contact-centre task and every message below it. <code>pain:[x]</code> is a genuine multi-select and the one dimension anyone segments a broadcast on. <code>tier:[x]</code> is what whoever packs the Home Ritual Kits filters a list by, and a merge field cannot be filtered. Nothing branches on <code>supplements</code>, so it stays a field.',
     warn:'GHL <b>creates</b> a tag that does not exist yet rather than rejecting it, so a typo does not error &mdash; it quietly makes a second tag nobody is filtering on. Which is the argument for mapping the array from one place rather than typing tags into the GHL UI.'}
   ]},

  {app:'ghl',badge:'note',title:'Create a Note',sub:'her answers, in reading order',
   peek:{
     lead:'The thing that actually gets read while the phone is ringing. Nineteen custom fields down a sidebar is not, which is why the note exists at all.',
     rows:[['Body','<code>{{2.note_body}}</code>'],['Order','for a call, not for the form'],['Runs before','the task, so the task can point at it']],
     code:'WHAT SHE CAME FOR   {{1.route}}\nWHAT SHE SAID WRONG {{1.pain}}\nBEFORE YOU PROMISE  henna/keratin &#8594; strand test\nHER LIFE AROUND IT  routine &#183; homecare &#183; detox\nHER, NOT HER HAIR   confidence &#183; wellbeing\nWHERE SHE IS        {{2.emirate}}'
   },
   cfg:[
    {h:'Module setup',fields:[
      ['Contact ID','<code>{{3.id}}</code>'],
      ['Body','<code>{{2.note_body}}</code>, built in module 2 so the layout lives in one place']
    ]},
    {h:'The layout in full',code:MK_NOTE_LAYOUT},
    {h:'Two decisions inside it',
     p:'<b>The order is for a person on a call.</b> What she came for first, because it is the only line reception needs before speaking. What she said is wrong second, in her own words, because repeating it back is the whole promise of the page. Then the one line that can go expensively wrong: <b>henna or keratin means a strand test comes first</b>.<br><br><b>The values read as raw keys</b> &mdash; <code>fade-fast</code>, <code>heat-daily</code> &mdash; rather than sentences. A translation table would read better and is one more thing that drifts out of sync with the quiz every time a question changes. Ship raw keys; revisit only if reception says they are struggling.'}
   ]},

  {app:'ghl',badge:'check',title:'Create a Task',sub:'first contact within 2h',
   filter:{label:'Route answered',cond:'<code>{{1.route}}</code> Exists'},
   peek:{
     lead:'A filter sits on the link into this module, not inside it. Two tasks for one woman is how a contact centre learns to ignore tasks.',
     rows:[['Due','<code>{{addHours(now; 2)}}</code>'],['Body','links the note from module 5'],['Open question','does a GHL Workflow already make it?']],
     code:'filter  {{1.route}}  Exists\n        &#8594; only a completed map raises a task'
   },
   cfg:[
    {h:'The filter on the link',fields:[
      ['Label','<code>Route answered</code>'],
      ['Condition','<code>{{1.route}}</code> &nbsp;Exists']
    ],
     p:'<code>route</code> is computed by the bridge from her answers, so it is only present on a map she actually finished. A half-finished submission gets its fields and its note, and does not raise a task.'},
    {h:'Module setup',fields:[
      ['Title','<code>Confidence Mapping &#183; first contact within 2h</code>'],
      ['Contact ID','<code>{{3.id}}</code>'],
      ['Due date','<code>{{addHours(now; 2)}}</code>'],
      ['Assigned to','the contact-centre user or queue'],
      ['Body','<code>Route: {{1.route}} &#183; Top pain: {{1.pain}} &#183; her full map is the note on this contact, written {{formatDate(now; "HH:mm")}}.</code>']
    ]},
    {h:'The decision this module is waiting on',
     warn:'If a <b>GHL Workflow</b> already raises this task off the <code>map:completed</code> tag, then <b>delete this module</b> rather than filtering it. A filter evaluated on every run is a decision nobody ever made; deleting it is the decision. This is the one module in the scenario that may not survive contact with the live account, and it is drawn dashed for that reason.'}
   ]},

  {app:'hook',badge:'back',title:'Webhook response',sub:'200 back to WordPress',
   peek:{
     lead:'Answers Gravity Forms only once GHL has actually taken the contact, so the WordPress entry list becomes a second place you can read the truth from.',
     rows:[['Status','<code>200</code>'],['Body','<code>{"ok":true}</code>'],['Without it','GF is told &ldquo;accepted&rdquo; and learns nothing']]
   },
   cfg:[
    {h:'Module setup',fields:[
      ['Status','<code>200</code>'],
      ['Body','<code>{"ok":true, "contact":"{{3.id}}"}</code>'],
      ['Custom headers','<code>content-type: application/json</code>']
    ]},
    {h:'Why it is worth one operation',
     p:'Without this module Make answers the webhook the instant it receives it, with its own <code>Accepted</code>, and the Gravity Forms log records a success whatever happened afterwards. With it, the feed is told the truth: a 200 means the contact exists in GHL and carries an id. That turns the two-ended test in the field spec into something anyone can run without a Make login.'}
   ]}
  ]},

 /* ===== Scenario 2 =====
    The Welcome Pack lane has always referred to a "Stripe &#8594; Make bridge" as though it were
    a thing that exists. It is drawn now, with the same rule as everything else in the pack:
    what was checked says so, and what was not says so louder. Nobody in this build has opened
    the Stripe account. The nine payment links are read off the approval pack, and the tier
    each one sells is NOT something the pack states, which is why module 2 reads the tier off
    the amount paid instead of off the link. */
 {
  name:'Voucher paid &#8594; Welcome Pack',
  path:'Stripe checkout &nbsp;&#9656;&nbsp; Make.com &nbsp;&#9656;&nbsp; GoHighLevel &nbsp;&#9656;&nbsp; the Welcome Pack starts',
  chips:[
    {t:'Not inspected &#183; drawn from the pack',warn:true},
    {t:'Trigger: checkout.session.completed'},
    {t:'6 operations per payment'},
    {t:'Order matters: voucher:paid goes last'}
  ],
  modules:[
  {app:'stripe',badge:'instant',title:'Watch Events',sub:'checkout.session.completed',
   peek:{
     lead:'Stripe pushes the event the second she pays. If this is ever built as a poll on a timer, she gets her confirmation a quarter of an hour late and rings reception before it arrives.',
     rows:[['Event','<code>checkout.session.completed</code>'],['Filter','<code>payment_status = paid</code>'],['Never sees','Tabby, or reception at the till']],
     code:'checkout.session.completed\n  payment_link : plink_&#8230;5wI01\n  amount_total : 250000   // fils = AED 2,500'
   },
   cfg:[
    {h:'Module setup',fields:[
      ['Connection','Stripe &mdash; <b>whose account?</b> Nobody in this build has logged in'],
      ['Events','<code>checkout.session.completed</code>, and nothing else'],
      ['Watch from','now, not from the beginning of time'],
      ['Filter on the trigger','<code>payment_status</code> Equal to <code>paid</code>']
    ]},
    {h:'Why the filter is not optional',
     p:'A <i>completed</i> checkout session is not a <i>paid</i> one. Delayed methods complete first and settle afterwards, and one of them failing to settle would leave a woman holding a <code>voucher:paid</code> tag she has not paid for, in a workflow that will happily send her a confirmation.'},
    {h:'',warn:'<b>Nothing in this scenario has been inspected.</b> The nine payment links used below are read off the approval pack, not off a Stripe dashboard, and no test payment has been made. Before anything is built the first question is not technical: <b>who owns the Stripe account</b>, and are all nine links live? Saadiyat has no working Stripe at all, which is why its clients pay through the Khalifa City link.'},
    {h:'What arrives',code:
'{\n'+
'  "id":             "cs_live_&#8230;",\n'+
'  "payment_status": "paid",\n'+
'  "payment_link":   "plink_&#8230;5wI01",\n'+
'  "amount_total":   250000,\n'+
'  "currency":       "aed",\n'+
'  "customer_details": {\n'+
'    "name":  "Noura",\n'+
'    "email": "n@example.ae",\n'+
'    "phone": "+971501234567"\n'+
'  }\n'+
'}',
     p:'<code>amount_total</code> is in fils. <code>customer_details.phone</code> only exists if phone collection is switched on in the payment link, and whether it is has not been checked &mdash; see module 3.'}
   ]},

  {app:'tools',badge:'vars',title:'Set multiple variables',sub:'decode the payment link',
   peek:{
     lead:'The link she paid through is the only reliable emirate signal there is. <code>+971</code> covers the whole country, so her phone number says nothing at all.',
     rows:[['Nine links','three per paying branch'],['Emirate','from the link &mdash; stated in the pack'],['Tier','from the <b>amount</b>, not the link']],
     code:'&#8230;5wI01/02/03  &#8594; Abu Dhabi\n&#8230;eEo13/14/15  &#8594; Al Quoz     (Dubai)\n&#8230;0VO1E/F/G    &#8594; Motor City  (Dubai)'
   },
   cfg:[
    {h:'Variables',fields:[
      ['<code>emirate</code>','<code>if(contains(1.payment_link; "5wI0"); "abu-dhabi"; "dubai")</code>'],
      ['<code>tier</code>','<code>switch(1.amount_total; 100000; "dip"; 250000; "season"; 450000; "vip")</code>'],
      ['<code>tier_name</code>','<code>switch(2.tier; "dip"; "Dip Your Toes"; "season"; "Season of You"; "vip"; "All-In VIP Year")</code>'],
      ['<code>credit</code>','<code>switch(2.tier; "dip"; 1150; "season"; 3000; "vip"; 5400)</code>'],
      ['<code>expiry</code>','<code>formatDate(addMonths(now; switch(2.tier; "dip"; 6; "season"; 9; "vip"; 12)); "D MMM YYYY")</code>'],
      ['<code>branch_pair</code>','the two salons named on that emirate&rsquo;s voucher'],
      ['<code>tags</code>','<code>add("tier:" + 2.tier; "emirate:" + 2.emirate; "pay:stripe"; "campaign:beauty-voucher-v2")</code>'],
      ['<code>receipt</code>','the note layout in module 5, built here so it lives in one place']
    ]},
    {h:'Why the tier comes off the amount and not off the link',
     p:'The pack states which <i>emirate</i> each triplet of links belongs to. It does <b>not</b> state which tier each individual link sells, and assuming that <code>01/02/03</code> runs cheapest to dearest is a guess that would silently sell a woman the wrong credit. The amount is unambiguous: AED 1,000 / 2,500 / 4,500 paid buys AED 1,150 / 3,000 / 5,400 of credit. Read the amount, and confirm the link ordering in Stripe afterwards, at leisure.',
     code:'paid    1,000     2,500      4,500\ncredit  1,150     3,000      5,400\nbonus       &#8212;      +500       +900\nruns    6 months  9 months   12 months'},
    {h:'Emirate is reliable here. Branch is not.',
     warn:'Saadiyat has no working Stripe, so a Saadiyat client pays through the <b>Khalifa City</b> link. A KCA payment therefore means <b>Abu Dhabi</b>, and it does not mean KCA. Never write a branch from this &mdash; only the emirate, and the pair of salons that emirate&rsquo;s voucher names. Under T&amp;C term 3 the credit is held to the emirate it was bought in, which is why this one value is worth this much care.'},
    {h:'What this scenario will never see',
     warn:'<b>Tabby is not Stripe.</b> It is offered on the upper two tiers, and if it settles outside Stripe then no event fires and this scenario never runs. Same for a woman who pays at the till. Both are the manual-tag path already drawn in the Welcome Pack trigger, and both need someone at reception to apply <code>voucher:paid</code> by hand &mdash; without the emirate and tier that modules 3 and 4 would have written. That gap is real today and this scenario does not close it.'}
   ]},

  {app:'ghl',badge:'upsert',title:'Create or Update a Contact',sub:'matched on email',
   err:{t:'Error handler &#183; Break',s:'she has paid. Retry, then alert a human'},
   peek:{
     lead:'Writes the emirate, the tier and the credit as fields before any tag exists, so that whatever reads them later finds them already there.',
     rows:[['Match on','email from Stripe, then phone'],['Writes','emirate &#183; tier &#183; credit &#183; expiry'],['Risk','a duplicate, if the emails differ']],
     code:'emirate         abu-dhabi\nvoucher_tier    season\nvoucher_credit  3000\nvoucher_expiry  8 May 2027'
   },
   cfg:[
    {h:'Module setup',fields:[
      ['Action','Create or Update a Contact'],
      ['Match on','Email &#8594; <code>{{1.customer_details.email}}</code>, then Phone'],
      ['First name','<code>{{1.customer_details.name}}</code>'],
      ['Phone','<code>{{1.customer_details.phone}}</code>, if the link collects it'],
      ['<code>emirate</code>','<code>{{2.emirate}}</code>'],
      ['<code>voucher_tier</code>','<code>{{2.tier}}</code>'],
      ['<code>voucher_credit</code>','<code>{{2.credit}}</code>'],
      ['<code>voucher_expiry</code>','<code>{{2.expiry}}</code>'],
      ['<code>voucher_link</code>','<code>{{1.payment_link}}</code>, so a dispute can be traced'],
      ['Tags','empty here. Module 4 does it, and module 6 does the one that matters']
    ]},
    {h:'The duplicate, which is the real risk in this scenario',
     warn:'She may check out with a different email from the one the nurture has. Matching on email alone then creates a <b>second contact</b> who is paid, tagged and about to receive a Welcome Pack, while the first one carries on being nurtured to buy a voucher she already owns. <b>Turn phone collection on in the Stripe links and match on phone first</b>, the same way the Confidence Mapping scenario does. If phone cannot be collected, this scenario needs a Search Contacts module and a merge step, and that is a bigger build than the one drawn here.'},
    {h:'Error handler',
     p:'A <b>Break</b> on this module, and it carries more weight than the one in the other scenario. If this fails, module 6 never runs, <code>voucher:paid</code> is never applied, and a woman who has paid AED 4,500 hears nothing at all while the Lead Nurture carries on asking her to reserve a tier. Retry 3 times, park in Incomplete Executions, <b>and raise a real alert</b>. A parked run nobody looks at is the same as no run.'}
   ]},

  {app:'ghl',badge:'tag',title:'Add Contact Tags',sub:'everything except the starting gun',
   peek:{
     lead:'All the descriptive tags, and deliberately <b>not</b> <code>voucher:paid</code>. That one is held back to module 6, and the reason is on that module.',
     rows:[['Adds','<code>tier:</code> &#183; <code>emirate:</code> &#183; <code>pay:stripe</code> &#183; <code>campaign:</code>'],['Withholds','<code>voucher:paid</code>'],['From','<code>{{2.tags}}</code>']],
     code:'[tier:season, emirate:abu-dhabi,\n pay:stripe, campaign:beauty-voucher-v2]'
   },
   cfg:[
    {h:'Module setup',fields:[
      ['Contact ID','<code>{{3.id}}</code>'],
      ['Tags','<code>{{2.tags}}</code>']
    ]},
    {h:'Why these four',
     p:'<code>emirate:[x]</code> is what the Lead Nurture and the Welcome Pack both branch on. <code>tier:[x]</code> decides whether the Self-Care Bonus paragraph appears at all. <code>pay:stripe</code> is how you find, later, which contacts came through this scenario rather than a hand-typed tag &mdash; which is the only way anyone will ever audit whether the bridge is actually running. <code>campaign:</code> is the window she bought in.'}
   ]},

  {app:'ghl',badge:'note',title:'Create a Note',sub:'the receipt, in till language',
   peek:{
     lead:'What she bought, written for whoever is standing at the till with her in front of them, not for an accountant.',
     rows:[['Carries','tier &#183; paid &#183; credit &#183; expiry &#183; emirate'],['And','the payment link, for disputes']],
     code:'Tier:      Season of You\nPaid:      AED 2,500\nCredit:    AED 3,000\nRuns to:   8 May 2027\nBought in: abu-dhabi  &#8212; held to this emirate'
   },
   cfg:[
    {h:'Module setup',fields:[
      ['Contact ID','<code>{{3.id}}</code>'],
      ['Body','<code>{{2.receipt}}</code>']
    ]},
    {h:'The layout in full',code:MK_PAY_NOTE},
    {h:'The last two lines are the point',
     p:'Term 3 of the T&amp;Cs holds the credit to the emirate it was bought in, and the single most likely front-desk conversation in this whole campaign is a woman in Dubai holding an Abu Dhabi voucher. Putting the answer in the note means reception is not improvising it, and not promising something the voucher cannot do.'}
   ]},

  /* Named for what it does rather than for the GHL module it is, which is what anyone
     building this should do in Make too: a scenario with two modules both called
     "Add Contact Tags" is a scenario nobody can talk about out loud. */
  {app:'ghl',badge:'check',title:'Add Tag &#183; voucher:paid',sub:'on its own, and last',
   peek:{
     lead:'The starting gun, fired last on purpose. <code>voucher:paid</code> ends the Lead Nurture mid-arc and starts the Welcome Pack, whose very first decision reads the emirate &mdash; which exists only because modules 3 and 4 have already run.',
     rows:[['Tag','<code>voucher:paid</code>, alone'],['Starts','the Welcome Pack'],['Ends','the Lead Nurture, wherever she is in it']],
     code:'3  fields written\n4  emirate + tier tagged\n5  receipt on the contact\n6  voucher:paid   &#8592; only now'
   },
   cfg:[
    {h:'Module setup',fields:[
      ['Contact ID','<code>{{3.id}}</code>'],
      ['Tags','<code>voucher:paid</code> &mdash; this one value, and nothing else in this module']
    ]},
    {h:'Why this is a separate module and not one line in module 4',
     warn:'Because <code>voucher:paid</code> is a <b>trigger</b>, not a label. The moment it lands, GHL starts the Welcome Pack, and the Welcome Pack&rsquo;s first step is <code>If/Else &#183; Emirate from payment</code>, immediately followed by a confirmation email that merges <code>{{branch_a_name}}</code> and <code>{{branch_b_name}}</code>. Bundle this tag in with the others and it is a race: the Welcome Pack may read the emirate before it has been written, and send a confirmation with two blank buttons. <b>That exact fault is live in Email 1 today</b>, for a different reason. This ordering is what stops a second copy of it.'},
    {h:'What still is not solved by any of this',
     p:'Tabby and till payments never reach this scenario, so they are still tagged by hand &mdash; and a hand-typed <code>voucher:paid</code> arrives with no emirate, no tier and no receipt, straight into a Welcome Pack that needs all three. Whoever is asked to apply that tag manually needs the other three applied first, in that order, and right now nothing tells them so.'}
   ]}
  ]}
 ],
 lanes:[
    {k:'GoHighLevel',h:'Create the nineteen custom fields',todo:true,
     p:'First, and before any test. Nothing in scenario 1 works until they exist, and a field created later does not back-fill. Keys and types are in docs/CONFIDENCE-MAPPING-FIELD-SPEC.md Part 1.'},
    {k:'WordPress',h:'One Webhooks feed on form 21',todo:true,
     p:'The add-on is installed and there is no feed. Request URL is the Make webhook, POST, JSON, mapping input_8 through input_26. This is the whole website-side job for scenario 1.'},
    {k:'Stripe',h:'Answer who owns the account',todo:true,
     p:'Before a single module of scenario 2 is built: whose Stripe is it, are all nine links live, and do they collect a phone number? The last one decides whether the contact match is safe or whether every purchase risks a duplicate.'},
    {k:'Make.com',h:'Two scenarios, thirteen modules',todo:true,
     p:'At 7 and 6 operations a run, the free 1,000-a-month tier covers roughly 140 maps or 165 payments, and not both. Turn on sequential processing and store incomplete executions before either goes live, not after.'},
    {k:'How you will know',h:'Read both ends, not one',
     p:'Scenario 1: submit one test entry, then read WordPress &#8594; Entries and the GHL contact. Scenario 2: one real payment on the smallest tier, refunded afterwards, then read the Stripe event and the GHL contact. In both, values at one end and not the other tells you which side is at fault.'}
 ],
 foot:'<b>Two open questions this drawing does not answer.</b> Refunds: nothing here watches <code>charge.refunded</code>, so a refunded voucher keeps its <code>voucher:paid</code> tag and carries on receiving a Welcome Pack. And Tabby: it is offered on the upper two tiers and never appears in Stripe, so it stays a manual tag. Both need an owner before this goes live, and neither is a drawing problem.'
};

function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
/* the shortened tips carry a little inline markup (code, bold). The modal renders the full
   note as plain text, so the markup comes out before it is escaped, not after. */
function stripTags(s){return (s||'').replace(/<[^>]+>/g,'');}
/* 'submit' is the body that goes to Meta and is guaranteed within the cap by the build.
   'longer' is a reference draft only, and may be over, so the UI has to say so. */
function waText(key,mode){var t=WA[key]||{};return (mode==='longer'&&t.longer)?t.longer:(t.submit||'');}
function waChars(key,mode){var t=WA[key]||{};return (mode==='longer'&&t.longer)?t.longerChars:(t.submitChars||0);}

/* ===== the furniture a shortened tip is built from =====
   Shared by the hover panel and the modal, so the click never contradicts the hover: the
   modal shows exactly the same rows and code, plus the full note underneath. */
function flagHTML(tp){ return tp.flag ? '<span class="dflag'+(tp.flagOk?' ok':'')+'">'+tp.flag+'</span>' : ''; }
function rowsHTML(tp){
  if(!tp.rows||!tp.rows.length) return '';
  return '<div class="drows">'+tp.rows.map(function(r){
    return '<span class="drk">'+r[0]+'</span><span class="drv">'+r[1]+'</span>';
  }).join('')+'</div>';
}
function codeHTML(tp){ return tp.code ? '<pre class="dcode">'+tp.code+'</pre>' : ''; }
/* tp.make is either a plain module number (scenario 1) or "2-6" (scenario, module) */
function makeJumpHTML(tp){
  if(!tp.make) return '';
  var p=String(tp.make).split('-');
  var sc = p.length>1 ? p[0] : '1', num = p.length>1 ? p[1] : p[0];
  return '<button type="button" class="dmake" data-gomake="'+tp.make+'">'+
    '<i>'+num+'</i>Built by module '+num+' of Make scenario '+sc+'</button>';
}

/* ===== the pill and its two side panels ===== */
/* The official submitted-body count for one template. The voucher URL is resolved by the
   build before counting, so this is the number Meta will see, not a placeholder version. */
function waLimitText(k){
  var t=WA[k]||{}, over=t.submitChars>WA_BODY_LIMIT;
  return (t.region?t.region+' · ':'')+t.submitChars+' / '+WA_BODY_LIMIT+' characters'+
    (over?' · over Meta’s limit':' · voucher URL counted');
}

/* A fork, not a list of pills. Branches used to render as .bchip pills INSIDE the card in one
   centred column, so a 3-way router looked exactly like a linear step with some tags on it and
   there was no fork anywhere on the page.
   The horizontal comb is built from per-leg pseudo-elements rather than one absolutely
   positioned bar, so it survives any number of legs and any wrap without arithmetic. Half-width
   on the outer legs is what stops the comb overhanging the ends.
   Nothing here carries class "node": schedule.js counts .node per flow and maps array index to
   DOM order, so a leg picking up that class would shift every date on the page and leave one
   console warning as the only symptom. */
/* Every leg carries its own KIND, in the data, because inferring it from the colour class was
   wrong: `c` says what sort of outcome it is, not whether the line continues through it. The
   Blast "Did she come through?" fork proved it — the branch that reaches the next step is the
   green one, and the amber one holds. Four kinds, and between them no leg dead-ends unless it
   really does end:
     carry  reaches the next step. The line continues through it.
     skip   carries on, but bypasses the next step, which belongs to another branch, and
            rejoins under it.
     exit   leaves the workflow. Flat terminal cap.
     hold   stays where she is. Nothing further in THIS lane.
   Fallback for a leg with no kind: stop → exit, anything else → carry. */
function legKind(b){ return b.k || (b.c === 'stop' ? 'exit' : 'carry'); }

var LEGCAP = {carry:'Carries on below', skip:'Skips the next step',
              exit:'Exits here',        hold:'Stays here'};

/* Returns the fork's markup plus, if any branch bypasses a step, what the lane loop needs to
   wrap that step in a bypass rail. Not a bare string any more, because the rail has to span the
   step BELOW the fork and only the loop knows where that step ends. */
function forkParts(n){
  if(!n.branches) return null;
  var B = n.branches, N = B.length, carry = [], skip = [];
  B.forEach(function(b,i){
    var k = legKind(b);
    if(k === 'carry') carry.push(i);
    else if(k === 'skip') skip.push(i);
  });

  /* WHERE THE LINE CONTINUES. One carrying leg and the trunk sits under that pill; several and
     it sits under the bar where they merge, which is the midpoint of them. Nothing carries at
     all (every branch exits) and there is nothing to line up with, so it stays centred.
     Three numbers go to the CSS, which does the arithmetic in calc so it survives a resize:
       --n  leg count
       --f  how far to slide the row so that point lands on the centre line, in leg widths
       --m  the furthest leg edge from it, also in leg widths, which caps the leg width so a
            3-way fork cannot push its outer leg off the canvas */
  var anchor = carry.length
    ? carry.reduce(function(a,b){ return a + b; }, 0) / carry.length
    : (N - 1) / 2;
  var vars = '--n:' + N + ';--f:' + (N/2 - anchor - 0.5) +
             ';--m:' + Math.max(anchor + 0.5, N - 0.5 - anchor);

  var legs = B.map(function(b,i){
    var k = legKind(b);
    return '<div class="leg ' + (b.c === 'stop' ? 'stop' : (b.c === 'go' ? 'go' : 'on')) +
      '" data-k="' + k + '">' +
      '<span class="legchip">' + b.l + '</span>' +
      '<span class="legcap">' + LEGCAP[k] + '</span>' +
      /* the tail is what stops a leg looking like a dead end: carry and skip legs run on down
         to the bar below, exits and holds stop at their cap */
      (k === 'carry' || k === 'skip' ? '<span class="legtail"></span>' : '') +
    '</div>';
  }).join('');

  /* the bars the tails run into: carrying legs converge on the trunk, skipping legs converge on
     the rail that goes round the next step. A single leg needs no bar, its tail is the line. */
  var bar = function(list, cls){
    if(list.length < 2) return '';
    var span = list[list.length-1] - list[0],
        off  = (list[0] + list[list.length-1]) / 2 - anchor;
    return '<div class="' + cls + '" style="--barw:calc(var(--legw) * ' + span +
           ');--barx:calc(var(--legw) * ' + off + ')"></div>';
  };

  var out = {
    html: '<div class="fork" data-legw data-legs="' + N + '" style="' + vars + '">' +
      '<span class="forkstem"></span>' +
      '<div class="legs">' + legs + '</div>' +
      bar(carry, 'merge') + bar(skip, 'skipbar') +
    '</div>',
    vars: vars,
    skip: null
  };

  if(skip.length){
    /* One rail carries every skipping leg on this fork, started under the leg furthest from the
       trunk so it clears the others, and it goes round however many steps the widest skip needs.
       Every skip in this pack is a single step; n on the branch overrides it. */
    var far = skip.reduce(function(a,b){
      return Math.abs(b - anchor) > Math.abs(a - anchor) ? b : a;
    }, skip[0]);
    out.skip = {
      steps: Math.max.apply(null, skip.map(function(i){ return B[i].n || 1; })),
      side:  far < anchor ? 'left' : 'right',
      mag:   Math.abs(far - anchor)
    };
  }
  return out;
}

function nodeHTML(n,fl,idx){
  var col=COLOR[n.t]||'#666', type=TYPELABEL[n.t]||'', tp=n.tip||{};

  /* branches are drawn below the card now, by forkHTML, so this is only ever the channel pair */
  var extra='';
  if(n.emailKey && n.waKeys){
    extra='<div class="chanpair"><i style="background:'+COLOR.email+'">Email</i><i style="background:'+COLOR.wa+'">WhatsApp</i></div>';
  }

  var desc='<div class="side desc"><div class="dch">'+(tp.ch||type)+flagHTML(tp)+'</div>';
  if(tp.sub) desc+='<div class="dsub">'+tp.sub+'</div>';
  if(tp.note) desc+='<div class="dnote">'+tp.note+'</div>';
  desc+=rowsHTML(tp)+codeHTML(tp)+makeJumpHTML(tp);
  /* the peek is a summary now, so it has to say where the rest of it went */
  if(tp.long) desc+='<div class="dmore">Click the step for the full note</div>';
  desc+='</div>';

  var cards=[];
  if(n.emailKey){
    cards.push(
      '<div class="pv" data-open="email">'+
        '<div class="pvhead"><span class="pvdot" style="background:'+COLOR.email+'"></span>Email preview</div>'+
        '<div class="pvframe"><iframe data-key="'+n.emailKey+'" tabindex="-1" scrolling="no" title="email preview"></iframe><span class="pvfade"></span></div>'+
        '<div class="pvfoot">Open on a phone screen '+OPEN_ICON+'</div>'+
      '</div>');
  }
  if(n.waKeys){
    var regions = n.waKeys.length>1
      ? '<div class="pvregion">'+n.waKeys.map(function(k,i){
          return '<button class="pvrg'+(i===0?' active':'')+'" data-wak="'+k+'">'+
            esc((WA[k]||{}).region||'')+' <b class="bchars">'+(WA[k]||{}).submitChars+'</b></button>';
        }).join('')+'</div>'
      : '';
    var k0=n.waKeys[0], over=(WA[k0]||{}).submitChars>WA_BODY_LIMIT;
    cards.push(
      '<div class="pv" data-open="wa">'+
        '<div class="pvhead"><span class="pvdot" style="background:'+COLOR.wa+'"></span>WhatsApp preview'+
          (n.waKeys.length>1?' · '+n.waKeys.length+' regions':'')+'</div>'+
        regions+
        '<div class="pvwa"><div class="pvwabub" data-wabody>'+esc(waText(k0,'submit'))+'</div><span class="pvfade"></span></div>'+
        '<div class="pvlimit '+(over?'over':'ok')+'" data-walimit>'+
          waLimitText(k0)+'</div>'+
        '<div class="pvfoot">Open on a phone screen '+OPEN_ICON+'</div>'+
      '</div>');
  }
  if(!cards.length && n.t==='email'){
    cards.push('<div class="pv"><div class="pvhead">Email preview</div>'+
      '<div class="pvpending"><div class="pvpico">&#9998;</div><div class="pvptitle">Draft not built yet</div>'+
      '<div class="pvpnote">The note on the left is the brief.</div></div></div>');
  }
  var stack = cards.length ? '<div class="side pvstack">'+cards.join('')+'</div>' : '';

  return '<div class="node" data-fl="'+fl+'" data-i="'+idx+'"><span class="ntype">'+type+'</span>'+
    '<div class="nrow"><div class="ico" style="background:'+col+'"><svg viewBox="0 0 24 24">'+ICON[n.t]+'</svg></div>'+
    '<div><div class="ntitle">'+n.title+'</div>'+(n.sub?'<div class="nsub">'+n.sub+'</div>':'')+'</div></div>'+
    extra+desc+stack+'</div>';
}

/* ===== one lane, walked rather than mapped =====
   It used to be nodes.map(node + rail). A bypass rail has to span the step it goes round, and the
   only way to draw that without measuring heights in JS is to WRAP that step, so the rail is a
   border on the wrapper and grows with whatever is inside it. That needs a walk: a fork can eat
   the step that follows it.
   The wrapper is a plain div and never a <section id> — that would steal the note namespace from
   every step in the lane — and never carries class "node", so schedule.js still counts the same
   steps in the same DOM order. */
function laneHTML(w){
  var out = audHTML(w), i = 0, N = w.nodes.length;
  while(i < N){
    var fk = forkParts(w.nodes[i]);
    out += nodeHTML(w.nodes[i], w.id, i) + (fk ? fk.html : '');
    i++;
    if(fk && fk.skip && i < N){
      var inner = '', taken = 0;
      while(taken < fk.skip.steps && i < N){
        inner += '<div class="rail"></div>' + nodeHTML(w.nodes[i], w.id, i);
        i++; taken++;
      }
      out += '<div class="bypass ' + fk.skip.side + '" data-legw style="' + fk.vars +
               ';--bw:calc(var(--legw) * ' + fk.skip.mag + ')">' + inner + '</div>' +
             '<div class="rejoin ' + fk.skip.side + '" data-legw style="' + fk.vars +
               ';--bw:calc(var(--legw) * ' + fk.skip.mag + ')"></div>';
    }
    if(i < N) out += '<div class="rail"></div>';
  }
  return out;
}

/* The band that answers the one question the map never answered: who is in this lane.
   Deliberately three fixed columns rather than free prose, because "who is excluded" is the
   column people skip writing and it is the column that causes the incidents.
   Class is .aud and never .node: schedule.js counts .node per flow and maps array index to
   DOM order, so a band carrying that class would shift every date on the page and say so in
   nothing but one console warning. Same reason it is not wrapped in a section[id]: that would
   steal the note namespace from every step in the lane. */
function audHTML(w){
  var a = w.audience;
  if(!a) return '';
  return '<div class="aud">' +
    '<div class="audtop"><span class="audk">Who this is for</span>' +
      '<b>' + w.name + '</b><span class="audsub">' + (w.sub||'') + '</span></div>' +
    '<div class="audgrid">' +
      '<div class="audcell go"><i>Goes to</i><p>'  + a.to  + '</p></div>' +
      '<div class="audcell no"><i>Never enters</i><p>' + a.not + '</p></div>' +
      '<div class="audcell src"><i>Where the list comes from</i><p>' + a.src + '</p></div>' +
    '</div>' +
    (a.warn ? '<div class="audwarn"><b>Watch this</b>' + a.warn + '</div>' : '') +
  '</div>';
}

const tabs=document.getElementById('tabs');
const canvas=document.getElementById('canvas');
const WFMAP={};

/* One place that switches lanes, because three things now call it: the pills, the
   "built by module N" jump inside a Confidence Mapping tip, and the button in the
   Confidence Mapping note at the top of the page. The legend swaps with the lane:
   the Make lane has triggers and filters, not emails and waits. */
function activateTab(id){
  document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('active',x.dataset.wf===id);});
  document.querySelectorAll('.flow').forEach(function(x){x.classList.toggle('active',x.id==='automations-'+id);});
  document.querySelectorAll('[data-lg]').forEach(function(x){
    x.hidden = (x.dataset.lg==='make') !== (id==='make');
  });
}
window.trsActivateLane=activateTab;

WF.forEach(function(w,i){
  WFMAP[w.id]=w.nodes;
  var t=document.createElement('button');t.type='button';t.className='tab'+(i===0?' active':'');
  t.dataset.wf=w.id;
  t.textContent=w.short||w.name;
  t.title=w.name+' · '+w.sub;
  t.onclick=function(){ activateTab(w.id); };
  tabs.appendChild(t);
  /* a <section id> rather than a div: the notes widget derives a note's anchor from the
     nearest section[id], so without one every flow shared the same namespace and two
     mapping steps ("Wait · to Day 6", "Email · Day 6") lost their note button to the
     identically-named nurture steps. The id keeps the "automations" prefix the dashboard
     groups on. */
  var fl=document.createElement('section');fl.className='flow'+(i===0?' active':'');fl.id='automations-'+w.id;
  fl.innerHTML=laneHTML(w);
  canvas.appendChild(fl);

  /* The peek panels hang down from their node and are only visibility:hidden, so they are
     laid out even when closed. On the last steps that pushed the page ~340px past the end
     of the canvas and left a band of dead scroll below the dotted background. Anchoring the
     final steps' panels to the bottom of the node instead means nothing ever reaches past
     the last step, and the panel is still fully readable. */
  var ns=fl.querySelectorAll('.node');
  for(var k=Math.max(0,ns.length-2);k<ns.length;k++) ns[k].classList.add('peek-up');
});

/* ===== the Make lane, built the way Make draws itself =====
   A row of numbered circles, the filter on the link rather than in a step, and the error
   handler hanging off the module it protects. Same hover-then-click contract as the GHL
   lanes: the panel is the summary, the modal is the module setup. */
function mkModHTML(m,i,total,si){
  var app=MK_APP[m.app], pk=m.peek||{};
  var pos = i<2 ? ' pleft' : (i>=total-2 ? ' pright' : '');
  var panel='<div class="side mkpanel">'+
    '<div class="dch">'+app.label+'</div>'+
    '<div class="dsub">'+m.title+'</div>'+
    (pk.lead?'<div class="dnote">'+pk.lead+'</div>':'')+
    rowsHTML(pk)+codeHTML(pk)+
    '<div class="dmore">Click for the module setup</div>'+
  '</div>';

  /* data-mk is scenario-scoped ("2-4"), so a jump from a Confidence Mapping tip can never
     land on the module with the same number in the payment scenario. */
  return '<div class="mkmod'+pos+'" data-mk="'+si+'-'+(i+1)+'" style="--c:'+app.c+'">'+
    '<div class="mkcirc"><span class="mknum">'+(i+1)+'</span>'+app.mark+
      '<span class="mkbadge"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">'+
        MK_BADGE[m.badge]+'</svg></span></div>'+
    '<div class="mkapp">'+app.label+'</div>'+
    '<div class="mktitle">'+m.title+'</div>'+
    '<div class="mksub">'+m.sub+'</div>'+
    (m.err?'<div class="mkerr">'+m.err.t+'<span>'+m.err.s+'</span></div>':'')+
    panel+
  '</div>';
}

/* the three linked circles: what a Make scenario looks like from across the room */
const MK_SCEN_ICON='<svg viewBox="0 0 24 24">'+
  '<circle cx="5" cy="12" r="2.6"/><circle cx="12" cy="12" r="2.6"/><circle cx="19" cy="12" r="2.6"/>'+
  '<path d="M7.6 12h1.8"/><path d="M14.6 12h1.8"/></svg>';

function mkScenarioHTML(s,si){
  var chain=s.modules.map(function(m,i){
    var link='';
    if(i>0){
      var f=m.filter;
      link='<div class="mklink'+(f?' filt':'')+'">'+
        (f?'<span class="mkfilt"><svg viewBox="0 0 24 24"><path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg></span>'+
            '<span class="mkfiltlbl">'+f.label+'</span>':'')+'</div>';
    }
    return link+mkModHTML(m,i,s.modules.length,si);
  }).join('');

  /* A section with an id per scenario, not a div: the notes widget namespaces a note by the
     nearest section[id], and both scenarios contain a "Set multiple variables" and a
     "Create a Note". Sharing one namespace, the second of each pair silently lost its note
     button. Same fault the three GHL lanes hit, same fix. */
  return '<section class="mkscen" id="automations-make-'+si+'">'+
    '<div class="mkbar">'+
      '<div class="mkbar-l"><span class="mkgear">'+MK_SCEN_ICON+'</span>'+
        '<div><div class="mkname"><em>Scenario '+si+'</em>'+s.name+'</div>'+
        '<div class="mkpath">'+s.path+'</div></div></div>'+
      '<div class="mkbar-r">'+s.chips.map(function(c){
        return '<span class="mkchip'+(c.warn?' warn':'')+'">'+c.t+'</span>';
      }).join('')+'</div>'+
    '</div>'+
    '<div class="mkrow">'+chain+'</div>'+
  '</section>';
}

(function buildMakeLane(){
  var t=document.createElement('button');
  t.type='button';t.className='tab';t.dataset.wf='make';
  t.textContent='Make.com bridges';
  t.title='The two Make.com scenarios: the Confidence Mapping quiz into GHL, and a Stripe payment into the Welcome Pack';
  t.onclick=function(){ activateTab('make'); };
  tabs.appendChild(t);

  var fl=document.createElement('section');
  fl.className='flow make';fl.id='automations-make';

  fl.innerHTML=
    '<div class="mkwrap">'+
      MAKE.scenarios.map(function(s,i){ return mkScenarioHTML(s,i+1); }).join('')+
      '<div class="mklanes">'+MAKE.lanes.map(function(l){
        return '<div class="mklane'+(l.todo?' todo':'')+'"><b>'+l.k+'</b>'+
          '<div class="lh">'+l.h+'</div><p>'+l.p+'</p></div>';
      }).join('')+'</div>'+
      '<p class="mkfootnote">'+MAKE.foot+'</p>'+
    '</div>';
  canvas.appendChild(fl);
})();

/* Jump from a Confidence Mapping step to the module that does the work. Tips carry a plain
   number and always mean scenario 1; nothing in the GHL lanes points at scenario 2 yet. */
function goMake(n){
  activateTab('make');
  var m=canvas.querySelector('.mkmod[data-mk="'+(/-/.test(String(n))?n:'1-'+n)+'"]');
  if(!m) return;
  m.scrollIntoView({behavior:'smooth',block:'center'});
  m.classList.remove('pulse');
  void m.offsetWidth;              // restart the animation if it is already running
  m.classList.add('pulse');
  setTimeout(function(){m.classList.remove('pulse');},3200);
}

document.querySelectorAll('iframe[data-key]').forEach(function(ifr){
  var html=EMAILS[ifr.getAttribute('data-key')];
  if(html) ifr.srcdoc=html;
});

/* ===== peek panels that stay put =====
   The panels are DOM children of the pill but are drawn outside its box, so crossing the
   visual gap fires mouseleave. A delayed hide, cancelled by re-entering, covers that gap;
   the ::before/::after bridges in the CSS cover the rest. */
(function(){
  var openNode=null, hideTimer=null;
  function show(node){
    clearTimeout(hideTimer);
    if(openNode && openNode!==node) openNode.classList.remove('peek');
    openNode=node; node.classList.add('peek');
  }
  function scheduleHide(){
    clearTimeout(hideTimer);
    hideTimer=setTimeout(function(){
      if(openNode){openNode.classList.remove('peek');openNode=null;}
    },650);
  }
  canvas.addEventListener('mouseover',function(e){
    var node=e.target.closest('.node,.mkmod'); if(node) show(node);
  });
  canvas.addEventListener('mouseout',function(e){
    var node=e.target.closest('.node,.mkmod');
    if(node && !node.contains(e.relatedTarget)) scheduleHide();
  });
  // keyboard/touch: tapping the pill body opens the modal, so the peek is a pointer
  // affordance only. Escape closes it too.
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape' && openNode){openNode.classList.remove('peek');openNode=null;}
  });
})();

/* region switch inside the peek, and clicking a preview card opens that channel */
canvas.addEventListener('click',function(e){
  /* the jump has to be caught before the pill click that would open the step's own modal */
  var gm=e.target.closest('[data-gomake]');
  if(gm){ e.stopPropagation(); goMake(gm.dataset.gomake); return; }

  var mk=e.target.closest('.mkmod');
  if(mk){ openMakeModal(mk.dataset.mk); return; }

  var rg=e.target.closest('.pvrg');
  if(rg){
    e.stopPropagation();
    var card=rg.closest('.pv');
    card.querySelectorAll('.pvrg').forEach(function(x){x.classList.remove('active');});
    rg.classList.add('active');
    var k=rg.getAttribute('data-wak'), t=WA[k]||{};
    card.querySelector('[data-wabody]').textContent=waText(k,'submit');
    var lim=card.querySelector('[data-walimit]'), over=t.submitChars>WA_BODY_LIMIT;
    lim.className='pvlimit '+(over?'over':'ok');
    lim.textContent=waLimitText(k);
    return;
  }
  var node=e.target.closest('.node'); if(!node) return;
  var card2=e.target.closest('.pv');
  var mode=card2 ? card2.getAttribute('data-open') : null;
  openModal(WFMAP[node.dataset.fl][+node.dataset.i], node.dataset.fl, +node.dataset.i, mode);
});

/* ===== phone frames =====
   DEVICES, devSpec, avatar, sbIcons, statusBar, phone, devcol, gmailPane, outlookPane,
   subjectOf and fitMailFrames all live in mail-preview.js now, which is loaded before this
   script. The function names did not change, so no call site on this page moved: only the
   definitions did. waPane below still builds on devcol() and statusBar() from there.

   Both email panes render the same HTML at the same width: the inbox chrome is what differs.
   The one client that genuinely renders differently is DESKTOP Outlook, which renders through
   Word rather than a browser engine. That is what the fonts banner at the top of this page is
   about, and mapping-result/mapping-result.html now draws it as its own pane. */

/* icons for the reply bar */
var WICON={
  smiley:'<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/>',
  clip:'<path d="M20.4 11.6 12 20a5 5 0 0 1-7.1-7.1l8.5-8.4a3.5 3.5 0 0 1 5 5l-8.5 8.4a2 2 0 0 1-2.8-2.8l7.8-7.7"/>',
  cam:'<path d="M3 8.5A2 2 0 0 1 5 6.5h1.2l1-1.6h5.6l1 1.6H15a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="10" cy="12" r="3"/>',
  mic:'<path d="M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3z"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/>'
};
function wIcon(k){return '<svg viewBox="0 0 24 24">'+WICON[k]+'</svg>';}

/* the compose row. Inert by design, nothing to send from a preview, but a chat screen
   without it does not read as WhatsApp. */
function waCompose(kind){
  if(kind==='iphone'){
    return '<div class="wa-compose ios">'+
      '<span class="wa-plus">+</span>'+
      '<div class="wa-input"><span class="ph">Message</span>'+wIcon('smiley')+'</div>'+
      '<span class="out">'+wIcon('cam')+'</span>'+
      '<span class="out">'+wIcon('mic')+'</span>'+
    '</div>';
  }
  return '<div class="wa-compose and">'+
    '<div class="wa-input">'+wIcon('smiley')+'<span class="ph">Message</span>'+
      wIcon('clip')+wIcon('cam')+'</div>'+
    '<div class="wa-mic">'+wIcon('mic')+'</div>'+
  '</div>';
}

function waBubble(text,buttons){
  var btns=(buttons||[]).map(function(b){return '<div class="wa-btn">'+esc(b)+'</div>';}).join('');
  return '<div class="wa-daypill">TODAY</div>'+
    '<div class="wa-in">'+esc(text)+'<span class="wa-time">09:41</span></div>'+
    (btns?'<div class="wa-btns">'+btns+'</div>':'');
}
function waPane(side,kind,text,buttons){
  var head = kind==='iphone'
    ? '<div style="background:#F6F6F6;">'+statusBar(kind,false)+'</div>'+
      '<div class="wa-ios-bar"><span class="wa-chevron">&#8249;</span>'+
        '<div class="wa-ios-mid">Tara Rose Salon<small>Business account</small></div>'+avatar(30)+'</div>'
    : '<div style="background:#075E54;">'+statusBar(kind,true)+'</div>'+
      '<div class="wa-and-bar">'+
        '<svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2;"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>'+
        avatar(32)+
        '<div class="wa-bar-name" style="flex:1">Tara Rose Salon<small>Business account</small></div>'+
      '</div>';
  return devcol(side,'WhatsApp',kind,
    head+'<div class="wa-thread">'+waBubble(text,buttons)+'</div>'+waCompose(kind));
}

/* Copy, not "open in a new tab". Everything is already visible in one click, so the only
   thing a second window was still doing was nothing. What is actually needed next is
   pasting: the HTML into the GHL email builder, the body text into Meta's template form. */
function copyToClipboard(text,btn){
  function done(ok){
    var was=btn.innerHTML;
    btn.innerHTML=ok?'Copied &#10003;':'Press Ctrl+C';
    setTimeout(function(){btn.innerHTML=was;},1800);
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){done(true);},function(){fallback();});
  } else { fallback(); }
  function fallback(){
    // file:// and older browsers refuse the async clipboard API; a selected textarea still works
    var ta=document.createElement('textarea');
    ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    var ok=false; try{ ok=document.execCommand('copy'); }catch(e){}
    ta.remove(); done(ok);
  }
}

/* ===== modal ===== */
var mback=document.getElementById('mback'), modal=document.getElementById('modal');
function closeModal(){mback.classList.remove('open');modal.innerHTML='';}

/* Which handset each column shows. Kept outside openModal so a choice survives closing the
   modal and opening the next step: pick your phone once, not thirteen times. */
var DEVSIDE={left:'samsung',right:'iphone'};

function openModal(n,fl,idx,mode){
  var col=COLOR[n.t]||'#666', tp=n.tip||{};
  // mode says which channel was clicked. Falling back: email if there is one, else WhatsApp.
  if(mode!=='email' && mode!=='wa') mode = n.emailKey ? 'email' : (n.waKeys ? 'wa' : null);

  var head='<div class="mhead"><div class="mico" style="background:'+col+'"><svg viewBox="0 0 24 24">'+ICON[n.t]+'</svg></div>'+
    '<div><div class="mtt">'+n.title+'</div><div class="mss">'+(tp.sub||TYPELABEL[n.t]||'')+'</div></div>'+
    '<button class="mx" id="mx" aria-label="Close">&times;</button></div>';

  var body='', foot='', ctl='';
  /* A step that has a preview shows the preview, so the full note has nowhere else to go.
     It sits above the handsets rather than in the footer, where it would be read after the
     thing it is meant to warn you about. */
  var longBand = tp.long ? '<div class="mlong">'+rowsHTML(tp)+codeHTML(tp)+
    '<p>'+esc(stripTags(tp.long))+'</p></div>' : '';
  var chsw = (n.emailKey && n.waKeys)
    ? '<div class="grp"><span class="glbl">Channel</span>'+
      '<button'+(mode==='email'?' class="active"':'')+' data-ch="email">Email</button>'+
      '<button'+(mode==='wa'?' class="active"':'')+' data-ch="wa">WhatsApp</button></div>'
    : '';

  if(mode==='email'){
    ctl='<div class="mctl">'+chsw+'</div>'+longBand;
    body='<div class="mstage" data-mailstage></div>';
    foot='<div class="mfoot"><span class="mnote2">Both panes render the same HTML at that handset&rsquo;s true viewport width, so this is the real first screen. Switch the handset above each one. The unsubscribe link points at the live site here; GHL swaps in its own preference-centre URL at send.</span>'+
      '<button class="mopen" data-copy="mail">Copy the email HTML</button></div>';
  } else if(mode==='wa'){
    var keys=n.waKeys||[], hasLonger=keys.some(function(x){return !!(WA[x]||{}).longer;});
    /* The count sits ON the region button, not only on the active message, so both regions'
       official numbers are readable without clicking between them. */
    var reg = keys.length>1 ? '<div class="grp"><span class="glbl">Region</span>'+
      keys.map(function(x,i){return '<button class="'+(i===0?'active':'')+'" data-wak="'+x+'">'+
        esc((WA[x]||{}).region||'')+' <b class="bchars">'+(WA[x]||{}).submitChars+'</b></button>';}).join('')+'</div>' : '';
    var len = hasLonger ? '<div class="grp"><span class="glbl">Version</span>'+
      '<button class="active" data-len="submit">Submitting this</button>'+
      '<button data-len="longer">Longer draft</button></div>' : '';
    ctl='<div class="mctl">'+chsw+reg+len+'<span class="chars" data-chars></span></div>'+longBand;
    body='<div class="mstage" data-wastage></div>';
    foot='<div class="mfoot"><span class="mnote2">Shown as she receives it, so the bubble is incoming. You are looking at the body that gets submitted to Meta, capped at '+WA_BODY_LIMIT+' characters, with button labels capped at '+WA_BUTTON_LIMIT+'. Anything over is rejected at submission, so the build refuses to produce it.</span>'+
      '<button class="mopen" data-copy="wa">Copy the message text</button></div>';
  } else {
    /* A step with nothing to preview. The hover panel is a summary now, so this is where the
       whole note lives: the same rows and code as the peek, then the full text under them. */
    body='<div class="mplain">'+rowsHTML(tp)+codeHTML(tp)+
      '<div class="mplainbody"'+(tp.rows||tp.code?' style="margin-top:16px"':'')+'>'+
      esc(stripTags(tp.long||tp.note||tp.body||''))+'</div>'+
      (tp.make?'<div style="margin-top:14px">'+makeJumpHTML(tp)+'</div>':'')+'</div>';
  }

  modal.innerHTML=head+ctl+body+foot;
  modal.querySelector('#mx').addEventListener('click',closeModal);

  var state={key:(n.waKeys||[])[0], len:'submit'};

  function paintMail(){
    var html=EMAILS[n.emailKey]||'', subj=subjectOf(html);
    var stage=modal.querySelector('[data-mailstage]');
    stage.innerHTML=gmailPane('left',DEVSIDE.left,subj)+outlookPane('right',DEVSIDE.right,subj);
    fitMailFrames(stage,html);
  }
  function paintWa(){
    var t=WA[state.key]||{}, txt=waText(state.key,state.len), c=waChars(state.key,state.len);
    var stage=modal.querySelector('[data-wastage]');
    stage.innerHTML=waPane('left',DEVSIDE.left,txt,t.buttons)+waPane('right',DEVSIDE.right,txt,t.buttons);
    var charsEl=modal.querySelector('[data-chars]'), over=c>WA_BODY_LIMIT;
    charsEl.className='chars '+(over?'over':'ok');
    charsEl.textContent=c+' / '+WA_BODY_LIMIT+' characters'+
      (over ? ' · over Meta’s limit, cannot be submitted'
            : (state.len==='submit' ? ' · within Meta’s limit' : ''))+
      ' · voucher URL counted';
  }
  var repaint = mode==='email' ? paintMail : (mode==='wa' ? paintWa : null);
  if(repaint) repaint();

  // one listener for the whole modal: channel, region, version, handset, copy
  modal.addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b) return;
    if(b.dataset.gomake){ closeModal(); goMake(b.dataset.gomake); return; }
    if(b.dataset.ch){ openModal(n,fl,idx,b.dataset.ch); return; }
    if(b.dataset.dev){ setActive(b); DEVSIDE[b.dataset.side]=b.dataset.dev; if(repaint) repaint(); return; }
    if(b.dataset.wak){ setActive(b); state.key=b.dataset.wak; paintWa(); return; }
    if(b.dataset.len){ setActive(b); state.len=b.dataset.len; paintWa(); return; }
    if(b.dataset.copy==='mail'){ copyToClipboard(EMAILS[n.emailKey]||'',b); return; }
    if(b.dataset.copy==='wa'){ copyToClipboard(waText(state.key,state.len),b); return; }
  });

  mback.classList.add('open');
}
function setActive(btn){
  btn.parentNode.querySelectorAll('button').forEach(function(x){x.classList.remove('active');});
  btn.classList.add('active');
}

/* ===== a Make module, opened =====
   Deliberately laid out like Make's own module setup sheet: the settings as label/value
   pairs in run order, then the reasoning under them. Whoever builds this should be able to
   work top to bottom with this open on one screen and Make on the other. */
function mkFieldsHTML(f){
  return '<div class="mkfields">'+f.map(function(r){
    return '<span class="mkfk">'+r[0]+'</span><span class="mkfv">'+r[1]+'</span>';
  }).join('')+'</div>';
}
function mkTableHTML(){
  return '<div class="mktable"><table><thead><tr><th>GF</th><th>arrives as</th><th>GHL field</th><th>type</th></tr></thead><tbody>'+
    CM_FIELDS.map(function(r){
      var hot = r[2]==='cm_pain' || r[2]==='cm_condition';
      return '<tr'+(hot?' class="hot"':'')+'><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>';
    }).join('')+'</tbody></table></div>';
}
function openMakeModal(ref){
  var parts=String(ref).split('-'), s=MAKE.scenarios[+parts[0]-1];
  if(!s) return;
  var i=+parts[1]-1, m=s.modules[i]; if(!m) return;
  var app=MK_APP[m.app];

  var head='<div class="mhead"><div class="mico" style="background:'+app.c+'">'+
      (m.app==='ghl' ? '<span style="font-weight:800;font-size:13px">HL</span>' : app.mark)+'</div>'+
    '<div><div class="mtt">'+(i+1)+'. '+m.title+'</div>'+
    '<div class="mss">'+app.label+' &middot; '+m.sub+' &middot; scenario '+parts[0]+', '+s.name+'</div></div>'+
    '<button class="mx" id="mx" aria-label="Close">&times;</button></div>';

  var body='<div class="mkcfg">'+(m.cfg||[]).map(function(s){
    return '<div class="mksec">'+
      (s.h?'<h4>'+s.h+'</h4>':'')+
      (s.fields?mkFieldsHTML(s.fields):'')+
      (s.p?'<p>'+s.p+'</p>':'')+
      (s.table?mkTableHTML():'')+
      (s.code?'<pre class="mkpre">'+s.code+'</pre>':'')+
      (s.warn?'<div class="mkwarn">'+s.warn+'</div>':'')+
    '</div>';
  }).join('')+'</div>';

  var foot='<div class="mfoot"><span class="mnote2">Nothing on this screen has been built. '+
    'The Make account has not been opened and the nineteen GHL fields do not exist yet, so every '+
    'value here is a specification for whoever has the logins, not a record of a live module.</span>'+
    '<button class="mopen" data-copy="mkcfg">Copy this module&rsquo;s settings</button></div>';

  modal.innerHTML=head+body+foot;
  modal.querySelector('#mx').addEventListener('click',closeModal);
  modal.addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b) return;
    if(b.dataset.copy==='mkcfg'){
      copyToClipboard(modal.querySelector('.mkcfg').innerText,b);
    }
  });
  mback.classList.add('open');
}

mback.addEventListener('click',function(e){ if(e.target===mback) closeModal(); });
document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeModal(); });

/* ===== the banner notes =====
   Collapsed by default so the canvas is the first thing on screen, but the header keeps
   count of what has not been opened yet, so folding them away cannot quietly turn into
   nobody reading them. "Read" is remembered per browser; on file:// with storage blocked
   it just falls back to everything showing as unread, which is the safe direction.
   The count is COUNTED, never typed: the HTML said "4 notes" while there were five banners
   and would have been wrong again the moment a sixth landed. */
(function(){
  var notes=[].slice.call(document.querySelectorAll('details.banner'));
  if(!notes.length) return;
  var countEl=document.getElementById('nhCount'), allBtn=document.getElementById('nhAll');
  var KEY='bv-note-read-';
  function store(k,v){ try{ localStorage.setItem(KEY+k,v); }catch(e){} }
  function stored(k){ try{ return localStorage.getItem(KEY+k)==='1'; }catch(e){ return false; } }

  function paint(){
    var unread=notes.filter(function(n){ return !n.classList.contains('read'); }).length;
    countEl.textContent = unread ? unread+' to read' : notes.length+' notes';
    countEl.style.background = unread ? '' : 'var(--muted)';
    var anyClosed=notes.some(function(n){ return !n.open; });
    allBtn.textContent = anyClosed ? 'Open all' : 'Close all';
  }

  notes.forEach(function(n){
    if(stored(n.dataset.nid)) n.classList.add('read');
    n.addEventListener('toggle',function(){
      if(n.open && !n.classList.contains('read')){
        n.classList.add('read'); store(n.dataset.nid,'1');
      }
      paint();
    });
  });

  allBtn.addEventListener('click',function(){
    var open=notes.some(function(n){ return !n.open; });
    notes.forEach(function(n){ n.open=open; });
  });

  paint();
})();

  /* Pin a note to a single workflow step. The node title is the label, and the workflow
     id prefixes the anchor so the same step name in two flows never collides.
     float:false on purpose: it gets the "Note" word that way, and the CSS above puts it
     outside the pill at the bottom right. */
  window.TRS_ANCHOR_PREFIX = 'automations';
  window.TRS_PIN_TARGETS = [
    { sel: '.node', into: null, labelSel: '.ntitle', float: false },
    /* the Make modules take notes too: the whole point of that lane is that someone with the
       logins reads it and says which module is wrong before it gets built */
    { sel: '.mkmod', into: null, labelSel: '.mktitle', float: false }
  ];

/* ===== the header, collapsed by default =====
   Default collapsed. The three header rows are orientation, and orientation is a first-visit
   need, not a permanent one: on a laptop they cost about a third of the viewport on every
   subsequent visit. localStorage, same pattern as the campaign clock in schedule.js.
   The class goes on body rather than on .top because the clock rows are injected into .top by
   schedule.js after this runs, and a body class reaches them whenever they arrive. */
(function(){
  var btn = document.getElementById('hdrTog');
  if(!btn) return;
  var KEY = 'trs-bv-automations-header-v1';
  function set(collapsed){
    document.body.classList.toggle('hdr-collapsed', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.textContent = collapsed ? 'Show guide' : 'Hide guide';
    try{ localStorage.setItem(KEY, collapsed ? '1' : '0'); }catch(e){}
  }
  var saved = '1';
  try{ var v = localStorage.getItem(KEY); if(v !== null) saved = v; }catch(e){}
  set(saved === '1');
  btn.onclick = function(){ set(!document.body.classList.contains('hdr-collapsed')); };
})();

/* ===== zoom, the way the GHL builder zooms =====
   An 18-step lane does not fit a laptop at 100%, and the answer a reviewer wants is not "scroll
   more", it is "show me less of it, bigger or smaller". Applied with `zoom` on each .flow rather
   than a transform on the canvas: zoom REFLOWS, so the canvas grows and shrinks with its content
   and there is no dead band under a zoomed-out lane and no blurred text. It also stays off the
   canvas itself, which keeps the dotted grid at a constant size — the diagram scales, the paper
   it sits on does not.
   Capped at 130%: above that the 880px fork is wider than the canvas on a 1280px laptop, and the
   fix for that would be a scrolling canvas, which would clip every peek panel. */
(function(){
  var STEPS = [50,60,70,80,90,100,110,120,130];
  var out = document.getElementById('zOut'),
      inn = document.getElementById('zIn'),
      lvl = document.getElementById('zLvl');
  if(!out || !inn || !lvl) return;
  var KEY = 'trs-bv-automations-zoom-v1', HOME = STEPS.indexOf(100), i = HOME;
  try{ var j = STEPS.indexOf(parseInt(localStorage.getItem(KEY),10)); if(j >= 0) i = j; }catch(e){}
  function set(next){
    i = Math.max(0, Math.min(STEPS.length - 1, next));
    var z = STEPS[i];
    /* on the root, not on .canvas: the fork's leg-width cap reads --zoom in a calc() too, so a
       zoomed-in 3-way fork still keeps its outer leg inside the canvas */
    document.documentElement.style.setProperty('--zoom', z / 100);
    lvl.textContent = z + '%';
    out.disabled = i === 0;
    inn.disabled = i === STEPS.length - 1;
    try{ localStorage.setItem(KEY, String(z)); }catch(e){}
  }
  out.onclick = function(){ set(i - 1); };
  inn.onclick = function(){ set(i + 1); };
  lvl.onclick = function(){ set(HOME); };
  canvas.addEventListener('wheel', function(e){
    if(!e.ctrlKey && !e.metaKey) return;   /* a plain wheel must still scroll the page */
    e.preventDefault();
    set(i + (e.deltaY < 0 ? 1 : -1));
  }, {passive:false});
  set(i);
})();

/* ===== the banner stack, folded into its own header row =====
   .top was not the only thing eating the fold: .noteshead plus six banners is another seven
   rows before the canvas. Six rows become one, one click brings them back.
   Not folded into the header toggle above, deliberately: these are labelled "Read before you
   review", so the row, the label and the unread count stay visible whatever this is set to.
   Nothing is hidden here that was not already behind a <details> — the bodies were always
   collapsed, and the count pill keeps saying how many have not been opened. */
(function(){
  var btn   = document.getElementById('nhTog');
  var stack = document.getElementById('noteStack');
  if(!btn || !stack) return;
  var KEY = 'trs-bv-automations-notes-v1';
  var n   = stack.querySelectorAll('details.banner').length;
  function set(collapsed){
    document.body.classList.toggle('notes-collapsed', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.textContent = collapsed ? 'Show the notes' : 'Fold the notes';
    btn.title = collapsed
      ? 'Open the ' + n + ' notes that sit above the canvas'
      : 'Fold the ' + n + ' notes back into this row';
    try{ localStorage.setItem(KEY, collapsed ? '1' : '0'); }catch(e){}
  }
  var saved = '1';
  try{ var v = localStorage.getItem(KEY); if(v !== null) saved = v; }catch(e){}
  set(saved === '1');
  btn.onclick = function(){ set(!document.body.classList.contains('notes-collapsed')); };
})();
