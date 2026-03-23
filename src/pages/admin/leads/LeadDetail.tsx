// src/pages/admin/leads/LeadDetail.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Mail,
  Phone,
  MapPin,
  Building,
  Trash2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { NICHES } from "@/constants/niches";

type LeadForm = {
  companyName: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  tel: string;
  website: string;
  niche: string;
  city: string;
  service: string;
  isQualified: boolean;
  contacted: boolean;
  notes: string;
  // nova polja
  contactAttempts: number;
  isClient: boolean;
  isDropped: boolean;
};

const EMPTY_FORM: LeadForm = {
  companyName: "",
  firstName: "",
  lastName: "",
  title: "",
  email: "",
  tel: "",
  website: "",
  niche: "",
  city: "",
  service: "",
  isQualified: false,
  contacted: false,
  notes: "",
  contactAttempts: 0,
  isClient: false,
  isDropped: false,
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isNew = !id || id === "new";

  const [formData, setFormData] = useState<LeadForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Fetch postojećeg leada ako nije "new"
  useEffect(() => {
    const fetchLead = async () => {
      if (isNew) {
        setFormData(EMPTY_FORM);
        return;
      }

      try {
        setLoading(true);
        const res = await apiFetch(`/leads/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch lead");
        }
        const data = await res.json();

        setFormData({
          companyName: data.companyName ?? "",
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          title: data.title ?? "",
          email: data.email ?? "",
          tel: data.tel ?? "",
          website: data.website ?? "",
          niche: data.niche ?? "",
          city: data.city ?? "",
          service: data.service ?? "",
          isQualified: !!data.isQualified,
          contacted: !!data.contacted,
          notes: data.notes ?? "",
          contactAttempts: data.contactAttempts ?? 0,
          isClient: !!data.isClient,
          isDropped: !!data.isDropped,
        });
      } catch (err) {
        console.error(err);
        toast({
          title: "Greška",
          description: "Nije moguće učitati lead.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id, isNew, toast]);

    const handleSave = async () => {
    setEmailError(null);
    try {
      setLoading(true);

      const payload = {
        companyName: formData.companyName || null,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        title: formData.title || null,
        email: formData.email || null,
        tel: formData.tel || null,
        website: formData.website || null,
        niche: formData.niche || null,
        city: formData.city || null,
        service: formData.service || null,
        isQualified: formData.isQualified,
        contacted: formData.contacted,
        notes: formData.notes || null,
        contactAttempts: formData.contactAttempts ?? 0,
        isClient: formData.isClient,
        isDropped: formData.isDropped,
      };

      const res = await apiFetch(isNew ? "/leads" : `/leads/${id}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 409 && body?.error?.includes("email")) {
          setEmailError("Lead with this email adress already exists.");
          return;
        }
        throw new Error(body?.error || "Failed to save lead");
      }

      await res.json().catch(() => null);

      toast({
        title: isNew ? "Lead created" : "Lead updated",
        description: "Lead information has been saved successfully.",
      });

      // ✅ uvijek nazad na listu
      navigate("/admin/leads", { replace: true });
    } catch (err) {
      console.error(err);
      toast({
        title: "Greška",
        description: "Spremanje leada nije uspjelo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;

    if (!window.confirm("Sigurno obrisati ovaj lead?")) return;

    try {
      setLoading(true);
      const res = await apiFetch(`/leads/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete lead");
      }

      toast({
        title: "Lead deleted",
        description: "Lead je uspješno obrisan.",
      });

      navigate("/admin/leads");
    } catch (err) {
      console.error(err);
      toast({
        title: "Greška",
        description: "Brisanje leada nije uspjelo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleClient = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isClient: checked,
      // ako postane client → više nije dropped
      isDropped: checked ? false : prev.isDropped,
    }));
  };

  const toggleDropped = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isDropped: checked,
      // ako je dropped → nije client
      isClient: checked ? false : prev.isClient,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/leads")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {formData.companyName || (isNew ? "New Lead" : "Lead Details")}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Create a new lead" : "Lead details"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button
              variant="outline"
              type="button"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button type="button" onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setEmailError(null);
                      }}
                      className={`pl-9 ${emailError ? "border-red-500" : ""}`}
                    />
                  </div>
                  {emailError && (
                    <div className="text-red-600 text-sm mt-1 font-semibold">{emailError}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tel">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tel"
                      value={formData.tel}
                      onChange={(e) =>
                        setFormData({ ...formData, tel: e.target.value })
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="niche">Niche</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={formData.niche}
                      onValueChange={(v) =>
                        setFormData({ ...formData, niche: v })
                      }
                    >
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder="Choose niche" />
                      </SelectTrigger>
                      <SelectContent>
                        {NICHES.map((niche) => (
                          <SelectItem key={niche} value={niche}>
                            {niche}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Input
                    id="service"
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={6}
                placeholder="Add notes about this lead..."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="qualified">Qualified Lead</Label>
                <Switch
                  id="qualified"
                  checked={formData.isQualified}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isQualified: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="contacted">Contacted</Label>
                <Switch
                  id="contacted"
                  checked={formData.contacted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, contacted: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="clientClosed">Client closed</Label>
                <Switch
                  id="clientClosed"
                  checked={formData.isClient}
                  onCheckedChange={toggleClient}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="dropped">Dropped (give up)</Label>
                <Switch
                  id="dropped"
                  checked={formData.isDropped}
                  onCheckedChange={toggleDropped}
                />
              </div>

              <div className="pt-2 text-sm text-muted-foreground flex items-center justify-between">
                <span>Contact attempts</span>
                <Badge variant="outline">
                  {formData.contactAttempts ?? 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={() =>
                  formData.email && window.location.assign(`mailto:${formData.email}`)
                }
                disabled={!formData.email}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source:</span>
                <Badge variant="outline">Contact Form</Badge>
              </div>
              {/* Za sad hard-coded datumi */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated:</span>
                <span>-</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
