import { useState } from "react";
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

const mockCampaigns = [
  {
    id: 1,
    name: "Q1 2024 Outreach",
    status: "sent",
    totalRecipients: 45,
    sentCount: 45,
    failedCount: 0,
    sentAt: "2024-01-10 14:30",
  },
  {
    id: 2,
    name: "New Service Launch",
    status: "scheduled",
    totalRecipients: 32,
    sentCount: 0,
    failedCount: 0,
    scheduledFor: "2024-01-20 10:00",
  },
  {
    id: 3,
    name: "Follow-up Campaign",
    status: "draft",
    totalRecipients: 0,
    sentCount: 0,
    failedCount: 0,
  },
];

const mockTemplates = [
  { id: 1, name: "Welcome Email", subject: "Welcome to Fresh Studio", updatedAt: "2024-01-15" },
  { id: 2, name: "Service Proposal", subject: "Our services for {{companyName}}", updatedAt: "2024-01-12" },
  { id: 3, name: "Follow-up", subject: "Following up on our conversation", updatedAt: "2024-01-10" },
];

export default function CampaignsList() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [templates, setTemplates] = useState(mockTemplates);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      sent: "default",
      scheduled: "secondary",
      draft: "outline",
      sending: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const handleSaveCampaign = (campaign: any) => {
    if (campaign.id) {
      setCampaigns(campaigns.map(c => c.id === campaign.id ? campaign : c));
      toast({ title: "Campaign updated successfully" });
    } else {
      const newCampaign = { ...campaign, id: campaigns.length + 1, sentCount: 0, failedCount: 0 };
      setCampaigns([...campaigns, newCampaign]);
      toast({ title: "Campaign created successfully" });
    }
    setEditingCampaign(null);
  };

  const handleSaveTemplate = (template: any) => {
    if (template.id) {
      setTemplates(templates.map(t => t.id === template.id ? template : t));
      toast({ title: "Template updated successfully" });
    } else {
      const newTemplate = { ...template, id: templates.length + 1, updatedAt: new Date().toISOString().split('T')[0] };
      setTemplates([...templates, newTemplate]);
      toast({ title: "Template created successfully" });
    }
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground">Manage your email marketing campaigns</p>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingCampaign(null); setCampaignDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
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
                  {mockCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>{campaign.totalRecipients}</TableCell>
                      <TableCell>
                        {campaign.sentCount > 0 ? (
                          <span>
                            <span className="text-success">{campaign.sentCount}</span>
                            {campaign.failedCount > 0 && (
                              <span className="text-destructive"> / {campaign.failedCount}</span>
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {campaign.sentAt || campaign.scheduledFor || "Not scheduled"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingCampaign(campaign); setCampaignDialogOpen(true); }}
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

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingTemplate(null); setTemplateDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
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
                  {mockTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.subject}</TableCell>
                      <TableCell>{template.updatedAt}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingTemplate(template); setTemplateDialogOpen(true); }}
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
