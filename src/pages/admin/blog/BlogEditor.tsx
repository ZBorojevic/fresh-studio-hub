// Blog writing studio — big-screen editor with a live, pixel-true preview.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Columns2,
  Copy,
  Eye,
  ImagePlus,
  Loader2,
  PenLine,
  Rocket,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { articleStats } from "@/lib/markdown";
import MediaPickerDialog from "@/components/MediaPickerDialog";
import MarkdownEditor, { type MarkdownEditorHandle } from "@/components/blog/MarkdownEditor";
import ArticlePreview, { type ArticleSkin } from "@/components/blog/ArticlePreview";

const SITES = [
  { value: "pace", label: "pace.freshstudio.hr", base: "https://pace.freshstudio.hr/blog/" },
  { value: "freshstudio", label: "freshstudio.hr", base: "https://freshstudio.hr/blog/" },
] as const;

type Lang = "hr" | "en";
type View = "write" | "split" | "preview";

type BlogFormData = {
  slug: string;
  status: "draft" | "published";
  site: string;
  featuredImage: string;
  author: string;
  titleHr: string;
  excerptHr: string;
  contentHr: string;
  metaTitleHr: string;
  metaDescriptionHr: string;
  titleEn: string;
  excerptEn: string;
  contentEn: string;
  metaTitleEn: string;
  metaDescriptionEn: string;
  publishedAt: string;
};

const EMPTY_FORM: BlogFormData = {
  slug: "", status: "draft", site: "pace",
  featuredImage: "", author: "",
  titleHr: "", excerptHr: "", contentHr: "", metaTitleHr: "", metaDescriptionHr: "",
  titleEn: "", excerptEn: "", contentEn: "", metaTitleEn: "", metaDescriptionEn: "",
  publishedAt: "",
};

const generateSlug = (title: string) =>
  title.toLowerCase()
    .replace(/[čć]/g, "c").replace(/đ/g, "d").replace(/š/g, "s").replace(/ž/g, "z")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const draftKey = (id: string) => `hub-blog-draft:${id}`;
const L = (lang: Lang) => (lang === "hr" ? "Hr" : "En") as "Hr" | "En";

/** How complete a language version is: title, excerpt, body, meta. */
function completeness(f: BlogFormData, lang: Lang) {
  const k = L(lang);
  const parts = [f[`title${k}`], f[`excerpt${k}`], f[`content${k}`], f[`metaDescription${k}`]];
  return parts.filter((p) => p.trim()).length / parts.length;
}

function relTime(d: Date | null) {
  if (!d) return "";
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Intl.DateTimeFormat("hr-HR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id || id === "new";
  const key = isNew ? "new" : id!;

  const [f, setF] = useState<BlogFormData>(EMPTY_FORM);
  const [saved, setSaved] = useState<string>(JSON.stringify(EMPTY_FORM)); // last server state
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<Lang>("hr");
  const [view, setView] = useState<View>("split");
  const [picker, setPicker] = useState<null | "featured" | "inline">(null);
  const [restorable, setRestorable] = useState<{ data: BlogFormData; at: string } | null>(null);
  const [, tick] = useState(0);
  const editor = useRef<MarkdownEditorHandle>(null);
  const previewScroll = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(f) !== saved;
  const k = L(lang);
  const site = SITES.find((s) => s.value === f.site) ?? SITES[0];
  const skin: ArticleSkin = f.site === "pace" ? "pace" : "freshstudio";
  const stats = useMemo(() => articleStats(f[`content${k}`]), [f, k]);

  /* ── Load ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const offerDraft = (server: BlogFormData) => {
      try {
        const raw = localStorage.getItem(draftKey(key));
        if (!raw) return;
        const d = JSON.parse(raw) as { data: BlogFormData; at: string };
        if (JSON.stringify(d.data) !== JSON.stringify(server)) setRestorable(d);
      } catch {
        /* ignore a broken draft */
      }
    };
    if (isNew) {
      const fresh = { ...EMPTY_FORM, author: localStorage.getItem("fs_admin_fullname") || localStorage.getItem("fs_admin_username") || "" };
      setF(fresh);
      setSaved(JSON.stringify(fresh));
      setLang("en"); // new posts default to Pace, which is English-only
      offerDraft(fresh);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/blog/${id}`);
        if (!res.ok) throw new Error("Could not load the post.");
        const d = await res.json();
        const data: BlogFormData = {
          slug: d.slug ?? "", status: d.status ?? "draft", site: d.site ?? "pace",
          featuredImage: d.featuredImage ?? "", author: d.author ?? "",
          titleHr: d.titleHr ?? "", excerptHr: d.excerptHr ?? "", contentHr: d.contentHr ?? "",
          metaTitleHr: d.metaTitleHr ?? "", metaDescriptionHr: d.metaDescriptionHr ?? "",
          titleEn: d.titleEn ?? "", excerptEn: d.excerptEn ?? "", contentEn: d.contentEn ?? "",
          metaTitleEn: d.metaTitleEn ?? "", metaDescriptionEn: d.metaDescriptionEn ?? "",
          publishedAt: d.publishedAt ? new Date(d.publishedAt).toISOString().slice(0, 16) : "",
        };
        setF(data);
        setSaved(JSON.stringify(data));
        setSavedAt(d.updatedAt ? new Date(d.updatedAt) : null);
        setLang(data.titleEn && !data.titleHr ? "en" : data.site === "pace" ? "en" : "hr");
        offerDraft(data);
      } catch (err) {
        toast({ title: "Could not load the post", description: (err as Error).message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, key, toast]);

  /* ── Local draft (survives a crash or a closed tab) ───────────────── */
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(key), JSON.stringify({ data: f, at: new Date().toISOString() }));
      } catch {
        /* storage full or blocked */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [f, dirty, key]);

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // Keep "Saved 2 min ago" fresh.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 20_000);
    return () => clearInterval(t);
  }, []);

  /* ── Edits ────────────────────────────────────────────────────────── */
  const update = <K extends keyof BlogFormData>(field: K, value: BlogFormData[K]) => setF((p) => ({ ...p, [field]: value }));

  const setTitle = (value: string) =>
    setF((p) => {
      const next = { ...p, [`title${k}`]: value } as BlogFormData;
      if (!p.slug || p.slug === generateSlug(p[`title${k}`])) next.slug = generateSlug(value);
      return next;
    });

  /* ── Save / publish ───────────────────────────────────────────────── */
  const save = useCallback(
    async (override?: Partial<BlogFormData>) => {
      const data = { ...f, ...override };
      if (!data.titleHr.trim() && !data.titleEn.trim()) {
        toast({ title: "Add a title first", description: "A post needs a title in at least one language.", variant: "destructive" });
        return false;
      }
      try {
        setSaving(true);
        const slug = data.slug || generateSlug(data.titleEn || data.titleHr);
        const payload = {
          slug,
          status: data.status, site: data.site,
          featuredImage: data.featuredImage || null, author: data.author || null,
          titleHr: data.titleHr || null, excerptHr: data.excerptHr || null, contentHr: data.contentHr || null,
          metaTitleHr: data.metaTitleHr || null, metaDescriptionHr: data.metaDescriptionHr || null,
          titleEn: data.titleEn || null, excerptEn: data.excerptEn || null, contentEn: data.contentEn || null,
          metaTitleEn: data.metaTitleEn || null, metaDescriptionEn: data.metaDescriptionEn || null,
          publishedAt: data.publishedAt || null,
        };
        const res = await apiFetch(isNew ? "/blog" : `/blog/${id}`, { method: isNew ? "POST" : "PUT", body: JSON.stringify(payload) });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "The server did not accept the post — try again.");
        }
        const out = await res.json().catch(() => ({}));
        const finalData = { ...data, slug };
        setF(finalData);
        setSaved(JSON.stringify(finalData));
        setSavedAt(new Date());
        try {
          localStorage.removeItem(draftKey(key));
        } catch {
          /* ignore */
        }
        setRestorable(null);
        if (isNew && out?.id) navigate(`/admin/blog/${out.id}`, { replace: true });
        return true;
      } catch (err) {
        toast({ title: "Not saved", description: (err as Error).message, variant: "destructive" });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [f, id, isNew, key, navigate, toast]
  );

  const publish = async () => {
    const now = new Date();
    const wasLive = f.status === "published";
    const ok = await save({
      status: "published",
      publishedAt: f.publishedAt || new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    });
    if (ok) toast({ title: wasLive ? "Live post updated" : "Published", description: `${site.base}${f.slug || generateSlug(f.titleEn || f.titleHr)}` });
  };

  // ⌘S / Ctrl+S saves; ⌘⇧P cycles Write → Split → Preview.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving) void save();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setView((v) => (v === "write" ? "split" : v === "split" ? "preview" : "write"));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save, saving]);

  const leave = (e: React.MouseEvent) => {
    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) e.preventDefault();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground" aria-live="polite">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Loading post…
      </div>
    );
  }

  const title = f[`title${k}`];
  const metaTitle = f[`metaTitle${k}`] || title;
  const metaDesc = f[`metaDescription${k}`] || f[`excerpt${k}`];
  const url = `${site.base}${f.slug || "your-post"}`;
  const status = saving ? "Saving…" : dirty ? "Unsaved changes" : savedAt ? `Saved ${relTime(savedAt)}` : isNew ? "New post" : "Saved";

  const segBtn = (on: boolean) =>
    `inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      on ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
    }`;

  /* ── Panels ───────────────────────────────────────────────────────── */
  const writePanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 border-b px-6 pb-4 pt-6">
        <label htmlFor="post-title" className="sr-only">Title ({lang.toUpperCase()})</label>
        <input
          id="post-title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === "hr" ? "Naslov članka…" : "Post title…"}
          autoComplete="off"
          className="-mx-2 w-[calc(100%+1rem)] rounded-md bg-transparent px-2 text-3xl font-bold tracking-tight outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:bg-muted/40"
        />
        <label htmlFor="post-excerpt" className="sr-only">Excerpt ({lang.toUpperCase()})</label>
        <textarea
          id="post-excerpt"
          name="excerpt"
          value={f[`excerpt${k}`]}
          onChange={(e) => update(`excerpt${k}`, e.target.value)}
          placeholder={lang === "hr" ? "Kratki sažetak — prikazuje se u popisu i ispod naslova…" : "Short summary — shown in lists and under the title…"}
          rows={2}
          autoComplete="off"
          className="-mx-2 w-[calc(100%+1rem)] resize-none rounded-md bg-transparent px-2 text-lg leading-relaxed text-muted-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:bg-muted/40"
        />
      </div>
      <div className="min-h-0 flex-1">
        <MarkdownEditor
          ref={editor}
          value={f[`content${k}`]}
          onChange={(v) => update(`content${k}`, v)}
          onPickImage={() => setPicker("inline")}
          label={`Content (${lang.toUpperCase()})`}
          placeholder={lang === "hr" ? "## Uvod\n\nPiši u Markdownu — pregled desno se osvježava dok tipkaš…" : "## Introduction\n\nWrite in Markdown — the preview on the right updates as you type…"}
        />
      </div>
    </div>
  );

  const previewPanel = (
    <div ref={previewScroll} className="h-full overflow-auto overscroll-contain bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-white/90 px-6 py-2 text-xs text-neutral-500 backdrop-blur">
        <span className="min-w-0 truncate" translate="no">{url}</span>
        <span className="shrink-0">Live preview · {site.label}</span>
      </div>
      <ArticlePreview
        skin={skin}
        lang={lang}
        title={title}
        excerpt={f[`excerpt${k}`]}
        content={f[`content${k}`]}
        author={f.author}
        publishedAt={f.publishedAt}
        featuredImage={f.featuredImage}
        minutes={stats.minutes}
      />
    </div>
  );

  const titleLen = metaTitle.length;
  const descLen = metaDesc.length;
  const lenTone = (n: number, lo: number, hi: number) => (n === 0 ? "text-muted-foreground" : n >= lo && n <= hi ? "text-emerald-600" : "text-amber-600");

  return (
    <TooltipProvider delayDuration={300}>
      <div className="-m-6 flex h-[calc(100vh-4rem)] min-h-0 flex-col bg-muted/30 2xl:-m-8">
        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
          <Button asChild variant="ghost" size="icon" aria-label="Back to all posts">
            <Link to="/admin/blog" onClick={leave}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <div className="min-w-0 max-w-[28rem]">
            <p className="truncate text-sm font-semibold">{title || (isNew ? "New post" : "Untitled")}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
              <span className={`h-1.5 w-1.5 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden />
              {status}
              <span aria-hidden>·</span>
              {f.status === "published" ? "Published" : "Draft"}
            </p>
          </div>

          <div className="ml-4 flex items-center rounded-lg bg-muted p-1" role="group" aria-label="Language">
            {(["en", "hr"] as Lang[]).map((l) => {
              const c = completeness(f, l);
              return (
                <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className={segBtn(lang === l)}>
                  {l.toUpperCase()}
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${c === 1 ? "bg-emerald-500" : c > 0 ? "bg-amber-500" : "bg-muted-foreground/30"}`}
                    aria-label={`${Math.round(c * 100)}% complete`}
                  />
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center rounded-lg bg-muted p-1" role="group" aria-label="View">
            <button type="button" onClick={() => setView("write")} aria-pressed={view === "write"} className={segBtn(view === "write")}>
              <PenLine className="h-3.5 w-3.5" aria-hidden /> Write
            </button>
            <button type="button" onClick={() => setView("split")} aria-pressed={view === "split"} className={segBtn(view === "split")}>
              <Columns2 className="h-3.5 w-3.5" aria-hidden /> Split
            </button>
            <button type="button" onClick={() => setView("preview")} aria-pressed={view === "preview"} className={segBtn(view === "preview")}>
              <Eye className="h-3.5 w-3.5" aria-hidden /> Preview
            </button>
          </div>

          <Button variant="outline" onClick={() => void save()} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            Save
            <kbd className="ml-1 hidden rounded border px-1 text-[10px] font-normal text-muted-foreground xl:inline">⌘S</kbd>
          </Button>
          <Button onClick={publish} disabled={saving} className="gap-2">
            <Rocket className="h-4 w-4" aria-hidden />
            {f.status === "published" ? "Update Live Post" : "Publish"}
          </Button>
        </div>

        {restorable && (
          <div className="flex shrink-0 items-center gap-3 border-b bg-amber-50 px-4 py-2 text-sm text-amber-900" role="status">
            Unsaved changes from {new Intl.DateTimeFormat("hr-HR", { dateStyle: "short", timeStyle: "short" }).format(new Date(restorable.at))} were kept on this computer.
            <Button size="sm" variant="outline" className="h-7" onClick={() => (setF(restorable.data), setRestorable(null))}>
              Restore Them
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => {
                try {
                  localStorage.removeItem(draftKey(key));
                } catch {
                  /* ignore */
                }
                setRestorable(null);
              }}
            >
              Discard
            </Button>
          </div>
        )}

        {/* ── Workspace ───────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1">
            {view === "split" ? (
              <ResizablePanelGroup direction="horizontal" autoSaveId="hub-blog-split">
                <ResizablePanel defaultSize={50} minSize={30} className="bg-card">
                  {writePanel}
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  {previewPanel}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : view === "write" ? (
              <div className="mx-auto h-full max-w-4xl border-x bg-card">{writePanel}</div>
            ) : (
              previewPanel
            )}
          </div>

          {/* ── Settings ─────────────────────────────────────────── */}
          <aside aria-label="Post settings" className="w-[22rem] shrink-0 overflow-y-auto overscroll-contain border-l bg-card">
            <section className="space-y-4 border-b p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Publishing</h2>
              <div className="space-y-1.5">
                <Label htmlFor="post-site">Site</Label>
                <Select value={f.site} onValueChange={(v) => update("site", v)}>
                  <SelectTrigger id="post-site"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SITES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-slug">URL Slug</Label>
                <Input
                  id="post-slug"
                  name="slug"
                  value={f.slug}
                  onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  onBlur={(e) => update("slug", generateSlug(e.target.value))}
                  placeholder="how-to-build-a-safety-fund…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate" translate="no" title={url}>{url}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(url).then(() => toast({ title: "Link copied" }))}
                    aria-label="Copy post URL"
                    className="rounded p-1 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="post-status">Status</Label>
                  <Select value={f.status} onValueChange={(v) => update("status", v as BlogFormData["status"])}>
                    <SelectTrigger id="post-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="post-author">Author</Label>
                  <Input id="post-author" name="author" value={f.author} onChange={(e) => update("author", e.target.value)} autoComplete="name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="post-date">Publish Date</Label>
                <Input id="post-date" type="datetime-local" value={f.publishedAt} onChange={(e) => update("publishedAt", e.target.value)} />
                <p className="text-xs text-muted-foreground">Leave empty to use the moment you publish.</p>
              </div>
            </section>

            <section className="space-y-3 border-b p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cover Image</h2>
              {f.featuredImage ? (
                <div className="group relative overflow-hidden rounded-xl border">
                  <img src={f.featuredImage} alt="Cover preview" width={1200} height={630} className="aspect-[1200/630] w-full object-cover" />
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setPicker("featured")} aria-label="Change cover image">
                      <ImagePlus className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => update("featuredImage", "")} aria-label="Remove cover image">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPicker("featured")}
                  className="flex aspect-[1200/630] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ImagePlus className="h-5 w-5" aria-hidden />
                  Choose From Media Library
                  <span className="text-xs">1200 × 630 works best — also used for link previews</span>
                </button>
              )}
            </section>

            <section className="space-y-4 border-b p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search Preview ({lang.toUpperCase()})</h2>
              <div className="rounded-xl border bg-background p-4">
                <p className="truncate text-xs text-emerald-800" translate="no">{url.replace("https://", "").replace(/\//g, " › ")}</p>
                <p className="mt-1 line-clamp-2 text-[17px] leading-snug text-[#1a0dab]">{metaTitle || "Post title"}</p>
                <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-neutral-600">
                  {metaDesc || "Add an excerpt or a meta description — Google shows about 155 characters."}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="meta-title">Meta Title</Label>
                  <span className={`text-xs tabular-nums ${lenTone(titleLen, 30, 60)}`}>{titleLen}/60</span>
                </div>
                <Input id="meta-title" value={f[`metaTitle${k}`]} onChange={(e) => update(`metaTitle${k}`, e.target.value)} placeholder={title || "Same as the title…"} autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="meta-desc">Meta Description</Label>
                  <span className={`text-xs tabular-nums ${lenTone(descLen, 110, 160)}`}>{descLen}/160</span>
                </div>
                <Textarea
                  id="meta-desc"
                  rows={3}
                  value={f[`metaDescription${k}`]}
                  onChange={(e) => update(`metaDescription${k}`, e.target.value)}
                  placeholder={f[`excerpt${k}`] || "One or two sentences that make people click…"}
                  autoComplete="off"
                />
              </div>
            </section>

            <section className="space-y-3 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Article</h2>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">Words</dt>
                  <dd className="text-lg font-semibold tabular-nums">{new Intl.NumberFormat("hr-HR").format(stats.words)}</dd>
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">Reading Time</dt>
                  <dd className="text-lg font-semibold tabular-nums">{stats.minutes} min</dd>
                </div>
              </dl>
              {stats.outline.length > 0 ? (
                <nav aria-label="Outline" className="space-y-0.5">
                  {stats.outline.map((h, i) => (
                    <button
                      key={`${h.id}-${i}`}
                      type="button"
                      onClick={() => {
                        if (view === "write") setView("split");
                        requestAnimationFrame(() =>
                          previewScroll.current?.querySelector(`#${CSS.escape(h.id)}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                        );
                      }}
                      className={`block w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        h.depth === 3 ? "pl-5 text-muted-foreground" : "font-medium"
                      }`}
                    >
                      {h.text}
                    </button>
                  ))}
                </nav>
              ) : (
                <p className="text-xs text-muted-foreground">Use ## headings to give the article structure — they become the table of contents.</p>
              )}
              <ul className="space-y-1 pt-2 text-xs" aria-label="Checklist">
                {[
                  { ok: !!title.trim(), t: "Title" },
                  { ok: !!f[`excerpt${k}`].trim(), t: "Excerpt" },
                  { ok: !!f.featuredImage, t: "Cover image" },
                  { ok: stats.outline.length >= 2, t: "At least 2 headings" },
                  { ok: descLen >= 110 && descLen <= 160, t: "Meta description 110–160 characters" },
                  { ok: stats.words >= 600, t: "600+ words (better for search)" },
                ].map((c) => (
                  <li key={c.t} className={`flex items-center gap-2 ${c.ok ? "text-emerald-700" : "text-muted-foreground"}`}>
                    {c.ok ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
                    {c.t}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <MediaPickerDialog
          open={picker !== null}
          onOpenChange={(o) => !o && setPicker(null)}
          acceptTypes={["image/"]}
          title={picker === "inline" ? "Insert Image" : "Choose Cover Image"}
          onPick={(file) => {
            if (picker === "featured") update("featuredImage", file.url);
            else editor.current?.insert(`![${file.altEn || file.originalName || ""}](${file.url})`);
            setPicker(null);
          }}
        />
      </div>
    </TooltipProvider>
  );
}
