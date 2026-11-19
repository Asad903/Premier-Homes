import { defineField, defineType } from "sanity";

export const property = defineType({
  name: "property",
  title: "Property",
  type: "document",
  groups: [
    { name: "main", title: "Main", default: true },
    { name: "details", title: "Details" },
    { name: "location", title: "Location" },
    { name: "media", title: "Media" },
    { name: "feed", title: "Feed & source" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    // Main
    defineField({
      name: "title",
      type: "string",
      group: "main",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "main",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "listingType",
      type: "string",
      group: "main",
      options: { list: ["sale", "rent"] },
      initialValue: "sale",
    }),
    defineField({
      name: "newBuild",
      title: "New build",
      type: "boolean",
      group: "main",
      description: "CSV values: yes = new build, resale = false",
      initialValue: false,
    }),
    defineField({ name: "featured", type: "boolean", group: "main", initialValue: false }),
    defineField({ name: "price", type: "number", group: "main" }),
    defineField({
      name: "currency",
      type: "string",
      group: "main",
      options: {
        list: [
          { title: "€", value: "EUR" },
          { title: "£", value: "GBP" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "EUR",
    }),
    defineField({
      name: "description",
      type: "array",
      group: "main",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
        { type: "file" },
        {
          type: "object",
          name: "embed",
          title: "Embed (video, map, iframe)",
          fields: [
            defineField({ name: "url", title: "URL", type: "url" }),
            defineField({ name: "caption", type: "string" }),
          ],
        },
      ],
    }),

    // Details
    defineField({ name: "bedrooms", type: "number", group: "details" }),
    defineField({ name: "bathrooms", type: "number", group: "details" }),
    defineField({ name: "areaBuiltM2", title: "Built area (m²)", type: "number", group: "details" }),
    defineField({ name: "areaPlotM2", title: "Plot area (m²)", type: "number", group: "details" }),
    defineField({
      name: "features",
      type: "array",
      group: "details",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),

    // Location
    defineField({ name: "town", type: "string", group: "location" }),
    defineField({ name: "province", type: "string", group: "location" }),
    defineField({ name: "country", type: "string", group: "location" }),
    defineField({
      name: "location",
      title: "Map location",
      type: "object",
      group: "location",
      options: { columns: 2 },
      fields: [
        defineField({ name: "lat", title: "Latitude", type: "number", validation: (rule) => rule.min(-90).max(90) }),
        defineField({ name: "lng", title: "Longitude", type: "number", validation: (rule) => rule.min(-180).max(180) }),
      ],
    }),

    // Media
    defineField({ name: "image", type: "image", group: "media", options: { hotspot: true } }),
    defineField({ name: "mainImageUrl", title: "Main image URL", type: "url", group: "media", description: "Source image from the feed" }),
    defineField({
      name: "imageUrls",
      title: "Image URLs",
      type: "array",
      group: "media",
      of: [{ type: "url" }],
      description: "All source images from the feed, in order",
    }),

    defineField({
      name: "videoUrls",
      title: "Video URLs",
      type: "array",
      group: "media",
      of: [{ type: "url" }],
    }),
    defineField({
      name: "videoPosterUrls",
      title: "Video poster URLs",
      type: "array",
      group: "media",
      of: [{ type: "url" }],
    }),

    // Feed & source
    defineField({ name: "reference", type: "string", group: "feed", description: "Agency reference, e.g. SVM47347" }),
    defineField({ name: "referenceKey", type: "string", group: "feed", description: "Agent::Reference, unique per feed item" }),
    defineField({ name: "agentName", type: "string", group: "feed" }),
    defineField({
      name: "status",
      type: "string",
      group: "feed",
      options: { list: ["active", "inactive", "sold", "withdrawn"] },
      initialValue: "active",
    }),
    defineField({ name: "firstSeen", type: "datetime", group: "feed" }),
    defineField({ name: "lastSeen", type: "datetime", group: "feed" }),
    defineField({ name: "lastUpdatedSource", title: "Last updated at source", type: "datetime", group: "feed" }),

    // SEO
    defineField({
      name: "seoTitle",
      title: "SEO title",
      type: "string",
      group: "seo",
      description: "Falls back to the property title. Aim for 50-60 characters.",
      validation: (rule) => rule.max(70).warning("Longer than 70 characters may be cut off in search results"),
    }),
    defineField({
      name: "seoDescription",
      title: "SEO description",
      type: "text",
      rows: 3,
      group: "seo",
      description: "Aim for 140-160 characters.",
      validation: (rule) => rule.max(170).warning("Longer than 170 characters may be cut off in search results"),
    }),
    defineField({
      name: "ogTitle",
      title: "OG title",
      type: "string",
      group: "seo",
      description: "Social share title. Falls back to the SEO title.",
    }),
    defineField({
      name: "ogDescription",
      title: "OG description",
      type: "text",
      rows: 2,
      group: "seo",
      description: "Social share description. Falls back to the SEO description.",
    }),
    defineField({
      name: "ogImage",
      title: "OG image",
      type: "image",
      group: "seo",
      description: "1200x630 recommended. Falls back to the main image.",
    }),
    defineField({
      name: "noindex",
      title: "Hide from search engines",
      type: "boolean",
      group: "seo",
      initialValue: false,
    }),
  ],
});
