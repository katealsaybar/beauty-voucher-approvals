/* ===== The campaign clock =====
   Added 10 Aug 2026.

   The workflow map drew the arc as "Day 0 · Day 2 · Day 4 · Day 6 · Day 8", which is how GHL
   thinks about it and not how anybody planning a campaign thinks about it. Set one date here
   and every step in Lead Nurture picks up a real one.

   Two kinds of clock, and keeping them apart is the whole point of this file:

     Lead Nurture is on the CAMPAIGN clock. It is a broadcast: everybody gets Day 0 on the same
     morning, so every step has a real calendar date and the last one has to land on the close
     date the emails already name out loud.

     Welcome Pack and Confidence Mapping are on HER clock. They start when she pays or when she
     submits the quiz, which is whenever she does it. A calendar date on those steps would be a
     lie, so they show offsets and say why.

   The offsets below are read off the wait nodes in WF (automations.js) rather than parsed out
   of their titles, because "Wait · to Day 5–7" is prose and prose drifts. A wait node carries
   the day it RESOLVES to, so it reads as "the wait that ends on Day 2" rather than "the wait
   that starts on Day 0". null means the step has no position on either clock: a goal, an exit,
   or a branch that can fire at any point in the arc. */
(function(){

  var STORE      = 'trs-bv-campaign-start';
  var DEFAULT    = '2026-08-20';   /* 28 Aug minus the eight days of the arc */
  var CLOSE_COPY = '2026-08-28';   /* hardcoded in the body of all five nurture emails */
  var ARC_LAST   = 8;              /* the Day 8 "Final day" email */

  /* index → day. The arrays are length-checked against WF at boot, so a step added to a
     workflow without a day here fails loudly in the console instead of silently shifting
     every date below it by one. A number is a day; [a,b] is a range the build has not
     pinned down; null is "no position on a clock". */
  var OFFSETS = {
    nurture: [0,0,0,0,0,0,0, 2,2,2, 4,4, 6,6, 8,8, null,null],
    welcome: [0,0,0,0,0, [1,2],[1,2], [5,7],[5,7],[5,7], null,null,null],
    mapping: [0,0,0,0,0,0,0, 1,1,1, 3,3, 6,6, null]
  };

  /* Which clock each workflow is on. */
  var CLOCK = {
    nurture: 'campaign',
    welcome: 'contact',
    mapping: 'contact'
  };

  var ENTRY = {
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
  var DAYNAME = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MONNAME = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(d){ return DAYNAME[d.getDay()] + ' ' + d.getDate() + ' ' + MONNAME[d.getMonth()]; }
  function fmtLong(d){ return DAYNAME[d.getDay()] + ' ' + d.getDate() + ' ' + MONNAME[d.getMonth()] + ' ' + d.getFullYear(); }

  function startDate(){
    var saved = null;
    try { saved = localStorage.getItem(STORE); } catch(e){}
    return parse(saved && /^\d{4}-\d{2}-\d{2}$/.test(saved) ? saved : DEFAULT);
  }
  function saveStart(d){
    try { localStorage.setItem(STORE, iso(d)); } catch(e){}
  }

  /* ===== the label one step carries =====
     On the campaign clock that is a date. On her clock it is an offset, and "+0" is written
     out as "same minute" because that is what the node actually does. */
  function labelFor(flow, day, start){
    if(day === null || day === undefined) return null;
    var range = Array.isArray(day);
    var from  = range ? day[0] : day;
    var to    = range ? day[1] : day;

    if(CLOCK[flow] === 'campaign'){
      var d = addDays(start, from);
      return { text: fmt(d), day: 'Day ' + from, iso: iso(d) };
    }
    if(from === 0) return { text: 'Same minute', day: '+0' };
    return {
      text: range ? '+' + from + '–' + to + ' days' : '+' + from + (from === 1 ? ' day' : ' days'),
      day:  range ? 'Day ' + from + '–' + to : 'Day ' + from
    };
  }

  /* ===== paint the chips onto the nodes already on the canvas =====
     automations.js has finished rendering by the time this runs, so this reads the DOM rather
     than reaching into nodeHTML. That keeps the clock a layer over the map instead of a
     rewrite of it: delete this file and the page is exactly what it was. */
  function paint(start){
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
        var lab = labelFor(flow, OFFSETS[flow][i], start);
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
        chip.className = 'nday' + (CLOCK[flow] === 'campaign' ? ' abs' : ' rel');
        chip.innerHTML = '<b>' + lab.text + '</b><i>' + lab.day + '</i>';
      });
    });
    document.body.classList.add('has-clock');
  }

  /* ===== the control in the header ===== */
  var start = startDate();

  var row = document.createElement('div');
  row.className = 'toprow-clock';
  row.innerHTML =
    '<div class="clockwrap">' +
      '<label class="clocklbl" for="bvStart">Campaign starts</label>' +
      '<input type="date" id="bvStart" class="clockinput" value="' + iso(start) + '">' +
      '<button type="button" class="clockreset" id="bvReset" title="Back to the start the ' +
        'emails imply: 28 August minus the eight days of the arc">Reset</button>' +
    '</div>' +
    '<div class="clockout" id="bvOut"></div>';

  var top = document.querySelector('.top');
  var row3 = document.querySelector('.toprow3');
  if(top && row3) top.insertBefore(row, row3);

  var out   = document.getElementById('bvOut');
  var input = document.getElementById('bvStart');

  /* ===== what the derived close date tells you =====
     The five nurture emails say "28 August" in their body copy, and nurture-5 says "closes
     tonight". So the arc's last day is not a preference, it is a promise already written into
     an asset. Moving the start moves Day 8 off that promise, and the reader has to be told
     which of the two is now wrong. */
  function render(){
    var close   = addDays(start, ARC_LAST);
    var wanted  = parse(CLOSE_COPY);
    var drift   = Math.round((close - wanted) / 86400000);
    var ok      = drift === 0;

    out.innerHTML =
      '<span class="clockday">Day ' + ARC_LAST + ', the &ldquo;Final day&rdquo; email, lands ' +
        '<b>' + fmtLong(close) + '</b></span>' +
      '<span class="clockflag ' + (ok ? 'ok' : 'off') + '">' +
        (ok
          ? 'Matches the 28 August written into the emails'
          : (Math.abs(drift) + (Math.abs(drift) === 1 ? ' day' : ' days') +
             (drift > 0 ? ' after' : ' before') + ' the 28 August written into the emails')) +
      '</span>';

    paint(start);
    renderTimeline(start);
  }

  input.addEventListener('change', function(){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(input.value)) return;
    start = parse(input.value);
    saveStart(start);
    render();
  });
  document.getElementById('bvReset').addEventListener('click', function(){
    start = parse(DEFAULT);
    input.value = DEFAULT;
    saveStart(start);
    render();
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

  function renderTimeline(start){
    var nur = nodesOf('nurture');

    /* group the campaign-clock steps by day */
    var byDay = {}, order = [];
    OFFSETS.nurture.forEach(function(day, i){
      if(day === null || !nur[i]) return;
      var d = Array.isArray(day) ? day[0] : day;
      if(!byDay[d]){ byDay[d] = []; order.push(d); }
      byDay[d].push(nur[i]);
    });
    order.sort(function(a,b){ return a - b; });

    var close  = addDays(start, ARC_LAST);
    var wanted = parse(CLOSE_COPY);
    var drift  = Math.round((close - wanted) / 86400000);

    var days = order.map(function(d){
      var date = addDays(start, d);
      var last = d === ARC_LAST;
      return '<li class="tlday' + (last ? ' last' : '') + '">' +
        '<div class="tldate"><b>' + fmt(date) + '</b><i>Day ' + d + '</i></div>' +
        '<div class="tlitems">' + byDay[d].map(itemHTML).join('') + '</div>' +
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

    tlSec.innerHTML =
      '<div class="tlwrap">' +

        (drift !== 0
          ? '<div class="tlwarn"><b>The start date and the email copy disagree.</b> Day ' +
            ARC_LAST + ' now lands on ' + fmtLong(close) + ', but all five nurture emails say ' +
            '<em>28 August</em> in their body and <code>nurture-5</code> says the window ' +
            '&ldquo;closes tonight&rdquo;. Either move the start back to ' + fmtLong(parse(DEFAULT)) +
            ', or the copy in five files has to change. The copy is locked, so this is Tara&rsquo;s ' +
            'call rather than a build setting.</div>'
          : '') +

        /* This one is not about the start date and does not go away when the dates line up.
           It is a contradiction between two emails that only becomes visible once the arc has
           real dates on it, which is the argument for this lane existing at all. */
        '<div class="tlwarn hard"><b>Day 6 says &ldquo;Four days left&rdquo; and sits two days ' +
          'before the close.</b> <code>nurture-4</code> is titled &ldquo;Four days left&rdquo; ' +
          'and its body says the voucher closes on 28 August. On the arc as drawn it goes out on ' +
          'Day 6 and <code>nurture-5</code> goes out on Day 8, so Day 6 is <em>two</em> days ' +
          'before the close, not four. One of three things has to move: the wait between Day 6 ' +
          'and Day 8 becomes four days, the email moves to Day 4, or the copy reads ' +
          '&ldquo;Two days left&rdquo;. Nothing here can pick, because the copy is locked.</div>' +

        '<div class="tlsec">' +
          '<h3 class="tlh">The campaign clock</h3>' +
          '<p class="tlp">Lead Nurture is a broadcast, so every woman on it gets the same step ' +
            'on the same day. These are real dates and they move together when you change the ' +
            'start above.</p>' +
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
          'skip-if-passed, not relative delays, which is why the start date is a real setting ' +
          'and not a preview. Rebuild them as relative delays after the campaign, as the ' +
          '&ldquo;still to build&rdquo; note at the top of this page says.</p>' +
      '</div>';
  }

  render();
})();
