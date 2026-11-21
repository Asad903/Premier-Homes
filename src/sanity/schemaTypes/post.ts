import { defineArrayMember, defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  groups: [
    { name: "main", title: "Main", default: true },
    { name: "content", title: "Content" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    // Main
    defineField({ name: "title", type: "string", group: "main", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      group: "main",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      type: "reference",
      group: "main",
      to: [{ type: "category" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      group: "main",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "readingTime",
      title: "Reading time (minutes)",
      type: "number",
      group: "main",
      validation: (rule) => rule.min(1).integer(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 3,
      group: "main",
      description: "Shown on blog cards and under the post title.",
      validation: (rule) => rule.max(220).warning("Keep it short so cards stay even"),
    }),
    defineField({
      name: "featured",
      type: "boolean",
      group: "main",
      description: "Shown in the blog hero. Only one post should be featured.",
      initialValue: false,
    }),
    defineField({
      name: "image",
      title: "Cover image",
      type: "image",
      group: "main",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
    }),

    // Content
    defineField({
      name: "intro",
      title: "Sidebar intro",
      type: "object",
      group: "content",
      description: "Optional label, heading and text shown beside the article body.",
      fields: [
        defineField({ name: "eyebrow", type: "string" }),
        defineField({ name: "heading", type: "string" }),
        defineField({ name: "text", type: "text", rows: 3 }),
      ],
    }),
    defineField({
      name: "sideImages",
      title: "Sidebar images",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
        }),
      ],
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: "body",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading 2", value: "h2" },
            { title: "Heading 3", value: "h3" },
            { title: "Heading 4", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
        }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alt text", type: "string" }),
            defineField({ name: "caption", type: "string" }),
          ],
        }),
        defineArrayMember({
          type: "object",
          name: "embed",
          title: "Embed (video, map, iframe)",
          fields: [
            defineField({ name: "url", title: "URL", type: "url" }),
            defineField({ name: "caption", type: "string" }),
          ],
        }),
      ],
    }),

    // SEO
    defineField({
      name: "seoTitle",
      title: "SEO title",
      type: "string",
      group: "seo",
      description: "Falls back to the post title. Aim for 50-60 characters.",
      validation: (rule) => rule.max(70).warning("Longer than 70 characters may be cut off in search results"),
    }),
    defineField({
      name: "seoDescription",
      title: "SEO description",
      type: "text",
      rows: 3,
      group: "seo",
      description: "Falls back to the excerpt. Aim for 140-160 characters.",
      validation: (rule) => rule.max(170).warning("Longer than 170 characters may be cut off in search results"),
    }),
    defineField({ name: "ogImage", title: "OG image", type: "image", group: "seo", description: "1200x630 recommended. Falls back to the cover image." }),
    defineField({ name: "noindex", title: "Hide from search engines", type: "boolean", group: "seo", initialValue: false }),
  ],
  orderings: [
    { title: "Newest first", name: "publishedDesc", by: [{ field: "publishedAt", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "category.title", media: "image", date: "publishedAt" },
    prepare: ({ title, subtitle, media, date }) => ({
      title,
      subtitle: [subtitle, date && new Date(date).toLocaleDateString("en-GB")].filter(Boolean).join(" · "),
      media,
    }),
  },
});
