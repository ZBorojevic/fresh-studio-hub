// /var/www/fresh-studio-hub/src/pages/admin/leads/LeadsList.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Upload, Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { NICHES } from "@/constants/niches";
import { useIsMobile } from "@/hooks/use-mobile";

type Lead = {
  id: number;
  companyName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  tel: string | null;
  city: string | null;
  niche: string | null;
  service: string | null;
  isQualified: boolean;
  contacted: boolean;
  contactAttempts: number;
  isClient: boolean;
  isDropped: boolean;
};

type LeadsResponse = {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildCompactPages(
  current: number,
  totalPages: number,
  siblingCount = 1
) {
  const pages: (number | "…")[] = [];

  if (totalPages <= 1) return [1];

  const totalNumbers = siblingCount * 2 + 3;
  const totalBlocks = totalNumbers + 2;

  if (totalPages <= totalBlocks) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  const leftSibling = Math.max(current - siblingCount, 2);
  const rightSibling = Math.min(current + siblingCount, totalPages - 1);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  pages.push(1);

  if (!showLeftDots && showRightDots) {
    const leftRangeEnd = 1 + (siblingCount * 2 + 2);
    for (let i = 2; i <= leftRangeEnd; i++) pages.push(i);
    pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  if (showLeftDots && !showRightDots) {
    pages.push("…");
    const rightRangeStart = totalPages - (siblingCount * 2 + 1);
    for (let i = rightRangeStart; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  if (showLeftDots && showRightDots) {
    pages.push("…");
    for (let i = leftSibling; i <= rightSibling; i++) pages.push(i);
    pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return pages;
}

export default function LeadsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [qualifiedFilter, setQualifiedFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);

  const [jump, setJump] = useState("");

  const pageSize = isMobile ? 20 : 10;

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          search: searchQuery,
          city: cityFilter,
          status: qualifiedFilter === "all" ? "all" : qualifiedFilter,
          niche: nicheFilter,
          page: String(page),
          pageSize: String(pageSize),
        });

        const token = localStorage.getItem("fs_auth_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await apiFetch(`/leads?${params.toString()}`);
        if (res.status === 401) {
          localStorage.removeItem("fs_auth_token");
          navigate("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch leads");
        }

        const data = (await res.json()) as LeadsResponse;
        setLeads(data.items);
        setTotal(data.total);

        const totalPagesNow = Math.max(
          1,
          Math.ceil((data.total ?? 0) / pageSize)
        );
        if (page > totalPagesNow) setPage(totalPagesNow);
      } catch (err) {
        console.error(err);
        toast({
          title: "Greška",
          description: "Nije moguće učitati leadove.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [searchQuery, cityFilter, qualifiedFilter, nicheFilter, page, pageSize, toast, navigate]);

  const handleImportCSV = () => {
    toast({
      title: "CSV Import",
      description: "CSV import functionality will open here",
    });
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const changePage = (next: number) => {
    const n = clamp(next, 1, totalPages);
    setPage(n);
  };

  const pageButtons = useMemo(() => {
    return buildCompactPages(page, totalPages, 1);
  }, [page, totalPages]);

  const statusBadge = (lead: Lead) => {
    if (lead.isClient) {
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] px-1.5 py-0">
          Client
        </Badge>
      );
    }
    if (lead.isDropped) {
      return (
        <Badge className="bg-red-600 text-white hover:bg-red-600 text-[10px] px-1.5 py-0">
          Dropped
        </Badge>
      );
    }
    if (lead.isQualified) {
      return (
        <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-[10px] px-1.5 py-0">
          Qualified
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-200 text-slate-900 hover:bg-slate-200 text-[10px] px-1.5 py-0">
        New
      </Badge>
    );
  };

  const statusCell = (lead: Lead) => {
    if (lead.isClient) {
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
          Client
        </Badge>
      );
    }

    if (lead.isDropped) {
      return (
        <Badge className="bg-red-600 text-white hover:bg-red-600">
          Dropped
        </Badge>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {lead.isQualified ? (
          <Badge className="bg-blue-600 text-white hover:bg-blue-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Qualified
          </Badge>
        ) : (
          <Badge className="bg-slate-200 text-slate-900 hover:bg-slate-200">
            <XCircle className="mr-1 h-3 w-3" />
            Unqualified
          </Badge>
        )}

        {lead.contacted && (
          <Badge variant="outline" className="border-slate-300 text-slate-700">
            Contacted
          </Badge>
        )}
      </div>
    );
  };

  const handleJump = () => {
    const n = Number(jump);
    if (!Number.isFinite(n)) return;
    changePage(n);
  };

  /* ======================================================================== */
  /* FILTERS (shared)                                                          */
  /* ======================================================================== */
  const FiltersRow = () => (
    <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-col md:flex-row"}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => {
            setPage(1);
            setSearchQuery(e.target.value);
          }}
          className="pl-9"
        />
      </div>

      <div className={`flex gap-2 ${isMobile ? "overflow-x-auto" : ""}`}>
        <Select
          value={cityFilter}
          onValueChange={(val) => {
            setPage(1);
            setCityFilter(val);
          }}
        >
          <SelectTrigger className={isMobile ? "w-[130px] shrink-0" : "w-[180px]"}>
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            <SelectItem value="Zagreb">Zagreb</SelectItem>
            <SelectItem value="Split">Split</SelectItem>
            <SelectItem value="Rijeka">Rijeka</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={qualifiedFilter}
          onValueChange={(val) => {
            setPage(1);
            setQualifiedFilter(val);
          }}
        >
          <SelectTrigger className={isMobile ? "w-[130px] shrink-0" : "w-[180px]"}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="unqualified">Unqualified</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={nicheFilter}
          onValueChange={(val) => {
            setPage(1);
            setNicheFilter(val);
          }}
        >
          <SelectTrigger className={isMobile ? "w-[150px] shrink-0" : "w-[220px]"}>
            <SelectValue placeholder="Niche" />
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
    </div>
  );

  /* ======================================================================== */
  /* PAGINATION (shared)                                                       */
  /* ======================================================================== */
  const Pagination = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground">
      <span>
        Page {page}/{totalPages} · {total} leads
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => changePage(page - 1)}
        >
          Prev
        </Button>

        {!isMobile && (
          <div className="flex items-center gap-1">
            {pageButtons.map((p, idx) =>
              p === "…" ? (
                <span key={`dots-${idx}`} className="px-2 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => changePage(p)}
                >
                  {p}
                </Button>
              )
            )}
          </div>
        )}

        {isMobile && (
          <span className="text-xs font-medium">{page}/{totalPages}</span>
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => changePage(page + 1)}
        >
          Next
        </Button>

        {!isMobile && (
          <div className="flex items-center gap-2 ml-2">
            <span className="hidden sm:inline">Go to</span>
            <Input
              value={jump}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "");
                setJump(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleJump();
              }}
              placeholder="#"
              className="h-9 w-[80px]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleJump}
              disabled={!jump}
            >
              Go
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  /* ======================================================================== */
  /* MOBILE LAYOUT                                                             */
  /* ======================================================================== */
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
            <p className="text-xs text-muted-foreground">{total} leads</p>
          </div>
          <Button size="sm" onClick={() => navigate("/admin/leads/new")}>
            <Plus className="mr-1 h-4 w-4" />
            New
          </Button>
        </div>

        <FiltersRow />

        {loading && <p className="text-sm text-muted-foreground py-4">Loading…</p>}

        <div className="space-y-2">
          {leads.map((lead) => (
            <Card
              key={lead.id}
              className={`active:bg-accent/50 transition-colors ${
                lead.isDropped ? "border-destructive/30" : ""
              }`}
              onClick={() => navigate(`/admin/leads/${lead.id}`)}
            >
              <CardContent className="pt-3 pb-2.5 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {lead.companyName || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {`${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "No contact"}
                    </p>
                  </div>
                  {statusBadge(lead)}
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>{lead.city || "—"}{lead.niche ? ` · ${lead.niche}` : ""}</span>
                  {lead.contacted && <span>Contacted ×{lead.contactAttempts}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && leads.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No leads found.</p>
        )}

        <Pagination />
      </div>
    );
  }

  /* ======================================================================== */
  /* DESKTOP LAYOUT                                                            */
  /* ======================================================================== */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage your customer leads and CRM data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportCSV}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={() => navigate("/admin/leads/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <FiltersRow />

          <div className="overflow-auto rounded-md border">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className={lead.isDropped ? "bg-destructive/5" : ""}
                    >
                      <TableCell className="font-medium">
                        {lead.companyName}
                      </TableCell>
                      <TableCell>
                        {`${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim()}
                      </TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.city}</TableCell>
                      <TableCell>{lead.niche}</TableCell>
                      <TableCell>{lead.service}</TableCell>
                      <TableCell>{statusCell(lead)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/leads/${lead.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!loading && leads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        No leads found.
                      </TableCell>
                    </TableRow>
                  )}

                  {loading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        Loading…
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Pagination />
        </CardContent>
      </Card>
    </div>
  );
}