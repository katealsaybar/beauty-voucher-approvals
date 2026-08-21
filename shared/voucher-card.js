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

  // The back of the card names the salons rather than the emirate, because "Abu Dhabi salons"
  // on the front answers where and this answers which. Derived from BRANCHES rather than typed
  // again, so opening a fifth salon is still a one-line change in one place.
  T.salonsIn = function (emirate) {
    var out = [], k;
    for (k in T.BRANCHES) if (T.BRANCHES[k].emirate === emirate) out.push(T.BRANCHES[k].name);
    return out;
  };

  // Term 3: the credit stays in the emirate it was bought in, so there are exactly two terms
  // pages and exactly two QR codes. Both were decoded off the rendered PDF, not trusted.
  T.emirateSlug = function (emirate) { return emirate === 'Dubai' ? 'dubai' : 'abu-dhabi'; };
  T.termsPath = function (emirate) {
    return 'tararosesalon.com/en/ae/wellness-voucher/' + T.emirateSlug(emirate);
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

  /* ---------- the cover ---------- */
  // Page one of HER file, and the reason no covering email had to be written: everything
  // reception would otherwise type into WhatsApp is on it.
  //
  // It lists the cards IN THIS FILE rather than the whole set, because her friends' cards are
  // sent as separate files now, one per friend. If it listed all eight she would go looking for
  // five cards that are not in there.
  //
  // Nothing here is a new fact. The tier, the credit, the dates and the salons all come off the
  // same set the cards are drawn from, so the cover cannot disagree with the card behind it.
  T.renderCover = function (set, cards) {
    var b = T.BRANCHES[set.branch];
    var t = T.TIERS[set.tier];
    var slug = T.emirateSlug(b.emirate);
    var main = cards[0];
    var gifts = set.cards.filter(function (c) { return c.gift && c.printable; }).length;

    // c.label is reception's word for the card, and "Main card" and "Birthday" are the wrong
    // words to hand a client. She is not filing them, she is being given them.
    var CLIENT_NAME = { M:'Your card', B:t.birthdayWhat, R:'Referral credit' };
    var list = cards.map(function (c) {
      return '<li><b>' + T.esc(CLIENT_NAME[c.type] || c.label) + '</b>, AED ' + T.money(c.value) +
             (c.expiry ? ', until ' + T.fmt(c.expiry) : '') + '</li>';
    }).join('');

    // One file per friend is a privacy decision, not a filing preference, so it is explained
    // rather than left for her to notice.
    var friends = gifts
      ? '<h2>Your friends’ cards come separately</h2>' +
        '<p>' + (gifts === 1 ? 'One card, in its own file' : gifts + ' cards, one file each') +
        ', so you can pass one to a friend without sending her the rest.</p>' +
        '<h2>One thing to do now</h2>' +
        '<p>Hand those out early. They run for two months from the day <b>you</b> bought, ' +
        'not from the day you give one away.</p>'
      : '';

    // Named but not promised as an attachment, because on the day she pays it does not exist
    // yet. She gets it as its own card once the third friend has been in.
    var refer = '<h2>Later</h2><p>AED ' + T.money(t.refer) + ' of referral credit reaches you as ' +
      'its own card once your ' + T.ordinal(t.needs) + ' friend has visited and paid.</p>';

    return '' +
    '<div class="cover">' +
      '<div class="top"><img src="../assets/tara-rose-logo-black.png" alt="Tara Rose Salon"></div>' +
      '<h1>Your Wellness Voucher</h1>' +
      '<div class="who"><b>' + T.esc(set.name || 'Her name') + '</b> &middot; ' + T.esc(t.name) + '</div>' +
      '<div class="rule"></div>' +
      '<div class="amt"><small>AED</small>' + T.money(main.value) + '</div>' +
      '<div class="sub">Yours until ' + T.fmt(main.expiry) + ', at ' +
        T.esc(T.salonsIn(b.emirate).join(' and ')) + '.</div>' +
      '<h2>In this file</h2>' +
      '<ul>' + list + '</ul>' +
      friends +
      refer +
      '<div class="foot">' +
        '<div class="terms"><b>Thank you for placing this with us.</b>' +
          'Full terms: ' + T.termsPath(b.emirate) + '</div>' +
        '<div class="qr"><img src="../assets/qr-terms-' + slug + '.svg" alt="Scan for the full terms"></div>' +
      '</div>' +
    '</div>';
  };

  /* ---------- the back ---------- */
  // The front answers what she holds and what it is worth. The back answers the two questions
  // reception gets asked after that: where exactly can I spend it, and where are the terms.
  //
  // The QR is an SVG, not a PNG, so it stays vector in the saved PDF and survives any zoom.
  // It sits on a CREAM PANEL and that is not decoration: the modules are #2d2e37 and a dark
  // QR on a black card does not scan. The panel is the thing that makes it readable.
  //
  // The wording below is lifted from the approved gift card artwork, which took it from Dawn's
  // terms. Only the clauses that are true of EVERY card in the set are here; anything that
  // varies by card, the value and the expiry, is a row above rather than a sentence.
  T.renderBack = function (set, card, extraClass) {
    var b = T.BRANCHES[set.branch];
    var slug = T.emirateSlug(b.emirate);
    var expiry = card.expiry ? T.fmt(card.expiry) : 'Set on referral';

    function row (label, value) {
      return '<div class="row"><div class="lb">' + label + '</div>' +
             '<div class="vl">' + value + '</div></div>';
    }

    return '' +
    '<div class="card back' + (extraClass ? ' ' + extraClass : '') + '">' +
      '<div class="sheen"></div>' +
      '<div class="brand"><img src="../assets/tara-rose-logo-card.png" alt="Tara Rose Salon"></div>' +
      '<div class="qrbox"><img src="../assets/qr-terms-' + slug + '.svg" alt="Scan for the full terms"></div>' +
      '<div class="qrcap">Scan for the full terms</div>' +
      '<div class="bk">' +
        row('Redeemable at', T.esc(T.salonsIn(b.emirate).join(' and ')) + ' only') +
        row('Full serial', T.esc(card.serial)) +
        row('Valid until', expiry) +
      '</div>' +
      '<div class="rules">' +
        '<div>Eligible salon services only. Not valid on home care, retail products or another voucher.</div>' +
        '<div>No cash value. Cannot be exchanged or refunded, and cannot be combined with another offer.</div>' +
        '<div>Subject to appointment availability. Standard booking and cancellation policies apply.</div>' +
      '</div>' +
      '<div class="bkurl">' + T.termsPath(b.emirate) + '</div>' +
    '</div>';
  };

  // The saved page, on screen, at 55%. Same two faces the printer gets, in the same box, so
  // reception can check the page during a practice run rather than spending a serial to see it.
  // The scale lives in CSS, not here, because voucher-card.css is the only thing that is
  // allowed to know how big the page is.
  T.renderPage = function (set, card) {
    return '<div class="pagewrap"><div class="pagescale">' +
             '<div class="sheet preview">' + T.render(set, card) + T.renderBack(set, card) + '</div>' +
           '</div></div>';
  };

  /* ---------- printing ---------- */
  // One function for every page. It fills #trs-printroot, which voucher-card.css is the only
  // thing that knows how to lay out, so no page has to own print rules of its own.
  //
  // The class comes off on afterprint rather than on the line after window.print(). Chrome
  // does not reliably block there, and clearing it early strips the print layout before the
  // preview has rendered, which silently produces the wrong pages.
  T.print = function (set, cards, filename, cover) {
    var root = document.getElementById('trs-printroot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'trs-printroot';
      document.body.appendChild(root);
    }
    // One A4 page per card, both faces on it. The sheet is what carries the page break, so
    // voucher-card.css can size the page and the card independently. See the printing block
    // there for why the card is not printed at its real 85.6mm.
    root.innerHTML =
      (cover ? '<div class="sheet cover-sheet">' + T.renderCover(set, cards) + '</div>' : '') +
      cards.map(function (c) {
        return '<div class="sheet">' + T.render(set, c) + T.renderBack(set, c) + '</div>';
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

  // HER file: the two cards that are hers on the day she pays, behind a cover. The main card
  // and the birthday card, and nothing else.
  //
  // NOT the gift cards. There used to be one button that put all eight in one file, and it was
  // the shortest path to a leak in the pack: she forwards that file to a friend, because it is
  // the only file she has, and the friend opens it holding her balance and the other four gift
  // serials, any of which she could then spend. One file per friend costs reception a second
  // Save and closes it.
  //
  // NOT the referral card either, and that one is a timing decision rather than a privacy one.
  // It does not exist on the day she pays: the clock starts when her third friend has visited
  // AND paid, so it is a later delivery. Bundling it here would mean her file held two cards on
  // Monday and three in November, which is the kind of quiet difference nobody can support.
  T.printHers = function (set) {
    var hers = set.cards.filter(function (c) {
      return c.printable && (c.type === 'M' || c.type === 'B');
    });
    T.print(set, hers,
      'WV-' + set.branch + '-' + T.pad4(set.seq) + ' ' + set.name + ' wellness voucher', true);
  };

  // Any one card on its own: a friend's gift card, or her referral card when she has earned it.
  // The gift name is written for the person it is forwarded TO, who never saw the till and should
  // not receive a file called WV-VG-KCA-0042-1.
  T.printOne = function (set, card) {
    var name = card.gift
      ? 'Gift card from ' + set.name + ' ' + card.serial
      : 'WV-' + set.branch + '-' + T.pad4(set.seq) + ' ' + set.name + ' ' + card.label.toLowerCase();
    T.print(set, [card], name);
  };

  // Kept so nothing that still calls these breaks. printSet used to mean the whole set in one
  // file, which is the thing being removed, so it now means her file.
  T.printSet  = T.printHers;
  T.printGift = T.printOne;
})();
