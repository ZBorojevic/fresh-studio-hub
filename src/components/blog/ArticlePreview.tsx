import { useMemo } from "react";
import { markdownToHtml } from "@/lib/markdown";

export type ArticleSkin = "pace" | "freshstudio";

/**
 * The article exactly as the public site renders it (same Markdown rules,
 * same typography — src/styles/article.css). Used as the live preview in the
 * blog editor.
 */
export default function ArticlePreview({
  skin,
  lang,
  title,
  excerpt,
  content,
  author,
  publishedAt,
  featuredImage,
  minutes,
}: {
  skin: ArticleSkin;
  lang: "hr" | "en";
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  featuredImage: string;
  minutes: number;
}) {
  const html = useMemo(() => markdownToHtml(content), [content]);
  const date = publishedAt ? new Date(publishedAt) : new Date();
  const dateLabel = new Intl.DateTimeFormat(lang === "hr" ? "hr-HR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
  const accent = skin === "pace" ? "text-[#c26d00]" : "text-neutral-900";
  const readLabel = lang === "hr" ? `${minutes} min čitanja` : `${minutes} min read`;

  return (
    <article className="mx-auto max-w-[68ch] px-2 pb-24 pt-10" data-skin={skin}>
      <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${accent}`} translate="no">
        {skin === "pace" ? "Pace · Blog" : "Fresh Studio · Blog"}
      </p>
      <h1
        className="mt-4 text-[2.6rem] font-black leading-[1.05] tracking-tight text-neutral-950 [text-wrap:balance]"
        style={{ fontFamily: skin === "pace" ? "Inter, system-ui, sans-serif" : "futura-pt, system-ui, sans-serif" }}
      >
        {title || (lang === "hr" ? "Naslov članka" : "Post title")}
      </h1>
      {excerpt && <p className="mt-5 text-xl leading-relaxed text-neutral-600 [text-wrap:pretty]">{excerpt}</p>}
      <p className="mt-6 flex flex-wrap items-center gap-x-2 text-sm text-neutral-500">
        {author && <span className="font-medium text-neutral-800">{author}</span>}
        {author && <span aria-hidden>·</span>}
        <time dateTime={date.toISOString()}>{dateLabel}</time>
        <span aria-hidden>·</span>
        <span>{readLabel}</span>
      </p>
      {featuredImage ? (
        <img src={featuredImage} alt="" width={1200} height={630} className="mt-8 aspect-[1200/630] w-full rounded-2xl object-cover" />
      ) : null}
      {content.trim() ? (
        <div className="fs-article mt-10" data-skin={skin} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          {lang === "hr" ? "Počni pisati lijevo — pregled se osvježava dok tipkaš." : "Start writing on the left — the preview updates as you type."}
        </p>
      )}
    </article>
  );
}
