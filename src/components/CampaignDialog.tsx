import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NICHES } from "@/constants/niches";

export type CampaignStatus = "draft" | "scheduled" | "sent";

export interface CampaignForm {
  id?: number;
  name: string;
  status: CampaignStatus;
  templateId: number | null;

  segmentCity: string; // "all" ili grad
  segmentStatus: "all" | "qualified" | "unqualified";
  segmentNiche: string; // "all" ili konkretna niša
  segmentContactAttempt: number | null; // null = svi, 0..3 attempt
  scheduledFor?: string; // datetime-local string ili ""
}

export interface TemplateOption {
  id: number;
  name: string;
  subject: string;
  niche?: string | null;
}

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: CampaignForm | null;
  templates: TemplateOption[];
  onSave: (campaign: CampaignForm) => void;
}

const EMPTY_FORM: CampaignForm = {
  name: "",
  status: "draft",
  templateId: null,
  segmentCity: "all",
  segmentStatus: "all",
  segmentNiche: "all",
  segmentContactAttempt: null,
  scheduledFor: "",
};

export default function CampaignDialog({
  open,
  onOpenChange,
  campaign,
  templates,
  onSave,
}: CampaignDialogProps) {
  const [formData, setFormData] = useState<CampaignForm>(EMPTY_FORM);

  useEffect(() => {
    if (campaign) {
      setFormData({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status ?? "draft",
        templateId: campaign.templateId ?? null,
        segmentCity: campaign.segmentCity ?? "all",
        segmentStatus: campaign.segmentStatus ?? "all",
        segmentNiche: campaign.segmentNiche ?? "all",
        segmentContactAttempt:
          campaign.segmentContactAttempt !== undefined
            ? campaign.segmentContactAttempt
            : null,
        scheduledFor: campaign.scheduledFor ?? "",
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [campaign, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.templateId) return;
    onSave({ ...formData, name: formData.name.trim() });
    onOpenChange(false);
  };

  const handleChange = <K extends keyof CampaignForm>(
    key: K,
    value: CampaignForm[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{campaign ? "Edit Campaign" : "New Campaign"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={formData.templateId ? String(formData.templateId) : ""}
              onValueChange={(val) =>
                handleChange("templateId", val ? Number(val) : null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                    {t.niche ? ` · ${t.niche}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status & schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val: CampaignStatus) =>
                  handleChange("status", val)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledFor">Scheduled For</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={formData.scheduledFor || ""}
                onChange={(e) =>
                  handleChange("scheduledFor", e.target.value || "")
                }
              />
            </div>
          </div>

          {/* Segmentation */}
          <div className="grid grid-cols-2 gap-4">
            {/* City */}
            <div className="space-y-2">
              <Label>City</Label>
              <Select
                value={formData.segmentCity}
                onValueChange={(val) => handleChange("segmentCity", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="Zagreb">Zagreb</SelectItem>
                  <SelectItem value="Split">Split</SelectItem>
                  <SelectItem value="Rijeka">Rijeka</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Qualified status */}
            <div className="space-y-2">
              <Label>Lead status</Label>
              <Select
                value={formData.segmentStatus}
                onValueChange={(val: "all" | "qualified" | "unqualified") =>
                  handleChange("segmentStatus", val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="unqualified">Unqualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Niche & contact attempt */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Niche</Label>
              <Select
                value={formData.segmentNiche}
                onValueChange={(val) => handleChange("segmentNiche", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All niches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Niches</SelectItem>
                  {NICHES.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact attempt</Label>
              <Select
                value={
                  formData.segmentContactAttempt !== null &&
                  formData.segmentContactAttempt !== undefined
                    ? String(formData.segmentContactAttempt)
                    : "any"
                }
                onValueChange={(val) => {
                  if (val === "any") handleChange("segmentContactAttempt", null);
                  else handleChange("segmentContactAttempt", Number(val));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All attempts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any (0+)</SelectItem>
                  <SelectItem value="0">0 (initial email)</SelectItem>
                  <SelectItem value="1">1 (first follow-up)</SelectItem>
                  <SelectItem value="2">2 (second follow-up)</SelectItem>
                  <SelectItem value="3">3 (third follow-up)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save campaign</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
