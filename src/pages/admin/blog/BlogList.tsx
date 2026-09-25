// /var/www/fresh-studio-hub/src/pages/admin/blog/BlogList.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";

type BlogPost = {
  id: number;
  slug: string;
  status: "draft" | "published";
  site: string;
  titleHr: string | null;
  titleEn: string | null;
  excerptHr: string | null;
  excerptEn: string | null;
  publishedAt: string | null;
  updatedAt: string;
  author: string | null;
};

type BlogListResponse = { items: BlogPost[]; total: number };

const SITE_LABELS: Record<string, string> = {
  freshstudio: "freshstudio.hr",
  pace: "pace.freshstudio.hr",
};

export default function BlogList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search: searchQuery, status: statusFilter, site: siteFilter });
      const res = await apiFetch(`/blog?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = (await res.json()) as BlogListResponse;
      setPosts(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not load blog posts.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [searchQuery, statusFilter, siteFilter]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await apiFetch(`/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Post deleted" });
      fetchPosts();
    } catch { toast({ title: "Error", description: "Could not delete.", variant: "destructive" }); }
  };

  const langBadges = (post: BlogPost) => {
    const langs: string[] = [];
    if (post.titleHr) langs.push("HR");
    if (post.titleEn) langs.push("EN");
    return langs;
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const siteBadge = (site: string) => (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
      {SITE_LABELS[site] || site}
    </Badge>
  );

  /* ======================================================================== */
  /* MOBILE                                                                    */
  /* ======================================================================== */
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
            <p className="text-xs text-muted-foreground">{total} posts</p>
          </div>
          <Button size="sm" onClick={() => navigate("/admin/blog/new")}><Plus className="mr-1 h-4 w-4" />New</Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              <SelectItem value="freshstudio">Fresh</SelectItem>
              <SelectItem value="pace">Pace</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="active:bg-accent/50" onClick={() => navigate(`/admin/blog/${post.id}`)}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{post.titleHr || post.titleEn || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{post.slug}</p>
                  </div>
                  <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-[10px] shrink-0">{post.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {siteBadge(post.site)}
                    {langBadges(post).map((lang) => (
                      <Badge key={lang} variant="outline" className="text-[10px] px-1.5 py-0">
                        <Globe className="h-2.5 w-2.5 mr-0.5" />{lang}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDate(post.publishedAt || post.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && posts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No blog posts yet.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/admin/blog/new")}>Create first post</Button>
          </div>
        )}
      </div>
    );
  }

  /* ======================================================================== */
  /* DESKTOP                                                                   */
  /* ======================================================================== */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">Multi-site bilingual blog · {total} posts</p>
        </div>
        <Button onClick={() => navigate("/admin/blog/new")}><Plus className="mr-2 h-4 w-4" />New Post</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by site" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                <SelectItem value="freshstudio">freshstudio.hr</SelectItem>
                <SelectItem value="pace">pace.freshstudio.hr</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Languages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div><p className="font-medium">{post.titleHr || post.titleEn || "Untitled"}</p>
                    <p className="text-sm text-muted-foreground">{post.slug}</p></div>
                  </TableCell>
                  <TableCell>{siteBadge(post.site)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {langBadges(post).map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" />{lang}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={post.status === "published" ? "default" : "secondary"}>{post.status}</Badge></TableCell>
                  <TableCell>{formatDate(post.publishedAt || post.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/blog/${post.id}`)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && posts.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8">No posts found.</TableCell></TableRow>
              )}
              {loading && <TableRow><TableCell colSpan={6} className="text-center py-8">Loading…</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}