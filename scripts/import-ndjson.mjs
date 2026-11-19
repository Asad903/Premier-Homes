// Usage: node --env-file=.env scripts/import-ndjson.mjs <file.ndjson>
// Upserts each document (createOrReplace), so it is safe to re-run.
import { readFileSync } from "node:fs";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const docs = readFileSync(process.argv[2], "utf8").trim().split("\n").map((l) => JSON.parse(l));
for (let i = 0; i < docs.length; i += 10) {
  const tx = client.transaction();
  docs.slice(i, i + 10).forEach((d) => tx.createOrReplace(d));
  const res = await tx.commit();
  console.log(`Committed ${res.results.length} (${Math.min(i + 10, docs.length)}/${docs.length})`);
}
const count = await client.fetch(`count(*[_type == "property"])`);
console.log(`Properties in dataset: ${count}`);
