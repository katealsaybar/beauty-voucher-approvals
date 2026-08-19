/* Wellness Voucher cheat sheets: open a document without leaving the sheet.
 *
 * Any link carrying data-doc opens its href in a panel over the page instead of
 * navigating away. Built for the issued Terms, which somebody working the
 * revision list needs to read against rather than travel to.
 *
 * Falls back to a new tab wherever an inline PDF will not render, which is most
 * phones. A modal that shows a grey rectangle is worse than a new tab.
 *
 * No em-dashes anywhere, per the 4 July purge. Comments included.
 */
(function () {
  "use strict";

  // iOS and most mobile browsers refuse to render a PDF in an iframe. Rather
  // than sniff the browser, test the capability the way the platform reports it.
  function canInlinePdf() {
    if (window.innerWidth < 760) return false;
    var n = navigator.pdfViewerEnabled;
    if (typeof n === "boolean") return n;
    return !!(navigator.mimeTypes && navigator.mimeTypes["application/pdf"]);
  }

  var overlay = null, frame = null, titleEl = null, openBtn = null, lastFocus = null;

  function build() {
    overlay = document.createElement("div");
    overlay.className = "docmodal";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    var shell = document.createElement("div");
    shell.className = "docmodal-shell";

    var head = document.createElement("div");
    head.className = "docmodal-head";
    titleEl = document.createElement("div");
    titleEl.className = "docmodal-title";
    var actions = document.createElement("div");
    actions.className = "docmodal-actions";
    openBtn = document.createElement("a");
    openBtn.className = "docmodal-open";
    openBtn.target = "_blank";
    openBtn.rel = "noopener";
    openBtn.textContent = "Open in a new tab";
    var close = document.createElement("button");
    close.className = "docmodal-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.textContent = "×";
    actions.appendChild(openBtn); actions.appendChild(close);
    head.appendChild(titleEl); head.appendChild(actions);

    frame = document.createElement("iframe");
    frame.className = "docmodal-frame";
    frame.setAttribute("title", "Document");

    shell.appendChild(head); shell.appendChild(frame);
    overlay.appendChild(shell);
    document.body.appendChild(overlay);

    close.addEventListener("click", shut);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) shut(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.hidden) shut();
    });
  }

  function shut() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    frame.src = "about:blank";          // stop the PDF rendering behind the page
    document.body.classList.remove("docmodal-on");
    if (lastFocus) lastFocus.focus();
  }

  function show(href, label) {
    if (!overlay) build();
    lastFocus = document.activeElement;
    titleEl.textContent = label;
    openBtn.href = href;
    frame.src = href;
    overlay.hidden = false;
    document.body.classList.add("docmodal-on");
    overlay.setAttribute("aria-label", label);
    openBtn.focus();
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-doc]");
    if (!a) return;
    if (!canInlinePdf()) return;        // let the browser take it to a new tab
    e.preventDefault();
    show(a.getAttribute("href"), a.dataset.doc || a.textContent.trim());
  });
})();
