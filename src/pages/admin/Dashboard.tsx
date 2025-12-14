// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Mail, Star, TrendingUp, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

// Types for backend response
type OverviewResponse = {
  totals: {
    totalLeads: number;
    newLeads7d: number;
    qualifiedLeads: number;
    clientsCount: number;
    droppedLeads: number;
  };
  activity: {
    contactedLeads: number;
    avgContactAttempts: number;
  };
  emails: {
    emailsSent30d: number;
    totalEmailsSent: number;
    campaignsLast30d: number;
  };
  recentLeads: {
    id: number;
    companyName: string | null;
    email: string | null;
    city: string | null;
    niche: string | null;
    createdAt: string;
  }[];
  recentClients: {
    id: number;
    companyName: string | null;
    email: string | null;
    city: string | null;
    niche: string | null;
    createdAt: string;
  }[];
  recentPositiveLeads: {
    id: number;
    companyName: string | null;
    email: string | null;
    city: string | null;
    niche: string | null;
    isClient: boolean;
    isQualified: boolean;
    contacted: boolean;
    updatedAt: string;
  }[];
};

export default function Dashboard() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch("/analytics/overview");
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "Failed to load analytics");
        }

        const json = (await res.json()) as OverviewResponse;
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totals = data?.totals;
  const emails = data?.emails;
  const activity = data?.activity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of Fresh Studio hub growth — leads, clients, and campaigns.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* New Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Leads (7 days)
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : totals?.newLeads7d ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total leads: {totals?.totalLeads ?? 0}
            </p>
          </CardContent>
        </Card>

        {/* Qualified Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Qualified Leads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : totals?.qualifiedLeads ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Contacted: {activity?.contactedLeads ?? 0} · Avg attempts:{" "}
              {(activity?.avgContactAttempts ?? 0).toFixed(1)}
            </p>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Star className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : totals?.clientsCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Dropped leads: {totals?.droppedLeads ?? 0}
            </p>
          </CardContent>
        </Card>

        {/* Emails Sent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Sent (30 days)
            </CardTitle>
            <Mail className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : emails?.emailsSent30d ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Campaigns: {emails?.campaignsLast30d ?? 0} · Total emails:{" "}
              {emails?.totalEmailsSent ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Leads</CardTitle>
            <CardDescription>
              The most recent contacts added to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !data && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {!loading && data && data.recentLeads.length === 0 && (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            )}
            <div className="space-y-4">
              {data?.recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {lead.companyName || "Unknown company"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.email || "No email"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.city || "-"}
                      {lead.niche ? ` · ${lead.niche}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Clients</CardTitle>
            <CardDescription>
              Leads that became clients (Client closed)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !data && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {!loading && data && data.recentClients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No clients marked yet.
              </p>
            )}
            <div className="space-y-4">
              {data?.recentClients.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-1">
                      {lead.companyName || "Unknown company"}
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.email || "No email"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.city || "-"}
                      {lead.niche ? ` · ${lead.niche}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Positive Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Positive Activity</CardTitle>
            <CardDescription>
              Leads with the most progress (client or qualified + contacted)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !data && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {!loading && data && data.recentPositiveLeads.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No positive activity yet.
              </p>
            )}
            <div className="space-y-4">
              {data?.recentPositiveLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col border-b pb-3 last:border-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">
                      {lead.companyName || "Unknown company"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.updatedAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lead.email || "No email"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {lead.isClient && (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                        Client
                      </Badge>
                    )}
                    {lead.isQualified && <Badge variant="outline">Qualified</Badge>}
                    {lead.contacted && <Badge variant="outline">Contacted</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
