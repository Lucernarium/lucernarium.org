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
public/styles.css              shared styles, light + dark
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

`styles.css` mirrors the design tokens from the Vespers app
(`frontend/src/styles/tokens.css`) so this site reads as part of the same family
— same system font stack, same palette, same spacing and radius scales, same
40rem measure. **Token names are kept identical on purpose**: if the app's
palette moves, the diff to apply here is obvious.

Two deliberate differences:

- The app resolves dark mode via `[data-theme="dark"]`, set by its ThemeProvider.
  This site has no JS, so it follows `prefers-color-scheme` — which is what an
  app user on the default "system" theme sees anyway.
- **No logo.** The Vespers marks live in `frontend/src/assets/logo-concepts/` and
  are concepts pending a branding pass; they are also the *product's* identity,
  not the *company's*. Copying one here would create a second copy to drift.

Verified in a real browser at 900px light, 900px dark, and 390px mobile
(no horizontal overflow) — CSS correctness is not something a unit test can
establish.
