import { useState } from "react";
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

const mockLeads = [
  {
    id: 1,
    companyName: "Tech Solutions Ltd",
    firstName: "Ivan",
    lastName: "Horvat",
    email: "ivan@techsolutions.com",
    tel: "+385 91 234 5678",
    city: "Zagreb",
    niche: "IT Services",
    service: "Web Development",
    isQualified: true,
    contacted: false,
  },
  {
    id: 2,
    companyName: "Digital Marketing Co",
    firstName: "Ana",
    lastName: "Kovač",
    email: "ana@digitalmark.hr",
    tel: "+385 92 345 6789",
    city: "Split",
    niche: "Marketing",
    service: "SEO",
    isQualified: true,
    contacted: true,
  },
  {
    id: 3,
    companyName: "Creative Agency",
    firstName: "Marko",
    lastName: "Petrović",
    email: "marko@creative.com",
    tel: "+385 98 456 7890",
    city: "Rijeka",
    niche: "Design",
    service: "Branding",
    isQualified: false,
    contacted: false,
  },
];

export default function LeadsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [qualifiedFilter, setQualifiedFilter] = useState("all");

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch = 
      lead.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = cityFilter === "all" || lead.city === cityFilter;
    const matchesQualified = 
      qualifiedFilter === "all" || 
      (qualifiedFilter === "qualified" && lead.isQualified) ||
      (qualifiedFilter === "unqualified" && !lead.isQualified);
    
    return matchesSearch && matchesCity && matchesQualified;
  });

  const handleImportCSV = () => {
    toast({
      title: "CSV Import",
      description: "CSV import functionality will open here",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage your customer leads and CRM data</p>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
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
            <Select value={qualifiedFilter} onValueChange={setQualifiedFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="unqualified">Unqualified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.companyName}</TableCell>
                    <TableCell>{`${lead.firstName} ${lead.lastName}`}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.city}</TableCell>
                    <TableCell>{lead.service}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {lead.isQualified ? (
                          <Badge variant="default" className="bg-success">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Qualified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="mr-1 h-3 w-3" />
                            Unqualified
                          </Badge>
                        )}
                        {lead.contacted && (
                          <Badge variant="outline">Contacted</Badge>
                        )}
                      </div>
                    </TableCell>
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
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
