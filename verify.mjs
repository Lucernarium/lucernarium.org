// Copyright 2026 Lucernarium, LLC. All rights reserved.

/*
 * Real-browser verification for the static site.
 *
 * This repo has no dependencies and no build step on purpose, so there is no
 * package.json to hang a devDependency off. Playwright is borrowed from the
 * Vespers frontend's install; point PLAYWRIGHT_PATH elsewhere if that repo
 * isn't beside this one.
 *
 *   node verify.mjs
 *   PLAYWRIGHT_PATH=/path/to/playwright node verify.mjs
 *
 * Exits non-zero on any failure. What it checks and why each one earns its
 * keep is documented in README.md → "Verifying"; the short version is that
 * every check here corresponds to a way this site has actually broken, or
 * could break silently:
 *
 *   - a stylesheet that fails to load renders a readable but unstyled page,
 *     which looks fine in a diff and wrong in a browser (this happened: a
 *     root-absolute href worked over HTTP and broke under file://)
 *   - an email anchor that never gets assembled renders as EMPTY, so the
 *     contact section silently loses an address
 *   - a literal address creeping back into source defeats the whole point of
 *     email.js without changing anything visible
 */

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(HERE, "public");
const PORT = 8899;

// The package entry point, not a path inside .pnpm/: that one embeds the
// version, so every Playwright bump in the Vespers frontend broke this script.
const PW =
  process.env.PLAYWRIGHT_PATH ||
  "/home/mike/projects/vespers/frontend/node_modules/@playwright/test/index.mjs";

let pw;
try {
  const mod = await import(PW);
  pw = mod.chromium ? mod : mod.default;
} catch {
  console.error(`Could not load Playwright from:\n  ${PW}\nSet PLAYWRIGHT_PATH.`);
  process.exit(2);
}

// Chromium will not render an SVG <img> served as application/octet-stream,
// so the image types matter here, not just the text ones.
const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// Serve `public/` so the http:// half of the run is exercised too. A
// root-absolute path regression is invisible over HTTP and fatal from disk, so
// neither scheme alone is sufficient.
const server = createServer((req, res) => {
  const rel = normalize(decodeURI(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const path = join(ROOT, rel.endsWith("/") ? `${rel}index.html` : rel);
  try {
    const body = readFileSync(path);
    res.writeHead(200, { "Content-Type": TYPES[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

const PAGES = [
  { name: "home", rel: "index.html", emails: 4 },
  { name: "child-safety", rel: "child-safety/index.html", emails: 1 },
];

let failures = 0;
const check = (label, cond, detail = "") => {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${detail ? `  :: ${detail}` : ""}`);
};

const browser = await pw.chromium.launch();

for (const scheme of ["file", "http"]) {
  console.log(`\n===== ${scheme.toUpperCase()} =====`);
  for (const p of PAGES) {
    const url =
      scheme === "file" ? `file://${join(ROOT, p.rel)}` : `http://127.0.0.1:${PORT}/${p.rel}`;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const failed = [];
    page.on("requestfailed", (r) => failed.push(r.url()));
    await page.goto(url, { waitUntil: "load" });

    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const h1font = await page.evaluate(() => {
      const h = document.querySelector("h1");
      return h ? getComputedStyle(h).fontFamily : "";
    });
    check(`[${p.name}] body bg is apex --bg #0a0d16`, bg === "rgb(10, 13, 22)", bg);
    check(`[${p.name}] h1 uses the serif stack`, /Iowan|Palatino|Georgia/.test(h1font), h1font.slice(0, 40));
    check(`[${p.name}] no failed requests`, failed.length === 0, failed.join(","));

    // The masthead wordmark is an image now. A broken src still leaves the alt
    // text in place, which reads fine in a diff, so check that it decoded.
    const mark = await page.evaluate(() => {
      const img = document.querySelector(".masthead .wordmark img");
      return img
        ? { alt: img.alt, w: img.naturalWidth, h: Math.round(img.getBoundingClientRect().height) }
        : null;
    });
    check(`[${p.name}] wordmark image decoded`, (mark?.w ?? 0) > 0, JSON.stringify(mark));
    check(`[${p.name}] wordmark alt is "Lucernarium"`, mark?.alt === "Lucernarium", mark?.alt ?? "");

    // Every icon link must resolve to a real image. Browsers fetch icons
    // outside the page's request stream, so "no failed requests" cannot see a
    // broken one; load each into an <img> and require it to decode.
    const icons = await page.evaluate(() =>
      Promise.all(
        [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')].map(
          (l) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve({ href: l.getAttribute("href"), ok: img.naturalWidth > 0 });
              img.onerror = () => resolve({ href: l.getAttribute("href"), ok: false });
              img.src = l.href;
            }),
        ),
      ),
    );
    check(`[${p.name}] has 4 icon links`, icons.length === 4, String(icons.length));
    for (const i of icons) {
      check(`[${p.name}] icon ${i.href} loads`, i.ok);
    }

    const mails = await page.evaluate(() =>
      [...document.querySelectorAll("a.js-email")].map((a) => ({
        href: a.getAttribute("href"),
        text: a.textContent,
      })),
    );
    check(`[${p.name}] found ${p.emails} js-email anchors`, mails.length === p.emails, String(mails.length));
    for (const m of mails) {
      const ok = m.href?.startsWith("mailto:") && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.text);
      check(`[${p.name}] assembled ${m.text || "(empty)"}`, ok, m.href || "no href");
      check(`[${p.name}] href matches text`, m.href === `mailto:${m.text}`, m.href || "");
    }

    const nsVisible = await page.evaluate(() =>
      [...document.querySelectorAll("noscript")].some((n) => n.offsetHeight > 0),
    );
    check(`[${p.name}] noscript hidden while JS enabled`, !nsVisible);

    await ctx.close();
  }
}

console.log("\n===== SOURCE (no harvestable address) =====");
for (const p of PAGES) {
  const src = readFileSync(join(ROOT, p.rel), "utf8");
  const hits = src.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
  check(`${p.rel} has no literal address`, hits.length === 0, hits.join(","));
  check(`${p.rel} has no mailto:`, !src.includes("mailto:"));
}

console.log("\n===== NO-JS FALLBACK =====");
{
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto(`file://${join(ROOT, p.rel)}`);
    const text = await page.innerText("body");
    // Every anchor that JS would have filled must have a readable fallback.
    const anchors = await page.evaluate(() => document.querySelectorAll("a.js-email").length);
    const fallbacks = (text.match(/\(at\)/g) || []).length;
    check(`[${p.name}] ${anchors} anchor(s) have ${fallbacks} readable fallback(s)`, anchors === fallbacks);
  }
  await ctx.close();
}

await browser.close();
server.close();

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
