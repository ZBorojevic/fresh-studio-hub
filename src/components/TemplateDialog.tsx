// src/components/TemplateDialog.tsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NICHES } from "@/constants/niches";
import { apiFetch } from "@/lib/api";

export type TemplateForm = {
  id?: number;
  name: string;
  subject: string;
  htmlBody: string;
  niche?: string | null;
  isActive?: boolean;
};

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateForm | null;
  onSave: (template: TemplateForm) => void;
  onDeleted?: () => void;
}

export default function TemplateDialog({
  open,
  onOpenChange,
  template,
  onSave,
  onDeleted,
}: TemplateDialogProps) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [niche, setNiche] = useState<string | "all">("all");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name ?? "");
      setSubject(template.subject ?? "");
      setHtmlBody(template.htmlBody ?? "");
      setNiche((template.niche as any) ?? "all");
    } else {
      setName("");
      setSubject("");
      setHtmlBody("");
      setNiche("all");
    }
  }, [template, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !htmlBody.trim()) return;

    setSubmitting(true);
    try {
      onSave({
        id: template?.id,
        name: name.trim(),
        subject: subject.trim(),
        htmlBody: htmlBody.trim(),
        niche: niche === "all" ? null : niche,
        isActive: template?.isActive ?? true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!template?.id) return;
    if (!window.confirm("Sigurno obrisati ovaj template?")) return;

    try {
      setDeleting(true);

      const res = await apiFetch(`/templates/${template.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to delete template");
      }

      onOpenChange(false);
      onDeleted?.();
    } catch (err: any) {
      console.error("Delete template error:", err);
      alert(err?.message ?? "Greška pri brisanju templatea.");
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (submitting || deleting) return;
    onOpenChange(false);
  };

  const dialogTitle = template ? "Edit Template" : "New Template";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Define email subject i HTML sadržaj. Možeš koristiti placeholdere poput{" "}
            <code>{"{{firstName}}"}</code>, <code>{"{{companyName}}"}</code>, itd.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={submitting || deleting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-subject">Email Subject</Label>
            <Input
              id="template-subject"
              placeholder="Use {{firstName}}, {{companyName}}, etc."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              disabled={submitting || deleting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-niche">Niche (optional)</Label>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger id="template-niche" disabled={submitting || deleting}>
                <SelectValue placeholder="All niches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Niches</SelectItem>
                {NICHES.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-html">HTML Body</Label>
            <Textarea
              id="template-html"
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={12}
              required
              className="font-mono text-sm"
              disabled={submitting || deleting}
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            {template?.id ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || submitting}
                className="text-sm text-red-600 hover:underline hover:text-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={submitting || deleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || deleting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
