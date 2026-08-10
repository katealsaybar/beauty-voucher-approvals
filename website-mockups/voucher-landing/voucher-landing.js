  /* Every subsection is notable, not just the eight big blocks: each tier, each salon
     card, each FAQ answer and each of the three "honest part" steps gets its own pin.
     That is why the blocks are <section id>: the widget namespaces a note's anchor by the
     nearest section[id], and without one "Al Quoz" (which appears in the coverage grid,
     the salon picker AND the salon list) would collide and silently lose two of its
     three pins to the widget's dedupe. */
  window.TRS_ANCHOR_PREFIX = 'sitemock';
  window.TRS_PIN_TARGETS = [
    { sel: '[data-mockblock]',   into: null, labelSel: '[data-mocklabel]',  float: true },
    { sel: '.site .card',        into: null, labelSel: '.cardtitle, .nm',   float: true },
    { sel: '.site .faq .q',      into: null, labelSel: '.qt',               float: true },
    { sel: '.site .steps > div', into: null, labelSel: '.stept',            float: true }
  ];

  (function () {
    var body = document.body;
    var ad = document.getElementById('btn-ad');
    var dxb = document.getElementById('btn-dxb');
    var diff = document.getElementById('btn-diff');
    // the picker on the mocked page itself, the one a real client would use
    var emAd = document.getElementById('em-ad');
    var emDxb = document.getElementById('em-dxb');

    function show(v) {
      body.classList.toggle('v-ad', v === 'ad');
      body.classList.toggle('v-dxb', v === 'dxb');
      ad.classList.toggle('on', v === 'ad');
      dxb.classList.toggle('on', v === 'dxb');
      emAd.classList.toggle('on', v === 'ad');
      emDxb.classList.toggle('on', v === 'dxb');
    }
    ad.addEventListener('click', function () { show('ad'); });
    dxb.addEventListener('click', function () { show('dxb'); });
    emAd.addEventListener('click', function () { show('ad'); });
    emDxb.addEventListener('click', function () { show('dxb'); });

    // Two sticky bars on one page: the review header (ours) and the site header (the
    // mockup's). Measuring rather than hard-coding keeps them stacked when the review
    // header wraps to two lines on a narrow window.
    //
    // A ResizeObserver rather than a one-off call: at script time the webfont has not
    // landed and the notes widget has not yet injected its "You are" bar, so the row
    // measures ~380px and the site header parked itself a third of the way down the page.
    // The observer re-reads it every time the row actually changes.
    var revh = document.querySelector('.top');
    function setRev() {
      document.documentElement.style.setProperty('--revh', Math.round(revh.getBoundingClientRect().height) + 'px');
    }
    setRev();
    if (window.ResizeObserver) new ResizeObserver(setRev).observe(revh);
    window.addEventListener('resize', setRev);
    window.addEventListener('load', setRev);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setRev);

    diff.addEventListener('click', function () {
      var on = body.classList.toggle('diff');
      diff.classList.toggle('on', on);
      diff.textContent = on ? 'Hide what changes' : 'Show what changes';
    });
  })();
