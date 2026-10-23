# DILO Creative Lab — Astro preview

A rebranded preview of the four-page Astro site for **DILO Creative Lab**, a
teaching factory and creative playground in Bandung. The layout, type, imagery,
motion and responsive behaviour come from the original published site; this
worktree changes the brand, copy, social links and colour palette only.

The original The Design Society project lives separately and is not modified by
this worktree.

## Run it

Requirements: Node.js 22.23.4+ and npm 9.6.5+.

```bash
npm install
npm run dev -- --port 4323
```

Then open <http://127.0.0.1:4323>.

```bash
npm run build
npm run preview -- --port 4324
```

The original preview keeps its own ports (`4321` / `4322`), so both sites can
run side by side.

`astro.config.mjs` currently uses `https://dilocreativelab.local` as a
placeholder canonical origin for metadata and absolute OG image URLs. Replace
it with the production domain, or set `site` from an environment variable,
before deploying.

## Palette previews

Two DILO palettes are available from the fixed switcher in the bottom-right
corner, or directly from the URL:

- `?palette=black` — **Palette A, DILO Black**: black structural brand area,
  lime accents, ink and paper.
- `?palette=lime` — **Palette B, DILO Lime**: lime structural brand area, ink
  text on lime, lime retained on dark surfaces.

The choice is stored in `localStorage` under `dilo-palette`. The switcher is a
preview control and writes the selected palette back to the URL with
`history.replaceState`.

## Content notes

- Instagram is the only live social destination:
  <https://www.instagram.com/dilocreativelab/>.
- WhatsApp and email are non-clickable placeholders until real destinations are
  supplied.
- Team and event photography are retained as placeholders.
- Copy is in English and set in Bandung.
- The DILO wordmark was traced from the supplied PNG and is served as an inline
  SVG symbol, with a lime square badge and OG image.

## Stack

- Astro 7 (static output, no Tailwind)
- GSAP 3.15.0 + CustomEase, ScrollTrigger, SplitText, ScrambleTextPlugin,
  Draggable, Observer and InertiaPlugin
- Barba 2.10.3 for page transitions
- Lenis 1.3.17 for smooth scrolling
- The original published Slater interaction bundle

All browser libraries are self-hosted under `public/vendor/`. Fonts live in
`public/fonts/`, imagery in `public/assets/`.

## Structure

```text
src/
  layouts/Base.astro       Persistent shell, metadata, palette boot, switcher
  lib/content.ts           Route metadata and raw markup lookup
  content/
    nav.html               Persistent navigation
    transition.html        Page-transition curtain
    crt.html               CRT overlay layers
    pages/*.html           Rebranded page markup
    pages.json             Page metadata
    dilo-wordmark.ts       Traced wordmark path
  styles/
    site.css               Published Webflow + inline design layer
    overrides.css          DILO tokens, palette B and accessibility additions
  pages/*.astro            Four static routes
public/
  assets/                  Local images, DILO wordmark, badge and OG image
  fonts/                   Local webfonts
  scripts/site.js          Navigation, metadata, palette and ARIA glue
  vendor/                  Self-hosted third-party browser libraries
```

## Accessibility

The published layout is preserved. Nonvisual additions include a skip link, a
single named main landmark, visible focus rings, focus management after
client-side page transitions, `aria-current`, `aria-expanded`,
`aria-controls`, inert closed menus, polite route announcements and reduced
motion handling inherited from the published bundle. The palette switcher uses
`aria-pressed` and the DILO lime never carries white text: ink on lime is
`13.44:1`.

## Rights and attribution

This is a non-commercial rebrand preview built on a demo recreation of The
Design Society site. It is not affiliated with or endorsed by The Design
Society or DILO Creative Lab.

- Original site, layout, photography, illustration and fonts: © The Design
  Society and their respective rights holders.
- DILO name, supplied logo and brand colours belong to DILO Creative Lab.
- The Slater interaction bundle is third-party proprietary code, included here
  only to reproduce the published demo.
- GSAP plugins, Barba, Lenis and the original webfonts remain subject to their
  own licenses and terms.
