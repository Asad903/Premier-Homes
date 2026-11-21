// Imports the Webflow blog CSVs (categories + posts) into Sanity, uploading every image.
// Usage: node --env-file=.env scripts/import-blog.mjs <categories.csv> <posts.csv> [--dry]
// Safe to re-run: documents use fixed ids (category-<slug>, post-<slug>) and are replaced,
// and images are de-duplicated by Sanity (same file = same asset).
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@sanity/client";
import { htmlToBlocks } from "./html-to-blocks.mjs";

const [catCsv, postCsv] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dry = process.argv.includes("--dry");
const key = () => randomBytes(6).toString("hex");

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some(Boolean));
  head[0] = head[0].replace(/^﻿/, "");
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const assets = new Map();
async function upload(url) {
  if (!url) return undefined;
  if (assets.has(url)) return assets.get(url);
  if (dry) return { _type: "reference", _ref: "image-dry" };
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = decodeURIComponent(url.split("/").pop().split("?")[0]);
  const doc = await client.assets.upload("image", buf, { filename: file });
  const ref = { _type: "reference", _ref: doc._id };
  assets.set(url, ref);
  return ref;
}
const image = async (url, alt) => {
  const asset = await upload(url);
  return asset ? { _type: "image", asset, ...(alt ? { alt } : {}) } : undefined;
};

// Source links carry a "?utm_source=chatgpt.com" tag from drafting. Drop it.
const cleanHref = (href) => href.replace(/[?&]utm_source=chatgpt\.com/, "").replace(/\?$/, "");

async function bodyToBlocks(html) {
  const out = [];
  // Split around <figure>…</figure> and bare <img>, which become image blocks.
  for (const part of html.split(/(<figure[\s\S]*?<\/figure>|<img[^>]*>)/i)) {
    if (/^<(figure|img)/i.test(part)) {
      const src = part.match(/<img[^>]*\ssrc="([^"]+)"/i)?.[1];
      const alt = part.match(/<img[^>]*\salt="([^"]*)"/i)?.[1];
      const img = await image(src, alt);
      if (img) out.push({ ...img, _key: key() });
    } else {
      for (const b of htmlToBlocks(part)) {
        b.markDefs?.forEach((d) => { if (d.href) d.href = cleanHref(d.href); });
        out.push(b);
      }
    }
  }
  return out;
}

const date = (v) => (v ? new Date(v.replace(/\s*\(.*\)$/, "")).toISOString() : undefined);
const minutes = (v) => Number(v.match(/\d+/)?.[0]) || undefined;
const strip = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ""));

const categories = parseCsv(readFileSync(catCsv, "utf8"));
const posts = parseCsv(readFileSync(postCsv, "utf8"));
const docs = [];

for (const c of categories) {
  docs.push({ _id: `category-${c.Slug}`, _type: "category", title: c.Name, slug: { _type: "slug", current: c.Slug } });
}
const known = new Set(categories.map((c) => c.Slug));

for (const p of posts) {
  if (!known.has(p.Category)) throw new Error(`Unknown category "${p.Category}" on ${p.Slug}`);
  const draft = p.Draft === "true";
  const title = p.Title.replace(/\s+/g, " ");
  console.log(`${draft ? "[draft] " : ""}${p.Slug}`);
  const intro = strip({ eyebrow: p["LS Eyebrow"], heading: p["LS Ttitle"], text: p["LS Text"] });
  const sideImages = [];
  for (const u of [p["LS Image 1"], p["LS Image 2"]]) {
    const img = await image(u, title);
    if (img) sideImages.push({ ...img, _key: key() });
  }
  docs.push(
    strip({
      _id: `${draft ? "drafts." : ""}post-${p.Slug}`,
      _type: "post",
      title,
      slug: { _type: "slug", current: p.Slug },
      category: { _type: "reference", _ref: `category-${p.Category}` },
      publishedAt: date(p.Date) ?? date(p["Published On"]),
      readingTime: minutes(p["Time to Read"]),
      excerpt: p.Summary,
      featured: p["Featured?"] === "true",
      image: await image(p.Image, title),
      intro: Object.keys(intro).length ? intro : undefined,
      sideImages: sideImages.length ? sideImages : undefined,
      body: await bodyToBlocks(p.Body),
      seoTitle: p["SEO Title Tag"],
      seoDescription: p["SEO Meta Description"],
      ogImage: p["OG Img"] && p["OG Img"] !== p.Image ? await image(p["OG Img"]) : undefined,
    }),
  );
}

if (dry) {
  console.log(`\nDry run: ${docs.length} docs, nothing written.`);
  console.log(JSON.stringify(docs.find((d) => d._type === "post"), null, 1).slice(0, 1800));
} else {
  for (let i = 0; i < docs.length; i += 5) {
    const tx = client.transaction();
    docs.slice(i, i + 5).forEach((d) => tx.createOrReplace(d));
    await tx.commit();
  }
  const counts = await client.fetch(`{"posts": count(*[_type=="post"]), "categories": count(*[_type=="category"]), "images": count(*[_type=="sanity.imageAsset"])}`);
  console.log(`Done.`, counts);
}
