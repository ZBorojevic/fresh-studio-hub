// /var/www/fresh-studio-hub/src/pages/admin/racuni/RacunEditor.tsx
//
// Pisanje računa. Isti raspored kao lokalna aplikacija — obrazac lijevo, pregled
// PDF-a desno — jer je to raspored u kojem se račun piše bez pogađanja kako će
// izgledati.
//
// Na mobitelu pregleda nema uz obrazac: iframe s PDF-om na 390px je slika iz
// koje se ništa ne pročita, a zauzima pola ekrana. Umjesto toga je gumb koji ga
// otvori preko cijelog ekrana.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Eye, Plus, Save, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  vatId: string | null;
};

type Racun = {
  id?: string;
  year: number;
  seq: number;
  unit: string;
  operator: string;
  title: string;
  issueDate: string;
  dueDate: string;
  deliveryDate: string | null;
  clientId: string | null;
  client: { name: string; address: string; city: string; oib: string };
  items: Stavka[];
  discount: number;
  vatExempt: boolean;
  currency: string;
  notes: string[];
  afterNotes: string[];
  pozivNaBroj: string;
  showBarcode: boolean;
  status: string;
  total?: number;
  sentTo?: string | null;
  source?: string;
};

const danas = () => new Date().toISOString().slice(0, 10);

const zaDana = (iso: string, dana: number) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dana);
  return d.toISOString().slice(0, 10);
};

const eur = (n: number) =>
  new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n || 0);

export default function RacunEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const noviRacun = !id || id === "novi";

  const [klijenti, setKlijenti] = useState<Klijent[]>([]);
  const [racun, setRacun] = useState<Racun | null>(null);
  const [spremam, setSpremam] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [upozorenja, setUpozorenja] = useState<string[]>([]);
  const zadnjiUrl = useRef<string | null>(null);

  /* ---------------------------------------------------------------- učitavanje */

  useEffect(() => {
    const dohvati = async () => {
      const boot = await apiFetch("/racuni/bootstrap");

      if (!boot.ok) {
        toast({ title: "Podaci se nisu učitali", variant: "destructive" });
        return;
      }

      const d = await boot.json();
      setKlijenti(d.clients ?? []);

      if (noviRacun) {
        const dan = danas();

        setRacun({
          year: d.year,
          seq: d.nextSeq,
          unit: d.settings.defaults.unit,
          operator: d.settings.defaults.operator,
          title: d.settings.defaults.title,
          issueDate: dan,
          dueDate: zaDana(dan, d.settings.defaults.paymentTermDays ?? 14),
          deliveryDate: null,
          clientId: null,
          client: { name: "", address: "", city: "", oib: "" },
          items: [{ description: "", qty: 1, amount: 0 }],
          discount: 0,
          vatExempt: d.settings.defaults.vatExempt ?? true,
          currency: d.settings.defaults.currency ?? "EUR",
          notes: d.settings.defaults.note ? [d.settings.defaults.note] : [],
          afterNotes: [],
          pozivNaBroj: d.settings.defaults.pozivNaBroj ?? "00",
          showBarcode: d.settings.defaults.showBarcode ?? true,
          status: "issued",
        });

        return;
      }

      const r = await apiFetch(`/racuni/${id}`);

      if (!r.ok) {
        toast({ title: "Račun nije pronađen", variant: "destructive" });
        navigate("/admin/racuni");
        return;
      }

      const inv = await r.json();

      setRacun({
        ...inv,
        client: {
          name: inv.client?.name ?? "",
          address: inv.client?.address ?? "",
          city: inv.client?.city ?? "",
          oib: inv.client?.oib ?? "",
        },
        issueDate: inv.issueDate ?? danas(),
        dueDate: inv.dueDate ?? zaDana(inv.issueDate ?? danas(), 14),
      });
    };

    void dohvati();
  }, [id, noviRacun, navigate, toast]);

  /* ------------------------------------------------------------------ pregled */

  const osvjeziPregled = useCallback(async () => {
    if (!racun) return;

    const odgovor = await apiFetch("/racuni/preview", {
      method: "POST",
      body: JSON.stringify(racun),
    });

    if (!odgovor.ok) return;

    const zaglavlje = odgovor.headers.get("x-warnings");

    try {
      setUpozorenja(zaglavlje ? JSON.parse(decodeURIComponent(zaglavlje)) : []);
    } catch {
      setUpozorenja([]);
    }

    const blob = await odgovor.blob();
    const url = URL.createObjectURL(blob);

    // Stari blob se pušta; inače svaka tipka ostavi megabajt u memoriji.
    if (zadnjiUrl.current) URL.revokeObjectURL(zadnjiUrl.current);
    zadnjiUrl.current = url;
    setPdfUrl(url);
  }, [racun]);

  useEffect(() => {
    if (!racun) return;

    // Čeka se da se prestane tipkati: pregled je PDF, ne slovo.
    const odgoda = setTimeout(() => void osvjeziPregled(), 600);

    return () => clearTimeout(odgoda);
  }, [racun, osvjeziPregled]);

  useEffect(() => () => {
    if (zadnjiUrl.current) URL.revokeObjectURL(zadnjiUrl.current);
  }, []);

  /* ------------------------------------------------------------------- radnje */

  const zbroj = useMemo(() => {
    if (!racun) return 0;
    const stavke = racun.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    return Math.round((stavke - (Number(racun.discount) || 0) + Number.EPSILON) * 100) / 100;
  }, [racun]);

  const promijeni = (dio: Partial<Racun>) => setRacun((r) => (r ? { ...r, ...dio } : r));

  const odaberiKlijenta = (klijentId: string) => {
    const k = klijenti.find((x) => x.id === klijentId);

    if (!k) return;

    promijeni({
      clientId: k.id,
      client: {
        name: k.name ?? "",
        address: k.address ?? "",
        city: k.city ?? "",
        oib: k.oib ?? "",
      },
    });
  };

  const spremi = async () => {
    if (!racun) return;

    if (!racun.client.name.trim()) {
      toast({ title: "Kupac je obavezan", description: "Račun bez kupca se ne izdaje.", variant: "destructive" });
      return;
    }

    setSpremam(true);

    try {
      const odgovor = await apiFetch(noviRacun ? "/racuni" : `/racuni/${racun.id}`, {
        method: noviRacun ? "POST" : "PUT",
        body: JSON.stringify(racun),
      });

      const tijelo = await odgovor.json();

      if (!odgovor.ok) throw new Error(tijelo?.error ?? "Račun nije spremljen.");

      toast({ title: noviRacun ? "Račun je izdan" : "Spremljeno", description: `Broj ${tijelo.seq}-${tijelo.unit}-${tijelo.operator}` });
      navigate(`/admin/racuni/${tijelo.id}`);
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

  /**
   * Označava račun plaćenim i odmah sprema.
   *
   * Namjerno ne čeka „Spremi": kad se novac vidi na izvodu, to je jedan klik i
   * gotovo. Sve ostalo na računu ostaje netaknuto.
   */
  const oznaciPlacenim = async () => {
    if (!racun?.id) return;

    const odgovor = await apiFetch(`/racuni/${racun.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...racun, status: "paid" }),
    });

    if (odgovor.ok) {
      promijeni({ status: "paid" });
      toast({ title: "Označeno kao plaćeno" });
    } else {
      toast({ title: "Nije spremljeno", variant: "destructive" });
    }
  };

  const posalji = async () => {
    if (!racun?.id) return;

    const adresa = window.prompt("Na koju adresu poslati račun?", racun.sentTo ?? "");

    if (!adresa) return;

    const odgovor = await apiFetch(`/racuni/${racun.id}/posalji`, {
      method: "POST",
      body: JSON.stringify({ email: adresa }),
    });

    if (odgovor.ok) {
      toast({ title: "Poslano", description: adresa });
      promijeni({ sentTo: adresa });
    } else {
      const t = await odgovor.json().catch(() => ({}));
      toast({ title: "Nije poslano", description: t?.error ?? "", variant: "destructive" });
    }
  };

  if (!racun) {
    return <p className="text-sm text-muted-foreground">Učitavam…</p>;
  }

  /* -------------------------------------------------------------------- ispis */

  const obrazac = (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Račun</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="seq">Broj</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                className="w-20"
                id="seq"
                inputMode="numeric"
                onChange={(e) => promijeni({ seq: Number(e.target.value) })}
                value={racun.seq}
              />
              <span className="text-sm text-muted-foreground">
                – {racun.unit} – {racun.operator} / {racun.year}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="issueDate">Datum izdavanja</Label>
            <Input
              className="mt-1.5"
              id="issueDate"
              onChange={(e) =>
                promijeni({ issueDate: e.target.value, dueDate: zaDana(e.target.value, 14) })
              }
              type="date"
              value={racun.issueDate}
            />
          </div>

          <div>
            <Label htmlFor="dueDate">Dospijeće</Label>
            <Input
              className="mt-1.5"
              id="dueDate"
              onChange={(e) => promijeni({ dueDate: e.target.value })}
              type="date"
              value={racun.dueDate}
            />
          </div>

          <div>
            <Label htmlFor="pozivNaBroj">Poziv na broj</Label>
            <Input
              className="mt-1.5"
              id="pozivNaBroj"
              onChange={(e) => promijeni({ pozivNaBroj: e.target.value })}
              value={racun.pozivNaBroj}
            />
          </div>

          {/*
            Stanje je podatak o naplati, ne o dokumentu: račun ostaje isti, samo
            znamo je li novac stigao. Zato stoji uz broj i datume, a ne među
            napomenama — to je prvo što se traži kad se otvori stari račun.
          */}
          <div>
            <Label htmlFor="status">Stanje</Label>
            <Select onValueChange={(v) => promijeni({ status: v })} value={racun.status}>
              <SelectTrigger className="mt-1.5" id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="issued">Izdano — čeka plaćanje</SelectItem>
                <SelectItem value="paid">Plaćeno</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kupac</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="klijent">Iz kartoteke</Label>
            <Select onValueChange={odaberiKlijenta} value={racun.clientId ?? ""}>
              <SelectTrigger className="mt-1.5" id="klijent">
                <SelectValue placeholder="Odaberi klijenta ili upiši ispod" />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="ime">Naziv</Label>
              <Input
                className="mt-1.5"
                id="ime"
                onChange={(e) => promijeni({ client: { ...racun.client, name: e.target.value } })}
                value={racun.client.name}
              />
            </div>

            <div>
              <Label htmlFor="adresa">Adresa</Label>
              <Input
                className="mt-1.5"
                id="adresa"
                onChange={(e) => promijeni({ client: { ...racun.client, address: e.target.value } })}
                value={racun.client.address}
              />
            </div>

            <div>
              <Label htmlFor="mjesto">Poštanski broj i mjesto</Label>
              <Input
                className="mt-1.5"
                id="mjesto"
                onChange={(e) => promijeni({ client: { ...racun.client, city: e.target.value } })}
                value={racun.client.city}
              />
            </div>

            <div>
              <Label htmlFor="oib">OIB</Label>
              <Input
                className="mt-1.5"
                id="oib"
                inputMode="numeric"
                maxLength={11}
                onChange={(e) => promijeni({ client: { ...racun.client, oib: e.target.value } })}
                value={racun.client.oib}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Stavke</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {racun.items.map((stavka, i) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_5rem_8rem_2.5rem]" key={i}>
              <div>
                {i === 0 && <Label className="sm:hidden">Opis</Label>}
                <Textarea
                  aria-label={`Opis stavke ${i + 1}`}
                  className="mt-1.5 min-h-[62px] sm:mt-0"
                  onChange={(e) => {
                    const items = [...racun.items];
                    items[i] = { ...stavka, description: e.target.value };
                    promijeni({ items });
                  }}
                  placeholder="Usluga"
                  value={stavka.description}
                />
              </div>

              <div>
                <Input
                  aria-label={`Količina stavke ${i + 1}`}
                  inputMode="decimal"
                  onChange={(e) => {
                    const items = [...racun.items];
                    items[i] = { ...stavka, qty: Number(e.target.value) };
                    promijeni({ items });
                  }}
                  placeholder="KOL."
                  value={stavka.qty}
                />
              </div>

              <div>
                <Input
                  aria-label={`Iznos stavke ${i + 1}`}
                  inputMode="decimal"
                  onChange={(e) => {
                    const items = [...racun.items];
                    items[i] = { ...stavka, amount: Number(e.target.value) };
                    promijeni({ items });
                  }}
                  placeholder="IZNOS"
                  value={stavka.amount}
                />
              </div>

              <Button
                aria-label={`Obriši stavku ${i + 1}`}
                className="h-10 w-10 shrink-0"
                disabled={racun.items.length === 1}
                onClick={() => promijeni({ items: racun.items.filter((_, x) => x !== i) })}
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
              promijeni({ items: [...racun.items, { description: "", qty: 1, amount: 0 }] })
            }
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Dodaj stavku
          </Button>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">Ukupno</span>
            <span className="text-lg font-semibold">{eur(zbroj)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Napomene i plaćanje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="napomena">Napomena</Label>
            <Textarea
              className="mt-1.5"
              id="napomena"
              onChange={(e) => promijeni({ notes: e.target.value.split("\n").filter(Boolean) })}
              value={racun.notes.join("\n")}
            />
          </div>

          <div>
            <Label htmlFor="poslije">Tekst ispod napomene</Label>
            <Textarea
              className="mt-1.5"
              id="poslije"
              onChange={(e) => promijeni({ afterNotes: e.target.value.split("\n").filter(Boolean) })}
              placeholder="npr. Račun se odnosi na usluge u razdoblju…"
              value={racun.afterNotes.join("\n")}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label className="text-sm" htmlFor="barkod">
                Barkod za plaćanje
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                HUB3 barkod s iznosom. Na računu koji je već plaćen karticom nema što platiti, pa
                ga isključi.
              </p>
            </div>
            <Switch
              checked={racun.showBarcode}
              id="barkod"
              onCheckedChange={(v) => promijeni({ showBarcode: v })}
            />
          </div>
        </CardContent>
      </Card>

      {upozorenja.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          {upozorenja.map((u) => (
            <p key={u}>{u}</p>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            aria-label="Natrag na popis"
            onClick={() => navigate("/admin/racuni")}
            size="icon"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {noviRacun ? "Novi račun" : `Račun ${racun.seq}-${racun.unit}-${racun.operator}`}
            </h1>
            <p className="text-xs text-muted-foreground">
              {racun.status === "paid" ? "Plaćeno" : "Izdano — čeka plaćanje"}
              {racun.source === "sidrena" && " · izdan automatski, kupnja Sidrene"}
              {racun.sentTo && ` · poslano na ${racun.sentTo}`}
            </p>
          </div>
        </div>

        {/* Na širokom ekranu radnje stoje gore; na mobitelu su u traci na dnu. */}
        <div className="hidden gap-2 lg:flex">
          {!noviRacun && racun.status !== "paid" && (
            <Button
              className="gap-2"
              onClick={() => void oznaciPlacenim()}
              variant="outline"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Označi plaćenim
            </Button>
          )}
          {!noviRacun && (
            <Button className="gap-2" onClick={posalji} variant="outline">
              <Send className="h-4 w-4" aria-hidden="true" />
              Pošalji
            </Button>
          )}
          <Button className="gap-2" disabled={spremam} onClick={spremi}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {spremam ? "Spremam…" : noviRacun ? "Izdaj račun" : "Spremi"}
          </Button>
        </div>
      </div>

      {isMobile ? (
        <>
          {obrazac}

          {pdfUrl && (
            <Button
              className="w-full gap-2"
              onClick={() => window.open(pdfUrl, "_blank")}
              variant="secondary"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Pogledaj PDF
            </Button>
          )}

          {/*
            Traka s radnjama na dnu. `env(safe-area-inset-bottom)` je zbog
            iPhonea u PWA načinu: bez toga gumb sjedi pod trakom za povratak i
            pola klikova ode u sustav, a ne u aplikaciju.
          */}
          <div
            className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t bg-background/95 p-3 backdrop-blur"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            {!noviRacun && racun.status !== "paid" && (
              <Button
                aria-label="Označi plaćenim"
                onClick={() => void oznaciPlacenim()}
                size="icon"
                variant="outline"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            {!noviRacun && (
              <Button aria-label="Pošalji račun" onClick={posalji} size="icon" variant="outline">
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            <Button className="flex-1 gap-2" disabled={spremam} onClick={spremi}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {spremam ? "Spremam…" : noviRacun ? "Izdaj račun" : "Spremi"}
            </Button>
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          {obrazac}

          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pregled</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {pdfUrl ? (
                  <iframe
                    className="h-[70vh] w-full border-0"
                    src={pdfUrl}
                    title="Pregled računa"
                  />
                ) : (
                  <div className="flex h-[70vh] items-center justify-center text-sm text-muted-foreground">
                    Pregled se gradi…
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
