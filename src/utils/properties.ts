import { sanityClient } from "sanity:client";

export const PAGE_SIZE = 12;

export type PropertyCardData = {
  _id: string;
  title: string;
  slug: string;
  reference?: string;
  price?: number;
  currency?: "EUR" | "GBP";
  listingType?: "sale" | "rent";
  status?: string;
  newBuild?: boolean;
  town?: string;
  province?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaBuiltM2?: number;
  features?: string[];
  imageUrl?: string;
};

export type PropertyFilters = {
  q: string;
  ref: string;
  build: "" | "yes" | "resale";
  location: string;
  province: string;
  type: "" | "sale" | "rent";
  minPrice: number;
  maxPrice: number;
  status: "" | "active" | "inactive" | "sold" | "withdrawn";
  beds: number;
  page: number;
};

const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | "" =>
  allowed.includes(value as T) ? (value as T) : "";
const int = (value: string | null) => Math.max(0, parseInt(value ?? "", 10) || 0);

/** Reads filters from the URL. Anything unknown is ignored, so a bad URL never breaks the query. */
export function readFilters(params: URLSearchParams): PropertyFilters {
  const build = params.get("build") ?? params.get("status_build");
  return {
    q: (params.get("q") ?? "").trim().slice(0, 80),
    ref: (params.get("ref") ?? "").trim().slice(0, 40),
    build: build === "new-build" ? "yes" : pick(build, ["yes", "resale"] as const),
    location: (params.get("location") ?? "").trim().slice(0, 80),
    province: pick(params.get("province"), ["Alicante", "Murcia"] as const),
    type: pick(params.get("type"), ["sale", "rent"] as const),
    minPrice: int(params.get("min_price")),
    maxPrice: int(params.get("max_price")),
    status: pick(params.get("status"), ["active", "inactive", "sold", "withdrawn"] as const),
    beds: int(params.get("beds")),
    page: Math.max(1, int(params.get("page")) || 1),
  };
}

// Every filter is optional: an empty parameter turns its clause off, so one query serves all combinations.
const QUERY = /* groq */ `{
  "total": count(*[_type == "property" && ${"__FILTER__"}]),
  "items": *[_type == "property" && ${"__FILTER__"}]
    | order(_createdAt desc, title asc)[$from...$to]{
      _id, title, reference, price, currency, listingType, status, newBuild,
      town, province, bedrooms, bathrooms, areaBuiltM2,
      "slug": slug.current,
      "features": features[0...2],
      "imageUrl": coalesce(image.asset->url, mainImageUrl)
    }
}`;

const FILTER = /* groq */ `
  ($q == "" || title match $q + "*" || town match $q + "*" || province match $q + "*" || reference match $q + "*")
  && ($ref == "" || reference match $ref + "*")
  && ($build == "" || newBuild == ($build == "yes"))
  && ($location == "" || town match $location + "*" || province match $location + "*")
  && ($province == "" || province == $province)
  && ($type == "" || listingType == $type)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
  && ($status == "" || status == $status)
  && ($beds == 0 || bedrooms >= $beds)
`;

export async function getProperties(filters: PropertyFilters) {
  const from = (filters.page - 1) * PAGE_SIZE;
  const { total, items } = await sanityClient.fetch<{ total: number; items: PropertyCardData[] }>(
    QUERY.replaceAll("__FILTER__", FILTER),
    { ...filters, from, to: from + PAGE_SIZE },
  );
  return { total, items, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

const symbols = { EUR: "€", GBP: "£" } as const;

export function formatPrice(price?: number, currency: "EUR" | "GBP" = "EUR", listingType?: string) {
  if (!price) return "Price on request";
  return `${symbols[currency] ?? "€"}${price.toLocaleString("en-GB")}${listingType === "rent" ? " / month" : ""}`;
}

export type PropertyData = PropertyCardData & {
  features?: string[];
  imageUrls?: string[];
  areaPlotM2?: number;
  country?: string;
  location?: { lat?: number; lng?: number };
  description?: unknown[];
  seoTitle?: string;
  seoDescription?: string;
  noindex?: boolean;
};

/** One property for its own page. Images fall back from the uploaded image to the feed's URL list. */
export function getProperty(slug: string) {
  return sanityClient.fetch<PropertyData | null>(
    /* groq */ `*[_type == "property" && slug.current == $slug][0]{
      _id, title, reference, price, currency, listingType, status, newBuild,
      town, province, country, bedrooms, bathrooms, areaBuiltM2, areaPlotM2,
      features, location, seoTitle, seoDescription, noindex,
      "slug": slug.current,
      "imageUrl": coalesce(image.asset->url, mainImageUrl),
      "imageUrls": coalesce(imageUrls, []),
      "description": description[]{
        ...,
        _type == "image" => { "url": asset->url, "alt": alt },
        _type == "file" => { "url": asset->url }
      }
    }`,
    { slug },
  );
}

/** Three other properties, preferring the same province and listing type. */
export function getSimilar(property: PropertyData, limit = 3) {
  return sanityClient.fetch<PropertyCardData[]>(
    /* groq */ `*[_type == "property" && _id != $id && status == "active" && listingType == $type]
      | order(select(province == $province => 0, 1) asc, _createdAt desc)[0...$limit]{
        _id, title, reference, price, currency, listingType, status, newBuild,
        town, province, bedrooms, bathrooms, areaBuiltM2,
        "slug": slug.current,
        "features": features[0...2],
        "imageUrl": coalesce(image.asset->url, mainImageUrl)
      }`,
    { id: property._id, type: property.listingType ?? "sale", province: property.province ?? "", limit },
  );
}

export type CompareData = PropertyCardData & { areaPlotM2?: number; features?: string[] };

/** The properties named in `?p=a,b,c`, in that order (at most three, unknown slugs dropped). */
export async function getPropertiesBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  const found = await sanityClient.fetch<CompareData[]>(
    /* groq */ `*[_type == "property" && slug.current in $slugs]{
      _id, title, reference, price, currency, listingType, status, newBuild,
      town, province, bedrooms, bathrooms, areaBuiltM2, areaPlotM2, features,
      "slug": slug.current,
      "imageUrl": coalesce(image.asset->url, mainImageUrl)
    }`,
    { slugs },
  );
  return slugs.map((slug) => found.find((p) => p.slug === slug)).filter((p): p is CompareData => Boolean(p));
}
