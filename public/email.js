// Copyright 2026 Lucernarium, LLC. All rights reserved.

/*
 * Email address assembly, so no harvestable address appears in the served
 * HTML.
 *
 * This is the same technique the Vespers apex one-pager uses (see the inline
 * script at the foot of the apex `respond` body in the Vespers repo's
 * `Caddyfile.tmpl`), generalised from that page's single hard-coded address
 * to the several this site publishes. Keeping the two consistent matters:
 * these are the same company's addresses, and protecting one while printing
 * another in plain text protects neither.
 *
 * The markup contract, per address:
 *
 *   <a class="js-email" data-user="hello" data-domain="lucernarium.org"></a>
 *   <noscript>hello (at) lucernarium (dot) org</noscript>
 *
 * The anchor ships EMPTY and carries the halves in data attributes; the "@"
 * is produced by `String.fromCharCode(64)` so the literal character never
 * appears in the source either. A scraper that does not execute JavaScript —
 * which is most of them — finds no address to take.
 *
 * WHY the anchor is not `hidden` in the markup, unlike the apex's:
 *
 *   The apex hides its anchor and unhides it from script. That is safe there
 *   because that page has exactly one address and its `<noscript>` sits
 *   outside the anchor. Doing the same here would mean a JS-disabled visitor
 *   sees a permanently `hidden` anchor — invisible — for every address. An
 *   empty anchor is already invisible in practice (nothing to paint), so
 *   shipping it un-hidden costs nothing and removes a way for the no-JS path
 *   to fail silently. The `<noscript>` is what such a visitor actually reads.
 *
 * This is spam mitigation, not security. Anyone running a headless browser
 * gets the address, and that is fine — the addresses are meant to be
 * reachable by humans. The goal is only to stay off the cheap harvest lists.
 */

(function () {
  "use strict";

  var nodes = document.querySelectorAll("a.js-email");

  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    var user = el.getAttribute("data-user");
    var domain = el.getAttribute("data-domain");

    // A half-configured anchor would otherwise render the string
    // "null@null" as a mailto link, which is worse than rendering nothing.
    if (!user || !domain) continue;

    var addr = user + String.fromCharCode(64) + domain;

    el.href = "mailto:" + addr;
    el.textContent = addr;

    // Nothing to do about the paired <noscript>: when scripting is enabled
    // the browser does not render its contents at all, so the address cannot
    // appear twice. No cleanup needed, and code to remove it would be dead.
  }
})();
