// /var/www/fresh-studio-hub/src/pages/admin/blog/BlogEditor.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, Save, Globe } from "lucide-react";
import MediaPickerDialog from "@/components/MediaPickerDialog";

const SITES = [
  { value: "freshstudio", label: "freshstudio.hr" },
  { value: "pace", label: "pace.freshstudio.hr" },
];

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
  slug: "", status: "draft", site: "freshstudio",
  featuredImage: "", author: "",
  titleHr: "", excerptHr: "", contentHr: "", metaTitleHr: "", metaDescriptionHr: "",
  titleEn: "", excerptEn: "", contentEn: "", metaTitleEn: "", metaDescriptionEn: "",
  publishedAt: "",
};

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isNew = !id || id === "new";

  const [formData, setFormData] = useState<BlogFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<"hr" | "en">("hr");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  useEffect(() => {
    if (isNew) {
      setFormData({
        ...EMPTY_FORM,
        author: localStorage.getItem("fs_admin_fullname") || localStorage.getItem("fs_admin_username") || "",
      });
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/blog/${id}`);
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        setFormData({
          slug: data.slug ?? "", status: data.status ?? "draft",
          site: data.site ?? "freshstudio",
          featuredImage: data.featuredImage ?? "", author: data.author ?? "",
          titleHr: data.titleHr ?? "", excerptHr: data.excerptHr ?? "",
          contentHr: data.contentHr ?? "", metaTitleHr: data.metaTitleHr ?? "",
          metaDescriptionHr: data.metaDescriptionHr ?? "",
          titleEn: data.titleEn ?? "", excerptEn: data.excerptEn ?? "",
          contentEn: data.contentEn ?? "", metaTitleEn: data.metaTitleEn ?? "",
          metaDescriptionEn: data.metaDescriptionEn ?? "",
          publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString().slice(0, 16) : "",
        });
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Could not load post.", variant: "destructive" });
      } finally { setLoading(false); }
    };
    load();
  }, [id, isNew, toast]);

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[čć]/g, "c").replace(/[đ]/g, "d").replace(/[š]/g, "s").replace(/[ž]/g, "z")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (lang: "hr" | "en", value: string) => {
    const updates: Partial<BlogFormData> = {};
    if (lang === "hr") {
      updates.titleHr = value;
      if (!formData.metaTitleHr || formData.metaTitleHr === formData.titleHr) updates.metaTitleHr = value;
    } else {
      updates.titleEn = value;
      if (!formData.metaTitleEn || formData.metaTitleEn === formData.titleEn) updates.metaTitleEn = value;
    }
    if (!formData.slug || formData.slug === generateSlug(lang === "hr" ? formData.titleHr : formData.titleEn)) {
      updates.slug = generateSlug(value);
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!formData.titleHr && !formData.titleEn) {
      toast({ title: "Title required", description: "At least one language title is needed.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        slug: formData.slug || generateSlug(formData.titleHr || formData.titleEn),
        status: formData.status, site: formData.site,
        featuredImage: formData.featuredImage || null, author: formData.author || null,
        titleHr: formData.titleHr || null, excerptHr: formData.excerptHr || null,
        contentHr: formData.contentHr || null, metaTitleHr: formData.metaTitleHr || null,
        metaDescriptionHr: formData.metaDescriptionHr || null,
        titleEn: formData.titleEn || null, excerptEn: formData.excerptEn || null,
        contentEn: formData.contentEn || null, metaTitleEn: formData.metaTitleEn || null,
        metaDescriptionEn: formData.metaDescriptionEn || null,
        publishedAt: formData.publishedAt || null,
      };
      const res = await apiFetch(isNew ? "/blog" : `/blog/${id}`, {
        method: isNew ? "POST" : "PUT", body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to save post");
      }
      toast({ title: isNew ? "Post created" : "Post updated" });
      navigate("/admin/blog", { replace: true });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const update = <K extends keyof BlogFormData>(key: K, value: BlogFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Loading…</p></div>;
  }

  /* ======================================================================== */
  /* RENDER HELPERS                                                            */
  /* ======================================================================== */

  const renderLangFields = (lang: "hr" | "en") => {
    const t = lang === "hr";
    const titleKey: keyof BlogFormData = t ? "titleHr" : "titleEn";
    const excerptKey: keyof BlogFormData = t ? "excerptHr" : "excerptEn";
    const contentKey: keyof BlogFormData = t ? "contentHr" : "contentEn";
    const metaTitleKey: keyof BlogFormData = t ? "metaTitleHr" : "metaTitleEn";
    const metaDescKey: keyof BlogFormData = t ? "metaDescriptionHr" : "metaDescriptionEn";

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title ({lang.toUpperCase()})</Label>
          <Input value={formData[titleKey]} onChange={(e) => handleTitleChange(lang, e.target.value)}
            placeholder={t ? "Naslov članka" : "Post title"} />
        </div>
        <div className="space-y-2">
          <Label>Excerpt ({lang.toUpperCase()})</Label>
          <Textarea value={formData[excerptKey]} onChange={(e) => update(excerptKey, e.target.value)}
            placeholder={t ? "Kratki opis..." : "Brief description..."} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Content ({lang.toUpperCase()}) — Markdown</Label>
          <Textarea value={formData[contentKey]} onChange={(e) => update(contentKey, e.target.value)}
            placeholder={t ? "Sadržaj u Markdown formatu..." : "Content in Markdown..."}
            rows={isMobile ? 12 : 18} className="font-mono text-sm" />
        </div>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">SEO ({lang.toUpperCase()})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Meta Title</Label>
              <Input value={formData[metaTitleKey]} onChange={(e) => update(metaTitleKey, e.target.value)}
                placeholder={String(formData[titleKey]) || "Meta title..."} />
              <p className="text-[10px] text-muted-foreground">{String(formData[metaTitleKey]).length}/60</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Meta Description</Label>
              <Textarea value={formData[metaDescKey]} onChange={(e) => update(metaDescKey, e.target.value)}
                placeholder="Meta description..." rows={2} />
              <p className="text-[10px] text-muted-foreground">{String(formData[metaDescKey]).length}/160</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Site</Label>
            <Select value={formData.site} onValueChange={(v) => update("site", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SITES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={formData.slug} onChange={(e) => update("slug", e.target.value)} placeholder="post-url-slug" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v: "draft" | "published") => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Publish Date</Label>
            <Input type="datetime-local" value={formData.publishedAt} onChange={(e) => update("publishedAt", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            <Input value={formData.author} onChange={(e) => update("author", e.target.value)} placeholder="Author name" />
          </div>
          <div className="space-y-2">
            <Label>Featured Image</Label>
            {formData.featuredImage ? (
              <div className="space-y-2">
                <div className="aspect-video bg-muted rounded-md overflow-hidden">
                  <img src={formData.featuredImage} alt="Featured" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" type="button" onClick={() => setMediaPickerOpen(true)}>Change</Button>
                  <Button variant="outline" size="sm" type="button" onClick={() => update("featuredImage", "")}>Remove</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full" type="button" onClick={() => setMediaPickerOpen(true)}>
                <Globe className="mr-2 h-4 w-4" /> Choose from Media Library
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Languages</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Croatian</span>
            <Badge variant={formData.titleHr ? "default" : "outline"} className="text-[10px]">{formData.titleHr ? "Has content" : "Empty"}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> English</span>
            <Badge variant={formData.titleEn ? "default" : "outline"} className="text-[10px]">{formData.titleEn ? "Has content" : "Empty"}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /* ======================================================================== */
  /* MOBILE LAYOUT                                                             */
  /* ======================================================================== */
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/admin/blog")}><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-lg font-bold truncate">{isNew ? "New Post" : "Edit Post"}</h1>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}><Save className="mr-1 h-4 w-4" />{saving ? "…" : "Save"}</Button>
        </div>
        {renderSettings()}
        <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as "hr" | "en")}>
          <TabsList className="w-full">
            <TabsTrigger value="hr" className="flex-1"><Globe className="h-3.5 w-3.5 mr-1" />HR</TabsTrigger>
            <TabsTrigger value="en" className="flex-1"><Globe className="h-3.5 w-3.5 mr-1" />EN</TabsTrigger>
          </TabsList>
          <TabsContent value="hr">{renderLangFields("hr")}</TabsContent>
          <TabsContent value="en">{renderLangFields("en")}</TabsContent>
        </Tabs>
        <MediaPickerDialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}
          acceptTypes={["image/"]} title="Select Featured Image" onPick={(file) => update("featuredImage", file.url)} />
      </div>
    );
  }

  /* ======================================================================== */
  /* DESKTOP LAYOUT                                                            */
  /* ======================================================================== */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/blog")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{isNew ? "New Post" : "Edit Post"}</h1>
            <p className="text-muted-foreground">
              {SITES.find((s) => s.value === formData.site)?.label || formData.site} · HR &amp; EN
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save"}</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as "hr" | "en")}>
            <TabsList>
              <TabsTrigger value="hr"><Globe className="h-3.5 w-3.5 mr-1.5" />Croatian (HR)</TabsTrigger>
              <TabsTrigger value="en"><Globe className="h-3.5 w-3.5 mr-1.5" />English (EN)</TabsTrigger>
            </TabsList>
            <TabsContent value="hr" className="mt-4">{renderLangFields("hr")}</TabsContent>
            <TabsContent value="en" className="mt-4">{renderLangFields("en")}</TabsContent>
          </Tabs>
        </div>
        <div>{renderSettings()}</div>
      </div>
      <MediaPickerDialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}
        acceptTypes={["image/"]} title="Select Featured Image" onPick={(file) => update("featuredImage", file.url)} />
    </div>
  );
}