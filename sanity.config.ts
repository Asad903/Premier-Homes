import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

export default defineConfig({
  name: "default",
  title: "Premier Homes",
  projectId: "5pd7267f",
  dataset: "production",
  plugins: [structureTool({ structure })],
  schema: { types: schemaTypes },
});
