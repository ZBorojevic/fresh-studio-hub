import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText, Mail, Pencil } from "lucide-react";

import CampaignDialog, {
  CampaignForm,
  CampaignStatus,
  TemplateOption,
} from "@/components/CampaignDialog";
import TemplateDialog, { TemplateForm } from "@/components/TemplateDialog";
import { useToast } from "@/hooks/use-toast";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Campaign = {
  id: number;
  name: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;

  templateId: number | null;

  segmentCity: string;
  segmentStatus: "all" | "qualified" | "unqualified";
  segmentNiche: string;
  segmentContactAttempt: number | null;

  scheduledFor?: string | null;
  sentAt?: string | null;
};

type EmailTemplate = TemplateForm & {
  id: number;
  updatedAt: string;
  niche?: string | null;
};

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function CampaignsList() {
  const { toast } = useToast();
  const token = localStorage.getItem("fs_auth_token");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingTemplate, setEditingTemplate] =
    useState<EmailTemplate | null>(null);

  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -------------------------------------------------------------------------- */
  /* HELPERS                                                                    */
  /* -------------------------------------------------------------------------- */

  const getStatusBadge = (status: CampaignStatus) => {
    const variants: Record<
      CampaignStatus,
      "default" | "secondary" | "outline"
    > = {
      sent: "default",
      scheduled: "secondary",
      draft: "outline",
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  return new Intl.DateTimeFormat("hr-HR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

  /* -------------------------------------------------------------------------- */
  /* FETCH DATA                                                                 */
  /* -------------------------------------------------------------------------- */

  const fetchCampaigns = async () => {
    if (!token) return;
    setLoadingCampaigns(true);

    try {
      const res = await fetch("/api/campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to fetch campaigns");

      setCampaigns(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchTemplates = async () => {
    if (!token) return;
    setLoadingTemplates(true);

    try {
      const res = await fetch("/api/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to fetch templates");

      setTemplates(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Nema aktivne prijave.");
      return;
    }
    fetchCampaigns();
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------------- */
  /* TEMPLATE OPTIONS                                                           */
  /* -------------------------------------------------------------------------- */

  const templateOptions: TemplateOption[] = useMemo(() => {
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      niche: t.niche ?? null,
    }));
  }, [templates]);

  /* -------------------------------------------------------------------------- */
  /* SAVE HANDLERS                                                              */
  /* -------------------------------------------------------------------------- */

  const handleSaveCampaign = async (payload: CampaignForm) => {
    if (!token) return;

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to save campaign");

      toast({
        title: payload.id ? "Campaign updated" : "Campaign created",
      });

      setCampaignDialogOpen(false);
      setEditingCampaign(null);
      fetchCampaigns();
    } catch (err: any) {
      toast({
        title: "Greška pri spremanju kampanje",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = async (payload: TemplateForm) => {
    if (!token) return;

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to save template");

      toast({
        title: payload.id ? "Template updated" : "Template created",
      });

      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err: any) {
      toast({
        title: "Greška pri spremanju templatea",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /* SEND CAMPAIGN                                                              */
  /* -------------------------------------------------------------------------- */

  const handleSendNow = async (campaign: Campaign) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/send-now`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send campaign");

      toast({
        title: "Campaign sent",
        description: `Sent: ${data.sentCount}, Failed: ${data.failedCount}`,
      });

      fetchCampaigns();
    } catch (err: any) {
      toast({
        title: "Greška pri slanju kampanje",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /* UI                                                                         */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
        <p className="text-muted-foreground">
          Manage your email marketing campaigns
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Mail className="mr-2 h-4 w-4" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="mr-2 h-4 w-4" /> Templates
          </TabsTrigger>
        </TabsList>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns">
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline" onClick={fetchCampaigns}>
              Refresh
            </Button>
            <Button
              onClick={() => {
                setEditingCampaign(null);
                setCampaignDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> New Campaign
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {loadingCampaigns && <p>Loading campaigns...</p>}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Sent / Failed</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No campaigns yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell>{c.totalRecipients}</TableCell>
                        <TableCell>
                          {c.sentCount || "-"} / {c.failedCount || "-"}
                        </TableCell>
                        <TableCell>{formatDateTime(c.sentAt ?? c.scheduledFor)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCampaign(c);
                              setCampaignDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {(c.status === "draft" ||
                            c.status === "scheduled") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendNow(c)}
                            >
                              Send now
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates">
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline" onClick={fetchTemplates}>
              Refresh
            </Button>
            <Button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> New Template
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.subject}</TableCell>
                      <TableCell>{t.niche || "-"}</TableCell>
                      <TableCell>{t.updatedAt}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTemplate(t);
                            setTemplateDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}
      <CampaignDialog
        open={campaignDialogOpen}
        onOpenChange={setCampaignDialogOpen}
        campaign={
          editingCampaign
            ? {
                id: editingCampaign.id,
                name: editingCampaign.name,
                status: editingCampaign.status,
                templateId: editingCampaign.templateId,
                segmentCity: editingCampaign.segmentCity,
                segmentStatus: editingCampaign.segmentStatus,
                segmentNiche: editingCampaign.segmentNiche,
                segmentContactAttempt:
                  editingCampaign.segmentContactAttempt,
                scheduledFor: editingCampaign.scheduledFor || "",
              }
            : null
        }
        templates={templateOptions}
        onSave={handleSaveCampaign}
        onDeleted={fetchCampaigns}
      />

      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onDeleted={fetchTemplates}
      />

    </div>
  );
}
