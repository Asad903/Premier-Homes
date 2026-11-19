// One-off: rebuilds description blocks that contain literal HTML tags. Only the description field is patched.
// Usage: node --env-file=.env scripts/fix-descriptions.mjs [--dry]
import { createClient } from "@sanity/client";
import { htmlToBlocks } from "./html-to-blocks.mjs";

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});
const dry = process.argv.includes("--dry");
const docs = await client.fetch(`*[_type == "property" && defined(description)]{_id, description}`);
let fixed = 0;
for (const doc of docs) {
  const hasTags = doc.description.some((b) => b._type === "block" && b.children?.some((c) => /<\/?[a-z][^>]*>/i.test(c.text ?? "")));
  if (!hasTags) continue;
  const html = doc.description.filter((b) => b._type === "block").map((b) => b.children.map((c) => c.text).join("")).join("\n");
  const rest = doc.description.filter((b) => b._type !== "block");
  const next = [...htmlToBlocks(html), ...rest];
  if (!dry) await client.patch(doc._id).set({ description: next }).commit();
  fixed++;
  if (fixed === 1) console.log(doc._id, "->", next.length, "blocks;", next[0].children[0].text.slice(0, 80));
}
console.log(`${dry ? "would fix" : "fixed"} ${fixed} of ${docs.length}`);
