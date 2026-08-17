/* ===== The campaign clock =====
   Added 10 Aug 2026. Two-ended since 10 Aug: a start AND a close, and a choice of which one
   gives way when the other moves.

   The workflow map drew the arc as "Day 0 · Day 2 · Day 4 · Day 6 · Day 8", which is how GHL
   thinks about it and not how anybody planning a campaign thinks about it. Set the dates here
   and every step in Lead Nurture picks up a real one.

   The first version had one date, the start, and derived the close from it. That only ever
   answered half the question. The close is not a preference: "30 September" is written into the
   body of all five nurture emails and nurture-5 says the window closes tonight. So there are
   genuinely two ways to move this campaign and the page has to offer both:

     KEEP THE CLOSE, FIT THE ARC. The close stays where it is and the gaps between the five
     sends stretch or squeeze to reach it. A later start means a tighter arc; an earlier one
     means more air between the emails. The copy keeps its promise.

     KEEP THE ARC, MOVE THE CLOSE. The eight-day arc stays exactly as drawn and the close
     travels with the start. The copy in five files stops being true and has to be rewritten.

   RESCHEDULED 12 Aug 2026. The window now OPENS on 17 August and CLOSES on 30 September, six
   weeks rather than three. Five emails cannot carry six weeks: fitted across the whole window
   they land eleven days apart, which is not a nurture arc, it is a series of strangers. So the
   two things were separated. The purchase window is one span; the nurture arc is a fifteen-day
   countdown that runs at the END of it, into the close. OPEN below is the day the window goes
   live and nothing in the arc hangs off it. What still fills 17 August to 14 September is a
   question for the social calendar, not for this file.

   Fifteen days, not eight, and the number is not a preference. On an eight-day arc nurture-4
   ("Four days left") sits two days out and the headline is a lie. Fifteen is the one window in
   which it is literally true, which this file computes rather than remembers, so DEFAULT is
   CLOSE minus fifteen and every locked line in the emails survives the move.

   Two kinds of clock as well, and keeping THOSE apart is the other job of this file:

     Lead Nurture is on the CAMPAIGN clock. It is a broadcast: everybody gets Day 0 on the same
     morning, so every step has a real calendar date and the last one has to land on the close.

     Welcome Pack and Confidence Mapping are on HER clock. They start when she pays or when she
     submits the quiz, which is whenever she does it. A calendar date on those steps would be a
     lie, so they show offsets and say why.

   The offsets below are read off the wait nodes in WF (automations.js) rather than parsed out
   of their titles, because "Wait · to Day 5–7" is prose and prose drifts. A wait node carries
   the day it RESOLVES to, so it reads as "the wait that ends on Day 2" rather than "the wait
   that starts on Day 0". null means the step has no position on either clock: a goal, an exit,
   or a branch that can fire at any point in the arc.

   "Day 4" stays the NAME of a step even when the arc has been squeezed and Day 4 is really the
   third morning. Every node title on the canvas says Day 4, the file is called nurture3, and
   renaming those from here would make the map disagree with itself. The date is the thing that
   moves; the day number is the label it moves under. */
(function(){

  /* The three dates come from data/campaign-dates.js now, loaded before this file, because
     data/calendar-data.js used to carry its own copy of them and the two drifted the first
     time the campaign moved. The fallbacks are the campaign as at 12 Aug 2026: this file has
     to keep working if it is ever opened without that script beside it. */
  var W          = (typeof BV_WINDOW !== 'undefined' ? BV_WINDOW : {});
  /* Bumped on the 12 Aug reschedule. The old key holds an August arc that is no longer the
     campaign, and a browser that has one would quietly override every default below and show
     the reviewer dates nobody set. A new key is the only way a default reaches a returning
     browser at all. */
  var STORE      = 'trs-bv-campaign-clock-v2';
  var OPEN       = W.open  || '2026-08-17';   /* the window goes live; nothing in the arc hangs off it */
  var CLOSE_COPY = W.close || '2026-09-30';   /* hardcoded in the body of all five nurture emails */
  var ARC_DAYS   = W.arc   || 15;             /* the countdown that makes "Four days left" true */
  var DEFAULT    = iso(addDays(parse(CLOSE_COPY), -ARC_DAYS));  /* the close, less that countdown */
  var ARC_LAST   = 8;              /* the Day 8 "Final day" email */
  var DEF_MODE   = 'fit';          /* the copy is locked, so protecting the close is the safer default */
  /* The close as the emails write it. Every line below that quotes the date calls this, so
     moving the window in campaign-dates.js cannot leave this page quoting a date that is no
     longer in any email. A function rather than a constant: MONFULL is assigned further down
     and would still be undefined up here. */
  function closeTxt(){ var d = parse(CLOSE_COPY); return d.getDate() + ' ' + MONFULL[d.getMonth()]; }

  /* index → day. The arrays are length-checked against WF at boot, so a step added to a
     workflow without a day here fails loudly in the console instead of silently shifting
     every date below it by one. A number is a day; [a,b] is a range the build has not
     pinned down; null is "no position on a clock". */
  var OFFSETS = {
    blast:   [0,0,0,0,0, null, 2, null,null,null],
    nurture: [0,0,0,0,0,0,0, 2,2,2, 4,4, 6,6, 8,8, null,null],
    welcome: [0,0,0,0,0, [1,2],[1,2], [5,7],[5,7],[5,7], null,null,null],
    mapping: [0,0,0,0,0,0,0, 1,1,1, 3,3, 6,6, null]
  };

  /* Which clock each workflow is on. Three modes, not two, since the blast lane landed on
     17 Aug: it is absolute like the nurture arc, but it is anchored to the window OPENING
     rather than to the arc start, and the difference is four weeks. Dating it off the arc
     would announce the window a month after it opened, which is the exact gap this lane
     exists to fill. */
  var CLOCK = {
    blast:   'open',
    nurture: 'campaign',
    welcome: 'contact',
    mapping: 'contact'
  };

  var ENTRY = {
    blast:   'the day the purchase window opens',
    welcome: 'the moment <code>voucher:paid</code> lands',
    mapping: 'the moment she submits the quiz'
  };

  /* ===== dates, built from local components =====
     new Date('2026-08-20') parses as UTC midnight, which is the previous day for anyone west
     of Greenwich. Building from explicit local parts means the chip says the same thing in
     Abu Dhabi and in London. */
  function parse(iso){
    var p = String(iso).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function iso(d){
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }
  function addDays(d, n){
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }
  function between(a, b){ return Math.round((b - a) / 86400000); }
  var DAYNAME = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MONNAME = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var MONFULL = ['January','February','March','April','May','June','July','August',
                 'September','October','November','December'];
  function fmt(d){ return DAYNAME[d.getDay()] + ' ' + d.getDate() + ' ' + MONNAME[d.getMonth()]; }
  function fmtLong(d){ return fmt(d) + ' ' + d.getFullYear(); }
  function plural(n, w){ return n + ' ' + w + (Math.abs(n) === 1 ? '' : 's'); }

  /* ===== state =====
     Three things now, so the store holds JSON. The old store held a bare start date; read it
     back as the arc it drew rather than snapping it to anything, so anyone returning to the
     page sees exactly what they left. */
  var state = load();

  function load(){
    var raw = null;
    try { raw = localStorage.getItem(STORE); } catch(e){}
    var s = parse(DEFAULT), e = parse(CLOSE_COPY), m = DEF_MODE;

    if(raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)){          /* the pre-10-Aug format */
      s = parse(raw); e = addDays(s, ARC_LAST);
    } else if(raw){
      try {
        var o = JSON.parse(raw);
        if(/^\d{4}-\d{2}-\d{2}$/.test(o.start)) s = parse(o.start);
        if(/^\d{4}-\d{2}-\d{2}$/.test(o.end))   e = parse(o.end);
        if(o.mode === 'fit' || o.mode === 'shift') m = o.mode;
      } catch(err){}
    }
    if(between(s, e) < 1) e = addDays(s, ARC_LAST);
    return { start: s, end: e, mode: m };
  }
  function save(){
    try {
      localStorage.setItem(STORE, JSON.stringify({
        start: iso(state.start), end: iso(state.end), mode: state.mode
      }));
    } catch(e){}
  }

  /* ===== the arc, mapped onto real days =====
     One formula covers both modes, because "keep the arc" is only "fit" with the window nailed
     to eight. A day on the drawn arc lands at its own share of whatever window the two dates
     leave: Day 4 of 8 sits halfway, wherever halfway now is. */
  function windowDays(){ return Math.max(1, between(state.start, state.end)); }
  function offsetIn(day, w){ return Math.round(day * w / ARC_LAST); }
  function offsetOf(day){ return offsetIn(day, windowDays()); }
  function dateOf(day){ return addDays(state.start, offsetOf(day)); }

  /* The five sends, as distinct arc days, in order. Read from OFFSETS so adding a send to the
     arc does not need a second list here. */
  function arcDays(){
    var seen = [];
    OFFSETS.nurture.forEach(function(d){
      if(d === null) return;
      var n = Array.isArray(d) ? d[0] : d;
      if(seen.indexOf(n) < 0) seen.push(n);
    });
    return seen.sort(function(a,b){ return a - b; });
  }

  /* Squeeze the window far enough and two sends land on the same morning. That is a real
     outcome of a real setting, not an error to hide, so it is allowed and then said out loud. */
  function collisions(){
    var byOff = {}, out = [];
    arcDays().forEach(function(d){
      var o = offsetOf(d);
      (byOff[o] = byOff[o] || []).push(d);
    });
    Object.keys(byOff).forEach(function(o){ if(byOff[o].length > 1) out.push(byOff[o]); });
    return out;
  }

  /* ===== the label one step carries =====
     On the campaign clock that is a date. On her clock it is an offset, and "+0" is written
     out as "same minute" because that is what the node actually does. */
  function labelFor(flow, day){
    if(day === null || day === undefined) return null;
    var range = Array.isArray(day);
    var from  = range ? day[0] : day;
    var to    = range ? day[1] : day;

    if(CLOCK[flow] === 'campaign'){
      return { text: fmt(dateOf(from)), day: 'Day ' + from };
    }
    /* The third clock. Absolute, like the campaign one, but counted from the day the window
       goes live rather than from the first nurture send, so the announcement cannot drift a
       month behind the thing it announces. Nothing here moves when the arc is re-dated in the
       header, which is the point: OPEN is a fact about the campaign, not a setting. */
    if(CLOCK[flow] === 'open'){
      return { text: fmt(addDays(parse(OPEN), from)), day: 'Open +' + from };
    }
    if(from === 0) return { text: 'Same minute', day: '+0' };
    return {
      text: range ? '+' + from + '–' + to + ' days' : '+' + plural(from, 'day'),
      day:  range ? 'Day ' + from + '–' + to : 'Day ' + from
    };
  }

  /* ===== paint the chips onto the nodes already on the canvas =====
     automations.js has finished rendering by the time this runs, so this reads the DOM rather
     than reaching into nodeHTML. That keeps the clock a layer over the map instead of a
     rewrite of it: delete this file and the page is exactly what it was. */
  function paint(){
    Object.keys(OFFSETS).forEach(function(flow){
      var sec = document.getElementById('automations-' + flow);
      if(!sec) return;
      var nodes = sec.querySelectorAll('.node');

      if(nodes.length !== OFFSETS[flow].length){
        console.warn('[campaign clock] ' + flow + ' has ' + nodes.length +
          ' steps but ' + OFFSETS[flow].length + ' offsets. Dates below the mismatch will be' +
          ' wrong. Fix OFFSETS in schedule.js.');
      }

      nodes.forEach(function(node, i){
        var lab = labelFor(flow, OFFSETS[flow][i]);
        var chip = node.querySelector('.nday');
        if(!lab){
          if(chip) chip.remove();
          return;
        }
        if(!chip){
          chip = document.createElement('span');
          chip.className = 'nday';
          node.insertBefore(chip, node.firstChild);
        }
        chip.className = 'nday' + (CLOCK[flow] === 'campaign' ? ' abs'
                                 : CLOCK[flow] === 'open'     ? ' open' : ' rel');
        chip.innerHTML = '<b>' + lab.text + '</b><i>' + lab.day + '</i>';
      });
    });
    document.body.classList.add('has-clock');
  }

  /* ===== the control in the header ===== */
  var row = document.createElement('div');
  row.className = 'toprow-clock';
  row.innerHTML =
    '<div class="clockwrap">' +
      /* "First nurture send", not "Campaign starts". Since the 12 Aug reschedule those are two
         different days a month apart, and the old label would have read as the window opening. */
      '<label class="clocklbl" for="bvStart">First nurture send</label>' +
      '<input type="date" id="bvStart" class="clockinput">' +
      '<label class="clocklbl" for="bvEnd">Closes</label>' +
      '<input type="date" id="bvEnd" class="clockinput">' +
      '<button type="button" class="clockreset" id="bvReset" title="Back to the campaign the ' +
        'emails describe: the window opens ' + fmtLong(parse(OPEN)) + ', the nurture arc runs the ' +
        'last ' + ARC_DAYS + ' days into ' + closeTxt() + '">Reset</button>' +
    '</div>' +
    '<div class="clockout" id="bvOut"></div>';

  var modeRow = document.createElement('div');
  modeRow.className = 'toprow-mode';
  modeRow.innerHTML =
    '<span class="clocklbl">When one date moves</span>' +
    '<div class="clockmode" id="bvMode">' +
      '<button type="button" data-mode="fit">Keep the close, fit the arc</button>' +
      '<button type="button" data-mode="shift">Keep the arc, move the close</button>' +
    '</div>' +
    '<span class="clockhint" id="bvHint"></span>';

  var top  = document.querySelector('.top');
  var row3 = document.querySelector('.toprow3');
  if(top && row3){ top.insertBefore(row, row3); top.insertBefore(modeRow, row3); }

  var out   = document.getElementById('bvOut');
  var hint  = document.getElementById('bvHint');
  var input = document.getElementById('bvStart');
  var endIn = document.getElementById('bvEnd');

  var HINT = {
    fit: 'The close stays where you put it and the five sends spread themselves across whatever ' +
         'window is left. Leave the close on ' + closeTxt() + ' and every date written into the copy stays true.',
    shift: 'The eight-day arc stays exactly as drawn and the two dates travel together. Move either ' +
           'one and the close moves off the ' + closeTxt() + ' written into five emails, so that copy has to change.'
  };

  /* ===== what the two dates tell you =====
     The five nurture emails say "30 September" in their body copy, and nurture-5 says "closes
     tonight". So the close is not a preference, it is a promise already written into an asset.
     Whichever mode you are in, the reader has to be told whether the promise still holds. */
  function render(){
    input.value = iso(state.start);
    endIn.value = iso(state.end);
    hint.textContent = HINT[state.mode];

    [].forEach.call(document.querySelectorAll('#bvMode button'), function(b){
      b.setAttribute('aria-pressed', b.dataset.mode === state.mode ? 'true' : 'false');
    });

    var close  = dateOf(ARC_LAST);
    var wanted = parse(CLOSE_COPY);
    var drift  = between(wanted, close);
    var w      = windowDays();
    var clash  = collisions();

    var open   = parse(OPEN);
    var runway = between(open, state.start);

    out.innerHTML =
      /* The window is longer than the arc now, so the arc alone no longer describes the
         campaign. This says both: when it goes live, and how much of the run the five emails
         actually cover. */
      '<span class="clockday" title="The purchase window goes live on this day. Nothing in the ' +
        'nurture arc hangs off it.">Window opens <b>' + fmtLong(open) + '</b></span>' +
      /* short enough to sit beside the two date inputs on one line; the full name of the
         Day 8 email is one hover away and spelled out in the Timeline lane anyway */
      '<span class="clockday" title="Day ' + ARC_LAST + ' is the &ldquo;Final day&rdquo; email, ' +
        'nurture-5">' + arcDays().length + ' sends across <b>' + plural(w, 'day') +
        '</b> &middot; Day ' + ARC_LAST + ' lands <b>' + fmtLong(close) + '</b></span>' +
      '<span class="clockflag ' + (drift === 0 ? 'ok' : 'off') + '">' +
        (drift === 0
          ? 'Matches the ' + closeTxt() + ' written into the emails'
          : (plural(Math.abs(drift), 'day') + (drift > 0 ? ' after' : ' before') +
             ' the ' + closeTxt() + ' written into the emails')) +
      '</span>' +
      /* A nurture arc that begins before the window is live is a send with nothing to link
         to. Worth saying out loud rather than leaving it to be noticed on the Timeline. */
      (runway < 0
        ? '<span class="clockflag off">Starts ' + plural(-runway, 'day') + ' before the window opens</span>'
        : '<span class="clockday">' + plural(runway, 'day') + ' of window before the first send</span>') +
      (clash.length
        ? '<span class="clockflag off">Too tight: two sends share a day</span>'
        : '');

    paint();
    renderTimeline();
  }

  /* The two dates are one setting with two ends. Which end gives way is the mode, and nothing
     here silently rewrites the one you just typed: in "fit" your close is left alone, in
     "shift" the other end follows by exactly the eight days of the arc. */
  function setStart(d){
    state.start = d;
    if(state.mode === 'shift') state.end = addDays(d, ARC_LAST);
    else if(between(state.start, state.end) < 1) state.end = addDays(d, ARC_LAST);
    save(); render();
  }
  function setEnd(d){
    state.end = d;
    if(state.mode === 'shift') state.start = addDays(d, -ARC_LAST);
    else if(between(state.start, state.end) < 1) state.start = addDays(d, -ARC_LAST);
    save(); render();
  }

  input.addEventListener('change', function(){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(input.value)) return render();
    setStart(parse(input.value));
  });
  endIn.addEventListener('change', function(){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(endIn.value)) return render();
    setEnd(parse(endIn.value));
  });

  /* Switching to "keep the arc" snaps the close to start + 8, because that is what the phrase
     means: the arc drawn on the canvas, not whatever window happens to be set. Switching the
     other way changes nothing on its own; the window you are already in becomes the window
     the arc is fitted to. */
  document.getElementById('bvMode').addEventListener('click', function(ev){
    var b = ev.target.closest('button[data-mode]');
    if(!b) return;
    state.mode = b.dataset.mode;
    if(state.mode === 'shift') state.end = addDays(state.start, ARC_LAST);
    save(); render();
  });

  document.getElementById('bvReset').addEventListener('click', function(){
    state = { start: parse(DEFAULT), end: parse(CLOSE_COPY), mode: DEF_MODE };
    save(); render();
  });

  /* ===== the Timeline lane =====
     The three workflow tabs answer "what does this workflow do". None of them answers "what
     goes out on Thursday", which is the question anyone running the campaign actually has.
     This lane merges the dated steps into one column in date order and then, separately, shows
     the two arcs that cannot be dated at all rather than pretending they can. */
  var tlSec = document.createElement('section');
  tlSec.className = 'flow timeline';
  tlSec.id = 'automations-timeline';
  document.getElementById('canvas').appendChild(tlSec);

  var tlTab = document.createElement('button');
  tlTab.type = 'button';
  tlTab.className = 'tab';
  tlTab.dataset.wf = 'timeline';
  tlTab.textContent = 'Timeline';
  tlTab.title = 'Every dated step in one column, in the order it goes out';
  tlTab.onclick = function(){ window.trsActivateLane('timeline'); };
  var makeTab = document.querySelector('.tab[data-wf="make"]');
  if(makeTab && makeTab.parentNode) makeTab.parentNode.insertBefore(tlTab, makeTab);

  var TYPEC = {trigger:'#3E7A5E',email:'#3B6E8F',wa:'#25A55F',wait:'#B4823A',
               iff:'#8A6D3B',tag:'#A05C6E',task:'#46707C',goal:'#6E5BA0'};

  /* The node's own type is not in the DOM as data, but its colour swatch is, and the type
     word is printed in .ntype. Reading the word back is uglier than reading WF directly,
     so this reads WF: it is a global from automations.js and it is the same array the
     canvas was built from. */
  function nodesOf(flow){
    var w = (typeof WF !== 'undefined' ? WF : []).filter(function(x){ return x.id === flow; })[0];
    return w ? w.nodes : [];
  }

  function itemHTML(n){
    return '<div class="tlitem">' +
      '<span class="tldot" style="background:' + (TYPEC[n.t] || '#666') + '"></span>' +
      '<span class="tlt">' + n.title + '</span>' +
      (n.sub ? '<span class="tls">' + n.sub + '</span>' : '') +
    '</div>';
  }

  /* The arc day the "Four days left" email sits on, found by its file rather than by counting
     nodes, so inserting a step above it does not quietly move this check onto another email. */
  function dayOfEmail(key){
    var nur = nodesOf('nurture');
    for(var i = 0; i < nur.length; i++){
      if(nur[i] && nur[i].emailKey === key){
        var d = OFFSETS.nurture[i];
        if(d === null || d === undefined) return null;
        return Array.isArray(d) ? d[0] : d;
      }
    }
    return null;
  }

  /* The window in which "Four days left" is literally true: the one where that send lands four
     days before the close. Computed rather than remembered, because it depends on the same
     rounding the rest of the file uses. */
  function windowForTrueFour(day){
    for(var w = arcDays().length - 1; w <= 120; w++){
      if(offsetIn(ARC_LAST, w) - offsetIn(day, w) === 4) return w;
    }
    return null;
  }

  function renderTimeline(){
    var nur = nodesOf('nurture');

    /* group the campaign-clock steps by the real day they land on, which is not the same as
       grouping by arc day once the window has been squeezed */
    var byOff = {}, order = [];
    OFFSETS.nurture.forEach(function(day, i){
      if(day === null || !nur[i]) return;
      var arcDay = Array.isArray(day) ? day[0] : day;
      var off    = offsetOf(arcDay);
      if(!byOff[off]){ byOff[off] = {days: [], items: []}; order.push(off); }
      if(byOff[off].days.indexOf(arcDay) < 0) byOff[off].days.push(arcDay);
      byOff[off].items.push(nur[i]);
    });
    order.sort(function(a,b){ return a - b; });

    var close  = dateOf(ARC_LAST);
    var wanted = parse(CLOSE_COPY);
    var drift  = between(wanted, close);
    var clash  = collisions();
    var runup  = between(parse(OPEN), state.start);

    var days = order.map(function(off){
      var g    = byOff[off];
      var date = addDays(state.start, off);
      var last = g.days.indexOf(ARC_LAST) >= 0;
      return '<li class="tlday' + (last ? ' last' : '') + (g.days.length > 1 ? ' clash' : '') + '">' +
        '<div class="tldate"><b>' + fmt(date) + '</b><i>' +
          g.days.map(function(d){ return 'Day ' + d; }).join(' + ') + '</i></div>' +
        '<div class="tlitems">' + g.items.map(itemHTML).join('') + '</div>' +
      '</li>';
    }).join('');

    /* the two undated arcs, as ladders */
    var arcs = ['welcome','mapping'].map(function(flow){
      var ns = nodesOf(flow);
      var w  = (typeof WF !== 'undefined' ? WF : []).filter(function(x){ return x.id === flow; })[0];
      var rungs = {}, rorder = [];
      OFFSETS[flow].forEach(function(day, i){
        if(day === null || !ns[i]) return;
        var key = Array.isArray(day) ? day[0] + '–' + day[1] : String(day);
        if(!rungs[key]){ rungs[key] = {sort: Array.isArray(day) ? day[0] : day, items: []}; rorder.push(key); }
        rungs[key].items.push(ns[i]);
      });
      rorder.sort(function(a,b){ return rungs[a].sort - rungs[b].sort; });

      return '<div class="tlarc">' +
        '<div class="tlarch"><b>' + (w ? w.name : flow) + '</b>' +
          '<span>starts at ' + (ENTRY[flow] || 'her own entry') + ', so it has no date of its own</span></div>' +
        '<ol class="tldays rel">' + rorder.map(function(k){
          var r = rungs[k];
          var lab = r.sort === 0 ? 'Same minute' : ('+' + k + (k === '1' ? ' day' : ' days'));
          return '<li class="tlday"><div class="tldate"><b>' + lab + '</b><i>from her entry</i></div>' +
            '<div class="tlitems">' + r.items.map(itemHTML).join('') + '</div></li>';
        }).join('') + '</ol>' +
      '</div>';
    }).join('');

    /* ===== the close, against the copy that names it ===== */
    var closeWarn = '';
    if(drift !== 0){
      closeWarn = '<div class="tlwarn"><b>The close and the email copy disagree.</b> Day ' +
        ARC_LAST + ' now lands on ' + fmtLong(close) + ', but all five nurture emails say ' +
        '<em>' + closeTxt() + '</em> in their body and <code>nurture-5</code> says the window ' +
        '&ldquo;closes tonight&rdquo;. Two ways out, and they are not the same decision: put the ' +
        'close back to ' + fmtLong(wanted) + ' and let the arc fit whatever window that leaves, ' +
        'or keep this close and rewrite the date in five files. The copy is locked, so the second ' +
        'one is Tara&rsquo;s call rather than a build setting.</div>';
    }

    /* ===== two sends on one morning ===== */
    var clashWarn = '';
    if(clash.length){
      clashWarn = '<div class="tlwarn hard"><b>The window is too tight for the arc.</b> ' +
        clash.map(function(g){
          return g.map(function(d){ return 'Day ' + d; }).join(' and ') + ' now land on ' +
            fmt(dateOf(g[0]));
        }).join('; ') + '. Two emails in one morning reads as pressure, not as a campaign. ' +
        'Give it at least ' + plural(arcDays().length - 1, 'day') + ' between the start and the close.</div>';
    }

    /* ===== "Four days left" =====
       This one is not about either date and does not go away by itself. It is a contradiction
       between two emails that only becomes visible once the arc has real dates on it, which is
       the argument for this lane existing at all. What HAS changed since the one-date version:
       the gap is now computed, not asserted, so a stretched window can actually resolve it. */
    var d4   = dayOfEmail('nurture4');
    var four = '';
    if(d4 !== null){
      var gap = offsetOf(ARC_LAST) - offsetOf(d4);
      if(gap === 4){
        four = '<div class="tlwarn ok"><b>&ldquo;Four days left&rdquo; is true in this window.</b> ' +
          '<code>nurture-4</code> goes out on ' + fmt(dateOf(d4)) + ' and the window closes on ' +
          fmt(close) + ', which is four days later exactly. This is the only setting in which ' +
          'that headline and the locked copy agree, so if the arc is moved again, check this ' +
          'line first.</div>';
      } else {
        var need = windowForTrueFour(d4);
        four = '<div class="tlwarn hard"><b>Day ' + d4 + ' says &ldquo;Four days left&rdquo; and ' +
          'sits ' + plural(gap, 'day') + ' before the close.</b> <code>nurture-4</code> is titled ' +
          '&ldquo;Four days left&rdquo; and its body says the voucher closes on ' + closeTxt() + '. On this ' +
          'window it goes out on ' + fmt(dateOf(d4)) + ' and the close is ' + fmt(close) + ', so it ' +
          'is ' + plural(gap, 'day') + ' out, not four. Three things can move: the copy reads ' +
          '&ldquo;' + plural(gap, 'day') + ' left&rdquo;, the email moves earlier in the arc, or ' +
          (need
            ? 'the window stretches to ' + plural(need, 'day') + ' &mdash; keep the close on ' +
              fmtLong(wanted) + ' and start on <b>' + fmtLong(addDays(wanted, -need)) + '</b> and ' +
              'the line becomes true with no copy change at all'
            : 'the arc is redrawn') +
          '. Nothing here can pick, because the copy is locked.</div>';
      }
    }

    tlSec.innerHTML =
      '<div class="tlwrap">' +
        closeWarn + clashWarn + four +

        /* The gap between the window opening and the first send is the single thing a reviewer
           is most likely to read as a mistake, so it is named as a decision before the dated
           list rather than left to be inferred from the first row's date. */
        (runup > 0
          ? '<div class="tlwarn"><b>The window is live for ' + plural(runup, 'day') + ' before ' +
            'the first of these goes out.</b> It opens on ' + fmtLong(parse(OPEN)) + ' and Lead ' +
            'Nurture does not start until ' + fmtLong(state.start) + '. That is deliberate: five ' +
            'emails fitted across the whole six weeks would land eleven days apart, and every ' +
            'urgency line in them would be false for a month. The arc is the countdown into the ' +
            'close, not the whole campaign. What carries ' + fmt(parse(OPEN)) + ' to ' +
            fmt(addDays(state.start, -1)) + ' is the social calendar and the ads, which are not ' +
            'on this page. The Posting Calendar now runs on the same window as this one, and it ' +
            'reports how much of that stretch still has no plan in it.</div>'
          : '') +

        '<div class="tlsec">' +
          '<h3 class="tlh">The campaign clock</h3>' +
          '<p class="tlp">Lead Nurture is a broadcast, so every woman on it gets the same step ' +
            'on the same day. These are real dates and they move together when you change the ' +
            'dates above. The Day numbers are the names the steps carry on the canvas and in ' +
            'the email files; they stay put while the dates underneath them move.</p>' +
          '<ol class="tldays">' + days + '</ol>' +
        '</div>' +

        '<div class="tlsec">' +
          '<h3 class="tlh">The two arcs that have no date</h3>' +
          '<p class="tlp">These start when she does something, not when the campaign does. ' +
            'Two women who pay a week apart are on the same rung at different times, so an ' +
            'offset is the only honest label. They are drawn separately for that reason and ' +
            'not because they matter less.</p>' +
          arcs +
        '</div>' +

        '<p class="tlfoot">Waits in these workflows are <b>fixed-date</b> for this window with ' +
          'skip-if-passed, not relative delays, which is why these dates are a real setting ' +
          'and not a preview: every one of them is typed into a wait node by hand. Rebuild them ' +
          'as relative delays after the campaign, as the &ldquo;still to build&rdquo; note at ' +
          'the top of this page says.</p>' +
      '</div>';
  }

  render();
})();
