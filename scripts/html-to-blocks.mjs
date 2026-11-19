// Converts simple HTML (p, br, strong/b, em/i, ul/ol/li, h2-h4) or plain text into Sanity Portable Text blocks.
import { randomBytes } from "node:crypto";

const key = () => randomBytes(6).toString("hex");
const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", euro: "€", pound: "£", sup2: "²" };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return entities[e.toLowerCase()] ?? m;
  });

const block = (spans, style = "normal", listItem) => ({
  _type: "block", _key: key(), style, markDefs: [], ...(listItem ? { listItem, level: 1 } : {}),
  children: spans.length ? spans : [{ _type: "span", _key: key(), text: "", marks: [] }],
});

export function htmlToBlocks(input = "") {
  if (!/<[a-z][\s\S]*>/i.test(input)) {
    return input.split(/\n{2,}|\r?\n/).map((s) => s.trim()).filter(Boolean).map((t) => block([{ _type: "span", _key: key(), text: t, marks: [] }]));
  }
  const out = [];
  let spans = [];
  let marks = [];
  let style = "normal";
  let list = "";
  const flush = () => {
    const text = spans.map((s) => s.text).join("").trim();
    if (text) {
      const trimmed = spans.map((s) => ({ ...s }));
      trimmed[0].text = trimmed[0].text.replace(/^\s+/, "");
      trimmed.at(-1).text = trimmed.at(-1).text.replace(/\s+$/, "");
      out.push(block(trimmed.filter((s) => s.text), style, list === "ol" ? "number" : list === "ul" ? "bullet" : undefined));
    }
    spans = [];
  };
  const toggle = (mark, on) => { marks = on ? [...new Set([...marks, mark])] : marks.filter((m) => m !== mark); };
  for (const token of input.replace(/\r/g, "").split(/(<[^>]+>)/)) {
    const tag = token.match(/^<\s*(\/?)\s*([a-z0-9]+)[^>]*>$/i);
    if (!tag) {
      const text = decode(token).replace(/\s+/g, " ");
      if (text.trim() || (text && spans.length)) spans.push({ _type: "span", _key: key(), text, marks: [...marks] });
      continue;
    }
    const [, closing, nameRaw] = tag;
    const name = nameRaw.toLowerCase();
    const open = !closing;
    if (name === "br") spans.push({ _type: "span", _key: key(), text: "\n", marks: [...marks] });
    else if (name === "strong" || name === "b") toggle("strong", open);
    else if (name === "em" || name === "i") toggle("em", open);
    else if (name === "u") toggle("underline", open);
    else if (name === "ul" || name === "ol") { flush(); list = open ? name : ""; }
    else if (["p", "li", "h1", "h2", "h3", "h4", "div", "blockquote"].includes(name)) {
      flush();
      style = open ? ({ h1: "h2", h2: "h2", h3: "h3", h4: "h4", blockquote: "blockquote" }[name] ?? "normal") : "normal";
    }
  }
  flush();
  return out;
}
