  window.TRS_ANCHOR_PREFIX = 'mapresult';
  window.TRS_PIN_TARGETS = [
    { sel: '[data-mockblock]', into: null, labelSel: '[data-mocklabel]', float: true }
  ];

  (function () {
    // Render the real built email rather than a copy of it, so this page cannot drift
    // out of sync with what the workflow actually sends.
    // Bare identifier, not window.EMAILS: automations-data.js declares it with `const`,
    // and a top-level const is a global lexical binding, never a property of window.
    var built = (typeof EMAILS !== 'undefined' && EMAILS && EMAILS.journal) ? EMAILS.journal : null;

    var stage  = document.getElementById('mailstage');
    var sw     = document.getElementById('clientsw');
    var whyEl  = document.getElementById('clientwhy');
    var split  = document.getElementById('hersplit');
    var client = MAIL_CLIENTS[0].id;

    if (!built) {
      stage.innerHTML = '<p style="font-family:sans-serif;padding:24px;">' +
        'Could not load the built email from automations-data.js. Run <code>python build-previews.py</code>.</p>';
    } else {
      // the four buttons, straight off the shared list so the two never disagree
      sw.innerHTML = MAIL_CLIENTS.map(function (c, i) {
        return '<button type="button" data-client="' + c.id + '"' +
               (c.id === 'outlook-win' ? ' class="risky' + (i === 0 ? ' on' : '') + '"'
                                       : (i === 0 ? ' class="on"' : '')) +
               '>' + c.btn + '</button>';
      }).join('');

      function paint() {
        var c = MAIL_CLIENTS.filter(function (x) { return x.id === client; })[0];
        stage.innerHTML = mailClientPane(client, built);
        fitMailFrames(stage, built);
        whyEl.innerHTML = '<strong>' + c.btn + '.</strong> ' + c.why;
        // the desktop pane is 820px of reading pane and cannot sit beside the notes column
        split.classList.toggle('wide', c.pane === 'outlookdesk');
        sw.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('on', b.getAttribute('data-client') === client);
        });
      }
      sw.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        client = b.getAttribute('data-client');
        paint();
      });
      paint();
    }

    var body = document.body;
    var her = document.getElementById('btn-her');
    var us = document.getElementById('btn-us');
    function show(v) {
      body.classList.toggle('v-her', v === 'her');
      body.classList.toggle('v-us', v === 'us');
      her.classList.toggle('on', v === 'her');
      us.classList.toggle('on', v === 'us');
    }
    her.addEventListener('click', function () { show('her'); });
    us.addEventListener('click', function () { show('us'); });
  })();
