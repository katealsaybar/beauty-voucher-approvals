/* Wellness Voucher cheat sheets: the navigation rail.
 *
 * Built from the page's own h2 list rather than hand-written, so a section can
 * never exist without a link to it, and reordering the page reorders the rail.
 *
 * Two halves: the sheets at the top, grouped into the three teams and the core
 * team so somebody on the wrong sheet can get to theirs in one click, and the
 * sections of the current sheet below it. The
 * active section tracks the scroll position, because a twenty-item revision list
 * is easy to lose your place in.
 *
 * Hidden entirely in print. The sheets are meant to go on a wall, and a
 * navigation rail on paper is dead ink.
 *
 * No em-dashes anywhere, per the 4 July purge. Comments included.
 */
(function () {
  "use strict";

  /* Grouped, because the two kinds of sheet are not the same kind of thing: a team
     sheet is a job to do, the core team sheet is a set of answers to give. `group`
     starts a new label in the rail. */
  var SHEETS = [
    { file: "index.html", name: "Overview", note: "what changed, who owns what", group: "Start here" },
    { file: "lid.html", name: "LID", note: "the live site and the Terms", group: "The three teams" },
    { file: "ghl.html", name: "GHL team", note: "workflows and messages" },
    { file: "reception.html", name: "Reception", note: "what you say at the till" },
    { file: "core-team.html", name: "Core team", note: "Tara, Emma, Kate, Hanneh", group: "The core team" },
    { file: "lists.html", name: "The lists", note: "who gets contacted, and what it costs", group: "The numbers" }
  ];

  function build() {
    var page = location.pathname.split("/").pop() || "index.html";

    var heads = [];
    var all = document.querySelectorAll("h2");
    for (var i = 0; i < all.length; i++) {
      var n = all[i].querySelector(".n");
      var num = n ? n.textContent.trim() : null;
      // ref-peek.js may already have set the id; do not fight it
      if (!all[i].id) all[i].id = num !== null ? "s" + num : "h" + i;
      heads.push({ el: all[i], num: num, text: all[i].textContent.replace(/^\s*\d+\s*/, "").trim() });
    }

    var rail = document.createElement("nav");
    rail.className = "rail";
    rail.setAttribute("aria-label", "Cheat sheet navigation");

    var brand = document.createElement("a");
    brand.className = "rail-brand";
    brand.href = "index.html";
    brand.textContent = "Wellness Voucher";
    rail.appendChild(brand);

    SHEETS.forEach(function (s) {
      if (s.group) {
        var lbl = document.createElement("div");
        lbl.className = "rail-lbl";
        lbl.textContent = s.group;
        rail.appendChild(lbl);
      }
      var a = document.createElement("a");
      a.className = "rail-sheet" + (s.file === page ? " here" : "");
      a.href = s.file;
      var nm = document.createElement("span");
      nm.className = "rail-sheet-n";
      nm.textContent = s.name;
      var nt = document.createElement("span");
      nt.className = "rail-sheet-note";
      nt.textContent = s.note;
      a.appendChild(nm); a.appendChild(nt);
      if (s.file === page) a.setAttribute("aria-current", "page");
      rail.appendChild(a);
    });

    if (heads.length) {
      var l2 = document.createElement("div");
      l2.className = "rail-lbl";
      l2.textContent = "On this sheet";
      rail.appendChild(l2);

      heads.forEach(function (h) {
        var a = document.createElement("a");
        a.className = "rail-sec";
        a.href = "#" + h.el.id;
        a.dataset.target = h.el.id;
        if (h.num !== null) {
          var b = document.createElement("span");
          b.className = "rail-num";
          b.textContent = h.num;
          a.appendChild(b);
        }
        var t = document.createElement("span");
        t.textContent = h.text;
        a.appendChild(t);
        rail.appendChild(a);
      });
    }

    var back = document.createElement("a");
    back.className = "rail-back";
    back.href = "../index.html";
    back.innerHTML = "The approval pack &nearr;";
    back.target = "_blank";
    back.rel = "noopener";
    rail.appendChild(back);

    document.body.appendChild(rail);
    document.body.classList.add("has-rail");

    /* ---- a visible way back to the pack, at the top where it is looked for ----
       The rail carries the same link at its foot, but the foot of a rail is not
       where anyone looks for a way out. */
    var top = document.querySelector(".top");
    if (top) {
      var crumb = top.querySelector(".crumb");
      var wrapRow = document.createElement("div");
      wrapRow.className = "topnav";
      if (crumb) { crumb.parentNode.insertBefore(wrapRow, crumb); wrapRow.appendChild(crumb); }
      else { top.insertBefore(wrapRow, top.firstChild); }

      var pack = document.createElement("a");
      pack.className = "backpack";
      pack.href = "../index.html";
      pack.target = "_blank";
      pack.rel = "noopener";
      pack.innerHTML = '<span aria-hidden="true">&larr;</span> Back to the approval pack';
      pack.title = "The full pack, with the reasoning behind every line here. Opens in a new tab.";
      wrapRow.appendChild(pack);
    }

    /* ---- a button, because the rail is off-canvas on a phone ---- */
    var toggle = document.createElement("button");
    toggle.className = "rail-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Sections");
    toggle.innerHTML = "<span></span><span></span><span></span>";
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("rail-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.body.appendChild(toggle);
    rail.addEventListener("click", function (e) {
      if (e.target.closest("a")) document.body.classList.remove("rail-open");
    });

    /* ---- active section follows the scroll ---- */
    var secLinks = rail.querySelectorAll(".rail-sec");
    if (!secLinks.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    for (var k = 0; k < secLinks.length; k++) byId[secLinks[k].dataset.target] = secLinks[k];
    var visible = {};

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      // the topmost visible heading wins, so the rail reads like your position
      var current = null;
      for (var j = 0; j < heads.length; j++) {
        if (visible[heads[j].el.id]) { current = heads[j].el.id; break; }
      }
      if (!current) return;
      for (var id in byId) byId[id].classList.toggle("on", id === current);
    }, { rootMargin: "-8% 0px -70% 0px", threshold: 0 });

    heads.forEach(function (h) { io.observe(h.el); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
