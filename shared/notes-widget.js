// Beauty Voucher Approval Pack: notes + suggestions widget.
//
// Concept copied from the CWD knowledgebase widgets (Comments Widget + Suggestions
// Widget), merged into one slide-in panel with two tabs because this is one document
// rather than a whole site:
//   NOTES       is a revision request pinned to a specific part of the pack (a section, a
//                 T&C clause, one open decision), with threaded replies. Open -> Actioned.
//   SUGGESTIONS is a standalone idea not tied to one line, with a title, a status
//                 (Pending -> Accepted/Declined/Archived) and its own discussion thread.
//
// Plain script (not type="module") on purpose: this pack is usually opened straight off
// disk as a file:// URL, and browsers block ES module cross-origin imports in that
// context. Loaded after the Supabase UMD script, which exposes a global
// `supabase.createClient`.
//
// Injects all its own DOM: the page needs nothing but the <link>/<script> includes and a
// `data-note-pack` id on <body>.
//
// ACCESS: none, deliberately (decided 2026-08-07). Magic-link sign-in was built and then
// dropped, because making Tara and Emma go to their inbox and back before they can type a
// sentence meant they'd never leave a note at all. Instead they pick a name from the
// toggle injected into the page's sticky header, and that IS the identity.
//
// So: anyone with the URL can read and post, under any of the four names. The only
// server-side guard on authorship is that author_name must be one of them.
//
// EDITING is a different matter, and is properly guarded (2026-08-07, second pass). Marking
// a note actioned, archiving a row and deciding a suggestion need a signed-in editor account,
// Kate's. The database enforces it (sql/notes_setup.sql + sql/supabase_roles_setup.sql); the
// controls below are hidden to match, so nobody presses a button that would only fail.
// See auth/supabase-client.js, which owns the client and the session.

(function () {
  if (typeof supabase === 'undefined') return;

  var SUPABASE_URL = 'https://vlqvefsaxztitcbhirxt.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_JlOzwdcK0xjmE6j3nHmwhg_xDKxq1vv';

  var T_NOTES = 'approval_notes';
  var T_SUGG = 'approval_suggestions';
  var T_SUGG_NOTES = 'approval_suggestion_notes';

  var TZ = 'Asia/Dubai';
  var HINT_KEY = 'trs-approval-hint-dismissed';
  var POLL_MS = 20000; // only while the panel is open, because several people reviewing together

  // Keep in sync with public.is_reviewer_name() in sql/notes_setup.sql.
  var REVIEWERS = ['Tara', 'Emma', 'Hanneh', 'Kate', 'LID'];
  var NAME_KEY = 'trs-approval-author';
  var MINE_KEY = 'trs-approval-mine';

  // Share the client with auth/supabase-client.js when the page loads it, so an editor
  // session started on the sign-in page is the same session used for these writes. When it
  // is absent, fall back to an anonymous client: read and post still work, editing does not.
  var db = (window.TRS && window.TRS.db) || supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  // Can the reader change the state of a row? Only a signed-in admin. Read live rather than
  // cached, because the session arrives after the first render: supabase-client.js has to
  // ask Supabase for the session and then read the profile before it knows. Everything that
  // depends on this is re-rendered from onAuthChange at the bottom of init().
  function canEdit() { return !!(window.TRS && window.TRS.isAdmin && window.TRS.isAdmin()); }

  // The name attached to the signed-in account, '' when signed out. When it is set it wins
  // over the four-name toggle, which is the point: whatever Kate writes or actions while
  // signed in is filed as Kate, with nothing to remember to tap first.
  function sessionName() {
    var n = window.TRS && window.TRS.displayName ? window.TRS.displayName() : '';
    return n && REVIEWERS.indexOf(n) !== -1 ? n : '';
  }
  function signedIn() { return !!(window.TRS && window.TRS.email && window.TRS.email()); }

  var PACK_ID = document.body.dataset.notePack;
  var PACK_TITLE = document.title.split(':')[0].trim() || document.title;

  // Which blocks can be pinned. Sections cover everything; the two granular ones are the
  // places Tara is most likely to want to point at a single line. `.tier` is deliberately
  // NOT pinnable: the pack says there's nothing to decide there.
  var PIN_TARGETS = window.TRS_PIN_TARGETS || [
    { sel: 'main section[id]', into: '.sec-head', labelSel: 'h2', float: false },
    { sel: 'ol.terms > li', into: null, labelSel: 'strong', float: true },
    { sel: '.decision', into: null, labelSel: '.q', float: true }
  ];

  // Where the identity toggle gets injected, in priority order. Each of these is the
  // page's own sticky header, so the toggle stays visible while you scroll.
  // Tried one at a time on purpose: querySelector with a comma list returns the first
  // match in DOCUMENT order, not the first selector that matches, so 'body' always won
  // and the toggle landed at the very bottom of the page (found 2026-08-07).
  var ID_HOSTS = ['.topbar', '.top', '.dash-top', 'main', 'body'];
  function idHost() {
    for (var i = 0; i < ID_HOSTS.length; i++) {
      var el = document.querySelector(ID_HOSTS[i]);
      if (el) return el;
    }
    return null;
  }

  // ---------- helpers ----------

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: TZ }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: TZ });
  }

  function slugify(str) {
    return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function truncate(str, maxLen) {
    var clean = String(str).replace(/\s+/g, ' ').trim();
    return clean.length > maxLen ? clean.slice(0, maxLen).trim() + '…' : clean;
  }

  function cleanLabel(el) {
    var clone = el.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.badge, .trs-pin-btn, .num, .tick'), function (n) {
      n.remove();
    });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  // Identity is the signed-in account when there is one, and otherwise whichever name is
  // selected in the header toggle, remembered per browser.
  function authorName() {
    var s = sessionName();
    if (s) return s;
    var n = window.localStorage.getItem(NAME_KEY);
    return n && REVIEWERS.indexOf(n) !== -1 ? n : '';
  }
  function setAuthorName(n) { window.localStorage.setItem(NAME_KEY, n); }
  function isReviewer() { return !!authorName(); }

  // Rows posted from this browser, so Edit is only offered where it makes sense. A
  // convenience, not a permission: with no login there's nothing to enforce server-side.
  function mineIds() {
    try { return JSON.parse(window.localStorage.getItem(MINE_KEY)) || []; } catch (e) { return []; }
  }
  function rememberMine(id) {
    var ids = mineIds(); ids.push(id);
    window.localStorage.setItem(MINE_KEY, JSON.stringify(ids.slice(-200)));
  }
  function isMine(row) { return mineIds().indexOf(row.id) !== -1; }

  // anchor_id is always "<sectionId>__<slug>" so a note can be counted against its
  // sidebar section without storing the section id in its own column.
  function sectionOf(anchorId) {
    return anchorId ? String(anchorId).split('__')[0] : null;
  }

  // ---------- DOM ----------

  function buildDom() {
    var root = document.createElement('div');
    root.className = 'trs-notes-root';

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'trs-notes-toggle';
    toggle.setAttribute('aria-label', 'Open notes and suggestions');
    toggle.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>' +
      '<span class="trs-notes-count" id="trsNotesCount" hidden>0</span>';

    var hint = document.createElement('div');
    hint.className = 'trs-notes-hint';
    hint.innerHTML =
      '<span>Got notes or an idea? Tap here.</span>' +
      '<button type="button" class="trs-hint-close" aria-label="Dismiss">&times;</button>';

    var overlay = document.createElement('div');
    overlay.className = 'trs-notes-overlay';

    var panel = document.createElement('div');
    panel.className = 'trs-notes-panel';
    panel.innerHTML =
      '<div class="trs-notes-header">' +
        '<div>' +
          '<span class="trs-notes-eyebrow">Review</span>' +
          '<h3>Notes &amp; Suggestions</h3>' +
        '</div>' +
        '<button type="button" class="trs-notes-close" id="trsNotesClose" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="trs-notes-who" id="trsNotesWho"></div>' +
      '<div class="trs-notes-tabs">' +
        '<button type="button" data-tab="notes" class="active">Notes<span class="trs-tab-pill" id="trsPillNotes" hidden>0</span></button>' +
        '<button type="button" data-tab="suggestions">Suggestions<span class="trs-tab-pill" id="trsPillSugg" hidden>0</span></button>' +
      '</div>' +
      '<div class="trs-notes-filters" id="trsNotesFilters"></div>' +
      '<div class="trs-notes-message" id="trsNotesMessage"></div>' +
      '<div class="trs-notes-list" id="trsNotesList"><div class="trs-notes-empty">Loading…</div></div>' +
      '<div class="trs-notes-compose" id="trsNotesCompose"></div>';

    root.appendChild(toggle);
    root.appendChild(hint);
    root.appendChild(overlay);
    root.appendChild(panel);
    document.body.appendChild(root);

    return { root: root, toggle: toggle, hint: hint, overlay: overlay, panel: panel };
  }

  // ---------- init ----------

  function init() {
    if (!PACK_ID) return;

    var dom = buildDom();
    var listEl = document.getElementById('trsNotesList');
    var messageEl = document.getElementById('trsNotesMessage');
    var composeEl = document.getElementById('trsNotesCompose');
    var filtersEl = document.getElementById('trsNotesFilters');

    var notes = [];
    var suggestions = [];
    var suggNotes = [];
    var allNotes = [];             // every row including archived; the two lists below are slices
    var archivedNotes = [];        // editor-only, shown under the Archived filter
    var archivedSuggestions = [];
    var activeTab = 'notes';
    var noteFilter = 'all';       // all | open | done
    var suggFilter = 'all';       // all | pending | decided
    var activeAnchor = null;      // set by a pin button
    var openThreads = {};         // note thread id -> expanded
    var openDiscussions = {};     // suggestion id -> discussion expanded
    var pendingOpenAnchorId = null;
    var pollTimer = null;
    var loadError = null;         // set when the last fetch failed, so switching tabs doesn't
                                  // quietly claim "nothing here yet" when the DB is unreachable

    function showMessage(text, type) {
      messageEl.textContent = text;
      messageEl.className = 'trs-notes-message show trs-notes-message-' + type;
      if (type === 'ok') {
        window.setTimeout(function () {
          if (messageEl.textContent === text) clearMessage();
        }, 3000);
      }
    }
    function clearMessage() {
      messageEl.className = 'trs-notes-message';
      messageEl.textContent = '';
    }

    // ---------- who am I ----------

    // The identity toggle lives in the page's own sticky header, not just in the panel, so
    // whoever is reading can see and change who they're posting as at any point without
    // opening anything. Injected into .topbar (already sticky); falls back to the top of
    // <main> if this pack ever loses its topbar.
    function buildIdentityBar() {
      var host = idHost();
      if (!host) return null;
      var bar = document.createElement('div');
      bar.className = 'trs-idbar';
      host.appendChild(bar);
      renderIdentityBar(bar);
      return bar;
    }

    // Two states, redrawn whenever the session or the selected name changes.
    //
    //   signed out  the four-name toggle, plus a quiet "Sign in to edit" link. This is the
    //               reviewers' state and the one Tara, Emma and Hanneh stay in.
    //   signed in   no toggle at all. The account IS the identity, so offering to post as
    //               someone else would only produce notes signed with the wrong name.
    //               Sign out is always on screen, which is what makes it safe to keep the
    //               session in localStorage on a shared machine.
    function renderIdentityBar(bar) {
      var name = authorName();

      if (signedIn()) {
        var role = canEdit() ? 'editor' : 'viewer';
        var label = sessionName() || (window.TRS.email() || '');
        bar.innerHTML =
          '<span class="trs-idbar-label">Signed in as</span>' +
          '<span class="trs-idbar-you">' + esc(label) +
            '<span class="trs-idbar-role trs-role-' + role + '">' + role + '</span>' +
          '</span>' +
          (canEdit()
            ? ''
            : '<span class="trs-idbar-hint">This account cannot action notes. ' +
              'Ask for editor access, or sign out to post as yourself.</span>') +
          '<button type="button" class="trs-idbar-link" data-id-act="signout">Sign out</button>';
      } else {
        bar.innerHTML =
          '<span class="trs-idbar-label">You are</span>' +
          '<span class="trs-idbar-btns">' +
            REVIEWERS.map(function (n) {
              return '<button type="button" data-name="' + esc(n) + '"' +
                (n === name ? ' class="active"' : '') + '>' + esc(n) + '</button>';
            }).join('') +
          '</span>' +
          '<span class="trs-idbar-hint" id="trsIdHint"' + (name ? ' hidden' : '') + '>' +
            '&#9664; Tap your name first, or you cannot leave notes</span>' +
          (window.TRS && window.TRS.loginUrl
            ? '<a class="trs-idbar-link" href="' + esc(window.TRS.loginUrl()) + '">Sign in to edit</a>'
            : '');
      }

      bar.classList.toggle('trs-idbar-set', !!name);
      bar.classList.toggle('trs-idbar-editor', canEdit());

      Array.prototype.forEach.call(bar.querySelectorAll('button[data-name]'), function (btn) {
        btn.addEventListener('click', function () {
          var already = authorName() === btn.dataset.name;
          // clicking the selected name again clears it, a way back out if someone picks
          // the wrong one on a shared machine
          setAuthorName(already ? '' : btn.dataset.name);
          syncIdentity();
        });
      });

      var out = bar.querySelector('[data-id-act="signout"]');
      if (out) {
        out.addEventListener('click', function () {
          out.disabled = true;
          window.TRS.signOut().then(syncIdentity);
        });
      }
    }

    // Keeps the header toggle, the panel's "posting as" line, the composer and every
    // editor-only control in step whenever the name or the session changes.
    function syncIdentity() {
      if (dom.idbar) renderIdentityBar(dom.idbar);
      renderWho();
      renderCompose();
      renderFilters();
      renderList();
    }

    function renderWho() {
      var whoEl = document.getElementById('trsNotesWho');
      var name = authorName();
      // Signed in, the name is not a choice: it comes from the account, so "not you?" would
      // only lead somewhere that does nothing. Sign out is in the header instead.
      whoEl.innerHTML = signedIn()
        ? 'Posting as <strong>' + esc(name || window.TRS.email()) + '</strong>' +
          (canEdit() ? ' · <span class="trs-who-role">you can action and archive</span>' : '')
        : name
          ? 'Posting as <strong>' + esc(name) + '</strong> · <button type="button" ' +
            'id="trsWhoChange">not you?</button>'
          : '<strong>Pick your name</strong> in the header above before leaving a note.';
      var change = document.getElementById('trsWhoChange');
      if (change) {
        change.addEventListener('click', function () {
          setAuthorName('');
          syncIdentity();
          closePanel(); // the toggle is up in the header, so get out of its way
        });
      }
    }

    // ---------- panel open/close ----------

    function openPanel(tab) {
      if (tab) activeTab = tab;
      dom.panel.classList.add('open');
      dom.overlay.classList.add('open');
      syncTabs();
      loadAll();
      if (!pollTimer) pollTimer = window.setInterval(loadAll, POLL_MS);
    }
    function closePanel() {
      dom.panel.classList.remove('open');
      dom.overlay.classList.remove('open');
      if (pollTimer) { window.clearInterval(pollTimer); pollTimer = null; }
    }

    dom.overlay.addEventListener('click', closePanel);
    document.getElementById('trsNotesClose').addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dom.panel.classList.contains('open')) closePanel();
    });

    function dismissHint() {
      dom.hint.classList.remove('show');
      window.localStorage.setItem(HINT_KEY, '1');
    }
    dom.hint.querySelector('.trs-hint-close').addEventListener('click', dismissHint);
    dom.toggle.addEventListener('click', function () {
      dismissHint();
      openPanel();
    });

    // ---------- tabs + filters ----------

    Array.prototype.forEach.call(dom.panel.querySelectorAll('.trs-notes-tabs button'), function (btn) {
      btn.addEventListener('click', function () {
        activeTab = btn.dataset.tab;
        syncTabs();
        renderList();
        renderCompose();
      });
    });

    function syncTabsOnly() {
      Array.prototype.forEach.call(dom.panel.querySelectorAll('.trs-notes-tabs button'), function (btn) {
        btn.classList.toggle('active', btn.dataset.tab === activeTab);
      });
    }

    function syncTabs() {
      syncTabsOnly();
      renderFilters();
    }

    // Archived is an editor-only filter. Everyone else never sees the archived rows, which
    // is the whole point of archiving them; the editor needs the view because archiving has
    // to be reversible without opening the SQL editor.
    function renderFilters() {
      var opts = activeTab === 'notes'
        ? [['all', 'All'], ['open', 'Open'], ['done', 'Actioned']]
        : [['all', 'All'], ['pending', 'Pending'], ['decided', 'Decided']];
      if (canEdit()) opts.push(['archived', 'Archived']);

      var current = activeTab === 'notes' ? noteFilter : suggFilter;
      // dropped back to All when the editor signs out mid-session, so nobody is left
      // staring at an empty list on a filter that no longer has a button
      if (current === 'archived' && !canEdit()) {
        current = 'all';
        if (activeTab === 'notes') noteFilter = 'all'; else suggFilter = 'all';
      }
      filtersEl.innerHTML = opts.map(function (o) {
        return '<button type="button" data-val="' + o[0] + '"' +
          (o[0] === current ? ' class="active"' : '') + '>' + o[1] + '</button>';
      }).join('');
      Array.prototype.forEach.call(filtersEl.querySelectorAll('button'), function (btn) {
        btn.addEventListener('click', function () {
          if (activeTab === 'notes') noteFilter = btn.dataset.val;
          else suggFilter = btn.dataset.val;
          renderFilters();
          renderList();
        });
      });
    }

    // ---------- pins ----------

    function computeAnchor(el, target, index) {
      var section = el.matches('section[id]') ? el : el.closest('section[id]');
      var sectionId = section ? section.id : (window.TRS_ANCHOR_PREFIX || 'pack');
      if (el.matches('section[id]')) {
        var h2 = el.querySelector(target.labelSel);
        // "__section" rather than a slug of the heading: a section anchor should survive a
        // reworded heading, since the label is snapshotted on the note row anyway.
        return { id: sectionId + '__section', label: h2 ? cleanLabel(h2) : sectionId };
      }
      var labelEl = target.labelSel ? el.querySelector(target.labelSel) : null;
      var label = cleanLabel(labelEl || el);
      var slug = slugify(label).slice(0, 60) || ('item-' + index);
      return { id: sectionId + '__' + slug, label: truncate(label, 120) };
    }

    function makePin(anchor, floating) {
      var pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'trs-pin-btn' + (floating ? ' trs-pin-float' : '');
      pin.title = 'Leave a note on this';
      // The tooltip is fine when you can see what "this" is; a screen reader hears 31
      // identical buttons in the calendar's month grid, so the name carries the anchor.
      pin.setAttribute('aria-label', 'Leave a note on ' + anchor.label);
      pin.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>' +
        (floating ? '' : '<span>Note</span>') +
        '<span class="trs-pin-count" hidden></span>';
      pin.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        activeAnchor = { id: anchor.id, label: anchor.label };
        pendingOpenAnchorId = anchor.id;
        openPanel('notes');
        renderCompose();
      });
      return pin;
    }

    function injectPins() {
      var seen = {};
      PIN_TARGETS.forEach(function (target) {
        Array.prototype.forEach.call(document.querySelectorAll(target.sel), function (el, i) {
          // Already carries its pin. Matters on a page that rebuilds part of itself (the
          // calendar redraws both its views on a month change or a channel toggle and calls
          // back in here); without this, the blocks that survived the redraw would collect a
          // second pin every time.
          if (el.dataset.noteAnchorId && el.querySelector('.trs-pin-btn')) return;
          var anchor = computeAnchor(el, target, i);
          if (!anchor || seen[anchor.id]) return;
          seen[anchor.id] = true;
          el.dataset.noteAnchorId = anchor.id;

          var host = target.into ? el.querySelector(target.into) : el;
          if (!host) return;
          if (target.float) {
            host.classList.add('trs-pin-host');
            // the pin is absolutely positioned inside the block, so the block has to be a
            // containing block for it
            if (window.getComputedStyle(host).position === 'static') host.style.position = 'relative';
            // ...and the block's own heading has to leave room for it, or a long heading
            // runs underneath the pin. Only the heading is indented, not the body copy.
            var headingEl = target.labelSel ? host.querySelector(target.labelSel) : null;
            if (headingEl) headingEl.classList.add('trs-pin-clear');
          }
          host.appendChild(makePin(anchor, target.float));
        });
      });
    }

    function updatePinCounts() {
      var counts = {};
      notes.forEach(function (n) {
        if (n.anchor_id) counts[n.anchor_id] = (counts[n.anchor_id] || 0) + 1;
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-note-anchor-id]'), function (el) {
        var pin = el.querySelector('.trs-pin-btn');
        if (!pin) return;
        var countEl = pin.querySelector('.trs-pin-count');
        var n = counts[el.dataset.noteAnchorId];
        if (n) {
          countEl.textContent = n;
          countEl.hidden = false;
          pin.classList.add('has-notes');
        } else {
          countEl.hidden = true;
          pin.classList.remove('has-notes');
        }
      });
    }

    // Open-note count per sidebar section, so the nav shows where the work is.
    function updateNavCounts() {
      var counts = {};
      notes.forEach(function (n) {
        if (n.parent_id || n.resolved) return;
        var sec = sectionOf(n.anchor_id);
        if (sec) counts[sec] = (counts[sec] || 0) + 1;
      });
      Array.prototype.forEach.call(document.querySelectorAll('#nav a[href^="#"]'), function (a) {
        var sec = a.getAttribute('href').slice(1);
        var pill = a.querySelector('.trs-nav-count');
        var n = counts[sec];
        if (n) {
          if (!pill) {
            pill = document.createElement('span');
            pill.className = 'trs-nav-count';
            // before the status dot, so the dot stays the right-most thing in the row
            a.insertBefore(pill, a.querySelector('.dot'));
          }
          pill.textContent = n;
        } else if (pill) {
          pill.remove();
        }
      });
    }

    function updateToggleCount() {
      var openNotes = notes.filter(function (n) { return !n.parent_id && !n.resolved; }).length;
      var pendingSugg = suggestions.filter(function (s) { return s.status === 'pending'; }).length;

      var countEl = document.getElementById('trsNotesCount');
      var total = openNotes + pendingSugg;
      countEl.textContent = total;
      countEl.hidden = total === 0;

      var pn = document.getElementById('trsPillNotes');
      pn.textContent = openNotes;
      pn.hidden = openNotes === 0;

      var ps = document.getElementById('trsPillSugg');
      ps.textContent = pendingSugg;
      ps.hidden = pendingSugg === 0;
    }

    // Landing on #sectionId__slug from a shared link: that's a data-note-anchor-id value,
    // not a real element id, so the browser's own hash-scroll does nothing. Scroll to it
    // and flash it manually.
    function scrollToAnchorFromHash() {
      var raw = window.location.hash ? window.location.hash.slice(1) : '';
      if (!raw) return;
      // a magic-link return lands as #access_token=...&refresh_token=..., which is GoTrue's
      // to consume, not an anchor to scroll to
      if (raw.indexOf('access_token=') !== -1 || raw.indexOf('error_description=') !== -1) return;
      var hash;
      try { hash = decodeURIComponent(raw); } catch (e) { hash = raw; }
      var target = document.querySelector('[data-note-anchor-id="' + hash.replace(/"/g, '\\"') + '"]');
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.style.transition = 'box-shadow .3s ease';
      target.style.boxShadow = '0 0 0 3px rgba(153,246,228,.85)';
      window.setTimeout(function () { target.style.boxShadow = ''; }, 2500);
    }

    // ---------- load ----------

    // Archived rows are fetched too, then split off below. They are hidden from everyone's
    // normal view, but the editor can pull them back up under the Archived filter and
    // restore one, so archiving stays reversible from the page. It used to be a SQL job.
    function loadAll() {
      var q1 = db.from(T_NOTES).select('*')
        .eq('pack_id', PACK_ID)
        .order('created_at', { ascending: false });
      // 'archived' as a suggestion status means "hide this", the same contract as a note's
      // archived flag. Nothing is ever deleted, here or anywhere in this pack.
      var q2 = db.from(T_SUGG).select('*')
        .eq('pack_id', PACK_ID)
        .order('created_at', { ascending: false });
      var q3 = db.from(T_SUGG_NOTES).select('*')
        .order('created_at', { ascending: true });

      Promise.all([q1, q2, q3]).then(function (res) {
        var err = res[0].error || res[1].error || res[2].error;
        if (err) {
          loadError = err.message;
          renderList();
          return;
        }
        loadError = null;
        // Split rather than filter in the query, so the counts on the pins, the nav and the
        // toggle keep counting only live rows while the Archived view still has something
        // to show.
        allNotes = res[0].data || [];
        var allSugg = res[1].data || [];
        notes = allNotes.filter(function (n) { return !n.archived; });
        archivedNotes = allNotes.filter(function (n) { return n.archived; });
        suggestions = allSugg.filter(function (s) { return s.status !== 'archived'; });
        archivedSuggestions = allSugg.filter(function (s) { return s.status === 'archived'; });
        suggNotes = res[2].data || [];

        if (pendingOpenAnchorId) {
          notes.forEach(function (n) {
            if (!n.parent_id && n.anchor_id === pendingOpenAnchorId) openThreads[n.id] = true;
          });
          pendingOpenAnchorId = null;
        }

        renderList();
        updateToggleCount();
        updatePinCounts();
        updateNavCounts();
      });
    }

    // ---------- render: notes ----------

    function buildThreads(list) {
      var byId = {}, roots = [];
      list.forEach(function (n) { byId[n.id] = n; n.replies = []; });
      list.forEach(function (n) {
        if (n.parent_id && byId[n.parent_id]) byId[n.parent_id].replies.push(n);
        else if (!n.parent_id) roots.push(n);
      });
      roots.forEach(function (r) {
        r.replies.sort(function (a, b) { return new Date(a.created_at) - new Date(b.created_at); });
      });
      return roots;
    }

    // skipHeader: true for a root note rendered inside its own <details>: the <summary>
    // row already shows author/date/status, so repeating them doubles up the same info.
    function renderNoteCard(n, isReply, skipHeader) {
      var footer = [];
      if (!isReply) {
        // resolving and archiving are the editor's; everyone else sees the state, not the
        // switch. Archive is the reversible "get this out of the way" for duplicates and
        // test rows: hidden from the panel, still in the table, restorable from the
        // Archived filter. Nothing in this pack deletes.
        if (canEdit()) {
          if (n.archived) {
            footer.push('<button type="button" class="trs-primary" data-act="unarchive" data-id="' +
              n.id + '">Restore</button>');
          } else {
            footer.push('<button type="button" class="trs-primary" data-act="resolve" data-id="' + n.id +
              '" data-resolved="' + n.resolved + '">' + (n.resolved ? 'Reopen' : 'Mark actioned') + '</button>');
            footer.push('<button type="button" data-act="archive" data-id="' + n.id +
              '" title="Hides it from the panel. Nothing is deleted, and you can restore it ' +
              'from the Archived filter.">Archive</button>');
          }
        }
        if (!n.resolved && !n.archived) {
          footer.push('<button type="button" data-act="reply" data-id="' + n.id + '">Reply</button>');
        }
      }
      // Editing the text of a posted note is an UPDATE, and only the editor has one. It used
      // to be offered to anyone on their own rows, which meant a reviewer could type a
      // correction, press Save and get a permission error from the database.
      if (isMine(n) && canEdit()) {
        footer.push('<button type="button" data-act="edit" data-id="' + n.id + '">Edit</button>');
      }
      var meta = skipHeader ? '' :
        '<div class="trs-note-meta">' +
          '<span class="trs-note-author">' + esc(n.author_name) + '</span>' +
          '<span class="trs-note-date">' + formatDate(n.created_at) + '</span>' +
        '</div>';
      var anchorTag = (!isReply && n.anchor_label && !skipHeader)
        ? '<div class="trs-note-anchor">📍 ' + esc(n.anchor_label) + '</div>' : '';

      return '<div class="trs-note' + (n.resolved && !isReply ? ' resolved' : '') +
          (isReply ? ' trs-note-reply' : '') + '">' +
          anchorTag + meta +
          '<p class="trs-note-body" data-id="' + n.id + '">' + esc(n.body) + '</p>' +
          '<form class="trs-inline-form trs-edit-form" data-id="' + n.id + '" hidden>' +
            '<textarea required>' + esc(n.body) + '</textarea>' +
            '<div class="trs-inline-form-btns">' +
              '<button type="submit" class="trs-inline-submit">Save</button>' +
              '<button type="button" data-act="edit-cancel">Cancel</button>' +
            '</div>' +
          '</form>' +
          (footer.length ? '<div class="trs-note-footer">' + footer.join('') + '</div>' : '') +
        '</div>';
    }

    function renderThread(root) {
      var replies = root.replies.length;
      // Archived wins the badge: in the Archived view the open/actioned state is still true
      // but it is not what the reader needs to know about the row.
      var badge = root.archived
        ? '<span class="trs-badge trs-badge-declined">Archived</span>'
        : root.resolved
          ? '<span class="trs-badge trs-badge-done">Actioned' +
              (root.resolved_by_name ? ' · ' + esc(root.resolved_by_name) : '') + '</span>'
          : '<span class="trs-badge trs-badge-open">Open</span>';

      return '<details class="trs-thread" data-thread-id="' + root.id + '"' +
          (openThreads[root.id] ? ' open' : '') + '>' +
          '<summary class="trs-thread-summary">' +
            '<span class="trs-sum-line">' +
              (root.anchor_label ? '<span title="' + esc(root.anchor_label) + '">📍</span>' : '') +
              '<span class="trs-sum-author">' + esc(root.author_name) + '</span>' +
              '<span class="trs-sum-snippet">' + esc(truncate(root.body, 52)) + '</span>' +
            '</span>' +
            '<span class="trs-sum-meta">' + badge +
              (replies ? '<span class="trs-reply-count">' + replies + ' repl' + (replies === 1 ? 'y' : 'ies') + '</span>' : '') +
              '<span>' + formatDate(root.created_at) + '</span>' +
            '</span>' +
          '</summary>' +
          '<div class="trs-thread-body">' +
            (root.anchor_label ? '<div class="trs-note-anchor" style="margin-top:13px">📍 ' + esc(root.anchor_label) + '</div>' : '') +
            renderNoteCard(root, false, true) +
            root.replies.map(function (r) { return renderNoteCard(r, true); }).join('') +
            (root.resolved
              ? '<div class="trs-locked-hint">This is marked actioned. Reopen it above to add a new reply.</div>'
              : '<form class="trs-inline-form trs-reply-form" data-parent-id="' + root.id + '" hidden>' +
                  '<textarea placeholder="Write a reply…" required></textarea>' +
                  '<div class="trs-inline-form-btns"><button type="submit" class="trs-inline-submit">Post reply</button></div>' +
                '</form>') +
          '</div>' +
        '</details>';
    }

    function renderNotesList() {
      var threads;
      if (noteFilter === 'archived') {
        // An archived root keeps its replies, which are not archived themselves, so pull
        // them back in explicitly or the thread reads as if nobody answered.
        var archivedIds = {};
        archivedNotes.forEach(function (n) { archivedIds[n.id] = true; });
        threads = buildThreads(allNotes.filter(function (n) {
          return n.archived || (n.parent_id && archivedIds[n.parent_id]);
        }));
      } else {
        threads = buildThreads(notes).filter(function (t) {
          if (noteFilter === 'open') return !t.resolved;
          if (noteFilter === 'done') return t.resolved;
          return true;
        });
      }
      if (!threads.length) {
        listEl.innerHTML = '<div class="trs-notes-empty">' +
          (noteFilter === 'all'
            ? 'No notes yet.<br>Use the <strong>Note</strong> button next to any section, clause or decision to pin one, or write a general note below.'
            : noteFilter === 'archived'
              ? 'Nothing archived. Archiving hides a note from everyone without deleting it, and you can restore it from here.'
              : 'Nothing here with that filter.') +
          '</div>';
        return;
      }
      listEl.innerHTML = threads.map(renderThread).join('');

      Array.prototype.forEach.call(listEl.querySelectorAll('.trs-thread'), function (d) {
        d.addEventListener('toggle', function () {
          if (d.open) openThreads[d.dataset.threadId] = true;
          else delete openThreads[d.dataset.threadId];
        });
      });

      Array.prototype.forEach.call(listEl.querySelectorAll('[data-act]'), function (btn) {
        btn.addEventListener('click', function () {
          var act = btn.dataset.act;
          if (act === 'resolve') {
            setResolved(btn.dataset.id, btn.dataset.resolved !== 'true');
          } else if (act === 'archive' || act === 'unarchive') {
            setArchived(btn.dataset.id, act === 'archive');
          } else if (act === 'reply') {
            var form = btn.closest('.trs-thread').querySelector('.trs-reply-form');
            if (!form) return;
            form.hidden = !form.hidden;
            if (!form.hidden) form.querySelector('textarea').focus();
          } else if (act === 'edit') {
            var card = btn.closest('.trs-note');
            card.querySelector('.trs-note-body').hidden = true;
            var ef = card.querySelector('.trs-edit-form');
            ef.hidden = false;
            var ta = ef.querySelector('textarea');
            ta.focus();
            ta.selectionStart = ta.selectionEnd = ta.value.length;
          } else if (act === 'edit-cancel') {
            var c = btn.closest('.trs-note');
            c.querySelector('.trs-edit-form').hidden = true;
            c.querySelector('.trs-note-body').hidden = false;
          }
        });
      });

      Array.prototype.forEach.call(listEl.querySelectorAll('.trs-reply-form'), function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var ta = form.querySelector('textarea');
          var body = ta.value.trim();
          if (!body) return;
          if (!requireAuth()) return;
          var btn = form.querySelector('.trs-inline-submit');
          btn.disabled = true; btn.textContent = 'Posting…';
          var parent = notes.filter(function (n) { return n.id === form.dataset.parentId; })[0];
          db.from(T_NOTES).insert({
            pack_id: PACK_ID,
            pack_title: PACK_TITLE,
            anchor_id: parent ? parent.anchor_id : null,
            anchor_label: parent ? parent.anchor_label : null,
            parent_id: form.dataset.parentId,
            author_name: authorName(),
            body: body
          }).select('id').then(function (res) {
            btn.disabled = false; btn.textContent = 'Post reply';
            if (res.error) { showMessage('Could not post that reply: ' + res.error.message, 'error'); return; }
            loadAll();
          });
        });
      });

      Array.prototype.forEach.call(listEl.querySelectorAll('.trs-edit-form'), function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var body = form.querySelector('textarea').value.trim();
          if (!body) return;
          var btn = form.querySelector('.trs-inline-submit');
          btn.disabled = true; btn.textContent = 'Saving…';
          db.from(T_NOTES).update({ body: body }).eq('id', form.dataset.id).then(function (res) {
            btn.disabled = false; btn.textContent = 'Save';
            if (res.error) { showMessage('Could not save that edit: ' + res.error.message, 'error'); return; }
            loadAll();
          });
        });
      });
    }

    function setResolved(id, resolved) {
      if (!requireEditor()) return;
      var patch = resolved
        ? { resolved: true, resolved_by_name: authorName(), resolved_at: new Date().toISOString() }
        : { resolved: false, resolved_by_name: null, resolved_at: null };
      db.from(T_NOTES).update(patch).eq('id', id).then(function (res) {
        if (res.error) { showMessage('Could not update that note: ' + res.error.message, 'error'); return; }
        showMessage(resolved ? 'Marked actioned.' : 'Reopened.', 'ok');
        loadAll();
      });
    }

    function setArchived(id, archived) {
      if (!requireEditor()) return;
      db.from(T_NOTES).update({ archived: archived }).eq('id', id).then(function (res) {
        if (res.error) { showMessage('Could not archive that note: ' + res.error.message, 'error'); return; }
        showMessage(archived
          ? 'Archived. It is hidden, not deleted: the Archived filter brings it back.'
          : 'Restored.', 'ok');
        loadAll();
      });
    }

    // The database is the guard; this only stops a stale button from producing a confusing
    // permission error when the session expired since the panel was drawn.
    function requireEditor() {
      if (canEdit()) return true;
      showMessage(signedIn()
        ? 'This account is a viewer, so it cannot change the state of a row. Ask for editor access.'
        : 'Sign in as the editor to action, decide or archive.', 'error');
      return false;
    }

    // ---------- render: suggestions ----------

    var STATUS_BADGE = {
      pending: '<span class="trs-badge trs-badge-pending">Pending</span>',
      accepted: '<span class="trs-badge trs-badge-done">Accepted</span>',
      declined: '<span class="trs-badge trs-badge-declined">Declined</span>',
      archived: '<span class="trs-badge trs-badge-declined">Archived</span>'
    };

    function renderSuggestion(s) {
      var disc = suggNotes.filter(function (n) { return n.suggestion_id === s.id; });
      // deciding is the editor's. A viewer still sees the status badge and the discussion,
      // which is the whole point: they watch their suggestion move.
      var actions = '';
      if (canEdit()) {
        actions = s.status === 'pending'
          ? '<button type="button" class="trs-accept" data-sact="accepted" data-id="' + s.id + '">Accept</button>' +
            '<button type="button" class="trs-decline" data-sact="declined" data-id="' + s.id + '">Decline</button>' +
            '<button type="button" data-sact="archived" data-id="' + s.id + '" ' +
              'title="Hides it from this panel. Nothing is deleted, and the Archived filter ' +
              'brings it back.">Archive</button>'
          : '<button type="button" class="' + (s.status === 'archived' ? 'trs-primary' : '') +
            '" data-sact="pending" data-id="' + s.id + '">' +
            (s.status === 'archived' ? 'Restore' : 'Reset to pending') + '</button>';
      }
      // same as a note: changing the text is an UPDATE, and only the editor has one
      if (isMine(s) && canEdit()) {
        actions += '<button type="button" data-sact="edit" data-id="' + s.id + '">Edit</button>';
      }

      return '<div class="trs-sugg status-' + s.status + '">' +
          '<div class="trs-sugg-head">' +
            '<div>' +
              '<div class="trs-sugg-title">' + esc(s.title) + '</div>' +
              '<div class="trs-sugg-meta">' + esc(s.requester_name) + ' · ' + formatDate(s.created_at) +
                (s.section_context ? ' · from ' + esc(s.section_context) : '') +
                (s.status !== 'pending' && s.actioned_by_name ? ' · decided by ' + esc(s.actioned_by_name) : '') +
              '</div>' +
            '</div>' + STATUS_BADGE[s.status] +
          '</div>' +
          (s.description ? '<p class="trs-sugg-desc" data-id="' + s.id + '">' + esc(s.description) + '</p>' : '') +
          '<form class="trs-inline-form trs-sugg-edit" data-id="' + s.id + '" hidden>' +
            '<input type="text" value="' + esc(s.title) + '" maxlength="200" required>' +
            '<textarea placeholder="Description (optional)">' + esc(s.description || '') + '</textarea>' +
            '<div class="trs-inline-form-btns">' +
              '<button type="submit" class="trs-inline-submit">Save</button>' +
              '<button type="button" data-sact="edit-cancel" data-id="' + s.id + '">Cancel</button>' +
            '</div>' +
          '</form>' +
          '<div class="trs-sugg-actions">' + actions + '</div>' +
          '<details class="trs-sugg-disc" data-sugg-id="' + s.id + '"' + (openDiscussions[s.id] ? ' open' : '') + '>' +
            '<summary>Discussion' + (disc.length ? ' (' + disc.length + ')' : '') + '</summary>' +
            disc.map(function (n) {
              return '<div class="trs-disc-note">' +
                '<div class="trs-note-meta">' +
                  '<span class="trs-note-author">' + esc(n.author_name) + '</span>' +
                  '<span class="trs-note-date">' + formatDate(n.created_at) + '</span>' +
                '</div>' +
                '<p class="trs-note-body">' + esc(n.body) + '</p>' +
              '</div>';
            }).join('') +
            (s.status === 'pending'
              ? '<form class="trs-inline-form trs-disc-form" data-sugg-id="' + s.id + '">' +
                  '<textarea placeholder="Add a note on this idea…" required></textarea>' +
                  '<div class="trs-inline-form-btns"><button type="submit" class="trs-inline-submit">Post note</button></div>' +
                '</form>'
              : '<div class="trs-locked-hint">This is decided. Reset it to pending to add a note.</div>') +
          '</details>' +
        '</div>';
    }

    function renderSuggestionsList() {
      var list = suggFilter === 'archived'
        ? archivedSuggestions
        : suggestions.filter(function (s) {
            if (suggFilter === 'pending') return s.status === 'pending';
            if (suggFilter === 'decided') return s.status !== 'pending';
            return true;
          });
      if (!list.length) {
        listEl.innerHTML = '<div class="trs-notes-empty">' +
          (suggFilter === 'all'
            ? 'No suggestions yet.<br>Use the box below for anything that isn\'t tied to one specific line: a different idea, an addition, a "what if we…".'
            : suggFilter === 'archived'
              ? 'Nothing archived. Archiving hides a suggestion from everyone without deleting it, and you can restore it from here.'
              : 'Nothing here with that filter.') +
          '</div>';
        return;
      }
      listEl.innerHTML = list.map(renderSuggestion).join('');

      Array.prototype.forEach.call(listEl.querySelectorAll('.trs-sugg-disc'), function (d) {
        d.addEventListener('toggle', function () {
          if (d.open) openDiscussions[d.dataset.suggId] = true;
          else delete openDiscussions[d.dataset.suggId];
        });
      });

      Array.prototype.forEach.call(listEl.querySelectorAll('[data-sact]'), function (btn) {
        btn.addEventListener('click', function () {
          var act = btn.dataset.sact;
          var card = btn.closest('.trs-sugg');
          if (act === 'edit') {
            var desc = card.querySelector('.trs-sugg-desc');
            if (desc) desc.hidden = true;
            card.querySelector('.trs-sugg-title').hidden = true;
            card.querySelector('.trs-sugg-edit').hidden = false;
            card.querySelector('.trs-sugg-edit input').focus();
            return;
          }
          if (act === 'edit-cancel') {
            var d2 = card.querySelector('.trs-sugg-desc');
            if (d2) d2.hidden = false;
            card.querySelector('.trs-sugg-title').hidden = false;
            card.querySelector('.trs-sugg-edit').hidden = true;
            return;
          }
          setStatus(btn.dataset.id, act);
        });
      });

      Array.prototype.forEach.call(listEl.querySelectorAll('.trs-sugg-edit'), function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var title = form.querySelector('input').value.trim();
          var description = form.querySelector('textarea').value.trim();
          if (!title) return;
          var btn = form.querySelector('.trs-inline-submit');
          btn.disabled = true; btn.textContent = 'Saving…';
          db.from(T_SUGG).update({ title: title, description: description || null })
            .eq('id', form.dataset.id).then(function (res) {
              btn.disabled = false; btn.textContent = 'Save';
              if (res.error) { showMessage('Could not save that edit: ' + res.error.message, 'error'); return; }
              loadAll();
            });
        });
      });

      Array.prototype.forEach.call(listEl.querySelectorAll('.trs-disc-form'), function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var body = form.querySelector('textarea').value.trim();
          if (!body) return;
          if (!requireAuth()) return;
          var btn = form.querySelector('.trs-inline-submit');
          btn.disabled = true; btn.textContent = 'Posting…';
          db.from(T_SUGG_NOTES).insert({
            suggestion_id: form.dataset.suggId,
            author_name: authorName(),
            body: body
          }).then(function (res) {
            btn.disabled = false; btn.textContent = 'Post note';
            if (res.error) { showMessage('Could not post that note: ' + res.error.message, 'error'); return; }
            openDiscussions[form.dataset.suggId] = true;
            loadAll();
          });
        });
      });
    }

    var STATUS_SAID = {
      accepted: 'Accepted.',
      declined: 'Declined.',
      archived: 'Archived. It is hidden, not deleted: the Archived filter brings it back.',
      pending: 'Back to pending. The discussion is open again.'
    };

    function setStatus(id, status) {
      if (!requireEditor()) return;
      var patch = status === 'pending'
        ? { status: 'pending', actioned_by_name: null, actioned_at: null }
        : { status: status, actioned_by_name: authorName(), actioned_at: new Date().toISOString() };
      db.from(T_SUGG).update(patch).eq('id', id).then(function (res) {
        if (res.error) { showMessage('Could not update that suggestion: ' + res.error.message, 'error'); return; }
        showMessage(STATUS_SAID[status] || 'Updated.', 'ok');
        loadAll();
      });
    }

    function renderList() {
      if (loadError) {
        listEl.innerHTML = '<div class="trs-notes-empty">Notes and suggestions are unavailable ' +
          'right now.<br><br>' + esc(loadError) + '</div>';
        return;
      }
      if (activeTab === 'notes') renderNotesList();
      else renderSuggestionsList();
    }

    // ---------- compose ----------

    // Posting needs a name; reading doesn't. Nudges the header toggle rather than
    // blocking with a form, since the toggle is the only place to fix it.
    function requireAuth() {
      if (isReviewer()) return true;
      showMessage('Pick your name in the header first, so we know who this is from.', 'error');
      if (dom.idbar) {
        dom.idbar.classList.add('trs-idbar-nudge');
        window.setTimeout(function () { dom.idbar.classList.remove('trs-idbar-nudge'); }, 1800);
      }
      return false;
    }

    function renderCompose() {
      // No name picked = nothing to post with. Show why instead of a form that will only
      // reject them once they have typed the whole thing out.
      if (!isReviewer()) {
        composeEl.innerHTML =
          '<div class="trs-locked-compose">' +
            '<strong>Tap your name to start</strong>' +
            '<p>Notes and suggestions are filed under whoever left them, so pick ' +
            '<strong>Tara</strong>, <strong>Emma</strong>, <strong>Hanneh</strong> or ' +
            '<strong>Kate</strong> in the header at the top of the page. It only has to be ' +
            'done once on this device.</p>' +
            '<button type="button" id="trsJumpToId">Take me to it</button>' +
          '</div>';
        document.getElementById('trsJumpToId').addEventListener('click', function () {
          closePanel();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (dom.idbar) {
            dom.idbar.classList.add('trs-idbar-nudge');
            window.setTimeout(function () { dom.idbar.classList.remove('trs-idbar-nudge'); }, 2200);
          }
        });
        return;
      }
      if (activeTab === 'notes') {
        composeEl.innerHTML =
          (activeAnchor
            ? '<div class="trs-compose-chip"><span>📍 ' + esc(activeAnchor.label) + '</span>' +
              '<button type="button" id="trsChipClear" aria-label="Clear">&times;</button></div>'
            : '') +
          '<form id="trsNoteForm">' +
            '<textarea id="trsNoteInput" placeholder="' +
              (activeAnchor ? 'Your note on this bit…' : 'A general note on the pack…') +
              '" required></textarea>' +
            '<button type="submit" class="trs-submit">Add note</button>' +
          '</form>' +
          (activeAnchor ? '' : '<div class="trs-compose-hint">Tip: use the <strong>Note</strong> button next to a section, clause or decision to pin a note to it.</div>');

        if (activeAnchor) {
          document.getElementById('trsChipClear').addEventListener('click', function () {
            activeAnchor = null;
            renderCompose();
          });
        }
        document.getElementById('trsNoteForm').addEventListener('submit', function (e) {
          e.preventDefault();
          clearMessage();
          var input = document.getElementById('trsNoteInput');
          var body = input.value.trim();
          if (!body) return;
          if (!requireAuth()) return;
          var btn = composeEl.querySelector('.trs-submit');
          btn.disabled = true; btn.textContent = 'Posting…';
          db.from(T_NOTES).insert({
            pack_id: PACK_ID,
            pack_title: PACK_TITLE,
            anchor_id: activeAnchor ? activeAnchor.id : null,
            anchor_label: activeAnchor ? activeAnchor.label : null,
            author_name: authorName(),
            body: body
          }).select('id').then(function (res) {
            btn.disabled = false; btn.textContent = 'Add note';
            if (res.error) { showMessage('Could not post that note: ' + res.error.message, 'error'); return; }
            if (res.data && res.data[0]) openThreads[res.data[0].id] = true;
            input.value = '';
            showMessage('Note added.', 'ok');
            loadAll();
          });
        });
      } else {
        composeEl.innerHTML =
          '<form id="trsSuggForm">' +
            '<input type="text" id="trsSuggTitle" placeholder="Suggestion, in one line" maxlength="200" required>' +
            '<textarea id="trsSuggDesc" placeholder="Any detail on why / how (optional)"></textarea>' +
            '<button type="submit" class="trs-submit">Add suggestion</button>' +
          '</form>' +
          '<div class="trs-compose-hint">For ideas that aren\'t a fix to one line. Pinned corrections belong in <strong>Notes</strong>.</div>';

        document.getElementById('trsSuggForm').addEventListener('submit', function (e) {
          e.preventDefault();
          clearMessage();
          var titleEl = document.getElementById('trsSuggTitle');
          var descEl = document.getElementById('trsSuggDesc');
          var title = titleEl.value.trim();
          if (!title) return;
          if (!requireAuth()) return;
          var btn = composeEl.querySelector('.trs-submit');
          btn.disabled = true; btn.textContent = 'Posting…';
          db.from(T_SUGG).insert({
            pack_id: PACK_ID,
            section_context: currentSectionTitle(),
            requester_name: authorName(),
            title: title,
            description: descEl.value.trim() || null,
            status: 'pending'
          }).select('id').then(function (res) {
            btn.disabled = false; btn.textContent = 'Add suggestion';
            if (res.error) { showMessage('Could not post that suggestion: ' + res.error.message, 'error'); return; }
            titleEl.value = ''; descEl.value = '';
            showMessage('Suggestion added.', 'ok');
            loadAll();
          });
        });
      }
    }

    // Which section the reader is on: the pack's own scroll-spy marks it .active in the
    // sidebar. Recorded on a suggestion as context only, never as a pin.
    function currentSectionTitle() {
      var active = document.querySelector('#nav a.active');
      if (!active) return null;
      var label = active.querySelector('span');
      return label ? label.textContent.trim() : null;
    }

    // ---------- go ----------

    dom.idbar = buildIdentityBar();
    injectPins();

    // For a page that redraws its own content after load. Pins are injected by scanning the
    // DOM once, so anything rebuilt afterwards comes back without them: the calendar's month
    // grid and agenda are both thrown away and rewritten whenever the month changes or a
    // channel is unticked. Re-scanning is cheap and skips whatever is already pinned.
    window.TRS_NOTES = window.TRS_NOTES || {};
    window.TRS_NOTES.refreshPins = function () { injectPins(); updatePinCounts(); };

    scrollToAnchorFromHash();
    if (!window.localStorage.getItem(HINT_KEY)) dom.hint.classList.add('show');

    syncIdentity();
    loadAll(); // once up front, so the counts are right before the panel is ever opened

    // The session is not known yet at this point: supabase-client.js has to fetch it and
    // then read the profile row before canEdit() can be true. Without this the whole page
    // would render as a signed-out reviewer and stay that way until a manual reload, which
    // is what "I signed in and the buttons still are not there" looked like.
    if (window.TRS && window.TRS.onAuthChange) {
      window.TRS.onAuthChange(function () {
        syncIdentity();
        loadAll(); // archived rows only come back for an editor, so refetch on both edges
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
