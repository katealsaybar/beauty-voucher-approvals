/* Wellness Card: the campaign's numbers, the serial format, and the card itself.
 *
 * Shared by voucher-issue (the till) and voucher-log (the record). Everything that decides
 * what a card SAYS lives here, so the two pages cannot disagree about a value, an expiry or
 * a serial. Load after voucher-card.css; plain script, no modules, works off disk as file://
 * like the rest of the pack.
 *
 * The rules encoded below are not this file's to change. They come from the pack:
 *   tiers, values and validity     Decision 13 and the tier table
 *   three expiry clocks            19 August, with the birthday card settled 20 August
 *   serial format                  docs/VOUCHER-SERIAL-SPEC.md
 *   three friends for a referral   Kate, 19 August. See needs: below
 */
(function () {
  var T = window.TRSCard = {};

  // The campaign's own dates. opens is not a launch date, it is a floor: anything before it
  // is a mistyped year, which is the error that matters because a serial cannot be corrected
  // afterwards. closes is the real one and it is stated on the till page too, so if it ever
  // moves it moves in both. issue_voucher() in sql/voucher_issues_setup.sql holds the same
  // two dates and is the one that actually refuses.
  T.CAMPAIGN = { opens:'2026-01-01', closes:'2026-09-30' };

  T.BRANCHES = {
    SAA:{name:'Mamsha al Saadiyat', emirate:'Abu Dhabi'},
    KCA:{name:'Khalifa City A',     emirate:'Abu Dhabi'},
    AQ: {name:'Al Quoz',            emirate:'Dubai'},
    MC: {name:'Motor City',         emirate:'Dubai'}
  };

  // needs: how many new friends have to visit AND pay before the referral credit unlocks.
  // THREE, on every tier. Kate settled it on 19 August and the pack says it in five places:
  // the reception and core-team cheat sheets, the floor memo, docs/VOUCHER-SERIAL-SPEC.md and
  // the decision table in index.html. It is a field rather than a literal only so the copy on
  // the R card can be generated from it instead of the word "third" being typed twice.
  //
  // KNOWN CONSEQUENCE, and it is not a bug to be fixed here. Dip Your Toes ships ONE gift
  // card and still needs three friends, so two of her three arrive without one and get logged
  // with gift_serial empty. That is expected on this tier, not a miscount: gift_serial is
  // nullable for exactly this reason. Do not make it required, and do not refuse a friend for
  // arriving without a card.
  T.TIERS = {
    D:{name:'Dip Your Toes',   places:1000, spends:1150, months:6,  friends:1, needs:3, birthday:150, birthdayWhat:'Birthday blow-dry', refer:100},
    S:{name:'Season of You',   places:2500, spends:3000, months:9,  friends:3, needs:3, birthday:350, birthdayWhat:'Birthday facial',   refer:150},
    V:{name:'All-In VIP Year', places:4500, spends:5400, months:12, friends:5, needs:3, birthday:750, birthdayWhat:'Birthday treat',    refer:200}
  };

  /* ---------- dates ---------- */
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // British English, month spelled out. Deliberately not 26/08/2026: the client base is
  // mostly expat and a numeric 03/05/2026 is read two different ways by two nationalities.
  // A spelled month has exactly one reading, so the desk never has that argument.
  T.fmt = function (d) {
    if (!d) return '';
    if (typeof d === 'string') {
      var p = d.split('-');
      return (+p[2]) + ' ' + MONTHS[(+p[1]) - 1] + ' ' + p[0];
    }
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  };

  // Clamped to the end of the target month, so 31 Mar + 6 lands on 30 Sep rather than
  // rolling into October. Mirrors make_interval() in the SQL, so a date worked out here and
  // a date worked out by Postgres always agree.
  T.addMonths = function (d, n) {
    var day = d.getDate();
    var t = new Date(d.getFullYear(), d.getMonth() + n, 1);
    var last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    t.setDate(Math.min(day, last));
    return t;
  };

  T.parseDate = function (v) { var p = String(v).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  T.today = function () { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  T.iso = function (d) {
    var m = String(d.getMonth() + 1), dd = String(d.getDate());
    if (m.length < 2) m = '0' + m;
    if (dd.length < 2) dd = '0' + dd;
    return d.getFullYear() + '-' + m + '-' + dd;
  };

  T.money = function (n) { return Number(n || 0).toLocaleString('en-GB'); };
  // Only ever used for the referral threshold, so it needs to reach five and no further.
  var ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
  T.ordinal = function (n) { return ORDINALS[n] || (n + 'th'); };
  T.pad4 = function (n) { var s = String(n); while (s.length < 4) s = '0' + s; return s; };
  T.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  /* ---------- the serial ---------- */
  // WV-<tier><type>-<branch>-<seq>[-<n>] for the log, Phorest and the small print. The card
  // face prints the same thing in four groups, which is how it reads as a card number
  // without being encoded down into digits that need a lookup table to read back.
  T.serialOf = function (tier, type, branch, seq, n) {
    var s = 'WV-' + tier + type + '-' + branch + '-' + T.pad4(seq);
    return n ? s + '-' + n : s;
  };
  T.faceGroups = function (tier, type, branch, seq) {
    return ['WV', tier + type, branch, T.pad4(seq)];
  };

  /* ---------- one buyer's whole set ---------- */
  // One buyer, one sequence. The type letter is the only thing that changes, so reception
  // holds a single number for all four, six or eight cards.
  //
  // alloc carries {seq, mainExpiry, friendExpiry, live, id}. When it came from Postgres the
  // dates are the ones stored against the serial, so the card shows exactly what the log
  // holds rather than a second calculation that could drift from it.
  T.buildSet = function (branch, tier, name, purchase, alloc) {
    var t = T.TIERS[tier], seq = alloc.seq, cards = [], i;
    var mainExpiry = alloc.mainExpiry, friendExpiry = alloc.friendExpiry;

    cards.push({
      type:'M', label:'Main card', serial:T.serialOf(tier,'M',branch,seq),
      face:T.faceGroups(tier,'M',branch,seq),
      lead:t.name, value:t.spends, valueLabel:'Credit',
      expiry:mainExpiry, printable:true
    });

    for (i = 1; i <= t.friends; i++) {
      // Dip Your Toes ships a single card, where "Card 1 of 1" and "All 1 carry the same
      // expiry" both read as a bug at the desk. One card gets neither line.
      cards.push({
        type:'G', label:t.friends === 1 ? 'Gift card' : 'Gift ' + i,
        serial:T.serialOf(tier,'G',branch,seq,i),
        face:T.faceGroups(tier,'G',branch,seq),
        gift:true, value:100, valueLabel:'Gift credit',
        expiry:friendExpiry, printable:true,
        of:t.friends === 1 ? null : 'Card ' + i + ' of ' + t.friends,
        note:'Two months from <b>her</b> purchase date, not from the day she hands it over.' +
             (t.friends === 1 ? '' : ' All ' + t.friends + ' carry the same expiry.')
      });
    }

    cards.push({
      type:'B', label:'Birthday', serial:T.serialOf(tier,'B',branch,seq),
      face:T.faceGroups(tier,'B',branch,seq),
      lead:t.birthdayWhat, value:t.birthday, valueLabel:'Birthday treat',
      expiry:mainExpiry, printable:true,
      note:'Usable <b>any time</b> inside her voucher validity, not only in her birthday ' +
           'month. Same clock as the main card.'
    });

    cards.push({
      type:'R', label:'Refer a friend', serial:T.serialOf(tier,'R',branch,seq),
      face:T.faceGroups(tier,'R',branch,seq),
      lead:'Thank you for the introduction', value:t.refer, valueLabel:'Referral credit',
      expiry:alloc.referralExpiry || null,
      printable:!!alloc.referralExpiry,
      note:alloc.referralExpiry
        ? 'Earned. The clock started the day her ' + T.ordinal(t.needs) +
          ' friend visited and paid.'
        : '<b>Cannot be printed yet.</b> The clock starts when her ' + T.ordinal(t.needs) +
          ' new friend has visited <i>and paid</i>, so the expiry does not exist until then. ' +
          'It is a business adjustment, so it has no Phorest gift card either.'
    });

    return {
      seq:seq, branch:branch, tier:tier, name:name, purchase:purchase, cards:cards,
      live:!!alloc.live, id:alloc.id || null
    };
  };

  // Rebuild a set straight from a voucher_log row, so the log can show the same cards the
  // till printed without knowing how any of them are put together.
  T.setFromLogRow = function (row) {
    return T.buildSet(row.branch, row.tier, row.client_name, T.parseDate(row.purchase_date), {
      seq: row.seq,
      id: row.id,
      live: true,
      mainExpiry: T.parseDate(row.main_expires_on),
      friendExpiry: T.parseDate(row.friend_expires_on),
      referralExpiry: row.referral_expires_on ? T.parseDate(row.referral_expires_on) : null
    });
  };

  /* ---------- render ---------- */
  T.render = function (set, card, extraClass) {
    var b = T.BRANCHES[set.branch];
    var nm = set.name ? set.name : 'Her name';
    var lead = card.gift
      ? '<div class="gift">A gift for you</div>'
      : '<div class="tier">' + T.esc(card.lead) + '</div>';
    var expiry = card.expiry ? T.fmt(card.expiry) : 'Set on referral';

    return '' +
    '<div class="card' + (extraClass ? ' ' + extraClass : '') + '">' +
      '<div class="sheen"></div>' +
      // tara-rose-logo-CARD, not -white. The shared white logo carries the mint rule above the
      // wordmark, which is the pack's UI accent and is right on the eight pages that use it.
      // On the black card it is the only cool colour against the gold, and the approved Canva
      // artwork has a plain white rule there: counted, zero mint pixels on it. So the card gets
      // its own copy with that one rule turned white, and the shared asset is left alone.
      '<div class="brand"><img src="../assets/tara-rose-logo-card.png" alt="Tara Rose Salon"></div>' +
      lead +
      '<div class="emv"><i></i><i></i><i></i><i></i></div>' +
      '<div class="val">' +
        '<div class="lb">' + T.esc(card.valueLabel) + '</div>' +
        '<div class="amt"><small>AED</small>' + T.money(card.value) + '</div>' +
      '</div>' +
      '<div class="num">' +
        card.face.map(function (g) { return '<span>' + g + '</span>'; }).join('') +
      '</div>' +
      (card.of ? '<div class="of">' + T.esc(card.of) + '</div>' : '') +
      '<div class="foot">' +
        '<div class="who">' +
          '<div class="lb">' + (card.gift ? 'Gifted by' : 'Cardholder') + '</div>' +
          '<div class="nm">' + T.esc(nm) + '</div>' +
        '</div>' +
        '<div class="dates">' +
          '<div>Purchased <b>' + T.fmt(set.purchase) + '</b></div>' +
          '<div>Valid until <b>' + expiry + '</b></div>' +
          // The cardholder needs to know where the credit is good, and Term 3 holds it to
          // the emirate it was bought in. The issuing branch is already inside the serial,
          // so printing it twice would cost the one line that answers her actual question.
          '<div>' + T.esc(b.emirate) + ' salons</div>' +
        '</div>' +
      '</div>' +
      // Dawn's wording, term 12. The terms page is not published yet, so there is no URL to
      // point at; "full terms apply" is the honest version of that until there is one.
      '<div class="fine">Cannot be exchanged for cash &middot; Full terms apply</div>' +
    '</div>';
  };

  /* ---------- printing ---------- */
  // One function for every page. It fills #trs-printroot, which voucher-card.css is the only
  // thing that knows how to lay out, so no page has to own print rules of its own.
  //
  // The class comes off on afterprint rather than on the line after window.print(). Chrome
  // does not reliably block there, and clearing it early strips the print layout before the
  // preview has rendered, which silently produces the wrong pages.
  T.print = function (set, cards, filename) {
    var root = document.getElementById('trs-printroot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'trs-printroot';
      document.body.appendChild(root);
    }
    // One A5 page per card, the card centred on it. The sheet is what carries the page
    // break, so voucher-card.css can size the page and the card independently. See the
    // printing block there for why the card is not printed at its real 85.6mm.
    root.innerHTML = cards.map(function (c) {
      return '<div class="sheet">' + T.render(set, c) + '</div>';
    }).join('');

    // The browser names a Save as PDF after document.title, so reception can find the file
    // again in a folder of attachments rather than opening four called Untitled.
    var restore = document.title;
    if (filename) document.title = filename;
    document.body.classList.add('trs-printing');

    function cleanup() {
      document.body.classList.remove('trs-printing');
      document.title = restore;
      window.removeEventListener('afterprint', cleanup);
    }
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  // Her whole set as one file. The referral card is included only once it is printable,
  // which is why this filters rather than taking set.cards.
  T.printSet = function (set) {
    var printable = set.cards.filter(function (c) { return c.printable; });
    T.print(set, printable,
      'WV-' + set.branch + '-' + T.pad4(set.seq) + ' ' + set.name + ' all cards');
  };
})();
