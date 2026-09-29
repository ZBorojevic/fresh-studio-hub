// /var/www/fresh-studio-hub/src/pages/admin/ponude/PonudaEditor.tsx
//
// Pisanje ponude. Isti raspored kao računi — obrazac lijevo, pregled PDF-a
// desno — jer je to raspored u kojem se dokument piše bez pogađanja kako će
// izgledati. Na mobitelu pregleda nema uz obrazac nego kao gumb: iframe s
// PDF-om na 390px je slika iz koje se ništa ne pročita.
//
// Razlike od računa nisu kozmetičke. Ponuda nema dospijeće, poziv na broj ni
// barkod jer **nije nalog za plaćanje**; ima rok valjanosti i rok isporuke.
// Broj se smije upisati ručno — ponude se u praksi ne numeriraju od jedan svake
// godine, nego se niz nastavlja ondje gdje je stao u prethodnom alatu.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Eye, Plus, Save, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiFetch } from "@/lib/api";

type Stavka = { description: string; qty: number; amount: number };

type Klijent = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  oib: string | null;
};

type Ponuda = {
  id: string;
  year: number;
  seq: number;
  title: string;
  place: string;
  issueDate: string;
  validUntil: string;
  deliveryTerm: string;
  clientId: string | null;
  client: { name: string; address: string; city: string; oib: string };
  items: Stavka[];
  discount: number;
  vatRate: number;
  vatExempt: boolean;
  currency: string;
  notes: string[];
  afterNotes: string[];
  issuer: string;
  paymentMethod: string;
  status: string;
  total: number;
  sentTo?: string | null;
};

const danas = () => new Date().toISOString().slice(0, 10);

const zaDana = (iso: string, dana: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + dana);

  return d.toISOString().slice(0, 10);
};

const eur = (n: number) =>
  new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n || 0);

/** Koliko ponuda vrijedi ako se ne kaže drukčije. */
const VALJANOST_DANA = 30;

export default function PonudaEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const nova = !id || id === "nova";

  const [ponuda, setPonuda] = useState<Ponuda | null>(null);
  const [klijenti, setKlijenti] = useState<Klijent[]>([]);
  const [loading, setLoading] = useState(true);
  const [spremam, setSpremam] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [primatelj, setPrimatelj] = useState("");
  const zadnjiUrl = useRef<string | null>(null);

  useEffect(() => {
    const dohvati = async () => {
      try {
        setLoading(true);

        const boot = await apiFetch("/ponude/bootstrap");
        if (!boot.ok) throw new Error("Postavke se nisu učitale.");
        const d = await boot.json();

        setKlijenti(d.klijenti ?? []);

        if (nova) {
          const dan = danas();

          setPonuda({
            id: "",
            year: new Date().getFullYear(),
            seq: d.sljedeci ?? 1,
            title: "PONUDA",
            place: d.postavke.company.place ?? "",
            issueDate: dan,
            validUntil: zaDana(dan, VALJANOST_DANA),
            deliveryTerm: "",
            clientId: null,
            client: { name: "", address: "", city: "", oib: "" },
            items: [{ description: "", qty: 1, amount: 0 }],
            discount: 0,
            vatRate: d.postavke.defaults.vatRate ?? 25,
            vatExempt: d.postavke.defaults.vatExempt ?? true,
            currency: d.postavke.defaults.currency ?? "EUR",
            notes: d.postavke.defaults.note ? [d.postavke.defaults.note] : [],
            afterNotes: [],
            issuer: d.postavke.defaults.issuer ?? "",
            paymentMethod: d.postavke.defaults.paymentMethod ?? "",
            status: "draft",
            total: 0,
          });

          return;
        }

        const r = await apiFetch(`/ponude/${id}`);

        if (!r.ok) {
          toast({ title: "Ponuda ne postoji", variant: "destructive" });
          navigate("/admin/ponude");

          return;
        }

        const p = await r.json();

        setPonuda({
          ...p,
          place: p.place ?? "",
          deliveryTerm: p.deliveryTerm ?? "",
          issueDate: p.issueDate ?? danas(),
          validUntil: p.validUntil ?? zaDana(p.issueDate ?? danas(), VALJANOST_DANA),
          client: {
            name: p.client?.name ?? "",
            address: p.client?.address ?? "",
            city: p.client?.city ?? "",
            oib: p.client?.oib ?? "",
          },
          notes: p.notes ?? [],
          afterNotes: p.afterNotes ?? [],
          issuer: p.issuer ?? "",
          paymentMethod: p.paymentMethod ?? "",
        });
        setPrimatelj(p.sentTo ?? "");
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
  }, [id, nova, navigate, toast]);

  const iznos = useMemo(
    () => (ponuda?.items ?? []).reduce((s, x) => s + (Number(x.amount) || 0), 0),
    [ponuda]
  );

  const ukupno = useMemo(() => {
    const osnovica = iznos - (Number(ponuda?.discount) || 0);

    return ponuda?.vatExempt ? osnovica : osnovica * (1 + (Number(ponuda?.vatRate) || 0) / 100);
  }, [iznos, ponuda]);

  const promijeni = (dio: Partial<Ponuda>) => setPonuda((p) => (p ? { ...p, ...dio } : p));

  const osvjeziPregled = useCallback(async () => {
    if (!ponuda) return;

    const odgovor = await apiFetch("/ponude/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ponuda),
    });

    if (!odgovor.ok) return;

    if (zadnjiUrl.current) URL.revokeObjectURL(zadnjiUrl.current);

    const url = URL.createObjectURL(await odgovor.blob());
    zadnjiUrl.current = url;
    setPdfUrl(url);
  }, [ponuda]);

  // Pregled se osvježava s odmakom: bez toga svaki pritisak tipke gradi PDF.
  useEffect(() => {
    if (!ponuda || isMobile) return;

    const t = setTimeout(() => void osvjeziPregled(), 600);

    return () => clearTimeout(t);
  }, [ponuda, isMobile, osvjeziPregled]);

  useEffect(() => () => {
    if (zadnjiUrl.current) URL.revokeObjectURL(zadnjiUrl.current);
  }, []);

  const spremi = async () => {
    if (!ponuda) return;

    if (!ponuda.client.name.trim()) {
      toast({ title: "Nedostaje kupac", description: "Upiši naziv kupca.", variant: "destructive" });

      return;
    }

    try {
      setSpremam(true);

      const odgovor = await apiFetch(nova ? "/ponude" : `/ponude/${ponuda.id}`, {
        method: nova ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(ponuda),
      });

      const tijelo = await odgovor.json();

      if (!odgovor.ok) throw new Error(tijelo?.error ?? "Spremanje nije uspjelo.");

      toast({
        title: nova ? "Ponuda je stvorena" : "Spremljeno",
        description: `Broj ${String(tijelo.seq).padStart(2, "0")}/${tijelo.year}`,
      });
      navigate(`/admin/ponude/${tijelo.id}`);
    } catch (e) {
      toast({
        title: "Greška",
        description: e instanceof Error ? e.message : "Nepoznata greška.",
        variant: "destructive",
      });
    } finally {
      setSpremam(false);
    }
  };

  const posalji = async () => {
    if (!ponuda || nova) return;

    const mail = primatelj.trim();

    if (!mail) {
      toast({ title: "Nedostaje adresa", variant: "destructive" });

      return;
    }

    const odgovor = await apiFetch(`/ponude/${ponuda.id}/posalji`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: mail }),
    });

    if (!odgovor.ok) {
      const t = await odgovor.json().catch(() => null);

      toast({
        title: "Ponuda nije poslana",
        description: t?.error ?? "Pokušaj ponovno.",
        variant: "destructive",
      });

      return;
    }

    promijeni({ status: ponuda.status === "draft" ? "sent" : ponuda.status, sentTo: mail });
    toast({ title: "Ponuda je poslana", description: mail });
  };

  const odaberiKlijenta = (klijentId: string) => {
    const k = klijenti.find((x) => x.id === klijentId);

    if (!k) return;

    promijeni({
      clientId: k.id,
      client: {
        name: k.name,
        address: k.address ?? "",
        city: k.city ?? "",
        oib: k.oib ?? "",
      },
    });
  };

  const promijeniStavku = (i: number, dio: Partial<Stavka>) => {
    if (!ponuda) return;

    const items = ponuda.items.map((s, j) => (i === j ? { ...s, ...dio } : s));

    promijeni({ items });
  };

  if (loading || !ponuda) {
    return <p className="text-sm text-muted-foreground">Učitavam…</p>;
  }

  const obrazac = (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ponuda</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="seq">Broj ponude</Label>
            <div className="flex items-center gap-2">
              <Input
                className="w-24"
                id="seq"
                inputMode="numeric"
                onChange={(e) => promijeni({ seq: Number(e.target.value) || 0 })}
                value={ponuda.seq}
              />
              <span className="text-muted-foreground">/</span>
              <Input
                className="w-28"
                inputMode="numeric"
                onChange={(e) => promijeni({ year: Number(e.target.value) || 0 })}
                value={ponuda.year}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Prijedlog je prvi slobodan broj; smije se upisati bilo koji.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(v) => promijeni({ status: v })} value={ponuda.status}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Skica</SelectItem>
                <SelectItem value="sent">Poslana</SelectItem>
                <SelectItem value="accepted">Prihvaćena</SelectItem>
                <SelectItem value="declined">Odbijena</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="issueDate">Datum izdavanja</Label>
            <Input
              id="issueDate"
              onChange={(e) =>
                promijeni({
                  issueDate: e.target.value,
                  validUntil: zaDana(e.target.value, VALJANOST_DANA),
                })
              }
              type="date"
              value={ponuda.issueDate}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="validUntil">Ponuda vrijedi do</Label>
            <Input
              id="validUntil"
              onChange={(e) => promijeni({ validUntil: e.target.value })}
              type="date"
              value={ponuda.validUntil}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="deliveryTerm">Rok isporuke</Label>
            <Input
              id="deliveryTerm"
              onChange={(e) => promijeni({ deliveryTerm: e.target.value })}
              placeholder="npr. 7 radnih dana"
              value={ponuda.deliveryTerm}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kupac</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {klijenti.length > 0 && (
            <div className="grid gap-2 sm:col-span-2">
              <Label>Iz popisa</Label>
              <Select onValueChange={odaberiKlijenta} value={ponuda.clientId ?? ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberi postojećeg kupca" />
                </SelectTrigger>
                <SelectContent>
                  {klijenti.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="ime">Naziv</Label>
            <Input
              id="ime"
              onChange={(e) => promijeni({ client: { ...ponuda.client, name: e.target.value } })}
              value={ponuda.client.name}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="adresa">Adresa</Label>
            <Input
              id="adresa"
              onChange={(e) => promijeni({ client: { ...ponuda.client, address: e.target.value } })}
              value={ponuda.client.address}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mjesto">Poštanski broj i mjesto</Label>
            <Input
              id="mjesto"
              onChange={(e) => promijeni({ client: { ...ponuda.client, city: e.target.value } })}
              value={ponuda.client.city}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="oib">OIB</Label>
            <Input
              id="oib"
              inputMode="numeric"
              onChange={(e) => promijeni({ client: { ...ponuda.client, oib: e.target.value } })}
              value={ponuda.client.oib}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usluge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ponuda.items.map((s, i) => (
            <div className="grid gap-2 sm:grid-cols-[1fr_5rem_8rem_2.5rem]" key={i}>
              <Input
                aria-label={`Opis stavke ${i + 1}`}
                onChange={(e) => promijeniStavku(i, { description: e.target.value })}
                placeholder="Opis usluge"
                value={s.description}
              />
              <Input
                aria-label={`Količina stavke ${i + 1}`}
                inputMode="decimal"
                onChange={(e) => promijeniStavku(i, { qty: Number(e.target.value) || 0 })}
                value={s.qty}
              />
              <Input
                aria-label={`Iznos stavke ${i + 1}`}
                inputMode="decimal"
                onChange={(e) => promijeniStavku(i, { amount: Number(e.target.value) || 0 })}
                value={s.amount}
              />
              <Button
                aria-label={`Ukloni stavku ${i + 1}`}
                disabled={ponuda.items.length === 1}
                onClick={() => promijeni({ items: ponuda.items.filter((_, j) => j !== i) })}
                size="icon"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}

          <Button
            className="gap-2"
            onClick={() =>
              promijeni({ items: [...ponuda.items, { description: "", qty: 1, amount: 0 }] })
            }
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Dodaj stavku
          </Button>

          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">Ukupno</span>
            <span className="text-base font-semibold">{eur(ukupno)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Napomene</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="notes">Uz stavke</Label>
            <Textarea
              id="notes"
              onChange={(e) => promijeni({ notes: e.target.value.split("\n").filter(Boolean) })}
              rows={4}
              value={ponuda.notes.join("\n")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="afterNotes">Ispod svega</Label>
            <Textarea
              id="afterNotes"
              onChange={(e) => promijeni({ afterNotes: e.target.value.split("\n").filter(Boolean) })}
              rows={3}
              value={ponuda.afterNotes.join("\n")}
            />
          </div>
        </CardContent>
      </Card>

      {!nova && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Slanje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="primatelj">E-mail primatelja</Label>
              <Input
                id="primatelj"
                onChange={(e) => setPrimatelj(e.target.value)}
                placeholder="kupac@primjer.hr"
                type="email"
                value={primatelj}
              />
            </div>

            <Button className="gap-2" onClick={() => void posalji()} variant="secondary">
              <Send className="h-4 w-4" aria-hidden="true" />
              Pošalji ponudu
            </Button>

            {ponuda.sentTo && (
              <p className="text-xs text-muted-foreground">
                <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />
                Zadnji put poslano na {ponuda.sentTo}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            aria-label="Natrag na popis"
            onClick={() => navigate("/admin/ponude")}
            size="icon"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {nova ? "Nova ponuda" : `Ponuda ${String(ponuda.seq).padStart(2, "0")}/${ponuda.year}`}
          </h1>
        </div>

        <div className="flex gap-2">
          {isMobile && (
            <Button
              className="gap-2"
              onClick={() => void osvjeziPregled().then(() => pdfUrl && window.open(pdfUrl))}
              variant="outline"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Pregled
            </Button>
          )}

          <Button className="gap-2" disabled={spremam} onClick={() => void spremi()}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {spremam ? "Spremam…" : "Spremi"}
          </Button>
        </div>
      </div>

      {isMobile ? (
        obrazac
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          {obrazac}

          <Card className="sticky top-6">
            <CardContent className="p-2">
              {pdfUrl ? (
                <iframe
                  className="h-[80vh] w-full rounded"
                  src={pdfUrl}
                  title="Pregled ponude"
                />
              ) : (
                <p className="py-20 text-center text-sm text-muted-foreground">
                  Pregled se gradi…
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
