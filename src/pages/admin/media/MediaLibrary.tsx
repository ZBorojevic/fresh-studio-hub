// /var/www/fresh-studio-hub/src/pages/admin/media/MediaLibrary.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiFetch, apiUpload } from "@/lib/api";
import {
  Upload, Search, Grid3X3, List, Trash2, Copy, Download,
  FolderPlus, FolderOpen, ArrowLeft, Image as ImageIcon,
  FileText, Film, File, Check, Loader2, Globe, Save,
  RefreshCw, Pencil,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type MediaFile = {
  id: number;
  filename: string;
  originalName: string;
  customName: string | null;
  mimeType: string;
  size: number;
  url: string;
  folder: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  altHr: string | null;
  altEn: string | null;
  descriptionHr: string | null;
  descriptionEn: string | null;
  createdAt: string;
};

type MediaListResponse = { items: MediaFile[]; total: number; folders: string[] };

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileIcon = (mime: string) => {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return Film;
  if (mime.startsWith("application/pdf") || mime.startsWith("text/")) return FileText;
  return File;
};

const isImage = (mime: string) => mime.startsWith("image/");
const displayName = (f: MediaFile) => f.customName || f.originalName;

/* -------------------------------------------------------------------------- */
/* PROPS                                                                      */
/* -------------------------------------------------------------------------- */

interface MediaLibraryProps {
  pickerMode?: boolean;
  acceptTypes?: string[];
  onPick?: (file: MediaFile) => void;
  onClose?: () => void;
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function MediaLibrary({ pickerMode = false, acceptTypes, onPick }: MediaLibraryProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Detail dialog
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editAltHr, setEditAltHr] = useState("");
  const [editAltEn, setEditAltEn] = useState("");
  const [editDescHr, setEditDescHr] = useState("");
  const [editDescEn, setEditDescEn] = useState("");
  const [editCustomName, setEditCustomName] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [replacing, setReplacing] = useState(false);

  // Rename dialog
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  // New folder dialog
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  /* ======================================================================== */
  /* FETCH                                                                     */
  /* ======================================================================== */

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search: searchQuery, type: typeFilter });
      if (currentFolder !== null) params.set("folder", currentFolder);

      const res = await apiFetch(`/media?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch media");
      const data = (await res.json()) as MediaListResponse;
      setFiles(data.items);
      setTotal(data.total);
      setFolders(data.folders);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not load media files.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, currentFolder, toast]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  /* ======================================================================== */
  /* UPLOAD                                                                    */
  /* ======================================================================== */

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    try {
      setUploading(true);
      const fd = new FormData();
      for (let i = 0; i < fileList.length; i++) fd.append("files", fileList[i]);
      if (currentFolder) fd.append("folder", currentFolder);

      const res = await apiUpload("/media/upload", fd);
      if (!res.ok) { const b = await res.json().catch(() => null); throw new Error(b?.error || "Upload failed"); }
      const data = await res.json();
      toast({ title: "Upload complete", description: `${data.uploaded} file(s) uploaded.` });
      fetchMedia();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ======================================================================== */
  /* DELETE                                                                    */
  /* ======================================================================== */

  const handleDelete = async (file: MediaFile) => {
    if (!window.confirm(`Delete "${displayName(file)}"?`)) return;
    try {
      const res = await apiFetch(`/media/${file.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "File deleted" });
      setDetailOpen(false);
      setSelectedFile(null);
      fetchMedia();
    } catch { toast({ title: "Error", description: "Could not delete file.", variant: "destructive" }); }
  };

  /* ======================================================================== */
  /* SAVE METADATA                                                             */
  /* ======================================================================== */

  const handleSaveMeta = async () => {
    if (!selectedFile) return;
    try {
      setSavingMeta(true);
      const res = await apiFetch(`/media/${selectedFile.id}`, {
        method: "PUT",
        body: JSON.stringify({
          altHr: editAltHr, altEn: editAltEn,
          descriptionHr: editDescHr, descriptionEn: editDescEn,
          customName: editCustomName,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      toast({ title: "Saved" });
      setSelectedFile(updated);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    } catch { toast({ title: "Error", description: "Could not save.", variant: "destructive" }); }
    finally { setSavingMeta(false); }
  };

  /* ======================================================================== */
  /* REPLACE FILE                                                              */
  /* ======================================================================== */

  const handleReplace = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !selectedFile) return;
    try {
      setReplacing(true);
      const fd = new FormData();
      fd.append("file", fileList[0]);
      const res = await apiUpload(`/media/${selectedFile.id}/replace`, fd);
      if (!res.ok) throw new Error("Failed to replace");
      const updated = await res.json();
      toast({ title: "File replaced", description: "URL remains the same." });
      setSelectedFile(updated);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Replace failed.", variant: "destructive" });
    } finally {
      setReplacing(false);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  /* ======================================================================== */
  /* RENAME FILE                                                               */
  /* ======================================================================== */

  const handleRename = async () => {
    if (!selectedFile || !renameValue.trim()) return;
    try {
      setRenaming(true);
      const res = await apiFetch(`/media/${selectedFile.id}/rename`, {
        method: "POST",
        body: JSON.stringify({ newName: renameValue.trim() }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        throw new Error(b?.error || "Rename failed");
      }
      const updated = await res.json();
      toast({ title: "File renamed", description: `New URL: ${updated.url}` });
      setSelectedFile(updated);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setRenameOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" });
    } finally { setRenaming(false); }
  };

  /* ======================================================================== */
  /* COPY URL                                                                  */
  /* ======================================================================== */

  const handleCopyUrl = async (url: string) => {
    try { await navigator.clipboard.writeText(url); } catch {
      const input = document.createElement("input"); input.value = url;
      document.body.appendChild(input); input.select();
      document.execCommand("copy"); document.body.removeChild(input);
    }
    toast({ title: "URL copied" });
  };

  /* ======================================================================== */
  /* CREATE FOLDER                                                             */
  /* ======================================================================== */

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const res = await apiFetch("/media/folders", { method: "POST", body: JSON.stringify({ name, parent: currentFolder }) });
      if (!res.ok) throw new Error("Failed");
      toast({ title: `Folder "${name}" created` });
      setNewFolderOpen(false); setNewFolderName(""); fetchMedia();
    } catch (err: any) { toast({ title: "Error", description: err?.message, variant: "destructive" }); }
  };

  /* ======================================================================== */
  /* OPEN DETAIL                                                               */
  /* ======================================================================== */

  const openDetail = (file: MediaFile) => {
    setSelectedFile(file);
    setEditAltHr(file.altHr || "");
    setEditAltEn(file.altEn || "");
    setEditDescHr(file.descriptionHr || "");
    setEditDescEn(file.descriptionEn || "");
    setEditCustomName(file.customName || "");
    setDetailOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); };

  // The API returns every file when no folder is selected. The root view shows only files
  // that are not in a folder (folders have their own cards); a search still spans all folders.
  const atRoot = currentFolder === null && !searchQuery;
  const scopedFiles = atRoot ? files.filter((f) => !f.folder) : files;
  const visibleFiles = acceptTypes ? scopedFiles.filter((f) => acceptTypes.some((p) => f.mimeType.startsWith(p))) : scopedFiles;
  const folderCount = (name: string) => files.filter((f) => f.folder === name).length;

  /* ======================================================================== */
  /* RENDER: TOOLBAR                                                           */
  /* ======================================================================== */

  const renderToolbar = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {currentFolder !== null && (
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setCurrentFolder(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className={`font-bold tracking-tight truncate ${isMobile ? "text-2xl" : "text-3xl"}`}>
              {pickerMode ? "Select File" : "Media Library"}
            </h1>
            <p className="text-xs text-muted-foreground">{currentFolder ? `/${currentFolder}` : searchQuery ? "All folders" : "Root"} · {visibleFiles.length} items</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!pickerMode && (
            <Button variant="outline" size={isMobile ? "icon" : "default"} onClick={() => setNewFolderOpen(true)}>
              <FolderPlus className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />{!isMobile && "Folder"}
            </Button>
          )}
          <Button size={isMobile ? "sm" : "default"} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
            {isMobile ? "Upload" : "Upload Files"}
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className={isMobile ? "w-[100px]" : "w-[150px]"}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Docs</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {!isMobile && (
          <div className="flex border rounded-md">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-10 w-10 rounded-r-none" onClick={() => setViewMode("grid")}><Grid3X3 className="h-4 w-4" /></Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-10 w-10 rounded-l-none" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );

  /* ======================================================================== */
  /* RENDER: GRID                                                              */
  /* ======================================================================== */

  const renderGrid = () => (
    <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}`}>
      {visibleFiles.map((file) => {
        const Icon = getFileIcon(file.mimeType);
        return (
          <div key={file.id} className="group relative border rounded-lg overflow-hidden bg-card hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
            onClick={() => { if (pickerMode) onPick?.(file); else openDetail(file); }}>
            <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
              {isImage(file.mimeType)
                ? <img src={file.url} alt={file.altHr || file.originalName} className="w-full h-full object-cover" loading="lazy" />
                : <Icon className="h-10 w-10 text-muted-foreground" />}
            </div>
            <div className="p-2">
              <p className="text-xs font-medium truncate">{displayName(file)}</p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                {(file.altHr || file.altEn) && <Badge variant="outline" className="text-[8px] px-1 py-0">ALT</Badge>}
              </div>
            </div>
            {!isMobile && !pickerMode && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(file.url); }} className="h-7 w-7 rounded-md bg-background/90 border flex items-center justify-center hover:bg-background"><Copy className="h-3.5 w-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(file); }} className="h-7 w-7 rounded-md bg-background/90 border flex items-center justify-center hover:bg-destructive hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            )}
            {pickerMode && (
              <div className="absolute top-2 right-2">
                <div className="h-6 w-6 rounded-full bg-primary/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Check className="h-3.5 w-3.5 text-primary-foreground" /></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ======================================================================== */
  /* RENDER: LIST                                                              */
  /* ======================================================================== */

  const renderList = () => (
    <div className="space-y-1">
      {visibleFiles.map((file) => {
        const Icon = getFileIcon(file.mimeType);
        return (
          <div key={file.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer"
            onClick={() => { if (pickerMode) onPick?.(file); else openDetail(file); }}>
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {isImage(file.mimeType) ? <img src={file.url} alt={file.altHr || file.originalName} className="w-full h-full object-cover" loading="lazy" /> : <Icon className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName(file)}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}{file.altHr ? ` · ${file.altHr}` : ""}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 hidden md:block">{new Date(file.createdAt).toLocaleDateString("hr-HR")}</span>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleCopyUrl(file.url); }}><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ======================================================================== */
  /* RENDER: DETAIL DIALOG                                                     */
  /* ======================================================================== */

  const renderDetailDialog = () => {
    if (!selectedFile) return null;
    return (
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{displayName(selectedFile)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            {isImage(selectedFile.mimeType) ? (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img src={selectedFile.url + "?t=" + Date.now()} alt={editAltHr || selectedFile.originalName} className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {(() => { const I = getFileIcon(selectedFile.mimeType); return <I className="h-16 w-16 text-muted-foreground" />; })()}
              </div>
            )}

            {/* File info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground text-xs">Size</span><p className="font-medium">{formatFileSize(selectedFile.size)}</p></div>
              <div><span className="text-muted-foreground text-xs">Type</span><p className="font-medium">{selectedFile.mimeType}</p></div>
              {selectedFile.width && selectedFile.height && (
                <div><span className="text-muted-foreground text-xs">Dimensions</span><p className="font-medium">{selectedFile.width}×{selectedFile.height}</p></div>
              )}
              <div><span className="text-muted-foreground text-xs">Uploaded</span><p className="font-medium">{new Date(selectedFile.createdAt).toLocaleDateString("hr-HR")}</p></div>
            </div>

            {/* URL + actions */}
            <div className="space-y-2">
              <Label className="text-xs">File URL</Label>
              <div className="flex gap-2">
                <Input value={selectedFile.url} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={() => handleCopyUrl(selectedFile.url)}><Copy className="h-4 w-4" /></Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setRenameValue(selectedFile.filename.replace(/\.[^.]+$/, "")); setRenameOpen(true); }}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Rename URL
                </Button>
                <Button variant="outline" size="sm" onClick={() => replaceInputRef.current?.click()} disabled={replacing}>
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${replacing ? "animate-spin" : ""}`} /> Replace File
                </Button>
                <input ref={replaceInputRef} type="file" className="hidden" onChange={(e) => handleReplace(e.target.files)} />
              </div>
            </div>

            {/* Custom display name */}
            <div className="space-y-1">
              <Label className="text-xs">Display Name (optional)</Label>
              <Input value={editCustomName} onChange={(e) => setEditCustomName(e.target.value)} placeholder={selectedFile.originalName} />
            </div>

            {/* Bilingual Alt & Description */}
            <Tabs defaultValue="hr">
              <TabsList className="w-full">
                <TabsTrigger value="hr" className="flex-1"><Globe className="h-3.5 w-3.5 mr-1" /> HR (primary)</TabsTrigger>
                <TabsTrigger value="en" className="flex-1"><Globe className="h-3.5 w-3.5 mr-1" /> EN</TabsTrigger>
              </TabsList>
              <TabsContent value="hr" className="space-y-3 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs">Alt text (HR)</Label>
                  <Input value={editAltHr} onChange={(e) => setEditAltHr(e.target.value)} placeholder="Opisni tekst slike..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description (HR)</Label>
                  <Textarea value={editDescHr} onChange={(e) => setEditDescHr(e.target.value)} placeholder="Detaljniji opis..." rows={3} />
                </div>
              </TabsContent>
              <TabsContent value="en" className="space-y-3 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs">Alt text (EN)</Label>
                  <Input value={editAltEn} onChange={(e) => setEditAltEn(e.target.value)} placeholder="Image alt text..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description (EN)</Label>
                  <Textarea value={editDescEn} onChange={(e) => setEditDescEn(e.target.value)} placeholder="Detailed description..." rows={3} />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-2">
            <button type="button" onClick={() => handleDelete(selectedFile)} className="text-sm text-red-600 hover:underline">Delete</button>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href={selectedFile.url} download={selectedFile.originalName} target="_blank" rel="noopener">
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </Button>
              <Button onClick={handleSaveMeta} disabled={savingMeta}>
                <Save className="mr-2 h-4 w-4" />{savingMeta ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  /* ======================================================================== */
  /* RENDER: RENAME DIALOG                                                     */
  /* ======================================================================== */

  const renderRenameDialog = () => (
    <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader><DialogTitle>Rename File URL</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground">This changes the filename on disk and the URL. Existing references to the old URL will break.</p>
          <div className="space-y-2">
            <Label>New filename (without extension)</Label>
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="my-custom-filename"
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }} />
          </div>
          {selectedFile && (
            <p className="text-xs text-muted-foreground font-mono">
              Preview: /uploads/{renameValue.toLowerCase().replace(/[^a-z0-9._-]/g, "-")}{selectedFile.filename.match(/\.[^.]+$/)?.[0] || ""}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button onClick={handleRename} disabled={renaming || !renameValue.trim()}>
            {renaming ? "Renaming..." : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  /* ======================================================================== */
  /* RENDER: NEW FOLDER DIALOG                                                 */
  /* ======================================================================== */

  const renderNewFolderDialog = () => (
    <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Folder name</Label>
            <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. blog-images"
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  /* ======================================================================== */
  /* MAIN RENDER                                                               */
  /* ======================================================================== */

  return (
    <div className="space-y-4" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />

      {renderToolbar()}
      {folders.length > 0 && currentFolder === null && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {folders.map((f) => (
            <button key={f} onClick={() => setCurrentFolder(f)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border bg-card hover:bg-accent transition-colors shrink-0">
              <FolderOpen className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{f}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{folderCount(f)}</span>
            </button>
          ))}
        </div>
      )}

      {dragOver && (
        <div className="fixed inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-xl flex items-center justify-center pointer-events-none">
          <div className="text-center"><Upload className="h-12 w-12 text-primary mx-auto mb-2" /><p className="text-lg font-medium">Drop files here</p></div>
        </div>
      )}

      {uploading && <Card><CardContent className="pt-4 flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-primary" /><span className="text-sm">Uploading...</span></CardContent></Card>}

      {loading && !files.length ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : visibleFiles.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">{searchQuery || typeFilter !== "all" ? "No files match." : "No files yet."}</p>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
        </div>
      ) : viewMode === "grid" || isMobile ? renderGrid() : renderList()}

      {renderDetailDialog()}
      {renderRenameDialog()}
      {renderNewFolderDialog()}
    </div>
  );
}