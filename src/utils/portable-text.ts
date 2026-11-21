// A small Portable Text to HTML renderer for the property description:
// paragraphs, headings, quotes, lists, bold/italic/underline/links, images and embeds.
type Span = { _type: "span"; text: string; marks?: string[] };
type Block = {
  _type: "block";
  style?: string;
  listItem?: "bullet" | "number";
  children?: Span[];
  markDefs?: { _key: string; _type: string; href?: string }[];
};
type Node = Block | { _type: "image"; url?: string; alt?: string; caption?: string } | { _type: "embed"; url?: string; caption?: string } | { _type: "file"; url?: string };

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safeUrl = (url = "") => (/^(https?:|mailto:|tel:|\/|#)/i.test(url) ? escape(url) : "#");

function renderSpans(block: Block) {
  return (block.children ?? [])
    .map((span) => {
      let html = escape(span.text).replace(/\n/g, "<br>");
      for (const mark of span.marks ?? []) {
        const def = block.markDefs?.find((d) => d._key === mark);
        if (def?._type === "link") html = `<a href="${safeUrl(def.href)}" rel="noopener">${html}</a>`;
        else if (mark === "strong") html = `<strong>${html}</strong>`;
        else if (mark === "em") html = `<em>${html}</em>`;
        else if (mark === "underline") html = `<u>${html}</u>`;
      }
      return html;
    })
    .join("");
}

/** Turns a YouTube, Vimeo or Google Maps link into an embeddable URL; anything else stays a link. */
function embedUrl(raw = "") {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const id = url.searchParams.get("v") ?? url.pathname.split("/").pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${url.pathname.split("/").pop()}`;
    if (host === "player.vimeo.com" || (host.startsWith("google.") && url.pathname.startsWith("/maps/embed"))) return url.href;
  } catch {}
  return "";
}

const tags: Record<string, string> = { h1: "h2", h2: "h2", h3: "h3", h4: "h4", blockquote: "blockquote", normal: "p" };

export function portableTextToHtml(nodes: unknown[] = []) {
  const out: string[] = [];
  let list: "ul" | "ol" | "" = "";
  const close = () => {
    if (list) out.push(`</${list}>`);
    list = "";
  };
  for (const node of nodes as Node[]) {
    if (node._type === "block") {
      const inner = renderSpans(node);
      if (!inner.trim()) continue;
      if (node.listItem) {
        const wanted = node.listItem === "number" ? "ol" : "ul";
        if (list !== wanted) {
          close();
          out.push(`<${wanted}>`);
          list = wanted;
        }
        out.push(`<li>${inner}</li>`);
        continue;
      }
      close();
      const tag = tags[node.style ?? "normal"] ?? "p";
      out.push(`<${tag}>${inner}</${tag}>`);
    } else if (node._type === "image" && node.url) {
      close();
      const caption = node.caption ? `<figcaption>${escape(node.caption)}</figcaption>` : "";
      out.push(`<figure><img src="${safeUrl(node.url)}" alt="${escape(node.alt ?? "")}" loading="lazy">${caption}</figure>`);
    } else if (node._type === "embed" && node.url) {
      close();
      const src = embedUrl(node.url);
      const caption = node.caption ? `<figcaption>${escape(node.caption)}</figcaption>` : "";
      out.push(
        src
          ? `<figure class="embed"><iframe src="${escape(src)}" title="${escape(node.caption || "Embedded content")}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>${caption}</figure>`
          : `<p><a href="${safeUrl(node.url)}" rel="noopener">${escape(node.caption || node.url)}</a></p>`,
      );
    } else if (node._type === "file" && node.url) {
      close();
      out.push(`<p><a href="${safeUrl(node.url)}">Download file</a></p>`);
    }
  }
  close();
  return out.join("");
}
