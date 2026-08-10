(function () {
  var TZ   = 'Asia/Dubai';
  var DOW  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var DOW3 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MON  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Dates are handled as plain YYYY-MM-DD strings and only turned into a Date for the
  // weekday. Anything else drags the browser's timezone into a Dubai calendar, and a post
  // planned for the 28th starts showing on the 27th.
  function parts(iso) { var a = iso.split('-'); return { y: +a[0], m: +a[1], d: +a[2] }; }
  function iso(y, m, d) { return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
  function dowOf(isoStr) { var p = parts(isoStr); return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay(); }
  function daysIn(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pretty(isoStr) {
    var p = parts(isoStr);
    return DOW[dowOf(isoStr)] + ' ' + p.d + ' ' + MON[p.m - 1] + ' ' + p.y;
  }
  function time12(t) {
    var a = t.split(':'), h = +a[0];
    var ap = h >= 12 ? 'pm' : 'am';
    var hh = h % 12 === 0 ? 12 : h % 12;
    return hh + (a[1] === '00' ? '' : ':' + a[1]) + ap;
  }

  // Today is read live, in Dubai, rather than taken from the data file. Tara and Emma open
  // this pack over several days, and a hardcoded date would leave the today marker and the
  // countdown pills a day or two behind, which is exactly the number the closing week has to
  // get right. CAL_CAMPAIGN.today stays as the fallback for a browser with no Intl support.
  function todayInDubai() {
    try {
      var p = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date());
      return /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : CAL_CAMPAIGN.today;
    } catch (e) {
      return CAL_CAMPAIGN.today;
    }
  }

  var TODAY  = todayInDubai();
  var LAUNCH = CAL_CAMPAIGN.launch;
  var CLOSE  = CAL_CAMPAIGN.close;

  // ---------- index the plan by day ----------
  var byDay = {};
  CAL_POSTS.forEach(function (p, i) {
    p._i = i;
    (byDay[p.d] = byDay[p.d] || []).push(p);
  });
  Object.keys(byDay).forEach(function (d) {
    byDay[d].sort(function (a, b) { return a.t < b.t ? -1 : a.t > b.t ? 1 : 0; });
  });

  var on = {};   // which channels are ticked
  Object.keys(CAL_CHANNELS).forEach(function (k) { on[k] = CAL_CHANNELS[k].on !== false; });

  function visible(list) { return (list || []).filter(function (p) { return on[p.ch]; }); }

  // days-to-close ribbon, for the last week only. It is the number the whole closing week
  // has to agree on, so the grid says it rather than each post claiming its own
  function closeTag(isoStr) {
    if (isoStr === LAUNCH) return { cls: 'launch', txt: 'Opens' };
    if (isoStr === CLOSE)  return { cls: 'close',  txt: 'Closes' };
    var a = parts(isoStr), b = parts(CLOSE);
    var diff = Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
    if (diff > 0 && diff <= 5) return { cls: 'count', txt: diff + ' day' + (diff > 1 ? 's' : '') };
    return null;
  }

  // ---------- channel filter row ----------
  var calsEl = document.getElementById('cals');
  function renderCals() {
    var counts = {};
    CAL_POSTS.forEach(function (p) { counts[p.ch] = (counts[p.ch] || 0) + 1; });
    var keys = Object.keys(CAL_CHANNELS);
    // The switch is labelled with what it will do, not with what is currently true, so
    // there is nothing to work out before pressing it. Anything short of every box ticked
    // means the useful next move is "tick all".
    var allOn = keys.every(function (k) { return on[k]; });
    calsEl.innerHTML =
      '<button type="button" class="calall" data-to="' + (allOn ? 'off' : 'on') + '">' +
        (allOn ? 'Untick all' : 'Tick all') + '</button>' +
      keys.map(function (k) {
        var c = CAL_CHANNELS[k];
        return '<label class="cal ' + (on[k] ? 'on' : 'off') + '" data-ch="' + k + '">' +
          '<input type="checkbox"' + (on[k] ? ' checked' : '') + '>' +
          '<span class="box" style="border-color:' + c.colour + ';background:' + (on[k] ? c.colour : 'transparent') + '">' +
          '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' +
          esc(c.label) + ' <span class="calcount">' + (counts[k] || 0) + '</span></label>';
      }).join('');
  }
  calsEl.addEventListener('change', function (e) {
    var lab = e.target.closest('.cal');
    if (!lab) return;
    on[lab.dataset.ch] = e.target.checked;
    renderCals();
    render();
  });
  calsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.calall');
    if (!b) return;
    var want = b.dataset.to === 'on';
    Object.keys(CAL_CHANNELS).forEach(function (k) { on[k] = want; });
    renderCals();
    render();
  });

  // ---------- month grid ----------
  var view = { y: 2026, m: 8 };
  var weeksEl = document.getElementById('weeks');
  var mlblEl  = document.getElementById('mlbl');

  // `hid` marks a chip past the third: hidden in the month view, where three is what fits a
  // cell and the rest live behind "+n more", but shown on a phone, where the chips are dots
  // and all of them fit anyway.
  function chip(p, hid) {
    var c = CAL_CHANNELS[p.ch];
    return '<button class="ev ' + p.ch + (hid ? ' hid' : '') + '" data-i="' + p._i + '" title="' + esc(time12(p.t) + ' · ' + c.label + ' · ' + p.title) + '">' +
      '<span class="bar" style="background:' + c.colour + '"></span>' +
      '<span class="evt">' + time12(p.t) + '</span>' +
      '<span class="evn">' + esc(p.title) + '</span></button>';
  }

  function renderMonth() {
    mlblEl.textContent = MON[view.m - 1] + ' ' + view.y;
    var first = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay(); // 0 = Sunday
    var total = daysIn(view.y, view.m);
    var cells = [];

    // tail of the previous month, so the first week is not ragged
    var pm = view.m === 1 ? 12 : view.m - 1, py = view.m === 1 ? view.y - 1 : view.y;
    var pTotal = daysIn(py, pm);
    for (var i = first; i > 0; i--) cells.push({ iso: iso(py, pm, pTotal - i + 1), out: true });
    for (var d = 1; d <= total; d++) cells.push({ iso: iso(view.y, view.m, d), out: false });
    var nm = view.m === 12 ? 1 : view.m + 1, ny = view.m === 12 ? view.y + 1 : view.y;
    var nd = 1;
    while (cells.length % 7 !== 0) cells.push({ iso: iso(ny, nm, nd++), out: true });

    weeksEl.innerHTML = cells.map(function (c) {
      var p = parts(c.iso), w = dowOf(c.iso);
      var list = visible(byDay[c.iso]);
      var tag = c.out ? null : closeTag(c.iso);
      // three chips fit a cell cleanly; beyond that the day opens as a list
      var rest = Math.max(0, list.length - 3);
      return '<div class="day' + (c.out ? ' out' : '') + (w === 0 || w === 6 ? ' we' : '') +
          (c.iso === TODAY ? ' today' : '') + (list.length ? ' has' : '') +
          (tag ? ' ' + tag.cls + '-d' : '') + '" data-d="' + c.iso + '">' +
        '<div class="dhead"><span class="dnum">' + p.d + '</span>' +
          (tag ? '<span class="dtag ' + tag.cls + '">' + tag.txt + '</span>' : '') +
          (c.out ? '' : '<span class="dlbl">' + pretty(c.iso) + '</span>') + '</div>' +
        list.map(function (p, n) { return chip(p, n >= 3); }).join('') +
        (rest > 0 ? '<button class="more" data-day="' + c.iso + '">+' + rest + ' more</button>' : '') +
        (!c.out && !list.length ? '<span class="empty">&middot;</span>' : '') +
        '</div>';
    }).join('');
    repin();
  }

  // ---------- agenda ----------
  // Rendered at load whether or not it is the visible view: the notes widget scans the DOM
  // once, and these rows are what a note pins to.
  var agEl = document.getElementById('agenda');
  function renderAgenda() {
    var days = Object.keys(byDay).sort();
    agEl.innerHTML = days.map(function (d) {
      var list = visible(byDay[d]);
      if (!list.length) return '';
      var p = parts(d), w = dowOf(d);
      return '<div class="agday' + (w === 0 || w === 6 ? ' we' : '') + '">' +
        '<div class="agd"><div class="adw">' + DOW3[w] + (d === TODAY ? ' · today' : '') + '</div>' +
          '<div class="add">' + p.d + '</div><div class="adm">' + MON[p.m - 1] + '</div></div>' +
        '<div class="agrows">' + list.map(function (ev) {
          var c = CAL_CHANNELS[ev.ch];
          return '<div class="ag-row" data-i="' + ev._i + '">' +
            '<div class="ag-time">' + time12(ev.t) + '</div>' +
            '<div class="ag-main">' +
              '<div class="ag-t"><span class="swatch" style="background:' + c.colour + '"></span>' + esc(ev.title) + '</div>' +
              '<div class="ag-meta">' + esc(c.label) + ' &middot; ' + esc(CAL_PILLARS[ev.pillar]) +
                ' &middot; ' + esc(ev.owner) + ' &middot; ' + esc(ev.branch) + '</div>' +
              '<div class="ag-angle">' + esc(ev.angle) + '</div>' +
              (ev.hook ? '<div class="ag-hook"><i>Hook to start from</i>' + esc(ev.hook) + '</div>' : '') +
              (ev.cta ? '<div class="ag-meta" style="margin-top:5px;"><strong>Ask:</strong> ' + esc(ev.cta) + '</div>' : '') +
              (ev.flag ? '<div class="ag-flag"><strong>Flag:</strong> ' + esc(ev.flag) + '</div>' : '') +
            '</div></div>';
        }).join('') + '</div></div>';
    }).join('');
    repin();
  }

  // Both views are rebuilt from scratch on a month change or a channel toggle, which throws
  // away the note buttons the widget injected into them. It re-scans on request and skips
  // anything already pinned, so this is cheap and safe to call after every render. Absent
  // on the first pass, when the widget script has not loaded yet; its own init covers that.
  function repin() {
    if (window.TRS_NOTES && window.TRS_NOTES.refreshPins) window.TRS_NOTES.refreshPins();
  }

  function render() { renderMonth(); renderAgenda(); }

  // ---------- the detail popup ----------
  var mback = document.getElementById('mback');
  var modal = document.getElementById('modal');

  function openPost(i) {
    var p = CAL_POSTS[i];
    if (!p) return;
    var c = CAL_CHANNELS[p.ch];
    var statusTxt = { now: 'Draft this now', plan: 'Planned', fixed: 'Fixed date' }[p.status] || 'Planned';
    modal.innerHTML =
      '<div class="mtopbar" style="background:' + c.colour + '"></div>' +
      '<div class="mhead"><div class="mhw">' +
        '<div class="mkick"><span class="pill" style="background:' + c.colour + '">' + esc(c.short) + '</span>' +
          '<span class="spill">' + esc(CAL_PILLARS[p.pillar]) + '</span>' +
          '<span class="spill ' + p.status + '">' + statusTxt + '</span></div>' +
        '<div class="mtt">' + esc(p.title) + '</div>' +
        '<div class="mwhen">' + pretty(p.d) + ' &middot; ' + time12(p.t) + ' Dubai</div>' +
      '</div><button class="mx" id="mxBtn" title="Close">&times;</button></div>' +
      '<div class="mbody">' +
        '<div class="mgrid">' +
          '<div class="mcell"><div class="cl">Format</div><div class="cv">' + esc(CAL_FORMATS[p.ch]) + '</div></div>' +
          '<div class="mcell"><div class="cl">Owner</div><div class="cv">' + esc(p.owner) + '</div></div>' +
          '<div class="mcell"><div class="cl">Branch</div><div class="cv">' + esc(p.branch) + '</div></div>' +
        '</div>' +
        '<div class="mlbl">The angle</div><div class="mtext">' + esc(p.angle) + '</div>' +
        (p.hook ? '<div class="mlbl">Hook to start from</div><div class="mhook">&ldquo;' + esc(p.hook) + '&rdquo;</div>' : '') +
        (p.cta ? '<div class="mlbl">What it asks for</div><div class="mcta">' + esc(p.cta) + '</div>' : '') +
        (p.flag ? '<div class="mlbl">Flag before drafting</div><div class="mflag">' + esc(p.flag) + '</div>' : '') +
        '<div class="mrule">' + (p.ch === 'beat' || p.ch === 'prep'
          ? 'This is a date, not a post. Nothing publishes from this row. It is here because the posts around it depend on it.'
          : '<b>Before it goes out:</b> caption written in Notion against this one pillar, care standard PASS, then an approval. Silence auto-approves it at midnight before the publish date.') +
        '</div>' +
      '</div>';
    mback.classList.add('open');
    document.getElementById('mxBtn').addEventListener('click', closeModal);
  }

  function openDay(d) {
    var list = visible(byDay[d]);
    modal.innerHTML =
      '<div class="mtopbar" style="background:var(--dark)"></div>' +
      '<div class="mhead"><div class="mhw">' +
        '<div class="mkick"><span class="spill">' + list.length + ' in the day</span></div>' +
        '<div class="mtt">' + pretty(d) + '</div>' +
        '<div class="mwhen">Click any row for the full brief.</div>' +
      '</div><button class="mx" id="mxBtn" title="Close">&times;</button></div>' +
      '<div class="dmlist">' + list.map(function (ev) {
        var c = CAL_CHANNELS[ev.ch];
        return '<button class="dm-row" data-i="' + ev._i + '">' +
          '<span class="dm-time">' + time12(ev.t) + '</span>' +
          '<span><span class="dm-t">' + esc(ev.title) + '</span>' +
            '<span class="dm-m">' + esc(CAL_PILLARS[ev.pillar]) + ' &middot; ' + esc(ev.owner) + '</span></span>' +
          '<span class="pill" style="background:' + c.colour + '">' + esc(c.short) + '</span></button>';
      }).join('') + '</div>';
    mback.classList.add('open');
    document.getElementById('mxBtn').addEventListener('click', closeModal);
  }

  function closeModal() { mback.classList.remove('open'); }

  mback.addEventListener('click', function (e) { if (e.target === mback) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  // one delegated handler for the grid, the agenda and the day list
  document.addEventListener('click', function (e) {
    var more = e.target.closest('.more');
    if (more) { openDay(more.dataset.day); return; }
    var row = e.target.closest('.dm-row');
    if (row) { openPost(+row.dataset.i); return; }
    // a click on the note pin inside an agenda row belongs to the widget, not to us
    if (e.target.closest('.trs-pin-btn')) return;
    var ev = e.target.closest('.ev, .ag-row');
    if (ev && ev.dataset.i != null) { openPost(+ev.dataset.i); return; }
    // on a phone the chips are dots and there is no "+n more" to press, so the cell itself
    // is the way into the day
    if (window.matchMedia('(max-width:620px)').matches) {
      var cell = e.target.closest('.day');
      if (cell && visible(byDay[cell.dataset.d]).length) openDay(cell.dataset.d);
    }
  });

  document.getElementById('prev').addEventListener('click', function () {
    view.m--; if (view.m < 1) { view.m = 12; view.y--; } renderMonth();
  });
  document.getElementById('next').addEventListener('click', function () {
    view.m++; if (view.m > 12) { view.m = 1; view.y++; } renderMonth();
  });
  document.getElementById('todayBtn').addEventListener('click', function () {
    var p = parts(TODAY); view.y = p.y; view.m = p.m;
    document.body.classList.remove('view-agenda');
    document.getElementById('vMonth').classList.add('active');
    document.getElementById('vAgenda').classList.remove('active');
    renderMonth();
  });
  document.getElementById('vMonth').addEventListener('click', function () {
    document.body.classList.remove('view-agenda');
    this.classList.add('active');
    document.getElementById('vAgenda').classList.remove('active');
  });
  document.getElementById('vAgenda').addEventListener('click', function () {
    document.body.classList.add('view-agenda');
    this.classList.add('active');
    document.getElementById('vMonth').classList.remove('active');
  });

  // ---------- pillar mix, measured off the plan ----------
  // Beats and prep rows are excluded: they are dates, not posts, and counting them would
  // flatter the mix with rows that carry no pillar at all.
  var MIX_TARGET = { education: 30, transformation: 25, bts: 20, identity: 15, community: 5, conversion: 5 };
  function renderMix() {
    var posts = CAL_POSTS.filter(function (p) { return p.ch !== 'beat' && p.ch !== 'prep'; });
    var n = posts.length;
    var count = {};
    posts.forEach(function (p) { count[p.pillar] = (count[p.pillar] || 0) + 1; });
    var order = Object.keys(MIX_TARGET).sort(function (a, b) { return (count[b] || 0) - (count[a] || 0); });
    var max = Math.max.apply(null, order.map(function (k) {
      return Math.max((count[k] || 0) / n * 100, MIX_TARGET[k]);
    }));
    document.getElementById('mixn').textContent = '· ' + n + ' posts';
    document.getElementById('mixrows').innerHTML = order.map(function (k) {
      var pct = (count[k] || 0) / n * 100;
      var tgt = MIX_TARGET[k];
      var off = pct - tgt;
      var cls = off >= 6 ? 'over' : off <= -6 ? 'under' : '';
      return '<div class="mixrow"><div class="mixname">' + esc(CAL_PILLARS[k]) + '</div>' +
        '<div class="mixtrack"><div class="mixfill" style="width:' + (pct / max * 100).toFixed(1) + '%"></div>' +
          '<div class="mixtarget" style="left:' + (tgt / max * 100).toFixed(1) + '%" title="Target ' + tgt + '%"></div></div>' +
        '<div class="mixval ' + cls + '"><b>' + Math.round(pct) + '%</b> <span style="opacity:.7">/ ' + tgt + '</span></div></div>';
    }).join('');
  }

  // The sticky weekday row has to sit exactly under the header, and the header changes
  // height whenever its rows rewrap, on resize, but also when the webfont arrives. A
  // resize listener alone left the offset stale and the weekday row hid behind the header,
  // so the header is observed instead of polled.
  var topEl = document.querySelector('.top');
  function syncHeaderHeight() {
    var h = Math.round(topEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--toph', h + 'px');
    // measured, not guessed at a breakpoint: the header's height comes from how often its
    // rows wrap, so the same width can be fine on one screen and absurd on another
    var vh = window.innerHeight;
    if (vh > 0) document.body.classList.toggle('tall-header', h > vh * 0.34);
  }
  // The observer catches the header rewrapping and resize catches the window getting shorter
  // without the header changing at all. Scroll is the belt and braces: the offset only
  // matters while scrolling, so recomputing there means a missed resize event cannot leave
  // the weekday row parked behind the header. rAF-gated so it stays one measurement a frame.
  if (window.ResizeObserver) new ResizeObserver(syncHeaderHeight).observe(topEl);
  window.addEventListener('resize', syncHeaderHeight);
  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; syncHeaderHeight(); });
  }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeaderHeight);

  renderCals();
  renderMix();
  render();
  syncHeaderHeight();
})();

  // Pin a note to a single planned post. The agenda row is the anchor rather than the month
  // chip: a chip is too small to carry a button, and the agenda row has a stable title.
  window.TRS_ANCHOR_PREFIX = 'calendar';
  window.TRS_PIN_TARGETS = [
    // A note on one date: the whole day's plan, or a "this day is too heavy" that belongs to
    // no single post. Anchored on the hidden .dlbl, so the id is the date and stays the same
    // when the cell is rebuilt or the channels are filtered. Days spilling in from the
    // neighbouring month are excluded; they belong to that month's grid, not this one.
    { sel: '.day:not(.out)', into: '.dhead', labelSel: '.dlbl', float: true },
    { sel: '.ag-row', into: null, labelSel: '.ag-t', float: true }
  ];

// The calendar's own sign-off.
//
// The plan is a thing to approve, not just a thing to read: three weeks of drafting run off
// it. It is Decision 16 in the pack, so it already reaches Tara's queue, but the queue lives
// in the other tab and this is where she will actually be looking. So the same two answers
// are offered here, written to the same anchor as the queue writes to. Approve it in either
// place and it counts once, in one inbox, against one decision.
//
// Identity is the four-name toggle in the header, same key as the notes widget. Anyone can
// answer; the one that closes the decision is Tara's, because the decision is owned by her.
(function () {
  var SUPABASE_URL = 'https://vlqvefsaxztitcbhirxt.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_JlOzwdcK0xjmE6j3nHmwhg_xDKxq1vv';
  var T_NOTES = 'approval_notes';
  var NAME_KEY = 'trs-approval-author';           // shared with notes-widget.js and decide.js
  var REVIEWERS = ['Tara', 'Emma', 'Hanneh', 'Kate'];
  var OWNER = 'Tara';

  // MUST stay in step with the wording of Decision 16 in index.html. decide.js builds its
  // anchor as 'decisions__' + slugify(the decision's .q text), and an answer given here only
  // lands on that same decision while the two agree. Reword one, reword both.
  var ANCHOR = 'decisions__posting-calendar-approve-the-plan-as-it-stands';
  var LABEL = 'Posting calendar: approve the plan as it stands';

  var box, PACK_ID, db;
  var answers = [];      // what is already on record for this decision, newest first
  var loaded = false;
  var busy = false;
  var problem = '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function who() {
    var n = window.localStorage.getItem(NAME_KEY);
    return n && REVIEWERS.indexOf(n) !== -1 ? n : '';
  }
  function when(isoStr) {
    try {
      return new Date(isoStr).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', timeZone: 'Asia/Dubai'
      });
    } catch (e) { return ''; }
  }
  // Self-labelling bodies, the same contract decide.js reads its score from: matched on the
  // words, never on the punctuation after them.
  function verdict(body) {
    if (/^Approved\b/.test(body)) return 'ok';
    if (/^Change requested\b/.test(body)) return 'change';
    return 'note';
  }

  function stateLine() {
    if (problem) return '<div class="so-state err">' + esc(problem) + '</div>';
    if (!loaded) return '<div class="so-state">Checking what is already on record&hellip;</div>';

    var byOwner = answers.filter(function (a) { return a.author_name === OWNER; })[0];
    var others = answers.filter(function (a) { return a.author_name !== OWNER; });
    var line, cls = '';

    if (!byOwner) {
      line = 'No answer from <b>' + OWNER + '</b> yet.';
    } else if (verdict(byOwner.body) === 'ok') {
      cls = 'ok';
      line = '<b>Approved by ' + esc(byOwner.author_name) + '</b> on ' + when(byOwner.created_at) + '.';
    } else if (verdict(byOwner.body) === 'change') {
      cls = 'change';
      line = '<b>' + esc(byOwner.author_name) + ' asked for a change</b> on ' + when(byOwner.created_at) +
        ': &ldquo;' + esc(byOwner.body.replace(/^Change requested:\s*/, '')) + '&rdquo;';
    } else {
      line = '<b>' + esc(byOwner.author_name) + '</b> left a note on this on ' + when(byOwner.created_at) + '.';
    }

    if (others.length) {
      line += ' Also answered by ' + others.map(function (a) {
        return esc(a.author_name) + ' (' + (verdict(a.body) === 'ok' ? 'approved' :
          verdict(a.body) === 'change' ? 'change asked for' : 'note') + ')';
      }).join(', ') + '.';
    }
    return '<div class="so-state ' + cls + '">' + line + '</div>';
  }

  function render() {
    var me = who();
    box.hidden = false;
    box.innerHTML =
      '<div class="so-main">' +
        '<div class="so-k">Decision 16 &middot; ' + OWNER + '</div>' +
        '<div class="so-t">Sign the plan off</div>' +
        '<div class="so-p">Approving this approves the <em>plan</em>: the dates, the platforms and the ' +
          'pillar mix. It does not approve a single caption. Every post is still drafted, still gated ' +
          'against the care standard and still approved on its own before it publishes. ' +
          (me && me !== OWNER
            ? 'You are reading as <strong>' + esc(me) + '</strong>, so your answer is filed under your name. ' +
              'The one that closes this decision is ' + OWNER + '&rsquo;s.'
            : 'Answer here or in the pack; it is the same answer either way.') +
        '</div>' +
      '</div>' +
      '<div class="so-acts">' +
        '<button type="button" class="so-btn ok" id="soOk"' + (busy ? ' disabled' : '') + '>Approve the calendar</button>' +
        '<button type="button" class="so-btn" id="soChange"' + (busy ? ' disabled' : '') + '>Ask for a change</button>' +
      '</div>' +
      '<div class="so-say" id="soSay">' +
        '<textarea id="soTxt" placeholder="What needs to change? In your own words. Kate actions it from here."></textarea>' +
        '<div class="so-row">' +
          '<button type="button" class="so-btn ok" id="soSend">Send to Kate</button>' +
          '<button type="button" class="so-btn" id="soCancel">Cancel</button>' +
        '</div>' +
      '</div>' +
      stateLine();

    document.getElementById('soOk').addEventListener('click', function () {
      if (!requireName()) return;
      send('Approved.');
    });
    document.getElementById('soChange').addEventListener('click', function () {
      if (!requireName()) return;
      document.getElementById('soSay').classList.add('on');
      document.getElementById('soTxt').focus();
    });
    document.getElementById('soCancel').addEventListener('click', function () {
      document.getElementById('soSay').classList.remove('on');
      document.getElementById('soTxt').value = '';
    });
    document.getElementById('soSend').addEventListener('click', function () {
      var txt = document.getElementById('soTxt').value.trim();
      if (!txt) { document.getElementById('soTxt').focus(); return; }
      if (!requireName()) return;
      send('Change requested: ' + txt);
    });
  }

  // No name, no answer: an answer nobody is attached to is worse than none. The toggle in
  // the header is the only place to fix it, so point at it rather than blocking with a form.
  function requireName() {
    if (who()) return true;
    problem = 'Tap your name in the header first, so we know whose answer this is.';
    render();
    var bar = document.querySelector('.trs-idbar');
    if (bar) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      bar.classList.add('trs-idbar-nudge');
      window.setTimeout(function () { bar.classList.remove('trs-idbar-nudge'); }, 2000);
    }
    return false;
  }

  function send(body) {
    busy = true; problem = ''; render();
    db.from(T_NOTES).insert({
      pack_id: PACK_ID,
      pack_title: 'Beauty Voucher',
      anchor_id: ANCHOR,
      anchor_label: LABEL,
      author_name: who(),
      body: body
    }).then(function (res) {
      busy = false;
      if (res && res.error) { problem = 'That did not reach Kate: ' + res.error.message; render(); return; }
      load();
    }, function (e) {
      busy = false;
      problem = 'That did not reach Kate: ' + ((e && e.message) || 'network error');
      render();
    });
  }

  function load() {
    db.from(T_NOTES).select('author_name,body,created_at')
      .eq('pack_id', PACK_ID).eq('anchor_id', ANCHOR).eq('archived', false)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .then(function (res) {
        loaded = true;
        if (res && res.error) { problem = 'Could not read the answers on record: ' + res.error.message; render(); return; }
        problem = '';
        // Newest first, one row per person: an answer given twice is a mind changed, not two
        // answers, and the state line should read as the latest position.
        var seen = {};
        answers = (res.data || []).filter(function (a) {
          if (seen[a.author_name]) return false;
          seen[a.author_name] = true;
          return true;
        });
        render();
      }, function () { loaded = true; render(); });
  }

  // Started on DOMContentLoaded, not inline, because this file is loaded BEFORE the Supabase
  // UMD script (the grid should not wait on a CDN to draw itself). Reading `supabase` at parse
  // time would find nothing and the card would silently never appear. By DOMContentLoaded
  // every script in the page has run.
  function boot() {
    if (typeof supabase === 'undefined') return;
    box = document.getElementById('signoff');
    PACK_ID = document.body.dataset.notePack;
    if (!box || !PACK_ID) return;

    db = (window.TRS && window.TRS.db) || supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });

    // Picking a different name in the header changes whose answer this card is about. Deferred
    // a tick so the widget's own handler has written the name before this reads it back.
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.trs-idbar-btns button')) return;
      window.setTimeout(function () { problem = ''; render(); }, 0);
    });

    render();
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
