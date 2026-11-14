import { sanityClient } from "sanity:client";

/** GROQ fetch. Example: `await sanityFetch<Post[]>('*[_type == "post"]')` */
export function sanityFetch<T>(query: string, params: Record<string, unknown> = {}) {
  return sanityClient.fetch<T>(query, params);
}
