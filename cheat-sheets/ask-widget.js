/* Wellness Voucher cheat sheets: the question widget.
 *
 * What it does: a button in the corner, a panel, a question, an answer, and the
 * line from the sheets that the answer came from.
 *
 * The grounding trick, and it is the whole point: the context sent to the model
 * is the live text of the sheets themselves, read out of the pages at ask
 * time. So the widget can never drift from the sheets, because it has no other
 * copy to drift from. Edit a sheet and the answers change with it, with nothing
 * to re-sync and no second knowledge base to forget about.
 *
 * No em-dashes anywhere, per the 4 July purge. Comments included.
 */
(function () {
  "use strict";

  var ENDPOINT = window.TRS_ASK_ENDPOINT || "";
  var ANON_KEY = window.TRS_ASK_ANON_KEY || "";
  var SHEETS = ["index.html", "lid.html", "ghl.html", "reception.html"];
  var LABELS = { "index.html": "Overview", "lid.html": "LID", "ghl.html": "GHL team", "reception.html": "Reception" };

  var context = null;      // built once per page load, then reused
  var building = null;     // the in-flight build, so two fast clicks share one

  // Pull readable text out of a sheet. The panel and the widget's own markup are
  // stripped so the model never sees its own past answers as if they were policy.
  function textOf(doc) {
    var body = doc.body.cloneNode(true);
    var junk = body.querySelectorAll("script, style, #trs-ask, .crumb, .footer");
    for (var i = 0; i < junk.length; i++) junk[i].remove();
    return body.innerText.replace(/\n{3,}/g, "\n\n").trim();
  }

  function buildContext() {
    if (context) return Promise.resolve(context);
    if (building) return building;
    building = Promise.all(
      SHEETS.map(function (f) {
        return fetch(f)
          .then(function (r) { return r.ok ? r.text() : ""; })
          .then(function (html) {
            if (!html) return "";
            var doc = new DOMParser().parseFromString(html, "text/html");
            return "===== SHEET: " + LABELS[f] + " =====\n" + textOf(doc);
          })
          .catch(function () { return ""; });
      })
    ).then(function (parts) {
      context = parts.filter(Boolean).join("\n\n");
      building = null;
      return context;
    });
    return building;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function mount() {
    var root = el("div", null); root.id = "trs-ask";

    var btn = el("button", "trs-ask-btn");
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<span aria-hidden="true">?</span> Ask a question';

    var panel = el("div", "trs-ask-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Ask a question about the Wellness Voucher");
    panel.hidden = true;

    var head = el("div", "trs-ask-head");
    head.appendChild(el("div", "trs-ask-title", "Ask the cheat sheets"));
    var close = el("button", "trs-ask-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    head.appendChild(close);

    var note = el("p", "trs-ask-note",
      "Answers come from these sheets only. If it is not on them, you will be told so rather than guessed at.");

    var log = el("div", "trs-ask-log");
    log.setAttribute("aria-live", "polite");

    var form = el("form", "trs-ask-form");
    var input = el("input", "trs-ask-input");
    input.type = "text";
    input.placeholder = "Can a Season of You client have balayage?";
    input.setAttribute("aria-label", "Your question");
    input.maxLength = 600;
    var send = el("button", "trs-ask-send", "Ask");
    send.type = "submit";
    form.appendChild(input); form.appendChild(send);

    panel.appendChild(head); panel.appendChild(note); panel.appendChild(log); panel.appendChild(form);
    root.appendChild(btn); root.appendChild(panel);
    document.body.appendChild(root);

    function open() {
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      input.focus();
      buildContext();  // warm it while they type
    }
    function shut() {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      btn.focus();
    }
    btn.addEventListener("click", function () { panel.hidden ? open() : shut(); });
    close.addEventListener("click", shut);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) shut();
    });

    function say(cls, text) {
      var b = el("div", "trs-ask-msg " + cls);
      b.textContent = text;
      log.appendChild(b);
      log.scrollTop = log.scrollHeight;
      return b;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;

      if (!ENDPOINT) {
        say("trs-ask-err", "The answer service is not switched on yet. Until it is, the sheets themselves are the source: scroll and read, or ask Kate.");
        return;
      }

      say("trs-ask-q", q);
      input.value = "";
      input.disabled = true; send.disabled = true;
      var pending = say("trs-ask-wait", "Reading the sheets...");

      buildContext()
        .then(function (sheets) {
          var headers = { "Content-Type": "application/json" };
          if (ANON_KEY) {
            headers["apikey"] = ANON_KEY;
            headers["Authorization"] = "Bearer " + ANON_KEY;
          }
          return fetch(ENDPOINT, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ question: q, sheets: sheets }),
          });
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          pending.remove();
          if (!res.ok || res.d.error) {
            say("trs-ask-err", res.d.error || "That did not work. Try again, or read the sheet.");
            return;
          }
          // found:false is a real answer, not a failure. It is styled as a
          // caution rather than an error so nobody reads "not in the sheets"
          // as the widget being broken.
          say(res.d.found === false ? "trs-ask-none" : "trs-ask-a",
              res.d.answer || "No answer came back.");
          if (res.d.source && res.d.source !== "not in the sheets") {
            var s = el("div", "trs-ask-src");
            s.appendChild(el("span", "trs-ask-srclbl",
              res.d.sheet ? "From the " + res.d.sheet + " sheet" : "From the sheets"));
            s.appendChild(el("span", null, res.d.source));
            log.appendChild(s);
            log.scrollTop = log.scrollHeight;
          }
        })
        .catch(function () {
          pending.remove();
          say("trs-ask-err", "Could not reach the answer service. The sheets are still correct; scroll and read.");
        })
        .then(function () {
          input.disabled = false; send.disabled = false; input.focus();
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
