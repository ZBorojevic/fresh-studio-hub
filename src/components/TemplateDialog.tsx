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
}

export default function TemplateDialog({
  open,
  onOpenChange,
  template,
  onSave,
}: TemplateDialogProps) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [niche, setNiche] = useState<string | "all">("all");
  const [submitting, setSubmitting] = useState(false);

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

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
  };

  const dialogTitle = template ? "Edit Template" : "New Template";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Define email subject i HTML sadržaj. Možeš koristiti placeholdere
            poput <code>{"{{firstName}}"}</code>,{" "}
            <code>{"{{companyName}}"}</code>, itd.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="template-subject">Email Subject</Label>
            <Input
              id="template-subject"
              placeholder="Use {{firstName}}, {{companyName}}, etc."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Niche */}
          <div className="space-y-2">
            <Label htmlFor="template-niche">Niche (optional)</Label>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger id="template-niche">
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

          {/* HTML body */}
          <div className="space-y-2">
            <Label htmlFor="template-html">HTML Body</Label>
            <Textarea
              id="template-html"
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={12}
              required
              className="font-mono text-sm"
              placeholder={`<div style="font-family: Arial, sans-serif;">
  <h2>Pozdrav {{firstName}} 👋</h2>
  <p>Ovo je testni email iz Fresh Studio huba.</p>
  <p>Možeš urediti HTML po želji.</p>
</div>`}
            />
            <p className="text-xs text-muted-foreground">
              Savjet: drži HTML jednostavnim (inline stilovi, bez external CSS).
              Placeholderi će se zamijeniti podacima o leadu (npr.{" "}
              <code>{"{{firstName}}"}</code>, <code>{"{{companyName}}"}</code>).
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
