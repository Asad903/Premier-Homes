// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import sanity from "@sanity/astro";
import react from "@astrojs/react";
import { loadEnv } from "vite";
import { SITE_URL } from "./src/consts.ts";
import { isNoindexRoute } from "./src/utils/seo.ts";

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV ?? "development",
  process.cwd(),
  "",
);

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
