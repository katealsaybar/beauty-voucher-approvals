/* Wellness Voucher cheat sheets: section references you can look at without
 * leaving your place.
 *
 * The problem it solves: an item in the revision list says "see section 3", and
 * following that means scrolling away from a list you are working down. So the
 * reference becomes a link that shows what is there on hover, and opens in a new
 * tab if you actually want to go.
 *
 * Two jobs, done in this order:
 *   1. give every h2 a stable id, so a reference has something to point at
 *   2. turn every plain-text section reference into that link
 *
 * The preview is built from the live section, not from a copy, so it can never
 * be out of date with what the section says.
 *
 * No em-dashes anywhere, per the 4 July purge. Comments included.
 */
(function () {
  "use strict";

  var HIDE_DELAY = 220;   // enough to move the pointer into the card without it vanishing
  var hideTimer = null;
  var card = null;

  function sectionNumber(h2) {
    var n = h2.querySelector(".n");
    return n ? n.textContent.trim() : null;
  }

  /* ---- 1. stable ids ---- */
  var sections = {};
  var heads = document.querySelectorAll("h2");
  for (var i = 0; i < heads.length; i++) {
    var num = sectionNumber(heads[i]);
    if (num === null) continue;
    if (!heads[i].id) heads[i].id = "s" + num;
    sections[num] = heads[i];
  }
  if (!Object.keys(sections).length) return;

  /* ---- the preview card ---- */
  function ensureCard() {
    if (card) return card;
    card = document.createElement("div");
    card.className = "refpeek";
    card.setAttribute("role", "tooltip");
    card.hidden = true;
    card.addEventListener("mouseenter", function () { clearTimeout(hideTimer); });
    card.addEventListener("mouseleave", scheduleHide);
    document.body.appendChild(card);
    return card;
  }

  // Pull a readable gist out of a section: its title, the standfirst under it,
  // and the first substantive block. Tables are summarised by their headings
  // rather than reproduced, because a table in a tooltip is unreadable.
  function gistOf(h2) {
    var title = h2.textContent.replace(/^\s*\d+\s*/, "").trim();
    var bits = [];
    var kind = "";
    var node = h2.nextElementSibling;
    var guard = 0;
    while (node && node.tagName !== "H2" && guard++ < 8) {
      if (node.classList.contains("sub") && bits.length === 0) {
        bits.push(node.textContent.trim());
      } else if (node.tagName === "TABLE" && !kind) {
        var ths = [].map.call(node.querySelectorAll("thead th"), function (t) { return t.textContent.trim(); });
        var rows = node.querySelectorAll("tbody tr").length;
        kind = "A table: " + ths.join(" / ") + ". " + rows + (rows === 1 ? " row." : " rows.");
      } else if ((node.classList.contains("card") || node.classList.contains("rule")) && !kind) {
        kind = node.textContent.trim();
      } else if (node.tagName === "UL" && !kind) {
        kind = node.querySelectorAll("li").length + " items, starting: " + node.querySelector("li").textContent.trim();
      }
      node = node.nextElementSibling;
    }
    if (kind) bits.push(kind);
    var body = bits.join(" ");
    if (body.length > 320) body = body.slice(0, 320).replace(/\s+\S*$/, "") + "...";
    return { title: title, body: body };
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { if (card) card.hidden = true; }, HIDE_DELAY);
  }

  function show(link, num) {
    var target = sections[num];
    if (!target) return;
    var g = gistOf(target);
    var c = ensureCard();
    c.innerHTML = "";

    var lbl = document.createElement("div");
    lbl.className = "refpeek-lbl";
    lbl.textContent = "Section " + num + " of this sheet";
    var ttl = document.createElement("div");
    ttl.className = "refpeek-title";
    ttl.textContent = g.title;
    var bdy = document.createElement("div");
    bdy.className = "refpeek-body";
    bdy.textContent = g.body;
    var cta = document.createElement("div");
    cta.className = "refpeek-cta";
    cta.textContent = "Click to open in a new tab";

    c.appendChild(lbl); c.appendChild(ttl); c.appendChild(bdy); c.appendChild(cta);

    c.hidden = false;
    clearTimeout(hideTimer);

    // Place it above the link where there is room, below where there is not, and
    // never off the side of a phone.
    var r = link.getBoundingClientRect();
    var cw = c.offsetWidth, ch = c.offsetHeight;
    var left = Math.min(Math.max(8, r.left + r.width / 2 - cw / 2), window.innerWidth - cw - 8);
    var above = r.top > ch + 14;
    c.style.left = Math.round(left + window.scrollX) + "px";
    c.style.top = Math.round((above ? r.top - ch - 10 : r.bottom + 10) + window.scrollY) + "px";
    c.classList.toggle("below", !above);
  }

  /* ---- 2. turn the plain references into links ---- */
  var page = location.pathname.split("/").pop() || "index.html";
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: function (n) {
      if (!/§\s*\d+/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
      if (n.parentElement.closest("a, .refpeek, #trs-ask")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  var texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);

  texts.forEach(function (node) {
    var frag = document.createDocumentFragment();
    var re = /§\s*(\d+)/g;
    var last = 0, m;
    while ((m = re.exec(node.nodeValue)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(node.nodeValue.slice(last, m.index)));
      var num = m[1];
      if (sections[num]) {
        var a = document.createElement("a");
        a.className = "refpeek-link";
        a.href = page + "#s" + num;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "§" + num;
        a.setAttribute("aria-label", "Section " + num + ", opens in a new tab");
        a.addEventListener("mouseenter", function () { show(a, num); });
        a.addEventListener("mouseleave", scheduleHide);
        a.addEventListener("focus", function () { show(a, num); });
        a.addEventListener("blur", scheduleHide);
        frag.appendChild(a);
      } else {
        frag.appendChild(document.createTextNode(m[0]));
      }
      last = m.index + m[0].length;
    }
    if (last < node.nodeValue.length) frag.appendChild(document.createTextNode(node.nodeValue.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && card && !card.hidden) card.hidden = true;
  });
  window.addEventListener("scroll", function () { if (card && !card.hidden) card.hidden = true; }, { passive: true });
})();
