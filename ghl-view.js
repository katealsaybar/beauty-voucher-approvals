// Beauty Voucher — GHL automations viewer, rendered into #automations.
//
// Three workflow tiles. Click one to see its steps in order. Click any step that carries a
// message to open the actual draft in a drawer: the built email rendered in an iframe if
// it exists, the approved copy if it does not yet, and the WhatsApp text where there is
// one. Everything else (waits, tags, if/else branches, goals) is shown as a step so the
// shape of the flow is legible, but it opens nothing.
//
// Data comes from ghl-data.js (EMAILS, WAV, WF, COPY), which must load first.

(function () {
  if (typeof WF === 'undefined') return;
  var mount = document.getElementById('ghlMount');
  if (!mount) return;

  var TYPE_LABEL = {
    trigger: 'Trigger', email: 'Email', wa: 'WhatsApp', wait: 'Wait',
    iff: 'If / Else', tag: 'Add tag', task: 'Task', goal: 'Goal'
  };

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // A step is worth opening only if there is a message behind it.
  function payloadOf(n) {
    if (n.copyKey && COPY[n.copyKey]) return 'copy';
    if (n.emailKey && EMAILS[n.emailKey]) return 'email';
    if (n.variants && n.variants.length) return 'wa-variants';
    if (n.t === 'wa' && n.tip && n.tip.body) return 'wa-body';
    if (n.tip && n.tip.body) return 'note';
    return null;
  }

  // ---------- tiles + steps ----------

  function stepHTML(n, fi, ni) {
    var kind = payloadOf(n);
    var branches = n.branches
      ? '<div class="ghl-branches">' + n.branches.map(function (b) {
          return '<span class="ghl-branch ' + esc(b.c) + '">' + esc(b.l) + '</span>';
        }).join('') + '</div>'
      : '';
    return '<' + (kind ? 'button type="button"' : 'div') + ' class="ghl-step t-' + esc(n.t) +
        (kind ? ' openable' : '') + '"' + (kind ? ' data-fi="' + fi + '" data-ni="' + ni + '"' : '') + '>' +
        '<span class="ghl-step-type">' + esc(TYPE_LABEL[n.t] || n.t) + '</span>' +
        '<span class="ghl-step-main">' +
          '<span class="ghl-step-title">' + esc(n.title) + '</span>' +
          (n.sub ? '<span class="ghl-step-sub">' + esc(n.sub) + '</span>' : '') +
          branches +
        '</span>' +
        (kind ? '<span class="ghl-step-open">View</span>' : '') +
      '</' + (kind ? 'button' : 'div') + '>';
  }

  function render() {
    mount.innerHTML =
      '<div class="ghl-tiles">' +
        WF.map(function (fl, i) {
          var msgs = fl.nodes.filter(function (n) { return payloadOf(n); }).length;
          return '<button type="button" class="ghl-tile" data-fi="' + i + '">' +
              '<span class="ghl-tile-name">' + esc(fl.name) + '</span>' +
              '<span class="ghl-tile-sub">' + esc(fl.sub) + '</span>' +
              '<span class="ghl-tile-meta">' + fl.nodes.length + ' steps · ' + msgs + ' to review</span>' +
            '</button>';
        }).join('') +
      '</div>' +
      '<div class="ghl-flow" id="ghlFlow"></div>';

    Array.prototype.forEach.call(mount.querySelectorAll('.ghl-tile'), function (btn) {
      btn.addEventListener('click', function () { openFlow(+btn.dataset.fi); });
    });
    openFlow(0);
  }

  function openFlow(fi) {
    Array.prototype.forEach.call(mount.querySelectorAll('.ghl-tile'), function (b) {
      b.classList.toggle('active', +b.dataset.fi === fi);
    });
    var fl = WF[fi];
    document.getElementById('ghlFlow').innerHTML =
      '<div class="ghl-flow-head"><strong>' + esc(fl.name) + '</strong> · ' + esc(fl.sub) + '</div>' +
      '<div class="ghl-steps">' + fl.nodes.map(function (n, ni) { return stepHTML(n, fi, ni); }).join('') + '</div>';

    Array.prototype.forEach.call(document.querySelectorAll('.ghl-step.openable'), function (btn) {
      btn.addEventListener('click', function () { openDrawer(+btn.dataset.fi, +btn.dataset.ni); });
    });
  }

  // ---------- drawer ----------

  var drawer, drawerBody, drawerTitle, overlay;

  function buildDrawer() {
    overlay = document.createElement('div');
    overlay.className = 'ghl-overlay';
    drawer = document.createElement('div');
    drawer.className = 'ghl-drawer';
    drawer.innerHTML =
      '<div class="ghl-drawer-head">' +
        '<div><span class="ghl-drawer-eyebrow">Draft for approval</span>' +
        '<h3 id="ghlDrawerTitle"></h3></div>' +
        '<button type="button" class="ghl-drawer-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="ghl-drawer-body" id="ghlDrawerBody"></div>';
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    drawerBody = document.getElementById('ghlDrawerBody');
    drawerTitle = document.getElementById('ghlDrawerTitle');
    overlay.addEventListener('click', closeDrawer);
    drawer.querySelector('.ghl-drawer-close').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawerBody.innerHTML = ''; // drop the iframe so it isn't left running behind the overlay
  }

  function field(label, value) {
    return '<div class="ghl-field"><span class="ghl-field-label">' + esc(label) + '</span>' +
      '<div class="ghl-field-value">' + value + '</div></div>';
  }

  function waBlock(label, text) {
    return '<div class="ghl-wa">' +
      '<div class="ghl-wa-label">' + esc(label) + '</div>' +
      '<div class="ghl-wa-bubble">' + esc(text).replace(/\n/g, '<br>') + '</div>' +
    '</div>';
  }

  // The built emails carry {{LOGO_URL}} as a merge field, which previews as a broken image
  // and makes an otherwise finished email look unfinished. Swap in the real hosted asset
  // for the preview only — the stored template keeps its merge field. Black wordmark,
  // because these emails have a white header. (Build spec, Part A.)
  var LOGO_PREVIEW = 'https://res.cloudinary.com/efnt60v2/image/upload/v1786119973/6_ekivvq.png';

  // The built emails are complete HTML documents, so they go in an iframe rather than
  // being injected into the page — otherwise their <body> styling leaks into the pack.
  // sandbox with no allow-* : no scripts, no forms, opaque origin. Images still load.
  function emailFrame(html) {
    return '<div class="ghl-email-frame"><iframe title="Email preview" sandbox srcdoc="' +
      esc(html.split('{{LOGO_URL}}').join(LOGO_PREVIEW)) + '"></iframe></div>' +
      '<div class="ghl-notbuilt">Rendered exactly as she will receive it. Merge fields ' +
      'like <span style="font-family:monospace">{{contact.first_name}}</span> stay visible ' +
      'on purpose, so you can see where her details land.</div>';
  }

  function copyBlock(c) {
    var out = '';
    out += field('When', esc(c.when));
    out += field(c.subject.length > 1 ? 'Subject lines (pick one)' : 'Subject',
      '<ul class="ghl-subjects">' + c.subject.map(function (s) {
        return '<li>' + esc(s) + '</li>';
      }).join('') + '</ul>');
    out += field('Preview text', esc(c.preview));
    out += field('Headline', '<span class="ghl-headline">' + c.headline + '</span>');
    if (c.panel) {
      out += '<div class="ghl-panel"><span class="ghl-panel-label">' + esc(c.panel.label) + '</span>' +
        '<span class="ghl-panel-big">' + esc(c.panel.big) + '</span>' +
        '<span class="ghl-panel-sub">' + esc(c.panel.sub) + '</span></div>';
    }
    out += field('Body', c.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''));
    if (c.tiers) {
      out += '<div class="ghl-tiercards">' + c.tiers.map(function (t) {
        return '<div class="ghl-tiercard">' +
          '<div class="ghl-tiercard-top"><span class="ghl-tiercard-name">' + esc(t.name) + '</span>' +
          '<span class="ghl-tiercard-pill">' + esc(t.pill) + '</span></div>' +
          '<div class="ghl-tiercard-tag">' + esc(t.tag) + '</div>' +
          '<ul>' + t.lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>' +
          '<div class="ghl-tiercard-strip"><span>You place <strong>' + esc(t.place) + '</strong></span>' +
          '<span>On the table <strong>' + esc(t.table) + '</strong></span></div>' +
        '</div>';
      }).join('') + '</div>';
    }
    if (c.after) out += field('Under the cards', esc(c.after));
    if (c.conditional) {
      out += '<div class="ghl-conditional"><strong>Conditional line.</strong> ' + esc(c.conditional) + '</div>';
    }
    out += field('Buttons', '<span class="ghl-cta">' + esc(c.cta) + '</span>' +
      '<span class="ghl-cta2">' + esc(c.cta2) + '</span>');
    out += '<div class="ghl-notbuilt">Approved copy, not yet built as HTML. The four ' +
      'Confidence Mapping emails are built and render as the real thing.</div>';
    return out;
  }

  function openDrawer(fi, ni) {
    if (!drawer) buildDrawer();
    var n = WF[fi].nodes[ni];
    var kind = payloadOf(n);
    drawerTitle.textContent = n.title;

    var html = '';
    if (n.tip && n.tip.note) html += '<div class="ghl-why">' + n.tip.note + '</div>';

    if (kind === 'copy') {
      html += copyBlock(COPY[n.copyKey]);
    } else if (kind === 'email') {
      if (n.tip && n.tip.sub) html += field('Subject', esc(n.tip.sub));
      html += emailFrame(EMAILS[n.emailKey]);
      // the mapping bridge is a WhatsApp message that also has an email build
      if (n.t === 'wa' && n.tip && n.tip.body) html += waBlock('WhatsApp version', n.tip.body);
    } else if (kind === 'wa-variants') {
      n.variants.forEach(function (v) { html += waBlock(v.l, WAV[v.k] || '(missing)'); });
    } else if (kind === 'wa-body') {
      html += waBlock('WhatsApp', n.tip.body);
    } else if (kind === 'note') {
      html += field(n.tip.sub ? 'Subject' : 'Detail', esc(n.tip.sub || ''));
      html += field('What it says', esc(n.tip.body).replace(/\n\n/g, '</p><p>').replace(/^/, '<p>') + '</p>');
      if (n.tip.locked) {
        html += '<div class="ghl-notbuilt">Summary only. Full body lives in the locked copy ' +
          'pack in Notion, which always wins over anything shown here.</div>';
      }
    }

    drawerBody.innerHTML = html;
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawerBody.scrollTop = 0;
  }

  render();
})();
