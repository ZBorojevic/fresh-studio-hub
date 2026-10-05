import { Marked } from "marked";

/**
 * Blog Markdown → safe HTML, identical to what the public sites render (Pace:
 * src/site/markdown.ts). Keep the two in step so the hub preview shows exactly
 * what readers will see.
 *
 *  - Raw HTML inside Markdown is escaped (rendered as text): a pasted snippet
 *    can never inject markup or scripts into a site.
 *  - Links: http(s), mailto, same-site and #anchors only; external ones open
 *    in a new tab with rel="noopener noreferrer nofollow".
 *  - Images: https only, lazy-loaded.
 *  - Headings get stable ids (for the table of contents and deep links).
 */
const escHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function safeUrl(href: string | null | undefined, kind: "link" | "image"): string | null {
  if (!href) return null;
  const h = href.trim();
  if (kind === "link" && (/^(https?:|mailto:)/i.test(h) || /^\/(?!\/)/.test(h) || h.startsWith("#"))) return h;
  if (kind === "image" && /^https:\/\//i.test(h)) return h;
  return null;
}

/** "Koliko štedjeti?" → "koliko-stedjeti" — same rule on every site. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

const md = new Marked({ gfm: true, breaks: false });
md.use({
  renderer: {
    html({ text }) {
      return escHtml(text);
    },
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      const plain = inner.replace(/<[^>]+>/g, "");
      return `<h${depth} id="${headingId(plain)}">${inner}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const url = safeUrl(href, "link");
      if (!url) return text;
      const external = /^https?:/i.test(url);
      return `<a href="${escHtml(url)}"${title ? ` title="${escHtml(title)}"` : ""}${external ? ' rel="noopener noreferrer nofollow" target="_blank"' : ""}>${text}</a>`;
    },
    image({ href, title, text }) {
      const url = safeUrl(href, "image");
      if (!url) return escHtml(text ?? "");
      return `<img src="${escHtml(url)}" alt="${escHtml(text ?? "")}"${title ? ` title="${escHtml(title)}"` : ""} loading="lazy" decoding="async" />`;
    },
  },
});

/** Tables are wrapped so they scroll sideways on phones instead of squeezing. */
const wrapTables = (html: string) => html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
export const markdownToHtml = (src: string | null | undefined) => (src ? wrapTables(md.parse(src, { async: false }) as string) : "");

/** Words, reading time and the heading outline of a Markdown text. */
export function articleStats(src: string) {
  const text = src
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ");
  const words = (text.match(/\S+/g) ?? []).length;
  const outline = Array.from(src.matchAll(/^(#{2,3})\s+(.+?)\s*#*\s*$/gm)).map((m) => ({
    depth: m[1].length,
    text: m[2].replace(/[*_`]/g, ""),
    id: headingId(m[2].replace(/[*_`]/g, "")),
  }));
  return { words, minutes: Math.max(1, Math.round(words / 220)), outline };
}
