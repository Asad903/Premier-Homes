import { sanityClient } from "sanity:client";

export const BLOG_PAGE_SIZE = 9;

export type BlogCategory = { title: string; slug: string };

export type PostCardData = {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  readingTime?: number;
  excerpt?: string;
  imageUrl?: string;
  imageAlt?: string;
  category?: BlogCategory;
};

export type PostData = PostCardData & {
  intro?: { eyebrow?: string; heading?: string; text?: string };
  sideImages?: { url: string; alt?: string }[];
  body?: unknown[];
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  noindex?: boolean;
};

const card = `
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  readingTime,
  excerpt,
  "imageUrl": image.asset->url,
  "imageAlt": coalesce(image.alt, title),
  "category": category->{title, "slug": slug.current}
`;

/** Categories that have at least one published post, for the filter. */
export function getBlogCategories() {
  return sanityClient.fetch<BlogCategory[]>(
    `*[_type == "category" && count(*[_type == "post" && references(^._id)]) > 0] | order(title asc){title, "slug": slug.current}`,
  );
}

/** The newest post flagged as featured, shown in the blog hero. */
export function getFeaturedPost() {
  return sanityClient.fetch<PostCardData | null>(
    `*[_type == "post" && featured == true] | order(publishedAt desc)[0]{${card}}`,
  );
}

/** One page of posts, newest first. `category` is a category slug; an empty value means all. `page` starts at 1. */
export async function getPosts({ category = "", page = 1 }: { category?: string; page?: number } = {}) {
  const start = (page - 1) * BLOG_PAGE_SIZE;
  const end = start + BLOG_PAGE_SIZE;
  const filter = `_type == "post" && ($category == "" || category->slug.current == $category)`;
  const { total, items } = await sanityClient.fetch<{ total: number; items: PostCardData[] }>(
    `{
      "total": count(*[${filter}]),
      "items": *[${filter}] | order(publishedAt desc)[$start...$end]{${card}}
    }`,
    { category, start, end },
  );
  return { total, items, pages: Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE)) };
}

/** The latest posts for the homepage slider. `category` is a category slug; empty means all. */
export function getLatestPosts({ category = "", limit = 8 }: { category?: string; limit?: number } = {}) {
  return sanityClient.fetch<PostCardData[]>(
    `*[_type == "post" && ($category == "" || category->slug.current == $category)] | order(publishedAt desc)[0...$limit]{${card}}`,
    { category, limit },
  );
}

export function getPost(slug: string) {
  return sanityClient.fetch<PostData | null>(
    `*[_type == "post" && slug.current == $slug][0]{
      ${card},
      intro,
      "sideImages": sideImages[]{ "url": asset->url, "alt": coalesce(alt, ^.title) },
      body[]{
        ...,
        _type == "image" => { "url": asset->url, "alt": alt },
        _type == "file" => { "url": asset->url }
      },
      seoTitle,
      seoDescription,
      "ogImageUrl": ogImage.asset->url,
      noindex
    }`,
    { slug },
  );
}

/** "September 24, 2026" */
export const formatPostDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** "9 MIN READ" */
export const formatReadingTime = (minutes?: number) => (minutes ? `${minutes} min read` : "");
