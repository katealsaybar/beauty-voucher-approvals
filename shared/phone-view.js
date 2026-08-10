/* ==========================================================================
   Phone view for the mockup pages. Plain script, no build step, no module,
   same as notes-widget.js and mail-preview.js, so the pack still opens off
   disk as file://.

   Added 8 Aug 2026. Self-installing: include it and it finds the page's sticky
   header and its .browser > .site, and adds a Desktop / Phone switch. Nothing
   in the three mockups had to be restructured for it.

   MUST LOAD AFTER mail-preview.js: it uses DEVICES, devSpec, statusBar and
   phone() from there, so the handsets, their geometry and the Samsung/iPhone
   switch are literally the same ones the email previews use.

   ===== how the phone render actually works =====
   The mocked page is re-rendered inside an iframe that is 360 or 402 CSS px
   wide, NOT scaled down with a transform and not restyled by hand. That is the
   only honest option: every mockup's mobile layout is driven by its own
   @media(max-width:820px) rules, and a media query answers to the VIEWPORT, so
   the only way to make those rules fire is to give the page a real narrow
   viewport. An iframe is a viewport. A 360px-wide div is not, and would have
   shown the desktop layout squeezed into a phone, which is a lie, and the expensive
   kind, because it looks plausible.

   The frame gets the page's own <style> and font links, so it is the same CSS,
   and the body class (v-ad / v-dxb / v-fixed / v-live / diff) is mirrored into
   it, so the header's switches keep working while you are in the phone.

   What phone view deliberately does NOT carry: the notes widget. Its pins are
   stripped out of the frame. Leaving a note is a desktop job and the caption
   under the handset says so: a pin inside an iframe inside a phone shell would
   open its panel inside the phone, 360px wide, which is unusable.
   ========================================================================== */

(function () {
  /* ===================== embedded mode =====================
     A link inside the phone that points at another mockup navigates the frame to
     that whole page (review header, "You are" bar, its own Desktop/Phone switch
     and all), which is not a phone view of anything, it is the reviewer's furniture
     shrunk to 360px. So links between mockups are rewritten to carry ?pv=1, and a
     page opened with that flag hides everything except the mocked site.

     The flag is read from the URL rather than by asking the frame what its parent
     is, because the pack is opened off disk as well as over http, and a file://
     iframe cannot see its parent at all.

     The class is set by a one-line script in each mockup's <head>, not here, so the
     chrome is never painted and then removed. All this has to do is stand down. */
  var EMBED = document.documentElement.classList.contains('pv-embed');

  var browserEl = document.querySelector('.browser');
  var siteEl    = document.querySelector('.browser .site');
  var headEl    = document.querySelector('.top .inner');
  /* phone() and friends come from mail-preview.js. If it did not load, do
     nothing at all rather than half-install a broken control. */
  if (!browserEl || !siteEl || !headEl || typeof phone !== 'function' || typeof DEVICES === 'undefined') return;

  /* The pages that ARE a mocked page. A link to one of these is part of what a
     client walks through, so it stays inside the handset, chromeless. Anything else
     (the approval pack, the ritual kit tree, an email file) is a review link and
     opens in its own tab rather than hijacking the phone or the window behind it.

     Matched on the FILE NAME, not the whole href. Each mockup now sits in its own folder
     under website-mockups/, so the link from one to the next reads ../terms/terms.html
     and a whole-href match would have silently sent all three out to a new tab. */
  var PV_PAGES = ['voucher-landing.html', 'terms.html', 'confidence-mapping.html'];

  function pvRewrite(root){
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|tel:)/i.test(href)) return;
      var page = href.split('#')[0].split('?')[0];
      var hash = href.indexOf('#') > -1 ? href.slice(href.indexOf('#')) : '';
      if (PV_PAGES.indexOf(page.split('/').pop()) > -1) {
        a.setAttribute('href', page + '?pv=1' + hash);
        a.removeAttribute('target');
      } else {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      }
    });
  }
  /* Embedded: rewrite the live document's links so tapping on through a second and a
     third mockup stays chromeless, send pin taps out to the page holding the handset,
     then stand down. No switch, no stage: this page IS the phone's contents, and the
     switch that put it there is on the page behind. */
  if (EMBED) {
    pvRewrite(siteEl);
    document.addEventListener('click', function (e) {
      var p = e.target.closest && e.target.closest('.pin');
      if (!p) return;
      var q = p.querySelector('.pop');
      if (q) { try { parent.postMessage({ trsPV: 'pin', html: q.innerHTML }, '*'); } catch (err) {} }
      e.preventDefault();
    }, true);
    return;
  }

  var LS_MODE = 'trs-pv-mode', LS_DEV = 'trs-pv-device', LS_SEEN = 'trs-pv-seen';
  var mode = ls(LS_MODE) === 'phone' ? 'phone' : 'desktop';
  var dev  = ls(LS_DEV)  === 'samsung' ? 'samsung' : 'iphone';
  var seen = ls(LS_SEEN) === '1';

  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k,v){ try { localStorage.setItem(k,v); } catch (e) {} }

  /* ============================== icons ============================== */
  var I_DESK  = '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
  var I_PHONE = '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10.6 18.6h2.8"/></svg>';

  /* ===================== the switch in the header =====================
     Injected rather than written into each page so the three mockups stay in
     step: one definition, one label, one behaviour. */
  var lbl = document.createElement('span');
  lbl.className = 'swlabel pv-lbl';
  lbl.textContent = 'View';

  var sw = document.createElement('div');
  sw.className = 'switch pvswitch';
  sw.innerHTML =
    '<button type="button" data-mode="desktop" title="The page on a laptop">' + I_DESK + 'Desktop</button>' +
    '<button type="button" data-mode="phone" title="The same page on a real handset width">' + I_PHONE + 'Phone</button>';

  var back = headEl.querySelector('.back');
  if (back) { headEl.insertBefore(lbl, back); headEl.insertBefore(sw, back); }
  else { headEl.appendChild(lbl); headEl.appendChild(sw); }

  /* the pointer under the header, until the switch has been used once */
  var tip = null;
  var band = document.querySelector('.band');
  if (band && !seen) {
    tip = document.createElement('div');
    tip.className = 'pv-tip';
    tip.innerHTML =
      '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10.6 18.6h2.8"/></svg>' +
      '<div><b>This page has a phone view.</b> Most clients will read it on a phone, so you can too. ' +
      'the <b>Desktop / Phone</b> switch is in the header above, next to &ldquo;Back to approval pack&rdquo;. ' +
      'It is the real mobile layout at a real handset width, not a shrunken screenshot.</div>';
    band.insertBefore(tip, band.firstChild);
    document.body.classList.add('pv-nudge');
  }

  /* ============================== the stage ============================== */
  var stage = document.createElement('div');
  stage.className = 'mstage pv-stage';
  browserEl.parentNode.insertBefore(stage, browserEl.nextSibling);

  /* ===================== what the URL bar currently says =====================
     Read off the page's own desktop URL bar so the two frames can never disagree.
     It has to survive the desktop frame being display:none, which is why this
     tests each element's OWN computed display: `.only-dxb{display:none!important}`
     still computes to none inside a hidden parent, while the visible span still
     computes to inline. Walking .textContent instead would return both emirates'
     URLs concatenated. */
  function visText(node){
    var out = '';
    node.childNodes.forEach(function (n) {
      if (n.nodeType === 3) out += n.nodeValue;
      else if (n.nodeType === 1 && getComputedStyle(n).display !== 'none') out += visText(n);
    });
    return out;
  }
  function urlText(){
    var u = document.querySelector('.browser .urlbar');
    return u ? visText(u).replace(/\s+/g, '') : 'tararosesalon.com';
  }
  function hostOf(u){ return u.split('/')[0]; }

  /* ===================== the mobile browser chrome =====================
     Chrome on Android puts the address bar at the top; Safari on iOS puts it at
     the bottom. Both are drawn as they really are, because where the bar sits
     is exactly what decides whether a sticky call-to-action gets covered. */
  function chromeAndroid(url){
    return '<div class="pv-and">' +
      '<div class="u"><svg viewBox="0 0 24 24"><path d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9zm-8 0V7a3 3 0 0 1 6 0v2z"/></svg>' +
        '<span class="pv-host">' + hostOf(url) + '</span></div>' +
      '<span class="t">4</span><span class="m">&#8942;</span></div>';
  }
  function chromeIOS(url){
    var ico = function (p, off) { return '<svg viewBox="0 0 24 24"' + (off ? ' class="off"' : '') + '>' + p + '</svg>'; };
    return '<div class="pv-ios">' +
      '<div class="u"><span class="aa">&#7429;A</span><span class="host pv-host">' + hostOf(url) + '</span>' +
        '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/></svg></div>' +
      '<div class="tools">' +
        ico('<path d="m15 5-7 7 7 7"/>') +
        ico('<path d="m9 5 7 7-7 7"/>', true) +
        ico('<path d="M12 15V3"/><path d="m8 7 4-4 4 4"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>') +
        ico('<path d="M6 3h12v18l-6-4-6 4z"/>') +
        ico('<rect x="3" y="6" width="13" height="13" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v11"/>') +
      '</div></div>';
  }

  /* ===================== the document inside the frame =====================
     Same stylesheets, same markup, narrower viewport. Nothing is rewritten. */
  var FRAME_CSS =
    /* the review header does not exist in here, so the offset the mocked site
       reserves for it has to go to zero or its sticky header parks itself a
       third of the way down the phone */
    ':root{--revh:0px !important;}' +
    /* a 15px scrollbar would take the frame's layout width down to 345 and quietly
       make the whole simulation wrong. A phone has no persistent scrollbar either. */
    'html{scrollbar-width:none;-ms-overflow-style:none;}' +
    'html::-webkit-scrollbar{width:0;height:0;display:none;}' +
    'html,body{background:var(--site-sand,#F1ECE3);}' +
    /* the desktop frame's rounded corners belong to the frame, not the page */
    '.site,.site > *:last-child{border-radius:0 !important;}';

  /* ===================== what a tap inside the phone does =====================
     Three things are handled in the frame.

     A tap on an ANCHOR is scrolled here rather than followed. This one is not a
     nicety, it is the fix for a real fault: the frame is written with srcdoc, so it
     has no URL of its own and every href resolves against the PAGE BEHIND IT. That
     makes href="#" and href="#salon-pick" navigate the frame out of srcdoc and onto
     the real mockup, which then renders its own review header inside the handset,
     and its own phone stage on top of that, because the mode is remembered. What you
     get is the review chrome drawn inside the phone it belongs outside of.
     pvRewrite could not catch these, because it skips anything starting with "#" on
     the reasonable assumption that a hash link is same-page and safe. Inside srcdoc
     it is not, so the anchor has to be intercepted at click time instead.

     A tap on a BUTTON is replayed on the real page so its handler runs (the emirate
     picker drawn inside the website mockup).

     A tap on a PIN sends the note's text out to be drawn BESIDE the handset, not in
     it. The pins are review notes, and they are not part of what the site does, so
     they have no business taking up room on the client's screen, and inside a 360px
     frame the popover had to be clipped or turned into a sheet over the page either
     way. Nothing rendered in an iframe can escape it, so the only place a note can
     sit outside the phone is out here. The pin ICON stays in the frame: it is what
     marks which part of the page the note is about. */
  var RELAY =
    'document.addEventListener("click",function(e){' +
      'var t=e.target;' +
      'var p=t.closest&&t.closest(".pin");' +
      'if(p){var q=p.querySelector(".pop");' +
        'if(q){try{parent.postMessage({trsPV:"pin",html:q.innerHTML},"*");}catch(err){}}' +
        'e.preventDefault();return;}' +
      /* anchors: scroll, never navigate. href="#" alone is a placeholder CTA and
         scrolls nowhere, which is correct: on the real site it will be a real link,
         and in here it must simply not take the frame with it. */
      'var a=t.closest&&t.closest(\'a[href^="#"]\');' +
      'if(a){e.preventDefault();' +
        'var id=(a.getAttribute("href")||"").slice(1);' +
        'if(id){var el=document.getElementById(id)||document.querySelector(\'[name="\'+id+\'"]\');' +
          'if(el&&el.scrollIntoView)el.scrollIntoView({behavior:"smooth",block:"start"});}' +
        'return;}' +
      'var b=t.closest&&t.closest("button[id]");' +
      'if(b&&b.id){try{parent.postMessage({trsPV:"click",id:b.id},"*");}catch(err){}}' +
    '},true);';

  function frameDoc(){
    var head = '';
    document.querySelectorAll('head link[rel="stylesheet"], head link[rel="preconnect"], head style')
      .forEach(function (n) { head += n.outerHTML; });

    var clone = siteEl.cloneNode(true);
    /* The notes widget's own injected nodes come out; the marker classes it puts ON
       the page's elements are only stripped. Removing everything that matched
       [class*="trs-"] took the clauses with it: the widget tags the element it
       pinned with .trs-pin-clear, so "delete anything trs-" deleted the page. */
    clone.querySelectorAll('.trs-pin-btn, .trs-nav-count, .trs-idbar, [class*="trs-notes"]')
      .forEach(function (n) { n.remove(); });
    clone.querySelectorAll('.trs-pin-host, .trs-pin-clear').forEach(function (n) {
      n.classList.remove('trs-pin-host', 'trs-pin-clear');
    });
    pvRewrite(clone);

    /* class="pv-embed" on the frame's own <html> too, so the one set of rules in
       phone-view.css covers both ways a page ends up inside the handset: rendered
       from this clone, or navigated to with ?pv=1. */
    return '<!DOCTYPE html><html lang="en" class="pv-embed"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' + head +
      '<style>' + FRAME_CSS + '</style></head>' +
      '<body class="' + bodyClasses() + '">' + clone.outerHTML +
      '<' + 'script>' + RELAY + '<' + '/script></body></html>';
  }

  /* the page's own state classes, minus this script's (pv-on, pv-nudge) */
  function bodyClasses(){
    return document.body.className.replace(/\bpv-[\w-]+/g, '').replace(/\s+/g, ' ').trim();
  }

  /* ============================== render ============================== */
  function render(){
    var d = devSpec(dev);
    var url = urlText();
    var inner;
    if (dev === 'iphone') {
      inner = '<div style="background:var(--site-paper,#FAF8F4);">' + statusBar('iphone', false) + '</div>' +
        '<div class="scrollarea"><iframe title="Phone preview"></iframe></div>' + chromeIOS(url);
    } else {
      inner = '<div style="background:#F1F3F4;">' + statusBar('samsung', false) + '</div>' +
        chromeAndroid(url) + '<div class="scrollarea"><iframe title="Phone preview"></iframe></div>';
    }

    var swBtns = DEVICES.map(function (x) {
      return '<button type="button" data-dev="' + x[0] + '" title="' + x[2] + '"' +
        (x[0] === dev ? ' class="active"' : '') + '>' + x[1] + '</button>';
    }).join('');

    stage.innerHTML =
      '<div class="devcol pv-col">' +
        '<div class="devlbl">' + (dev === 'iphone' ? 'Safari' : 'Chrome') + ' &middot; ' + d[2] + '</div>' +
        '<div class="devspec">' + d[3] + ' CSS px</div>' +
        '<div class="devswitch">' + swBtns + '</div>' +
        phone(dev, inner) +
        '<div class="pv-cap"><b class="pv-url">' + url + '</b>' +
          'The page’s own mobile layout at a real handset width, not a shrunken screenshot. ' +
          'Scroll inside the phone. Tap a 📌 and the note opens beside it; ' +
          'the Note button for leaving your own stays on the desktop view.</div>' +
      '</div>' +
      /* the pin notes land here, outside the handset. Empty and hidden until one is
         tapped, so the phone stays centred on the stage until there is something to
         put next to it. */
      '<aside class="pv-note" hidden>' +
        '<div class="pv-note-h"><span>📌 Note on the mockup</span>' +
          '<button type="button" class="pv-note-x" title="Close">&times;</button></div>' +
        '<div class="pv-note-b"></div>' +
        '<div class="pv-note-f">Not part of the page. This is a note about it.</div>' +
      '</aside>';

    var ifr = stage.querySelector('iframe');
    ifr.addEventListener('load', syncFrame);
    ifr.srcdoc = frameDoc();
  }

  /* ===================== the pin note, beside the phone ===================== */
  function showNote(html){
    var box = stage.querySelector('.pv-note');
    if (!box) return;
    box.querySelector('.pv-note-b').innerHTML = html;
    box.hidden = false;
    stage.classList.add('pv-hasnote');
    /* Line the note's top edge up with the top of the handset rather than the top of
       the column, which also carries the label, the spec and the device switch.
       Measured rather than hardcoded: zero the margin, read the gap, apply it. If the
       window is too narrow and the note has wrapped underneath, the phone's top is
       above the note's and the gap comes out zero, which is what that layout wants. */
    var ph = stage.querySelector('.phone');
    if (ph) {
      box.style.marginTop = '0px';
      var gap = ph.getBoundingClientRect().top - box.getBoundingClientRect().top;
      box.style.marginTop = (gap > 0 ? Math.round(gap) : 0) + 'px';
    }
  }
  function hideNote(){
    var box = stage.querySelector('.pv-note');
    if (!box) return;
    box.hidden = true;
    stage.classList.remove('pv-hasnote');
  }
  stage.addEventListener('click', function (e) {
    if (e.target.closest('.pv-note-x')) hideNote();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hideNote();
  });

  /* ===================== keep the frame in step =====================
     The header switches (emirate, live/fixed, show-what-changed) all work by
     toggling a class on <body>, so mirroring that one attribute keeps the phone
     showing the same thing as the desktop frame. The per-id class copy is for
     the controls drawn INSIDE the mocked page, such as the emirate picker on the
     website mockup, whose "on" pill would otherwise stay where it was. */
  function syncFrame(){
    var ifr = stage.querySelector('iframe');
    if (!ifr) return;
    /* One try around the lot. Once a tap has navigated the frame to another mockup
       this may be a cross-origin document, and it is, on every file:// copy of the pack,
       and then even reading .body throws. Nothing to sync in that case: the page
       in there carries its own state. */
    try {
      var d = ifr.contentDocument;
      if (!d || !d.body) return;
      d.body.className = bodyClasses();
      document.querySelectorAll('.browser .site [id]').forEach(function (el) {
        if (typeof el.className !== 'string') return;   /* SVG className is not a string */
        var t = d.getElementById(el.id);
        if (t) t.className = el.className;
      });
    } catch (e) { /* cross-origin frame, leave it alone */ }
  }

  /* what the frame sends back out. A button is replayed on the real page, so the
     page's own handlers run and the state flows back down through syncFrame; a pin
     opens its note out here, beside the handset. */
  window.addEventListener('message', function (e) {
    var m = e.data;
    if (!m || !m.trsPV) return;
    if (m.trsPV === 'pin') { showNote(m.html || ''); return; }
    if (m.trsPV !== 'click' || !m.id) return;
    var el = document.getElementById(m.id);
    if (el && el.tagName === 'BUTTON') el.click();
  });

  /* body class changed (a switch was used, in either frame) → restate the URL
     and re-sync. Cheap: one attribute, a handful of ids. */
  new MutationObserver(function () {
    if (mode !== 'phone') return;
    var url = urlText();
    var u = stage.querySelector('.pv-url');
    if (u) u.textContent = url;
    stage.querySelectorAll('.pv-host').forEach(function (n) { n.textContent = hostOf(url); });
    syncFrame();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ============================== the switch ============================== */
  function setMode(m){
    mode = m;
    lsSet(LS_MODE, m);
    document.body.classList.toggle('pv-on', m === 'phone');
    sw.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === m); });
    if (m === 'phone') {
      if (!stage.dataset.built) { render(); stage.dataset.built = '1'; }
      if (!seen) {
        seen = true; lsSet(LS_SEEN, '1');
        document.body.classList.remove('pv-nudge');
        if (tip) tip.remove();
      }
    }
  }
  sw.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (b) setMode(b.dataset.mode);
  });
  stage.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-dev]');
    if (!b || b.dataset.dev === dev) return;
    dev = b.dataset.dev;
    lsSet(LS_DEV, dev);
    render();
  });

  setMode(mode);
})();
