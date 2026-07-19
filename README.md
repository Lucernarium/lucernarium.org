# lucernarium.org

The public company site for **Lucernarium LLC**. Static HTML, no build step.

## Why it exists

1. **Apple Developer Program organization enrollment** requires "a publicly available, functional website on the organization's domain." Links to social media or sites with minimal content are explicitly rejected. (vespers/#1142, #1143)
2. **Google Play Console organization accounts** require an organization website. (vespers/#1144)
3. **Google's Child Safety Standards policy** requires a globally accessible web page publishing our CSAE standards, naming the app and the developer, linked from Play Console. That page is `/child-safety/`. (vespers/#1154)

Apple verifies the site against the **legal entity** on the D-U-N-S record, which is why this lives on `lucernarium.org` and not `vespers.community` — the entity is Lucernarium LLC, the product is Vespers.

## Structure

```
wrangler.jsonc                 Workers static-assets config
public/index.html              company overview
public/child-safety/index.html CSAE standards (Google Child Safety Standards policy)
public/styles.css              shared styles (dark only, mirrors the Vespers apex)
public/email.js                runtime email assembly (anti-harvest)
```

No framework, no bundler, no dependencies, no build step. Paths are **relative**,
not root-absolute, so the pages also render correctly opened straight from disk
(`file://`) — under `file://` a leading `/` resolves to the filesystem root and
the stylesheet silently fails to load.

## Deploying

**Cloudflare Workers with static assets**, not Pages. Cloudflare folded Pages into
Workers during 2026; new projects deploy as a Worker serving a directory of
assets. There is no Worker script — `assets.directory` in `wrangler.jsonc` is
sufficient for a purely static site.

Site files live in `public/` precisely so this config and `README.md` are not
themselves served as pages.

Two ways to deploy:

- **Dashboard** — Workers → *Import a repository* → select this repo. No build
  command; `wrangler.jsonc` supplies the rest.
- **CLI** — `npx wrangler deploy` (after `npx wrangler login`).

DNS already lives on Cloudflare, so the custom domain and TLS are attached from
the Worker's **Domains** tab.

## Maintaining the child safety page

`child-safety/index.html` is a **public commitment**, not marketing copy. Two rules for editing it:

**Never claim a capability the product does not have.** Google cross-checks published child safety standards against actual app behaviour. The page currently makes no proactive content-scanning claim, because Vespers has none (vespers/#1147), and no in-app reporting claim, because the reporting backend exists but has no user-facing UI (vespers/#1145). An HTML comment in the file marks the exact sentence to add when #1145 ships — and not before.

**The NCMEC paragraph describes a legal obligation** under 18 U.S.C. § 2258A that applies regardless of what this page says. It has not been reviewed by counsel. If review becomes available, this is worth a read — though the higher-value use of legal time is the state age-assurance question (vespers/#1157), which concerns jurisdictional exposure rather than wording.

Bump the "Last updated" date on any substantive change.

## Styling

`styles.css` mirrors the **Vespers marketing one-pager** served at the
`vespers.community` apex — the same palette, the same serif display face, the
same radial wash, the same card treatment. Custom-property names and values are
copied verbatim from that page's inline `<style>` block, which lives in the
Vespers repo at **`Caddyfile.tmpl`** (inside the apex `respond` body). That file
is the source of truth; this one follows. There is no shared build step between
the two repos, so **nothing will warn you if they drift** — if the palette moves
there, move it here.

> An earlier version of this stylesheet mirrored the *application's* token set
> (`frontend/src/styles/tokens.css`, `--color-accent:#2563eb`, light + dark)
> instead. That is a different palette for a different surface — the in-app UI,
> not the public marketing face — and the result did not look like the site it
> was meant to match. Match the apex, not the app.

Deliberate differences from the apex:

- **Dark only**, like the apex (`color-scheme: dark`) — no light variant.
- **Narrower measure** (46rem vs the apex's 62rem). The apex is 62rem to fit a
  three-across card grid; these pages are long prose, and 62rem of running text
  is well past a comfortable line length.
- **No logo.** The Vespers marks are the *product's* identity, not the
  *company's*, and the rose-window PNG on the apex is a ~160KB inline data URI.
  A branding pass is pending.

## Email addresses

No address appears in the served HTML. `email.js` assembles each one at runtime
from `data-user` / `data-domain` halves, with the `@` produced by
`String.fromCharCode(64)` so the literal character is absent from source too.
This is the same technique the Vespers apex uses, generalised from its single
hard-coded address to the several published here.

The markup contract per address:

```html
<a class="js-email" data-user="hello" data-domain="lucernarium.org"></a>
<noscript>hello (at) lucernarium (dot) org</noscript>
```

The `<noscript>` is the no-JS fallback and is **required** — without it a
visitor with JavaScript disabled sees nothing at all where an address should
be. That matters most on the child-safety page, whose address someone may need
in an urgent moment.

This is spam mitigation, not security: anything running a headless browser gets
the address, which is fine. The goal is only to stay off the cheap harvest
lists.

**When adding an address, add the `<noscript>` in the same edit.** The
verification script below fails the build if a literal address or a `mailto:`
reappears in source.

## Verifying

CSS correctness, `file://` behaviour, and runtime email assembly are none of
them things a unit test can establish. A Playwright script exercises the real
thing across both pages:

- computed `body` background is the apex `--bg`, and `h1` resolves to the serif
  stack (catches a stylesheet that silently failed to load)
- zero failed requests under **both** `file://` and `http://` — a root-absolute
  path regression is invisible over HTTP and fatal from disk
- every `a.js-email` ends up with a valid address and a matching `mailto:` href
- neither source file contains a literal address or a `mailto:`
- with **JavaScript disabled**, the `(at)` / `(dot)` fallbacks are readable

Last verified at 1200px and 390px (no horizontal overflow).
