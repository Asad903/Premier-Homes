/**
 * Migration tracker data. Edit statuses here as work lands; the /migration
 * page reads everything from this file.
 */

export type Status = "done" | "progress" | "todo" | "blocked";

export const statusLabel: Record<Status, string> = {
  done: "Done",
  progress: "In progress",
  todo: "To do",
  blocked: "Blocked",
};

export type PageItem = {
  path: string;
  title: string;
  group: "Core" | "Areas" | "Templates" | "Utility";
  /** A Paper design exists for it. */
  design: boolean;
  status: Status;
  note?: string;
};

export const pages: PageItem[] = [
  { path: "/", title: "Home", group: "Core", design: true, status: "progress", note: "All sections built, including featured properties and the blogs slider; final polish pending" },
  { path: "/info-guides", title: "Info guides", group: "Core", design: false, status: "todo", note: "In the nav but not on the live site and not in the sitemap; decide whether to build or remove the link" },
  { path: "/about-us", title: "About us", group: "Core", design: true, status: "done", note: "Stock photos stand in for the team photos; swap for real ones" },
  { path: "/contact", title: "Contact", group: "Core", design: true, status: "done", note: "Form shows the success message only; needs a backend endpoint" },
  { path: "/listing", title: "Listing / search results", group: "Core", design: true, status: "done", note: "Instant filters, price slider and Load more; Sanity-backed" },
  { path: "/compare", title: "Compare properties", group: "Core", design: true, status: "done", note: "Up to 3 properties; shareable URL" },
  { path: "/buying-in-spain", title: "Buying in Spain", group: "Core", design: true, status: "done" },
  { path: "/blog", title: "Blog index", group: "Core", design: true, status: "done", note: "Category filter and Load more match the property listing" },
  { path: "/murcia-properties", title: "Murcia properties", group: "Areas", design: false, status: "done", note: "Shares the listing component with locked filters" },
  { path: "/alicante-properties", title: "Alicante properties", group: "Areas", design: false, status: "done", note: "Shares the listing component with locked filters" },
  { path: "/new-build-properties", title: "New build properties", group: "Areas", design: false, status: "done", note: "Shares the listing component with locked filters" },
  { path: "/blog/[slug]", title: "Blog post (14 posts)", group: "Templates", design: true, status: "done", note: "13 published posts; 1 draft until published in Studio" },
  { path: "/properties/[slug]", title: "Property page (93 properties)", group: "Templates", design: true, status: "done", note: "Gallery, map, enquiry form and similar properties" },
  { path: "/404", title: "Page not found", group: "Utility", design: false, status: "done", note: "From the template; restyled by the brand tokens" },
  { path: "/brand", title: "Brand foundations", group: "Utility", design: true, status: "done", note: "Internal, noindex" },
  { path: "/migration", title: "Migration tracker", group: "Utility", design: false, status: "done", note: "Internal, noindex; remove before launch if preferred" },
];

export type RedirectItem = {
  from: string;
  to: string;
  type: "301" | "302" | "410";
  reason: string;
  status: Status;
};

export const redirects: RedirectItem[] = [
  { from: "https://www.<live-domain>/*", to: "https://<live-domain>/:splat", type: "301", reason: "Live site redirects www to apex. Keep it.", status: "todo" },
  { from: "/*/ (trailing slash)", to: "/* (no slash)", type: "301", reason: "Live site strips trailing slashes. Set Astro trailingSlash to never and verify.", status: "todo" },
  { from: "/properties/*", to: "Same URL", type: "301", reason: "93 URLs. Slugs stay identical so no redirect is needed. Test every one after import.", status: "todo" },
  { from: "/blog/*", to: "Same URL", type: "301", reason: "14 posts keep their slugs.", status: "todo" },
  { from: "Sold or withdrawn properties", to: "/listing or 410", type: "301", reason: "Decide a rule: 301 to the matching area page, or 410 if no close match.", status: "todo" },
  { from: "Any Webflow-only URLs (check export)", to: "TBD", type: "301", reason: "Export Webflow 301 settings and compare with the sitemap.", status: "todo" },
];

export type CheckItem = { label: string; status: Status; note?: string };

export const seo: CheckItem[] = [
  { label: "Page titles and meta descriptions copied exactly for every URL", status: "todo", note: "Export from Webflow before the cutover" },
  { label: "Canonical URL on every page, pointing at the apex domain", status: "progress", note: "Handled by BaseHead; verify per template" },
  { label: "XML sitemap at /sitemap.xml (live URL) with every indexable page", status: "progress", note: "Astro generates sitemap-index.xml; add a /sitemap.xml redirect or alias" },
  { label: "robots.txt keeps the AI-training bot blocks", status: "todo", note: "Live file blocks GPTBot, ClaudeBot, Google-Extended, CCBot and 10 more. The template's robots.txt does not yet." },
  { label: "Open Graph and Twitter cards per page", status: "progress", note: "Base card done; per-page images needed for posts and properties" },
  { label: "Structured data: Organization, BreadcrumbList, Article, RealEstateListing", status: "todo" },
  { label: "H1 and heading structure matches the live pages", status: "todo" },
  { label: "Image alt text and filenames migrated", status: "todo" },
  { label: "Internal links updated to final URLs, no links to webflow.io", status: "todo" },
  { label: "noindex on /admin, /brand, /migration and staging", status: "progress", note: "Done for the three internal routes; staging still needs it" },
  { label: "Core Web Vitals checked on the home, listing and property templates", status: "todo" },
  { label: "Google Search Console and Bing Webmaster verified; sitemap resubmitted", status: "todo" },
  { label: "Analytics and tracking scripts moved over", status: "todo" },
];

export type ContentItem = { area: string; detail: string; status: Status };

export const content: ContentItem[] = [
  { area: "Property documents in Sanity", detail: "Fields: reference, title, slug, price, beds, baths, area, location, type, new build or resale, tags, gallery, description, source agent. 93 live properties; slugs carry the source feed as a prefix.", status: "progress" },
  { area: "Property data source", detail: "Find out how properties get into Webflow today (manual, feed or sync) and what keeps them updated. This decides whether we import once or build a sync.", status: "blocked" },
  { area: "Blog posts in Sanity", detail: "14 posts and 3 categories imported from the Webflow CSVs with images uploaded as Sanity assets. One post is a draft.", status: "done" },
  { area: "Area pages content", detail: "Murcia, Alicante and new-build copy plus featured-property rules.", status: "todo" },
  { area: "FAQ, team and testimonials", detail: "Reusable documents so one edit updates every page that shows them.", status: "todo" },
  { area: "Images and files", detail: "Webflow CDN and an R2 bucket today. Re-host in Sanity or Cloudflare Images and keep the originals until launch.", status: "todo" },
  { area: "Forms", detail: "Two forms on the live site (contact and newsletter). The footer newsletter form is built but not connected: it needs a Cloudflare Worker endpoint and a decision on where submissions go.", status: "progress" },
  { area: "Third-party embeds", detail: "WhatsApp links, TikTok and Facebook links, video, the Swiper sliders and Remix icons. Replace with lighter equivalents.", status: "todo" },
  { area: "Fonts", detail: "General Sans and Georgia are self-hosted.", status: "done" },
  { area: "Logo, favicons and brand tokens", detail: "Real logo, favicons and Paper styleguide tokens applied.", status: "done" },
];

export type LaunchGroup = { title: string; items: string[] };

export const launch: LaunchGroup[] = [
  {
    title: "Before cutover",
    items: [
      "Crawl the live site and save the full URL list as the source of truth",
      "Every live URL returns 200 or a planned 301 on the new build",
      "Redirect map tested on a preview URL",
      "robots.txt, sitemap and canonicals verified on the preview",
      "Forms submit and notifications arrive",
      "Sanity Studio access given to the client; roles set",
      "Cloudflare KV, environment variables and CORS origins set for production",
      "Lower DNS TTL to 5 minutes a day before",
    ],
  },
  {
    title: "Cutover day",
    items: [
      "Freeze edits in Webflow",
      "Final content sync into Sanity",
      "Deploy and attach the production custom domain in Cloudflare",
      "Confirm HTTPS and the www to apex redirect",
      "Spot-check 20 URLs, including properties and posts",
    ],
  },
  {
    title: "After launch",
    items: [
      "Resubmit the sitemap in Search Console and Bing",
      "Watch crawl errors and 404s daily for two weeks",
      "Compare rankings and traffic with the Webflow baseline weekly",
      "Keep the Webflow site unpublished but intact for 30 days",
      "Remove the internal pages or keep them noindexed",
    ],
  },
];
