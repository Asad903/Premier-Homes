// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import sanity from "@sanity/astro";
import react from "@astrojs/react";
import { createClient } from "@sanity/client";
import { loadEnv } from "vite";
import { SITE_URL } from "./src/consts.ts";
import { isNoindexRoute } from "./src/utils/seo.ts";

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV ?? "development",
  process.cwd(),
  "",
);

/**
 * Posts and properties live in Sanity, so the sitemap integration cannot discover them from the
 * file system. Fetch their paths here: published posts, and active properties, that are not hidden
 * from search. If Sanity cannot be reached the sitemap still builds, without them.
 */
async function sanityPages() {
  if (!PUBLIC_SANITY_PROJECT_ID) return [];
  try {
    const client = createClient({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2025-01-01",
      useCdn: true,
    });
    const [posts, properties] = await Promise.all([
      client.fetch(`*[_type == "post" && defined(slug.current) && noindex != true]{"path": "/blog/" + slug.current, "updated": _updatedAt}`),
      client.fetch(`*[_type == "property" && defined(slug.current) && status == "active" && noindex != true]{"path": "/properties/" + slug.current, "updated": _updatedAt}`),
    ]);
    return [...posts, ...properties];
  } catch (error) {
    console.warn(`[sitemap] Could not read posts and properties from Sanity: ${error instanceof Error ? error.message : error}`);
    return [];
  }
}

const dynamicPages = await sanityPages();
const lastModified = new Map(dynamicPages.map(({ path, updated }) => [new URL(path, SITE_URL).href, updated]));

export default defineConfig({
  site: SITE_URL,
  adapter: cloudflare(),
  integrations: [
    react(),
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2025-01-01",
      useCdn: true,
      studioBasePath: "/admin",
    }),
    sitemap({
      filter: (page) => !isNoindexRoute(new URL(page).pathname),
      customPages: dynamicPages.map(({ path }) => new URL(path, SITE_URL).href),
      // Pages are served and canonicalised without a trailing slash, so list them the same way.
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
        return { ...item, url: url.href, lastmod: lastModified.get(url.href) ?? item.lastmod };
      },
    }),
  ],
  fonts: [
    {
      name: "General Sans",
      cssVariable: "--font-general-sans",
      provider: fontProviders.local(),
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          { weight: 400, style: "normal", src: ["./src/assets/fonts/general-sans-regular.woff2"] },
          { weight: 500, style: "normal", src: ["./src/assets/fonts/general-sans-medium.woff2"] },
          { weight: 600, style: "normal", src: ["./src/assets/fonts/general-sans-semibold.woff2"] },
          { weight: 700, style: "normal", src: ["./src/assets/fonts/general-sans-bold.woff2"] },
        ],
      },
    },
    {
      name: "Georgia",
      cssVariable: "--font-georgia",
      provider: fontProviders.local(),
      fallbacks: ["serif"],
      options: {
        variants: [
          { weight: 400, style: "normal", src: ["./src/assets/fonts/georgia-regular.woff2"] },
        ],
      },
    },
  ],
  vite: { build: { cssTarget: "safari15.4" } },
});
