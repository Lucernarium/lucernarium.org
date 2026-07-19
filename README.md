# lucernarium.org

The public company site for **Lucernarium LLC**. Static HTML, no build step.

## Why it exists

1. **Apple Developer Program organization enrollment** requires "a publicly available, functional website on the organization's domain." Links to social media or sites with minimal content are explicitly rejected. (vespers/#1142, #1143)
2. **Google Play Console organization accounts** require an organization website. (vespers/#1144)
3. **Google's Child Safety Standards policy** requires a globally accessible web page publishing our CSAE standards, naming the app and the developer, linked from Play Console. That page is `/child-safety/`. (vespers/#1154)

Apple verifies the site against the **legal entity** on the D-U-N-S record, which is why this lives on `lucernarium.org` and not `vespers.community` — the entity is Lucernarium LLC, the product is Vespers.

## Structure

```
index.html              company overview
child-safety/index.html CSAE standards (Google Child Safety Standards policy)
styles.css              shared styles, light + dark
```

No framework, no bundler, no dependencies. Cloudflare Pages serves the directory as-is.

## Deploying

Cloudflare Pages, connected to this repo. Build command: none. Output directory: `/`.
DNS already lives on Cloudflare, so the custom domain and TLS are configured in the Pages project.

## Maintaining the child safety page

`child-safety/index.html` is a **public commitment**, not marketing copy. Two rules for editing it:

**Never claim a capability the product does not have.** Google cross-checks published child safety standards against actual app behaviour. The page currently makes no proactive content-scanning claim, because Vespers has none (vespers/#1147), and no in-app reporting claim, because the reporting backend exists but has no user-facing UI (vespers/#1145). An HTML comment in the file marks the exact sentence to add when #1145 ships — and not before.

**The NCMEC paragraph describes a legal obligation** under 18 U.S.C. § 2258A that applies regardless of what this page says. It has not been reviewed by counsel. If review becomes available, this is worth a read — though the higher-value use of legal time is the state age-assurance question (vespers/#1157), which concerns jurisdictional exposure rather than wording.

Bump the "Last updated" date on any substantive change.

## Branding

Deliberately plain — typography and spacing only, no logo or custom assets. A branding pass is planned separately, so this is built to be restyled rather than to be final.
