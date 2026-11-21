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

## Learned: Sanity schema, structure and CSV import

- Group long schemas with `groups` (Main, Details, Location, Media, Feed & source, SEO) and set `group` on every field.
- Rich text is `type: "array"` of `block`; add `image`, `file` and custom objects to `of` for freedom. `richtext` is not a Sanity type.
- The built-in `geopoint` carries an altitude. Use an object with `lat` and `lng` numbers when only a map point is wanted.
- Custom sidebar lives in `src/sanity/structure.ts` (`structureTool({ structure })`). Structure node IDs cannot contain spaces: slugify every ID built from data.
- The Sanity CLI v8 `dataset import` needs a `sanity.cli.ts`. `scripts/import-ndjson.mjs` uses `@sanity/client` with `SANITY_WRITE_TOKEN` and `createOrReplace`, so imports are re-runnable (IDs come from the reference).
- `scripts/properties-to-ndjson.mjs` converts the Webflow CSV; `diverse` picks rows so every status, agent, province and type is represented. Check the CSV row count: an old export may be in Downloads next to the new one.
- Editing imported documents in the Studio and then re-importing overwrites the edits.

## Learned: matching Paper exactly

- Paper `get_jsx` on a big artboard returns megabytes (embedded images). It is saved to a file: load the JSON, take the longest text, strip `data:` URIs and `<svg>`, then condense each element to its key styles. Pass `fileId` explicitly.
- Paper SVG icons export cleanly from the same JSX: replace stroke and fill colours with `currentColor`, drop the `style` attribute, and bake rotations into a `<g transform>`.
- Paper uses fixed pixel text sizes (12/14/16/18). Lumos text scales fluidly, so use `rem` values in card CSS when the exact size matters, and `text-style-*` classes when it should scale.
- Shared form look (label 14/500 slate, border `--background-3`) belongs in `patterns.css` `.field-*`, not in page CSS.
- Measure local against the design with `measure.mjs` style CDP scripts: print computed font size, colour, padding and border for each element. Use `127.0.0.1`, not `localhost`, for the debug port, and wait about 6s for Chrome to start.

## Learned: property detail page

- `Img` with a remote URL needs both `width` and `height`, otherwise Astro downloads the file to measure it and the dev worker fails with "fetch failed" (a 500 with no useful message).
- A prerendered route (like `404.astro`) can't be the target of `Astro.rewrite` from an on-demand page; return `new Response(..., { status: 404 })` instead.
- Section content boxes shrink to fit their children: give full-width blocks `width: 100%`.
- GROQ `order()` can't take a boolean expression: use `order(select(cond => 0, 1) asc, ...)`.
- Sanity Portable Text is rendered by `src/utils/portable-text.ts` (paragraphs, headings, lists, marks, images, embeds), with image URLs projected in the GROQ (`asset->url`).

## Learned: compare feature

- The compare list is client-side only: `CompareTray.astro` (in `BaseLayout`) keeps up to 3 `{slug, name, img}` in `localStorage` key `ph_compare`. Anything with `[data-compare]` toggles via event delegation, so Load more and instant filters need no extra wiring; a MutationObserver on `<main>` re-syncs button states.
- `/compare?p=a,b,c` is server-rendered from Sanity (`getPropertiesBySlugs`), so a comparison is a shareable link. Feature rows are the union of all compared properties' features.
- A button can't sit inside the card's `<a>`, so `CompareButton` is a sibling positioned over the photo.

## Learned: blog content model (Sanity)
- Two document types: `post` (title, slug, category ref, publishedAt, readingTime, excerpt, featured, cover `image` with alt, `intro` sidebar object, `sideImages` max 2, `body` Portable Text with h2–h4, quote, images, embeds, SEO fields) and `category` (title, slug, description).
- Images are real Sanity image assets (uploaded from the Webflow CDN), not URL strings like properties.
- `scripts/import-blog.mjs <categories.csv> <posts.csv> [--dry]` imports both Webflow CSVs. Fixed ids (`category-<slug>`, `post-<slug>`) make it safe to re-run. Posts with Draft=true import as `drafts.post-<slug>`.
- `html-to-blocks.mjs` now keeps links (markDefs). The importer strips the `utm_source=chatgpt.com` tag from source links and turns `<figure>`/`<img>` into image blocks.
- The CSV `Category` column is the category slug. The CSV has no image alt text, so cover images use the post title as alt.

## Learned: blog pages
- `/blog` (`src/pages/blog/index.astro`) and `/blog/[slug]` are on-demand (`prerender = false`) and read Sanity through `src/utils/blog.ts` (`getPosts`, `getFeaturedPost`, `getPost`, `getBlogCategories`). Drafts never show, because the client reads the published perspective.
- The category filter is `?category=<slug>`. Unknown slugs fall back to all posts. `?page=N` returns one page of 9. As on the property listing, JS swaps the results in place (fetch the server HTML, `replaceState`) when a category is picked, and Load more appends the next page. Both are plain links without JS.
- Hero featured card = newest post with `featured == true`. The category dropdown is a native `<details>` with a tiny script for outside click and Escape, styled with `.button_wrap.secondary`.
- Sanity returns `null`, not `undefined`, for an empty array. Destructuring defaults do not catch it, so use `?? []`.
- Lumos resets paragraph and heading margins, and `text-box: trim-both` shrinks every text box. For long-form rich text the rules must be **unlayered** (outside `@layer components`) and set `text-box: normal`, or the live site's spacing cannot be matched. On trimmed headings add `margin-top-0` and a `margin-bottom-N` utility, because the default `_margin-top` is large.
- `Img` draws a skeleton background. Add `transparent` for cut-out artwork such as the leaf.
- Remote Sanity images accept `?auto=format&w=…`. Keep explicit `width` and `height` on `Img` for remote sources.
- Post body images come through `portableTextToHtml`, which now renders `caption` as a `figcaption`.

## Learned: about, contact and buying-in-spain pages
- `PropertiesForYou` (shared by About and Buying) shows 3 sale properties: ones flagged `featured` first, then the newest active. Nothing is flagged yet, so it falls back to the newest. Rentals are excluded.
- Marquee: set size with a class (`.marquee_wrap.about-marquee { --_item-height; --_gap-size }`), never an inline `style`. The component builds its own inline `--_count`, and a passed `style` replaces it.
- Overhanging decoration (the About polaroids use negative margins) widens the page. Put `overflow: clip` on the section that holds it.
- The library `Form` has a large default row gap (`--space-8`). Tighten it with `.my-card .form_fields { row-gap: 1rem }` for a compact card.
- About images: the team and polaroid photos are stock (Pexels, free licence) by request, not real team photos. Swap `src/assets/images/about/team-*.webp`, `victoria.webp`, `mark.webp` and `bradley.webp` (and the handwritten `name-*.svg`) when real photos are ready. Large source PNGs were converted to WebP.
- Unsplash and Pexels block automated browsing. Find photo ids with a web search, then download from `images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg`.

## Learned: homepage properties and blog sections
- Both sections read Sanity per request, so `index.astro` now has `prerender = false`. "Properties we love" = `getFeaturedProperties(6)`; "Blogs & Guides" = `getLatestPosts` for All, Blog and Guide.
- `Tabs` counts the direct children of `.tabs_panels` and does nothing if that differs from the number of links. Astro inlines a component's `<script>` after its first use, which adds a stray child. Wrap each panel's content in its own `<div>`.
- To put the tab links beside a heading, make the `.tabs_wrap` `display: contents` and place `.tabs_bar` and `.tabs_panels` in the section container's grid areas. Restyle `.tabs_link` into pills with a two-class selector.
- Slider arrows use smooth scrolling, so a headless test must wait about 2s before reading `scrollLeft`.
