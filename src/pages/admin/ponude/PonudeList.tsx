// /var/www/fresh-studio-hub/src/pages/admin/ponude/PonudeList.tsx
//
// Popis ponuda. Isti kalup kao računi, jer idu istom kupcu i izgledaju isto —
// ali odvojeno, jer ponuda nije račun: može se mijenjati, može isteći i nikoga
// ne obvezuje dok je kupac ne prihvati.
//
// Zato je filtar po **statusu**, a ne po izvoru kao kod računa: ponudu uvijek
// piše čovjek, a ono što se traži pogledom je što čeka odgovor.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText, Plus, Search } from "lucide-react";

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

type Ponuda = {
  id: string;
  year: number;
  seq: number;
  issueDate: string | null;
  validUntil: string | null;
  client: { name?: string; oib?: string | null };
  total: number;
  currency: string;
  status: string;
  sentTo: string | null;
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

const broj = (p: Ponuda) => `${String(p.seq).padStart(2, "0")}/${p.year}`;

/** Je li ponuda istekla, bez obzira što piše u statusu. */
const istekla = (p: Ponuda) => {
  if (!p.validUntil || p.status === "accepted" || p.status === "declined") return false;

  return p.validUntil.slice(0, 10) < new Date().toISOString().slice(0, 10);
};

export default function PonudeList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [ponude, setPonude] = useState<Ponuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [upit, setUpit] = useState("");
  const [godina, setGodina] = useState("sve");
  const [status, setStatus] = useState("sve");

  useEffect(() => {
    const dohvati = async () => {
      try {
        setLoading(true);
        const r = await apiFetch("/ponude/bootstrap");
        if (!r.ok) throw new Error("Popis se nije učitao.");
        const d = await r.json();
        setPonude(d.ponude ?? []);
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
    () => [...new Set(ponude.map((p) => p.year))].sort((a, b) => b - a),
    [ponude]
  );

  const vidljive = useMemo(() => {
    const q = upit.trim().toLowerCase();

    return ponude.filter((p) => {
      if (godina !== "sve" && String(p.year) !== godina) return false;
      if (status === "istekle" && !istekla(p)) return false;
      if (status !== "sve" && status !== "istekle" && p.status !== status) return false;
      if (!q) return true;

      return (
        (p.client?.name ?? "").toLowerCase().includes(q) ||
        (p.client?.oib ?? "").includes(q) ||
        broj(p).includes(q)
      );
    });
  }, [ponude, upit, godina, status]);

  // Zbroj je zbroj onoga što se vidi, ne cijele godine — inače filtar laže.
  const zbroj = useMemo(
    () => vidljive.reduce((s, p) => s + (p.currency === "HRK" ? 0 : Number(p.total) || 0), 0),
    [vidljive]
  );

  const otvoriPdf = (p: Ponuda, preuzmi = false) => {
    void (async () => {
      const odgovor = await apiFetch(`/ponude/${p.id}/pdf`);

      if (!odgovor.ok) {
        toast({ title: "PDF se nije otvorio", variant: "destructive" });
        return;
      }

      const url = URL.createObjectURL(await odgovor.blob());

      if (preuzmi) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `Ponuda ${String(p.seq).padStart(2, "0")}-${p.year}.pdf`;
        a.click();
      } else {
        window.open(url, "_blank");
      }

      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    })();
  };

  const oznakaStatusa = (p: Ponuda) => {
    if (istekla(p)) return <Badge variant="destructive">istekla</Badge>;

    if (p.status === "accepted") {
      return <Badge className="bg-emerald-600 hover:bg-emerald-600">prihvaćena</Badge>;
    }

    if (p.status === "declined") return <Badge variant="outline">odbijena</Badge>;
    if (p.status === "sent") return <Badge variant="secondary">poslana</Badge>;

    return <Badge variant="outline">skica</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ponude</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Učitavam…"
              : `${vidljive.length} ${vidljive.length === 1 ? "ponuda" : "ponuda"} · ${eur(zbroj)}`}
          </p>
        </div>

        <Button onClick={() => navigate("/admin/ponude/nova")} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova ponuda
        </Button>
      </div>

      <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Pretraga ponuda"
            className="pl-9"
            onChange={(e) => setUpit(e.target.value)}
            placeholder="Kupac, OIB ili broj ponude"
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

          <Select onValueChange={setStatus} value={status}>
            <SelectTrigger className={isMobile ? "w-[150px] shrink-0" : "w-[170px]"}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sve">Svi statusi</SelectItem>
              <SelectItem value="draft">Skice</SelectItem>
              <SelectItem value="sent">Poslane</SelectItem>
              <SelectItem value="accepted">Prihvaćene</SelectItem>
              <SelectItem value="declined">Odbijene</SelectItem>
              <SelectItem value="istekle">Istekle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!loading && vidljive.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nema ponuda po ovim uvjetima.
          </CardContent>
        </Card>
      )}

      {/* Mobitel: kartice. Sedam stupaca na 390px nije tablica nego zagonetka. */}
      {isMobile ? (
        <div className="space-y-3">
          {vidljive.map((p) => (
            <Card key={p.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.client?.name ?? "—"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {broj(p)} · {datum(p.issueDate)}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-base font-semibold">
                    {eur(p.total, p.currency)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">{oznakaStatusa(p)}</div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => navigate(`/admin/ponude/${p.id}`)}
                    size="sm"
                    variant="secondary"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Otvori
                  </Button>
                  <Button
                    aria-label={`Preuzmi PDF ponude ${broj(p)}`}
                    onClick={() => otvoriPdf(p, true)}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Broj</TableHead>
                  <TableHead>Kupac</TableHead>
                  <TableHead className="w-[120px]">Izdana</TableHead>
                  <TableHead className="w-[120px]">Vrijedi do</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[130px] text-right">Iznos</TableHead>
                  <TableHead className="w-[110px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vidljive.map((p) => (
                  <TableRow
                    className="cursor-pointer"
                    key={p.id}
                    onClick={() => navigate(`/admin/ponude/${p.id}`)}
                  >
                    <TableCell className="font-medium">{broj(p)}</TableCell>
                    <TableCell>
                      <span className="block truncate">{p.client?.name ?? "—"}</span>
                      {p.sentTo && (
                        <span className="block truncate text-xs text-muted-foreground">
                          poslano na {p.sentTo}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{datum(p.issueDate)}</TableCell>
                    <TableCell>{datum(p.validUntil)}</TableCell>
                    <TableCell>{oznakaStatusa(p)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {eur(p.total, p.currency)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          aria-label={`Otvori PDF ponude ${broj(p)}`}
                          onClick={() => otvoriPdf(p)}
                          size="icon"
                          variant="ghost"
                        >
                          <FileText className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          aria-label={`Preuzmi PDF ponude ${broj(p)}`}
                          onClick={() => otvoriPdf(p, true)}
                          size="icon"
                          variant="ghost"
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
