// Wellness Voucher: review dashboard.
//
// The read-across view: every note and every suggestion anyone has left, on either page,
// in one list. Same idea as the CWD knowledgebase dashboard, cut down to what this pack
// actually needs: there is no per-user auth here, so no rail of "mine vs everyone".
//
// Read-mostly on purpose. Resolving and deciding happen in the widget, where the context
// is; this is for seeing the whole picture and finding things. The one action it does
// offer is Archive, because that is the only way to clear a row and it needs to be
// reachable without opening the SQL editor.
//
// Archive is EDITOR-ONLY (2026-08-07). Everyone can open this page and watch the review
// move; only a signed-in admin, Kate, can change a row. Enforced in the database
// (sql/notes_setup.sql), mirrored in the UI here so no one presses a button that would fail.

(function () {
  if (typeof supabase === 'undefined') return;

  var SUPABASE_URL = 'https://vlqvefsaxztitcbhirxt.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_JlOzwdcK0xjmE6j3nHmwhg_xDKxq1vv';
  var PACK_ID = 'beauty-voucher-2026-08';
  var TZ = 'Asia/Dubai';
  var POLL_MS = 30000;

  // share the signed-in session when auth/supabase-client.js is loaded on the page
  var db = (window.TRS && window.TRS.db) || supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  function canEdit() { return !!(window.TRS && window.TRS.isAdmin && window.TRS.isAdmin()); }

  var outEl = document.getElementById('out');
  var statsEl = document.getElementById('stats');
  var chipsEl = document.getElementById('chips');
  var qEl = document.getElementById('q');

  var notes = [], suggestions = [], suggNotes = [];
  var allNotes = [];     // includes archived; `notes` is the live slice
  var filter = 'todo';   // todo | all | notes | suggestions | done | archived
  var query = '';

  var FILTERS = [
    ['todo', 'Needs action'], ['all', 'Everything'],
    ['notes', 'Notes'], ['suggestions', 'Suggestions'], ['done', 'Closed']
  ];
  // Archived is editor-only and appended at render time: hiding a row is only safe if the
  // person who hid it can get it back without opening the SQL editor.
  function filters() {
    return canEdit() ? FILTERS.concat([['archived', 'Archived']]) : FILTERS;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmt(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: TZ }) +
      ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: TZ });
  }

  // Which page a note was left on, read back out of the anchor. Anchors are
  // "<sectionId>__<slug>", and the automations window prefixes its own with "automations".
  function pageOf(n) {
    if (!n.anchor_id) return 'General';
    return String(n.anchor_id).indexOf('automations') === 0 ? 'Automations' : 'Approval pack';
  }

  function matches(text) {
    if (!query) return true;
    return String(text || '').toLowerCase().indexOf(query) !== -1;
  }

  // ---------- render ----------

  function threads(list) {
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

  function renderStats(roots) {
    var openNotes = roots.filter(function (r) { return !r.resolved; }).length;
    var doneNotes = roots.length - openNotes;
    var pending = suggestions.filter(function (s) { return s.status === 'pending'; }).length;
    var people = {};
    roots.forEach(function (r) { people[r.author_name] = 1; });
    suggestions.forEach(function (s) { people[s.requester_name] = 1; });

    statsEl.innerHTML =
      '<div class="stat open"><b>' + openNotes + '</b><span>Notes open</span></div>' +
      '<div class="stat pending"><b>' + pending + '</b><span>Suggestions pending</span></div>' +
      '<div class="stat done"><b>' + doneNotes + '</b><span>Notes actioned</span></div>' +
      '<div class="stat people"><b>' + Object.keys(people).length + '</b><span>People contributing</span></div>';
  }

  function noteRow(r) {
    var replies = r.replies.map(function (x) {
      return '<div class="reply"><div class="row-who">' + esc(x.author_name) +
        ' <span class="row-meta">' + fmt(x.created_at) + '</span></div>' +
        '<div class="row-body">' + esc(x.body) + '</div></div>';
    }).join('');
    return '<div class="row ' + (r.resolved ? 's-done' : 's-open') + '">' +
      '<div class="row-top">' +
        '<div><span class="row-who">' + esc(r.author_name) + '</span> ' +
          '<span class="row-meta">' + fmt(r.created_at) + '</span></div>' +
        '<div>' + '<span class="pagepill">' + esc(pageOf(r)) + '</span> ' +
          (r.resolved
            ? '<span class="badge b-done">Actioned' + (r.resolved_by_name ? ' &middot; ' + esc(r.resolved_by_name) : '') + '</span>'
            : '<span class="badge b-open">Open</span>') +
        '</div>' +
      '</div>' +
      '<div class="row-body">' + esc(r.body) + '</div>' +
      (r.anchor_label ? '<div class="row-anchor">&#128205; ' + esc(r.anchor_label) + '</div>' : '') +
      (replies ? '<div class="replies">' + replies + '</div>' : '') +
      (canEdit()
        ? '<div class="replies" style="border:0;padding-top:8px;">' +
          (r.archived
            ? '<button class="chip" data-rest-note="' + r.id + '">Restore</button>'
            : '<button class="chip" data-arch-note="' + r.id + '">Archive</button>') + '</div>'
        : '') +
    '</div>';
  }

  function suggRow(s) {
    var disc = suggNotes.filter(function (n) { return n.suggestion_id === s.id; }).map(function (n) {
      return '<div class="reply"><div class="row-who">' + esc(n.author_name) +
        ' <span class="row-meta">' + fmt(n.created_at) + '</span></div>' +
        '<div class="row-body">' + esc(n.body) + '</div></div>';
    }).join('');
    var badge = { pending: 'b-pending', accepted: 'b-done', declined: 'b-grey', archived: 'b-grey' }[s.status];
    return '<div class="row s-' + esc(s.status) + '">' +
      '<div class="row-top">' +
        '<div class="row-title">' + esc(s.title) + '</div>' +
        '<span class="badge ' + badge + '">' + esc(s.status) + '</span>' +
      '</div>' +
      '<div class="row-meta">' + esc(s.requester_name) + ' &middot; ' + fmt(s.created_at) +
        (s.section_context ? ' &middot; from ' + esc(s.section_context) : '') +
        (s.actioned_by_name ? ' &middot; decided by ' + esc(s.actioned_by_name) : '') + '</div>' +
      (s.description ? '<div class="row-desc">' + esc(s.description) + '</div>' : '') +
      (disc ? '<div class="replies">' + disc + '</div>' : '') +
      (canEdit()
        ? '<div class="replies" style="border:0;padding-top:8px;">' +
          (s.status === 'archived'
            ? '<button class="chip" data-rest-sugg="' + s.id + '">Restore to pending</button>'
            : '<button class="chip" data-arch-sugg="' + s.id + '">Archive</button>') + '</div>'
        : '') +
    '</div>';
  }

  function render() {
    renderWho();
    if (filter === 'archived' && !canEdit()) filter = 'todo';
    chipsEl.innerHTML = filters().map(function (f) {
      return '<button class="chip' + (f[0] === filter ? ' active' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>';
    }).join('');
    Array.prototype.forEach.call(chipsEl.querySelectorAll('[data-f]'), function (b) {
      b.addEventListener('click', function () { filter = b.dataset.f; render(); });
    });

    // Stats always describe the live pack, never the archive: the counts are what Tara is
    // reading, and a number that moves because a duplicate got tidied away is a lie.
    var liveRoots = threads(notes);
    renderStats(liveRoots);

    var roots = liveRoots;
    if (filter === 'archived') {
      // an archived root keeps its (unarchived) replies, so pull them back in
      var archivedIds = {};
      allNotes.forEach(function (x) { if (x.archived) archivedIds[x.id] = true; });
      roots = threads(allNotes.filter(function (x) {
        return x.archived || (x.parent_id && archivedIds[x.parent_id]);
      }));
    }

    var n = roots.filter(function (r) {
      if (!matches(r.author_name + ' ' + r.body + ' ' + (r.anchor_label || ''))) return false;
      if (filter === 'archived') return !!r.archived;
      if (r.archived) return false;
      if (filter === 'todo') return !r.resolved;
      if (filter === 'done') return r.resolved;
      if (filter === 'suggestions') return false;
      return true;
    });
    var s = suggestions.filter(function (x) {
      if (!matches(x.requester_name + ' ' + x.title + ' ' + (x.description || ''))) return false;
      if (filter === 'archived') return x.status === 'archived';
      if (x.status === 'archived') return false;
      if (filter === 'todo') return x.status === 'pending';
      if (filter === 'done') return x.status !== 'pending';
      if (filter === 'notes') return false;
      return true;
    });

    if (!n.length && !s.length) {
      outEl.innerHTML = '<div class="empty">' +
        (query ? 'Nothing matches that search.'
          : filter === 'archived' ? 'Nothing archived. Archiving hides a row from everyone without deleting it, and you can restore it from here.'
          : 'Nothing here yet. Notes and suggestions left on the pack or the automations window show up here.') +
        '</div>';
      return;
    }

    outEl.innerHTML =
      (n.length ? '<div class="group-head">Notes &middot; ' + n.length + '</div>' + n.map(noteRow).join('') : '') +
      (s.length ? '<div class="group-head">Suggestions &middot; ' + s.length + '</div>' + s.map(suggRow).join('') : '');

    Array.prototype.forEach.call(outEl.querySelectorAll('[data-arch-note]'), function (b) {
      b.addEventListener('click', function () { patchRow('approval_notes', b.dataset.archNote, { archived: true }); });
    });
    Array.prototype.forEach.call(outEl.querySelectorAll('[data-rest-note]'), function (b) {
      b.addEventListener('click', function () { patchRow('approval_notes', b.dataset.restNote, { archived: false }); });
    });
    Array.prototype.forEach.call(outEl.querySelectorAll('[data-arch-sugg]'), function (b) {
      b.addEventListener('click', function () { patchRow('approval_suggestions', b.dataset.archSugg, { status: 'archived' }); });
    });
    Array.prototype.forEach.call(outEl.querySelectorAll('[data-rest-sugg]'), function (b) {
      b.addEventListener('click', function () {
        patchRow('approval_suggestions', b.dataset.restSugg, { status: 'pending', actioned_by_name: null, actioned_at: null });
      });
    });
  }

  function patchRow(table, id, patch) {
    if (!canEdit()) {
      alert('Sign in as the editor to change a row.');
      return;
    }
    db.from(table).update(patch).eq('id', id).then(function (res) {
      if (res.error) { alert('Could not update that: ' + res.error.message); return; }
      load();
    });
  }

  // ---------- load ----------

  // Archived rows come down too and are split off in render(). They are invisible to
  // everyone except the editor, who needs them to be able to undo an archive.
  function load() {
    Promise.all([
      db.from('approval_notes').select('*').eq('pack_id', PACK_ID)
        .order('created_at', { ascending: false }),
      db.from('approval_suggestions').select('*').eq('pack_id', PACK_ID)
        .order('created_at', { ascending: false }),
      db.from('approval_suggestion_notes').select('*').order('created_at', { ascending: true })
    ]).then(function (res) {
      var err = res[0].error || res[1].error || res[2].error;
      if (err) {
        outEl.innerHTML = '<div class="err"><strong>Could not load.</strong><br>' + esc(err.message) +
          '<br><br>If this says a table is missing, run sql/notes_setup.sql in Supabase first.</div>';
        return;
      }
      allNotes = res[0].data || [];
      notes = allNotes.filter(function (n) { return !n.archived; });
      suggestions = res[1].data || [];
      suggNotes = res[2].data || [];
      render();
    });
  }

  // ---------- who ----------

  // Sits in the header on every load, signed in or not, so the answer to "why can't I
  // archive anything" is on screen instead of in a README.
  function renderWho() {
    var el = document.getElementById('who');
    if (!el) return;
    var TRS = window.TRS;
    if (!TRS || !TRS.email) { el.innerHTML = ''; return; }

    var email = TRS.email();
    if (!email) {
      el.innerHTML = TRS.loginUrl
        ? '<a class="who-link" href="' + esc(TRS.loginUrl()) + '">Sign in to edit</a>'
        : '';
      return;
    }
    var role = canEdit() ? 'editor' : 'viewer';
    el.innerHTML = '<span class="who-name">' + esc(TRS.displayName() || email) +
      '<span class="who-role who-' + role + '">' + role + '</span></span>' +
      '<button type="button" class="who-link" id="whoOut">Sign out</button>';
    var out = document.getElementById('whoOut');
    if (out) out.addEventListener('click', function () {
      out.disabled = true;
      TRS.signOut().then(render);
    });
  }

  qEl.addEventListener('input', function () {
    query = qEl.value.trim().toLowerCase();
    render();
  });

  load();
  window.setInterval(load, POLL_MS);

  // The session lands after the first render, so redraw when it does. Without this the
  // page stays in its signed-out shape until a manual reload.
  if (window.TRS && window.TRS.onAuthChange) window.TRS.onAuthChange(render);
})();
