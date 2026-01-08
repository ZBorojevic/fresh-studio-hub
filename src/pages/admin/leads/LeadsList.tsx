// src/pages/admin/leads/LeadsList.tsx
import { useState, useEffect } from "react";
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

export default function LeadsList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [qualifiedFilter, setQualifiedFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

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
          // no token → redirect to login
          navigate("/login");
          return;
        }

        const res = await apiFetch(`/leads?${params.toString()}`);
        if (res.status === 401) {
          // token invalid/expired — clear and force login
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
  }, [searchQuery, cityFilter, qualifiedFilter, nicheFilter, page, toast]);

  const handleImportCSV = () => {
    toast({
      title: "CSV Import",
      description: "CSV import functionality will open here",
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const changePage = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
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

  return (
    <div className="space-y-6">
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
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

            {/* City filter */}
            <Select
              value={cityFilter}
              onValueChange={(val) => {
                setPage(1);
                setCityFilter(val);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Zagreb">Zagreb</SelectItem>
                <SelectItem value="Split">Split</SelectItem>
                <SelectItem value="Rijeka">Rijeka</SelectItem>
              </SelectContent>
            </Select>

            {/* Qualified filter */}
            <Select
              value={qualifiedFilter}
              onValueChange={(val) => {
                setPage(1);
                setQualifiedFilter(val);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="unqualified">Unqualified</SelectItem>
              </SelectContent>
            </Select>

            {/* Niche filter */}
            <Select
              value={nicheFilter}
              onValueChange={(val) => {
                setPage(1);
                setNicheFilter(val);
              }}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter by niche" />
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

          <div className="rounded-md border overflow-x-auto">
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
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages} · {total} leads
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => changePage(page - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => changePage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
