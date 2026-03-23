import { useEffect, useMemo, useState } from "react";
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

  const weeklyTarget = 50;
  const newLeads7d = totals?.newLeads7d ?? 0;

  const targetPct = useMemo(() => {
    const pct = (newLeads7d / weeklyTarget) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [newLeads7d]);

  return (
    // ✅ fixed app page, no outer scroll
    <div className="h-full overflow-hidden flex flex-col gap-6">
      {/* Title */}
      <div className="shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of Fresh Studio hub growth — leads, clients, and campaigns.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 shrink-0">
          <CardContent className="pt-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* KPI row (doesn't force page scroll) */}
      <div className="shrink-0 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Leads (this week)
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "…" : newLeads7d}</div>
            <p className="text-xs text-muted-foreground">
              Total leads: {totals?.totalLeads ?? 0}
            </p>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Weekly target</span>
                <span>
                  {newLeads7d}/{weeklyTarget} ({Math.round(targetPct)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${targetPct}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

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

      {/* Bottom section fills remaining height; each card scrolls internally */}
      <div className="flex-1 overflow-hidden grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>Latest Leads</CardTitle>
            <CardDescription>
              The most recent contacts added to the system
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
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
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {lead.companyName || "Unknown company"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.email || "No email"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.city || "-"}
                      {lead.niche ? ` · ${lead.niche}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(lead.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>Latest Clients</CardTitle>
            <CardDescription>
              Leads that became clients (Client closed)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
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
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-1 truncate">
                      {lead.companyName || "Unknown company"}
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.email || "No email"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.city || "-"}
                      {lead.niche ? ` · ${lead.niche}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(lead.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>Positive Activity</CardTitle>
            <CardDescription>
              Leads with the most progress (client or qualified + contacted)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
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
                  <div className="flex items-center justify-between mb-1 gap-3">
                    <p className="text-sm font-medium truncate">
                      {lead.companyName || "Unknown company"}
                    </p>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(lead.updatedAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
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
