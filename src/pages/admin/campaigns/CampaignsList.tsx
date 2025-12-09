// src/pages/admin/campaigns/CampaignsList.tsx
import { useEffect, useState } from "react";
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

import CampaignDialog from "@/components/CampaignDialog";
import TemplateDialog from "@/components/TemplateDialog";
import { useToast } from "@/hooks/use-toast";

type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";

type Campaign = {
  id: number;
  name: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledFor?: string | null;
  sentAt?: string | null;
};

// lokalni tip za template (kompatibilan s TemplateDialog propsima)
type EmailTemplate = {
  id?: number;
  name: string;
  subject: string;
  htmlBody: string;
  isActive?: boolean;
  updatedAt: string;
};

export default function CampaignsList() {
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );

  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("fs_auth_token");

  // Badge styling
  const getStatusBadge = (status: CampaignStatus) => {
    const variants: Record<
      CampaignStatus,
      "default" | "secondary" | "outline"
    > = {
      sent: "default",
      scheduled: "secondary",
      draft: "outline",
      sending: "secondary",
      cancelled: "outline",
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  // -----------------------------------------------------------------------------
  // FETCH DATA
  // -----------------------------------------------------------------------------
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

  // -----------------------------------------------------------------------------
  // SAVE HANDLERS
  // -----------------------------------------------------------------------------

  const handleSaveCampaign = async (payload: any) => {
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

  const handleSaveTemplate = async (payload: EmailTemplate) => {
    if (!token) return;

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // šalje name + subject + htmlBody (+ opcionalni id, isActive)
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

  // -----------------------------------------------------------------------------
  // SEND CAMPAIGN
  // -----------------------------------------------------------------------------
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

  // -----------------------------------------------------------------------------
  // UI
  // -----------------------------------------------------------------------------

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
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Campaigns
          </TabsTrigger>

          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Templates
          </TabsTrigger>
        </TabsList>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end gap-2">
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
                          {c.sentCount > 0 ? (
                            <>
                              <span className="text-success">{c.sentCount}</span>
                              {c.failedCount > 0 && (
                                <span className="text-destructive">
                                  {" "}
                                  / {c.failedCount}
                                </span>
                              )}
                            </>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{c.sentAt || c.scheduledFor || "-"}</TableCell>

                        <TableCell className="text-right space-x-2">
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

                          {(c.status === "draft" || c.status === "scheduled") && (
                            <Button
                              variant="outline"
                              size="sm"
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

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={fetchTemplates}>
              Refresh
            </Button>
            <Button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {loadingTemplates && <p>Loading templates...</p>}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No templates yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.name}</TableCell>
                        <TableCell>{t.subject}</TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CampaignDialog
        open={campaignDialogOpen}
        onOpenChange={setCampaignDialogOpen}
        campaign={editingCampaign}
        onSave={handleSaveCampaign}
      />

      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
