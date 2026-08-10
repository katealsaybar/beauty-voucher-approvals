  /* Every subsection is notable, not just the eight big blocks: each quiz stage, each FAQ
     answer and the form card get their own pin. */
  window.TRS_ANCHOR_PREFIX = 'mapmock';
  window.TRS_PIN_TARGETS = [
    { sel: '[data-mockblock]', into: null, labelSel: '[data-mocklabel]', float: true },
    { sel: '.site .quiz',      into: null, labelSel: '.qh, .stagerow b',  float: true },
    { sel: '.site .faq .q',    into: null, labelSel: '.qt',               float: true }
  ];

  (function () {
    var body = document.body;
    var fixed = document.getElementById('btn-fixed');
    var live = document.getElementById('btn-live');
    var diff = document.getElementById('btn-diff');

    function show(v) {
      body.classList.toggle('v-fixed', v === 'fixed');
      body.classList.toggle('v-live', v === 'live');
      fixed.classList.toggle('on', v === 'fixed');
      live.classList.toggle('on', v === 'live');
    }
    fixed.addEventListener('click', function () { show('fixed'); });
    live.addEventListener('click', function () { show('live'); });

    diff.addEventListener('click', function () {
      var on = body.classList.toggle('diff');
      diff.classList.toggle('on', on);
      diff.textContent = on ? 'Hide what changed' : 'Show what changed';
    });
  })();
