import type { StructureResolver } from "sanity/structure";

const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const filtered = (S: Parameters<StructureResolver>[0], rawId: string, title: string, filter: string, params = {}) => {
  const id = slug(rawId);
  return S.listItem()
    .id(id)
    .title(title)
    .child(S.documentList().id(id).title(title).filter(`_type == "property" && ${filter}`).params(params));
};

export const structure: StructureResolver = async (S, context) => {
  const pairs: { country?: string; province?: string }[] = await context
    .getClient({ apiVersion: "2024-01-01" })
    .fetch(`*[_type == "property" && defined(province)]{country, province}`);
  const places = new Map<string, Set<string>>();
  for (const { country = "Other", province } of pairs) {
    if (!places.has(country)) places.set(country, new Set());
    if (province) places.get(country)!.add(province);
  }
  const countries = [...places.keys()].sort();
  const categories: { _id: string; title: string }[] = await context
    .getClient({ apiVersion: "2024-01-01" })
    .fetch(`*[_type == "category"] | order(title asc){_id, title}`);

  return S.list()
    .title("Content")
    .items([
      S.listItem()
        .id("property")
        .title("Properties")
        .child(
          S.list()
            .title("Properties")
            .items([
              S.listItem().id("all").title("All properties").child(S.documentTypeList("property").title("All properties")),
              S.divider(),
              S.listItem()
                .id("by-listing-type")
                .title("By listing type")
                .child(
                  S.list()
                    .title("Listing type")
                    .items([
                      filtered(S, "sale", "For sale", `listingType == "sale"`),
                      filtered(S, "rent", "For rent", `listingType == "rent"`),
                    ]),
                ),
              S.listItem()
                .id("by-location")
                .title("By location")
                .child(
                  S.list()
                    .title("Location")
                    .items(
                      countries.map((country) =>
                        S.listItem()
                          .id(`country-${slug(country)}`)
                          .title(country)
                          .child(
                            S.list()
                              .title(country)
                              .items([
                                filtered(
                                  S,
                                  `all-${country}`,
                                  `All in ${country}`,
                                  country === "Other" ? `!defined(country)` : `country == $country`,
                                  { country },
                                ),
                                S.divider(),
                                ...[...places.get(country)!].sort().map((province) =>
                                  filtered(
                                    S,
                                    `province-${country}-${province}`,
                                    province,
                                    `${country === "Other" ? "!defined(country)" : "country == $country"} && province == $province`,
                                    { country, province },
                                  ),
                                ),
                              ]),
                          ),
                      ),
                    ),
                ),
              S.listItem()
                .id("by-status")
                .title("By status")
                .child(
                  S.list()
                    .title("Status")
                    .items(
                      ["active", "inactive", "sold", "withdrawn"].map((s) =>
                        filtered(S, `status-${s}`, s[0].toUpperCase() + s.slice(1), `status == "${s}"`),
                      ),
                    ),
                ),
            ]),
        ),
      S.listItem()
        .id("blog")
        .title("Blog")
        .child(
          S.list()
            .title("Blog")
            .items([
              S.listItem()
                .id("all-posts")
                .title("All posts")
                .child(S.documentTypeList("post").title("All posts").defaultOrdering([{ field: "publishedAt", direction: "desc" }])),
              S.divider(),
              S.listItem()
                .id("posts-by-category")
                .title("By category")
                .child(
                  S.list()
                    .title("Category")
                    .items(
                      categories.map((category) =>
                        S.listItem()
                          .id(`posts-${category._id}`)
                          .title(category.title)
                          .child(
                            S.documentList()
                              .id(`posts-${category._id}`)
                              .title(category.title)
                              .filter(`_type == "post" && category._ref == $category`)
                              .params({ category: category._id })
                              .defaultOrdering([{ field: "publishedAt", direction: "desc" }]),
                          ),
                      ),
                    ),
                ),
              S.listItem()
                .id("featured-posts")
                .title("Featured")
                .child(S.documentList().id("featured-posts").title("Featured").filter(`_type == "post" && featured == true`)),
              S.divider(),
              S.documentTypeListItem("category").title("Categories"),
            ]),
        ),
      ...S.documentTypeListItems().filter((item) => !["property", "post", "category"].includes(item.getId() ?? "")),
    ]);
};
