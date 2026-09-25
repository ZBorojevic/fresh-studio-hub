// /var/www/fresh-studio-hub/src/pages/admin/racuni/RacuniList.tsx
//
// Popis računa. Zamjenjuje lokalnu aplikaciju koja je radila samo na jednom
// Macu; podaci su sada u bazi, pa se račun može napisati i s telefona.
//
// Na mobitelu tablica postaje popis kartica: račun ima osam stupaca i na 390px
// bi se ili prelio ili se svaki podatak sveo na tri znaka. Iznos i broj računa
// su ono što se traži pogledom, pa oni ostaju veliki.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  FileText,
  Plus,
  Search,
  Send,
  ShoppingCart,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiFetch } from "@/lib/api";

type Racun = {
  id: string;
  year: number;
  seq: number;
  unit: string;
  operator: string;
  issueDate: string | null;
  dueDate: string | null;
  client: { name?: string; oib?: string | null };
  total: number;
  currency: string;
  status: string;
  source: string;
  sentTo: string | null;
  itemCount?: number;
  needsReview?: boolean;
};

const eur = (n: number, currency = "EUR") =>
  new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: currency === "HRK" ? "HRK" : "EUR",
    minimumFractionDigits: 2,
  }).format(n || 0);

const datum = (iso: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}.`;
};

const broj = (r: Racun) => `${String(r.seq).padStart(2, "0")}-${r.unit}-${r.operator}`;

export default function RacuniList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [racuni, setRacuni] = useState<Racun[]>([]);
  const [loading, setLoading] = useState(true);
  const [upit, setUpit] = useState("");
  const [godina, setGodina] = useState("sve");
  const [izvor, setIzvor] = useState("sve");

  useEffect(() => {
    const dohvati = async () => {
      try {
        setLoading(true);
        const r = await apiFetch("/racuni/bootstrap");
        if (!r.ok) throw new Error("Popis se nije učitao.");
        const d = await r.json();
        setRacuni(d.invoices ?? []);
      } catch (e) {
        toast({
          title: "Greška",
          description: e instanceof Error ? e.message : "Nepoznata greška.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void dohvati();
  }, [toast]);

  const godine = useMemo(
    () => [...new Set(racuni.map((r) => r.year))].sort((a, b) => b - a),
    [racuni]
  );

  const vidljivi = useMemo(() => {
    const q = upit.trim().toLowerCase();

    return racuni.filter((r) => {
      if (godina !== "sve" && String(r.year) !== godina) return false;
      if (izvor !== "sve" && r.source !== izvor) return false;
      if (!q) return true;

      return (
        (r.client?.name ?? "").toLowerCase().includes(q) ||
        (r.client?.oib ?? "").includes(q) ||
        broj(r).includes(q) ||
        r.id.includes(q)
      );
    });
  }, [racuni, upit, godina, izvor]);

  // Zbroj je zbroj onoga što se vidi, ne cijele godine — inače filtar laže.
  const zbroj = useMemo(
    () => vidljivi.reduce((s, r) => s + (r.currency === "HRK" ? 0 : Number(r.total) || 0), 0),
    [vidljivi]
  );

  const otvoriPdf = (r: Racun, preuzmi = false) => {
    const token = localStorage.getItem("fs_auth_token");
    // PDF ide kroz novi tab; token u adresi ne stavljamo, pa se otvara preko fetcha.
    void (async () => {
      const odgovor = await apiFetch(`/racuni/${r.id}/pdf${preuzmi ? "?download=1" : ""}`);

      if (!odgovor.ok) {
        toast({ title: "PDF se nije otvorio", variant: "destructive" });
        return;
      }

      const blob = await odgovor.blob();
      const url = URL.createObjectURL(blob);

      if (preuzmi) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice ${String(r.seq).padStart(2, "0")}-${r.year}.pdf`;
        a.click();
      } else {
        window.open(url, "_blank");
      }

      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    })();
    void token;
  };

  const oznakaIzvora = (r: Racun) =>
    r.source === "sidrena" ? (
      <Badge variant="secondary" className="gap-1">
        <ShoppingCart className="h-3 w-3" aria-hidden="true" />
        Sidrena
      </Badge>
    ) : null;

  const oznakaStatusa = (r: Racun) =>
    r.status === "paid" ? (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">plaćeno</Badge>
    ) : (
      <Badge variant="outline">izdano</Badge>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Računi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Učitavam…"
              : `${vidljivi.length} ${vidljivi.length === 1 ? "račun" : "računa"} · ${eur(zbroj)}`}
          </p>
        </div>

        <Button onClick={() => navigate("/admin/racuni/novi")} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novi račun
        </Button>
      </div>

      <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Pretraga računa"
            className="pl-9"
            onChange={(e) => setUpit(e.target.value)}
            placeholder="Kupac, OIB ili broj računa"
            value={upit}
          />
        </div>

        <div className={`flex gap-2 ${isMobile ? "overflow-x-auto pb-1" : ""}`}>
          <Select onValueChange={setGodina} value={godina}>
            <SelectTrigger className={isMobile ? "w-[120px] shrink-0" : "w-[140px]"}>
              <SelectValue placeholder="Godina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sve">Sve godine</SelectItem>
              {godine.map((g) => (
                <SelectItem key={g} value={String(g)}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setIzvor} value={izvor}>
            <SelectTrigger className={isMobile ? "w-[140px] shrink-0" : "w-[160px]"}>
              <SelectValue placeholder="Izvor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sve">Svi izvori</SelectItem>
              <SelectItem value="rucno">Ručno</SelectItem>
              <SelectItem value="sidrena">Sidrena</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!loading && vidljivi.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nema računa po ovim uvjetima.
          </CardContent>
        </Card>
      )}

      {/* Mobitel: kartice. Osam stupaca na 390px nije tablica nego zagonetka. */}
      {isMobile ? (
        <div className="space-y-3">
          {vidljivi.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.client?.name ?? "—"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {broj(r)} · {datum(r.issueDate)}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-base font-semibold">
                    {eur(r.total, r.currency)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {oznakaStatusa(r)}
                  {oznakaIzvora(r)}
                  {r.needsReview && <Badge variant="destructive">provjeri</Badge>}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => navigate(`/admin/racuni/${r.id}`)}
                    size="sm"
                    variant="secondary"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Otvori
                  </Button>
                  <Button
                    aria-label={`Preuzmi PDF računa ${broj(r)}`}
                    onClick={() => otvoriPdf(r, true)}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Broj</TableHead>
                    <TableHead>Kupac</TableHead>
                    <TableHead className="w-[110px]">Izdan</TableHead>
                    <TableHead className="w-[110px]">Dospijeće</TableHead>
                    <TableHead className="w-[130px] text-right">Iznos</TableHead>
                    <TableHead className="w-[170px]">Stanje</TableHead>
                    <TableHead className="w-[130px] text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vidljivi.map((r) => (
                    <TableRow
                      className="cursor-pointer"
                      key={r.id}
                      onClick={() => navigate(`/admin/racuni/${r.id}`)}
                    >
                      <TableCell className="font-mono text-xs">{broj(r)}</TableCell>
                      <TableCell>
                        <span className="font-medium">{r.client?.name ?? "—"}</span>
                        {r.client?.oib && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            OIB {r.client.oib}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{datum(r.issueDate)}</TableCell>
                      <TableCell className="text-sm">{datum(r.dueDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {eur(r.total, r.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {oznakaStatusa(r)}
                          {oznakaIzvora(r)}
                          {r.sentTo && (
                            <Send
                              aria-label={`Poslano na ${r.sentTo}`}
                              className="h-3.5 w-3.5 text-muted-foreground"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          aria-label={`Otvori PDF računa ${broj(r)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            otvoriPdf(r);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          <FileText className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          aria-label={`Preuzmi PDF računa ${broj(r)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            otvoriPdf(r, true);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
