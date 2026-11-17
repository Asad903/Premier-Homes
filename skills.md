# skills.md

Working notes for building a Webflow-to-Astro migration with **Lumos for Astro**, Sanity and Cloudflare. Written during the Premier Homes project so it can be copied into the next one. Keep adding to it as we learn things.

## How we work (rules from the client)

0. **Do not create a component per section.** Build sections inline on the page from library components. Create a component only when the client asks for one (for example a global section used on several pages) or when the same markup repeats.

1. **One section at a time.** Build a section, show it, then wait. Do not start the next section until told.
2. **Components only when asked.** Build a component whenever the client says so. Otherwise compose pages from existing Lumos components.
3. **Live site first, Paper second.** The live site is the first reference for layout, copy, behaviour and assets; Paper is the second. When they disagree, follow the live site and say so. Read the live CSS (the Webflow stylesheet linked from the page) for exact sizes, spacing and breakpoints.
4. **Do not create pages unprompted.** Pages are built when named.
5. **Update this file** whenever a convention, fix or gotcha is learned.
6. Commit and push to `main` only when asked. Deploys are automatic once Cloudflare Builds is connected.

## Stack and setup

- Astro 7, `@astrojs/cloudflare` adapter, `wrangler.jsonc` with `preview_urls: true`, `workers_dev: true`, and a `SESSION` KV binding (`id` for production, `preview_id` for previews).
- Sanity via `@sanity/astro` with the Studio embedded at `/admin` (needs `react`, `react-dom`, `sanity`, `styled-components`, `@astrojs/react`). `PUBLIC_SANITY_PROJECT_ID` and `PUBLIC_SANITY_DATASET` are read at build time: set them in `.env` and in Cloudflare Builds variables.
- Lumos for Astro is a scaffolded template (read `LUMOS.md` and `AGENTS.md` first). It is **not** the Lumos for Webflow rules.
- The template scaffold overwrites the project. Re-apply the adapter, wrangler config and Sanity after scaffolding.
- Add a `.gitignore` (`dist`, `.astro`, `.wrangler`, `node_modules`, `.env`); the template does not ship one.
- Node 22+ is required (`NODE_VERSION=22` in Cloudflare Builds).

## Lumos conventions that matter

- **Check the library before writing CSS.** Two columns is `ContentWrapper variant="columns"` (second column via `slot="column2"`); multi-column grids are `Grid`; spacing is a utility class. Write custom CSS only when no library component or variant does the job, and say why. Prefer composing sections directly on the page over creating a component.
- The heading scale follows the live site: H1 48–72, H2 40–56, H3 36–48, H4 28–40, H5 24–32, H6 20–24, line height 1.2, tracking -0.04em (H5 -0.02em), normal text wrapping.
- Cascade layers: `base`, `patterns`, `components`, `utilities`. Component CSS goes in the component's own `<style is:global>` under `@layer components`.
- Custom component roots end in `_wrap`; children are prefixed with the family name (`hero-home_layout`). Name by role, not mechanism.
- No `px` in CSS. Use `rem`, `ch` for text widths, `em` for things that track font size.
- Never put a custom class on a library component or target library components beneath a custom class. Use utility classes (`margin-top-5`, `width-full`) or add a variant. A plain `<a class="button_wrap secondary ...">` is acceptable when a library component can't take the content (icon buttons).
- Page sections go in `src/components/section/` (styles act on the section) or `src/components/content/` (a block inside a section). Pages carry no CSS.
- Components take `render` (default `true`) first, then content props, then variants, then `class`/`...rest`.
- Themes: `theme-light`, `theme-dark`, `theme-brand` on `Section`, `ContentWrapper` or plain HTML. Re-declared theme variables resolve per element, so define colour tokens inside theme blocks, never as `var(--background)` on `:root`.
- The default Lumos text trim (`text-box: trim-both`) removes leading space. Consequences:
  - Buttons and tags look cramped unless padding is raised (we use `0.875em 1.25em` for buttons, `0.4rem 0.5rem` for tags).
  - Headings and eyebrows touch what follows. Add utilities such as `margin-bottom-5` / `margin-top-4`, or use a `ContentWrapper`.
  - Multi-line labels need `display: flex; flex-direction: column; gap`.
- Form fields use `.field-control` in `patterns.css`. We changed it to a white background with a border to match the Paper design.
- Select placeholder styling keys on `option[value=""][disabled]`. A real default option with `value=""` and `value=""` on the `Select` shows in the ink colour.

## Design tokens (Premier Homes)

- Colours: primary blue `#1047AE`, gold `#FCB714`, ink `#1F2A37`, slate `#4D5761`, overlay `rgb(0 0 0 / 75%)`, mist `#F5F7FA`, line `#E5E7EB`.
- Fonts: Georgia (headings, 400) and General Sans (text, 400/500/600/700), self-hosted woff2 in `src/assets/fonts`, loaded with the Astro `fonts` config and `<Font>` in `BaseHead`.
- Headings: Georgia 400, live-site scale (see Lumos conventions).
- Radius: buttons 8px, tags 4px, cards 12px.
- Eyebrow variants: `default` (blue caps), `tag` (dark), `highlight` (gold), `muted` (for use over photos).
- `--nav-height` is `5.5rem` (88px, matching Paper).

## Paper to code workflow

- Read the whole artboard with `get_jsx` and `includeNodeIds: false`. Read the numbers there; use screenshots only to check.
- `get_screenshot` on large frames can time out. Use `get_jsx` instead.
- Images in Paper may be broken placeholders. Check the export visually. If broken, take the matching asset from the live site's CDN (the full-size file without `-p-500`).
- Export logos and SVGs with `export`. Text rendered in a font that is not on the web (the logo uses Cormorant) cannot become SVG text: export a PNG and give it a white rounded background so it works on dark sections.
- Strip the `style` attribute and fixed `width`/`height` from exported SVGs before using them as icons.

## Checking work visually

- Headless Chrome: `chrome --headless=new --window-size=1728,1100 --virtual-time-budget=15000 --screenshot=out.png URL`.
- The minimum window width is about 500px. Anything narrower renders a 500px layout that is cropped, so it looks like overflow. Use 500 for a mobile check.
- Use a long `--virtual-time-budget` on the first load; Astro's dev image optimiser is slow and the photo may not appear in the first shot.
- The dev server caches optimised images. If an image looks stale, request it again or restart the dev server.
- Save scratch files in the session scratchpad, never in the project.

## Cloudflare and GitHub

- `npm run build && npx wrangler deploy` deploys by hand. Cloudflare serves `/brand` as `/brand/` (307). Set `html_handling: "drop-trailing-slash"` if the live site had no trailing slashes.
- GitHub to Cloudflare auto-deploy lives in Workers & Pages, the Worker, Settings, Builds. If the panel says "disconnected from your Git account", reconnect the GitHub app and re-check repository access. The build and deploy commands are `npm run build` and `npx wrangler deploy`.
- The GitHub CLI is not installed. Create the repo on github.com and push over SSH.
- Internal pages (`/admin`, `/brand`, `/migration`) are `noindex` through `NOINDEX_ROUTES` in `src/consts.ts`.

## Migration notes

- Keep every URL and slug identical so redirects stay minimal. The live sitemap is the source of truth for URLs.
- Check Webflow behaviour before launch: `www` to apex 301, trailing-slash stripping, `robots.txt` bot blocks, and `/sitemap.xml`.
- Track pages, redirects, SEO and launch checks in `src/data/migration.ts`; the `/migration` page renders it.

## Done so far

- Brand tokens, fonts, logo and favicons.
- `/brand` and `/migration` pages.
- Nav (Paper design) and homepage hero with property search.

## Learned: reading the live site

- The Webflow stylesheet URL is in the page's `<link rel="stylesheet">`. Download it and grep for class names, `--_typography---h3--font-size-*` variables and `@media` rules.
- Webflow interactions (scroll animations, sticky effects) are in JS, not CSS. Reproduce them with CSS scroll-driven animations where possible: `view-timeline` on a tall section, a `position: sticky` child, and `animation-timeline` with `animation-range: cover 30% cover 58%`. Wrap in `@supports (animation-timeline: view())` and keep a static fallback.
- Pure CSS carousel: stack the slides, run one `@keyframes` per slide with `animation-delay: calc(var(--_i) * step - transition)` and an `infinite` loop. Reduced motion must set `animation: none` explicitly; the Lumos base reset forces `animation-iteration-count: 1`, which would end on the hidden keyframe.
- Lumos headings use `text-wrap: balance`. The live site wraps normally, so set `text-wrap: wrap` where the line breaks must match.
- Eyebrows on the live site use `letter-spacing: -0.01em`, uppercase.
- Full-page headless screenshots of pages that use `100dvh` misbehave because the window height becomes the viewport height. Do not rely on them for sticky or full-height sections.

## Lumos agent skills

- The scaffold may ship without `.agents/skills`. They live in the Lumos repo (`lumosframework/lumos-for-astro`, `.agents/skills`) at the commit stamped in `package.json`. Copy them in and alias them into `.claude/skills` with symlinks.
- Skills: `lumos-import-webflow` (migration), `lumos-import-figma` (design to tokens), `lumos-audit-props`, `lumos-scaling-graphic`, `lumos-upgrade-version`.
- Fill the **This project** section of `lumos-import-webflow/SKILL.md` as decisions are made. It is the project's migration record and survives upgrades.
- Without a Webflow export, the published URL is the evidence. The Webflow MCP only works if the connected account owns the site: check with `list_sites` first.
- Public property pages expose their data in `data-compare-data` attributes, which can seed Sanity without a CMS export.

## Learned: gotchas from the homepage build

- **Dev image cache:** the Astro dev server caches processed images by file path. If a replaced image still shows the old pixels, rename the file and update the import.
- **Spaces in the project path:** a background image set through a CSS variable must be quoted, `url('...')`. An unquoted URL with a space in the path is dropped silently in dev.
- **SVG clip paths:** when cleaning an exported SVG, only strip attributes from the root `<svg>` tag. Stripping `width`/`height` everywhere removes the size from a `<clipPath><rect>` and the artwork disappears.
- **Matching the live site numerically:** drive Chrome over the DevTools protocol (Node 22+ has a global `WebSocket`), load the live and local pages at 1440px, and print `getComputedStyle` for every text node in a section. Compare font size, weight, line height and position, not screenshots.
- **Contact details and name:** keep the site name, URL, phone, email and social links in `src/consts.ts` so a client's real details can be swapped in with one edit.
- **Type check:** `npx astro check` finds prop mistakes (for example `align` instead of `centered`) that a build does not.
