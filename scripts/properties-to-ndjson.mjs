// Converts the Webflow properties CSV into Sanity NDJSON.
// Usage: node scripts/properties-to-ndjson.mjs <input.csv> <output.ndjson> [limit] [diverse]
// "diverse" picks rows so every status, agent, province, new-build value, listing
// type, price band, bedroom count, video and missing-location case is represented.
// Then:  npx sanity dataset import <output.ndjson> production --replace
import { htmlToBlocks } from "./html-to-blocks.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const [input, output, limitArg, mode] = process.argv.slice(2);
const limit = Number(limitArg) || Infinity;

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
      row.push(cell); cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  head[0] = head[0].replace(/^﻿/, "");
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const key = () => randomBytes(6).toString("hex");
const num = (v) => (v === "" || Number.isNaN(Number(v)) ? undefined : Number(v));
const date = (v) => { const d = new Date(v.replace(/\s*\(.*\)$/, "")); return Number.isNaN(d.getTime()) ? undefined : d.toISOString(); };
const list = (v) => v.split(";").map((s) => s.trim()).filter(Boolean);
const blocks = htmlToBlocks;

const traits = (r) => {
  const price = Number(r["Price"]);
  return [
    `status:${r["Status"]}`, `agent:${r["Agent Name"]}`, `province:${r["Province"]}`,
    `town:${r["Town"]}`, `newBuild:${r["New Build"]}`, `type:${r["Listing Type"]}`,
    `source:${r["Source Format"]}`, `beds:${Math.min(Number(r["Bedrooms"]) || 0, 6)}`,
    `price:${price < 200000 ? "<200k" : price < 400000 ? "<400k" : price < 800000 ? "<800k" : "800k+"}`,
    `video:${(r["Video URLs"] ?? "") ? "yes" : "no"}`,
    `geo:${r["Latitude"] && r["Longitude"] ? "yes" : "no"}`,
  ];
};
function pickDiverse(rows, n) {
  const chosen = [], seen = new Set(), left = [...rows];
  while (chosen.length < n && left.length) {
    let best = 0, bestScore = -1;
    left.forEach((r, i) => {
      const score = traits(r).filter((t) => !seen.has(t)).length;
      if (score > bestScore) { best = i; bestScore = score; }
    });
    const [r] = left.splice(best, 1);
    traits(r).forEach((t) => seen.add(t));
    chosen.push(r);
  }
  return chosen;
}
const all = parseCsv(readFileSync(input, "utf8"));
const rows = mode === "diverse" ? pickDiverse(all, limit) : all.slice(0, limit);

const docs = rows.map((r) => {
  const lat = num(r["Latitude"]), lng = num(r["Longitude"]);
  const doc = {
    _id: `property-${r["Reference"].toLowerCase()}`,
    _type: "property",
    title: r["Name"],
    slug: { _type: "slug", current: r["Slug"] },
    reference: r["Reference"],
    referenceKey: r["Reference Key"],
    listingType: r["Listing Type"] || "sale",
    newBuild: r["New Build"].toLowerCase() === "yes",
    featured: false,
    price: num(r["Price"]),
    currency: r["Currency"] === "GBP" ? "GBP" : "EUR",
    description: blocks(r["Description"]),
    bedrooms: num(r["Bedrooms"]),
    bathrooms: num(r["Bathrooms"]),
    areaBuiltM2: num(r["Area Built M2"]),
    areaPlotM2: num(r["Area Plot M2"]),
    features: list(r["Features"]),
    town: r["Town"],
    province: r["Province"],
    country: r["Country"] || "Spain",
    location: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    mainImageUrl: r["Main Image URL"] || undefined,
    imageUrls: list(r["Image URLs"]),
    videoUrls: list(r["Video URLs"] ?? ""),
    videoPosterUrls: list(r["Video Poster URLs"] ?? ""),
    agentName: r["Agent Name"],
    status: r["Status"] || "active",
    firstSeen: date(r["First Seen"]),
    lastSeen: date(r["Last Seen"]),
    lastUpdatedSource: date(r["Last Updated Source"]),
  };
  return Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== undefined && v !== ""));
});

writeFileSync(output, docs.map((d) => JSON.stringify(d)).join("\n") + "\n");
console.log(`${docs.length} documents written to ${output}`);
