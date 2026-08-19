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
  var SHEETS = ["index.html", "lid.html", "ghl.html", "reception.html", "core-team.html"];
  var LABELS = {
    "index.html": "Overview", "lid.html": "LID", "ghl.html": "GHL team",
    "reception.html": "Reception", "core-team.html": "Core team"
  };

  var context = null;      // built once per page load, then reused
  var building = null;     // the in-flight build, so two fast clicks share one

  // Pull readable text out of a sheet. The panel and the widget's own markup are
  // stripped so the model never sees its own past answers as if they were policy.
  function textOf(doc) {
    var body = doc.body.cloneNode(true);
    // Belt and braces. The rail and the widget are injected by script, so they
    // are not in the fetched HTML this parses and would not appear anyway. Listed
    // so that stays true if any of it is ever moved into the markup.
    var junk = body.querySelectorAll(
      "script, style, #trs-ask, .rail, .rail-toggle, .refpeek, .topnav, .crumb, .footer, .backpack"
    );
    for (var i = 0; i < junk.length; i++) junk[i].remove();
    return body.innerText.replace(/\n{3,}/g, "\n\n").trim();
  }

  // Send the sheet she is on, plus the Overview, in full. Send the rest as their
  // headings only.
  //
  // Sending all four in full was 45,000 characters and about nine seconds, and it
  // was going to get worse as sheets are added. Almost every question is about the
  // sheet in front of her, and the Overview carries what changed and who owns
  // what, so those two answer nearly everything. The headings of the others are
  // enough for the model to say "that is on the GHL sheet" rather than guess,
  // which is the honest answer to a cross-team question anyway.
  function headingsOf(doc) {
    var hs = doc.querySelectorAll("h2");
    var out = [];
    for (var i = 0; i < hs.length; i++) out.push(hs[i].textContent.replace(/^\s*\d+\s*/, "").trim());
    return out;
  }

  function fetchSheet(f) {
    return fetch(f)
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (html) {
        return html ? new DOMParser().parseFromString(html, "text/html") : null;
      })
      .catch(function () { return null; });
  }

  function buildContext() {
    if (context) return Promise.resolve(context);
    if (building) return building;

    var here = location.pathname.split("/").pop() || "index.html";
    var full = [here];
    if (here !== "index.html") full.push("index.html");
    var rest = SHEETS.filter(function (f) { return full.indexOf(f) === -1; });

    building = Promise.all(
      full.map(fetchSheet).concat(rest.map(fetchSheet))
    ).then(function (docs) {
      var parts = [];
      full.forEach(function (f, i) {
        if (docs[i]) parts.push("===== SHEET: " + LABELS[f] + " (full text) =====\n" + textOf(docs[i]));
      });
      rest.forEach(function (f, i) {
        var d = docs[full.length + i];
        if (!d) return;
        parts.push("===== SHEET: " + LABELS[f] + " (headings only, not loaded) =====\n" +
                   headingsOf(d).map(function (h) { return "- " + h; }).join("\n"));
      });
      context = parts.join("\n\n");
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

    // Tappable starters. The old placeholder read like a question somebody had
    // already typed, so people pressed Ask on grey text and nothing happened.
    var chips = el("div", "trs-ask-chips");
    var STARTERS = [
      "Can a Season of You client have balayage?",
      "What is the kit allowance?",
      "What are the three expiry dates?",
      "Which branch does which facial?"
    ];

    // Who answers. The reader picks, because the trade is theirs to make: at a
    // till with somebody waiting, a fast answer she can check against the quoted
    // line beats a slower one. The key is sent to the function, which holds the
    // allowlist; nothing here decides which model actually runs.
    var MODELS = [
      { key: "quick",    name: "Quick",    note: "fastest" },
      { key: "balanced", name: "Balanced", note: "middle" },
      { key: "careful",  name: "Careful",  note: "slowest, most exacting" }
    ];
    var chosen = "careful";
    try { chosen = localStorage.getItem("trsAskModel") || "careful"; } catch (e) {}
    if (!MODELS.some(function (m) { return m.key === chosen; })) chosen = "careful";

    var picker = el("div", "trs-ask-models");
    picker.setAttribute("role", "radiogroup");
    picker.setAttribute("aria-label", "Who answers");
    var lbl = el("span", "trs-ask-models-lbl", "Answered by");
    picker.appendChild(lbl);
    MODELS.forEach(function (m) {
      var b = el("button", "trs-ask-model" + (m.key === chosen ? " on" : ""), m.name);
      b.type = "button";
      b.title = m.name + ", " + m.note;
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", m.key === chosen ? "true" : "false");
      b.addEventListener("click", function () {
        chosen = m.key;
        try { localStorage.setItem("trsAskModel", chosen); } catch (e) {}
        [].forEach.call(picker.querySelectorAll(".trs-ask-model"), function (o) {
          var on = o === b;
          o.classList.toggle("on", on);
          o.setAttribute("aria-checked", on ? "true" : "false");
        });
      });
      picker.appendChild(b);
    });

    var form = el("form", "trs-ask-form");
    var input = el("input", "trs-ask-input");
    input.type = "text";
    input.placeholder = "Type your question";
    input.setAttribute("aria-label", "Your question");
    input.maxLength = 600;
    var send = el("button", "trs-ask-send", "Ask");
    send.type = "submit";
    form.appendChild(input); form.appendChild(send);

    STARTERS.forEach(function (q) {
      var c = el("button", "trs-ask-chip", q);
      c.type = "button";
      c.addEventListener("click", function () {
        input.value = q;
        chips.remove();
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      });
      chips.appendChild(c);
    });

    panel.appendChild(head); panel.appendChild(note); panel.appendChild(chips); panel.appendChild(log); panel.appendChild(picker); panel.appendChild(form);
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
      if (chips.parentNode) chips.remove();
      var pending = say("trs-ask-wait", "Reading the sheets...");
      // A grounded answer over all five sheets takes a few seconds. Saying so
      // beats a spinner that looks stuck.
      var waited = 0;
      var tick = setInterval(function () {
        waited += 3;
        if (!pending.parentNode) { clearInterval(tick); return; }
        pending.textContent = waited < 6 ? "Reading the sheets..."
          : (waited < 12 ? "Checking which sheet says it..." : "Nearly there, this one is taking a moment...");
      }, 3000);

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
            body: JSON.stringify({ question: q, sheets: sheets, model: chosen }),
          });
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          clearInterval(tick); pending.remove();
          if (!res.ok || res.d.error) {
            say("trs-ask-err", res.d.error || "That did not work. Try again, or read the sheet.");
            return;
          }
          // found:false is a real answer, not a failure. It is styled as a
          // caution rather than an error so nobody reads "not in the sheets"
          // as the widget being broken.
          say(res.d.found === false ? "trs-ask-none" : "trs-ask-a",
              res.d.answer || "No answer came back.");
          if (res.d.model) {
            var who = MODELS.filter(function (m) { return m.key === res.d.model; })[0];
            if (who) {
              var tag = el("div", "trs-ask-by", "answered by " + who.name);
              log.appendChild(tag);
            }
          }
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
          clearInterval(tick); pending.remove();
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
