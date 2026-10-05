// Dashboard — the studio's control room: money, pipeline and what to do next.
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  FileSignature,
  FileText,
  PenLine,
  Receipt,
  Target,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type Overview = {
  totals: { totalLeads: number; newLeads7d: number; qualifiedLeads: number; clientsCount: number; droppedLeads: number };
  activity: { contactedLeads: number; avgContactAttempts: number };
  recentLeads: { id: number; companyName: string | null; city: string | null; niche: string | null; createdAt: string }[];
};
type Doc = { id: string; title: string | null; issueDate: string | null; dueDate?: string | null; status: string; total: number | string; client?: { name?: string } };
type Post = { id: number; status: string; titleEn: string | null; titleHr: string | null; site: string; updatedAt: string };

const eur = (n: number, digits = 0) => new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR", maximumFractionDigits: digits }).format(n);
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const monthKey = (d: string | Date) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}`;
};
const reduce = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Eased count-up to `to` — numbers that land, not just appear. */
function useCountUp(to: number, ms = 900) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reduce()) {
      setV(to);
      return;
    }
    const start = performance.now();
    const f0 = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      setV(f0 + (to - f0) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return v;
}

function Kpi({
  i,
  icon: Icon,
  label,
  value,
  format,
  hint,
  delta,
  tone = "default",
  to,
  bar,
}: {
  i: number;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  format: (n: number) => string;
  hint?: string;
  delta?: number | null;
  tone?: "default" | "warn" | "good";
  to: string;
  bar?: number;
}) {
  const v = useCountUp(value);
  return (
    <Link
      to={to}
      style={{ ["--i" as string]: i }}
      className="glass group relative block overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            tone === "warn" ? "bg-warning/15 text-warning" : tone === "good" ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {delta != null && Number.isFinite(delta) && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${delta >= 0 ? "text-success" : "text-destructive"}`}>
            {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
            {Math.abs(Math.round(delta * 100))}% vs prošli mj.
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight 2xl:text-4xl">{format(v)}</p>
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
      {bar != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))] transition-[width] duration-1000 ease-out" style={{ width: `${Math.min(100, bar * 100)}%` }} />
        </div>
      )}
    </Link>
  );
}

/** Monthly revenue goal ring. */
function GoalRing({ value, goal, onGoal }: { value: number; goal: number; onGoal: (g: number) => void }) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const shown = useCountUp(pct * 100, 1200);
  const money = useCountUp(value, 1100);
  const r = 52;
  const c = 2 * Math.PI * r;
  const done = pct >= 1;
  return (
    <div className="flex items-center gap-7">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
          <defs>
            <linearGradient id="goal" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="hsl(80 96% 62%)" />
              <stop offset="1" stopColor="hsl(188 90% 58%)" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="url(#goal)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - shown / 100)}
            style={{ filter: "drop-shadow(0 0 8px hsl(80 96% 58% / 0.6))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums">{Math.round(shown)}%</span>
          <span className="text-[11px] text-muted-foreground">mjesečnog cilja</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Naplaćeno ovaj mjesec</p>
        <p className="text-gradient text-4xl font-bold tabular-nums tracking-tight 2xl:text-5xl">{eur(money)}</p>
        <button
          type="button"
          onClick={() => {
            const g = window.prompt("Mjesečni cilj prihoda (€):", String(goal));
            const n = Number(g?.replace(/[^\d.]/g, ""));
            if (n > 0) onGoal(n);
          }}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Target className="h-3.5 w-3.5" aria-hidden /> Cilj {eur(goal)} · promijeni
        </button>
        <p className={`mt-3 text-sm font-medium ${done ? "text-success" : "text-foreground/80"}`}>
          {done ? "Cilj je pao — ovaj mjesec je tvoj." : `Još ${eur(Math.max(0, goal - value))} do cilja.`}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [invoices, setInvoices] = useState<Doc[]>([]);
  const [quotes, setQuotes] = useState<Doc[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [goal, setGoal] = useState(() => Number(localStorage.getItem("hub-revenue-goal")) || 5000);

  useEffect(() => {
    const get = async <T,>(path: string, pick: (j: unknown) => T, fallback: T): Promise<T> => {
      try {
        const r = await apiFetch(path);
        if (!r.ok) return fallback;
        return pick(await r.json());
      } catch {
        return fallback;
      }
    };
    Promise.all([
      get<Overview | null>("/analytics/overview", (j) => j as Overview, null),
      get<Doc[]>("/racuni", (j) => (Array.isArray(j) ? (j as Doc[]) : []), []),
      get<Doc[]>("/ponude", (j) => (Array.isArray(j) ? (j as Doc[]) : []), []),
      get<Post[]>("/blog", (j) => ((j as { items?: Post[] }).items ?? []) as Post[], []),
    ]).then(([o, inv, q, p]) => {
      setOv(o);
      setInvoices(inv);
      setQuotes(q);
      setPosts(p);
      setLoaded(true);
    });
  }, []);

  const saveGoal = (g: number) => {
    setGoal(g);
    try {
      localStorage.setItem("hub-revenue-goal", String(g));
    } catch {
      /* ignore */
    }
  };

  const m = useMemo(() => {
    const now = new Date();
    const thisM = monthKey(now);
    const lastM = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const paid = invoices.filter((x) => x.status === "paid" && x.issueDate);
    const sumIn = (k: string) => paid.filter((x) => monthKey(x.issueDate!) === k).reduce((a, x) => a + num(x.total), 0);
    const revenue = sumIn(thisM);
    const prev = sumIn(lastM);
    const today = new Date(now.toDateString());
    const open = invoices.filter((x) => x.status !== "paid" && x.status !== "draft" && x.status !== "cancelled");
    const overdue = open.filter((x) => x.dueDate && new Date(x.dueDate) < today);
    const openQuotes = quotes.filter((x) => x.status === "sent" || x.status === "draft");
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { label: new Intl.DateTimeFormat("hr-HR", { month: "short" }).format(d), value: sumIn(monthKey(d)) };
    });
    return {
      revenue,
      delta: prev > 0 ? revenue / prev - 1 : null,
      unpaid: open.reduce((a, x) => a + num(x.total), 0),
      unpaidCount: open.length,
      overdue,
      open: [...open].sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))).slice(0, 5),
      quotesValue: openQuotes.reduce((a, x) => a + num(x.total), 0),
      quotesCount: openQuotes.length,
      accepted: quotes.filter((x) => x.status === "accepted").length,
      published: posts.filter((p) => p.status === "published").length,
      drafts: posts.filter((p) => p.status !== "published").length,
      months,
    };
  }, [invoices, quotes, posts]);

  const t = ov?.totals;
  const funnel = [
    { label: "Leadovi", value: num(t?.totalLeads) },
    { label: "Kontaktirani", value: num(ov?.activity?.contactedLeads) },
    { label: "Kvalificirani", value: num(t?.qualifiedLeads) },
    { label: "Klijenti", value: num(t?.clientsCount) },
  ];
  const fmax = Math.max(1, ...funnel.map((f) => f.value));

  const feed = [
    ...(ov?.recentLeads ?? []).map((l) => ({
      at: l.createdAt,
      icon: UserPlus,
      text: `Novi lead: ${l.companyName ?? "—"}`,
      sub: [l.city, l.niche].filter(Boolean).join(" · "),
      to: `/admin/leads/${l.id}`,
    })),
    ...invoices.slice(0, 6).map((x) => ({
      at: x.issueDate ?? "",
      icon: Receipt,
      text: `${x.title ?? "Račun"} · ${eur(num(x.total))}`,
      sub: `${x.client?.name ?? ""} · ${x.status === "paid" ? "plaćen" : "izdan"}`,
      to: `/admin/racuni/${x.id}`,
    })),
    ...posts.slice(0, 4).map((p) => ({
      at: p.updatedAt,
      icon: FileText,
      text: p.titleEn || p.titleHr || "Untitled",
      sub: `${p.site} · ${p.status === "published" ? "objavljen" : "skica"}`,
      to: `/admin/blog/${p.id}`,
    })),
  ]
    .filter((x) => x.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 8);

  const fmtDay = (d: string) => new Intl.DateTimeFormat("hr-HR", { day: "numeric", month: "short" }).format(new Date(d));
  const actions = [
    { to: "/admin/blog/new", icon: PenLine, label: "Napiši članak" },
    { to: "/admin/ponude/nova", icon: FileSignature, label: "Nova ponuda" },
    { to: "/admin/racuni/novi", icon: Receipt, label: "Novi račun" },
    { to: "/admin/leads/new", icon: UserPlus, label: "Novi lead" },
  ];

  return (
    <div className="mx-auto max-w-[1800px] space-y-6">
      {/* Hero: the month at a glance + quick actions */}
      <section className="rise grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="glass relative overflow-hidden rounded-3xl p-7 2xl:p-9">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="relative">{loaded ? <GoalRing value={m.revenue} goal={goal} onGoal={saveGoal} /> : <div className="h-40" aria-busy="true" />}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="glass group flex flex-col justify-between rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary))] transition-transform duration-300 group-hover:scale-110">
                <a.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="mt-6 flex items-center justify-between text-sm font-semibold">
                {a.label}
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* KPIs */}
      <section className="rise grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-5" aria-label="Key numbers">
        <Kpi i={0} icon={Wallet} label="Prihod ovaj mjesec" value={m.revenue} format={(n) => eur(n)} delta={m.delta} hint="plaćeni računi" tone="good" to="/admin/racuni" />
        <Kpi
          i={1}
          icon={m.overdue.length ? AlertTriangle : Receipt}
          label="Za naplatiti"
          value={m.unpaid}
          format={(n) => eur(n)}
          hint={`${m.unpaidCount} ${m.unpaidCount === 1 ? "račun" : "računa"}${m.overdue.length ? ` · ${m.overdue.length} kasni` : ""}`}
          tone={m.overdue.length ? "warn" : "default"}
          to="/admin/racuni"
        />
        <Kpi i={2} icon={FileSignature} label="Otvorene ponude" value={m.quotesValue} format={(n) => eur(n)} hint={`${m.quotesCount} otvorenih · ${m.accepted} prihvaćenih`} to="/admin/ponude" />
        <Kpi i={3} icon={Users} label="Novi leadovi · 7 dana" value={num(t?.newLeads7d)} format={(n) => String(Math.round(n))} hint="tjedni cilj: 50" bar={num(t?.newLeads7d) / 50} to="/admin/leads" />
        <Kpi i={4} icon={FileText} label="Objavljeni članci" value={m.published} format={(n) => String(Math.round(n))} hint={`${m.drafts} u skicama`} to="/admin/blog" />
      </section>

      {/* Revenue + pipeline */}
      <section className="rise grid gap-6 xl:grid-cols-3">
        <div className="glass rounded-2xl p-6 xl:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Prihod · zadnjih 6 mjeseci</h2>
            <span className="text-xs tabular-nums text-muted-foreground">{eur(m.months.reduce((a, x) => a + x.value, 0))} ukupno</span>
          </div>
          <div className="mt-4 h-64 2xl:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={m.months} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="hsl(80 96% 58%)" stopOpacity={0.45} />
                    <stop offset="1" stopColor="hsl(80 96% 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(224 14% 66%)", fontSize: 12 }} />
                <Tooltip
                  cursor={{ stroke: "hsl(80 96% 58% / 0.4)" }}
                  contentStyle={{ background: "hsl(228 26% 11%)", border: "1px solid hsl(228 18% 20%)", borderRadius: 12, color: "hsl(220 25% 96%)" }}
                  formatter={(v: number) => [eur(v), "Prihod"]}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(80 96% 58%)" strokeWidth={2.5} fill="url(#rev)" isAnimationActive={!reduce()} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold">Lijevak</h2>
          <ul className="mt-5 space-y-4">
            {funnel.map((f, i) => (
              <li key={f.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-semibold tabular-nums">{f.value}</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-out"
                    style={{
                      width: loaded ? `${(f.value / fmax) * 100}%` : "0%",
                      background: ["hsl(188 90% 55%)", "hsl(170 80% 50%)", "hsl(140 75% 52%)", "hsl(80 96% 58%)"][i],
                      transitionDelay: `${i * 120}ms`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-muted-foreground">
            Konverzija lead → klijent:{" "}
            <span className="font-semibold tabular-nums text-foreground">{funnel[0].value ? Math.round((funnel[3].value / funnel[0].value) * 100) : 0}%</span>
          </p>
        </div>
      </section>

      <section className="rise grid gap-6 xl:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Za naplatiti</h2>
            <Link to="/admin/racuni" className="text-xs text-muted-foreground hover:text-foreground">Svi računi →</Link>
          </div>
          {m.open.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{loaded ? "Sve je naplaćeno. Lijepo." : "Učitavam…"}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {m.open.map((x) => {
                const late = !!x.dueDate && new Date(x.dueDate) < new Date(new Date().toDateString());
                return (
                  <li key={x.id}>
                    <Link
                      to={`/admin/racuni/${x.id}`}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${late ? "bg-warning shadow-[0_0_8px_hsl(var(--warning))]" : "bg-info"}`} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{x.client?.name ?? x.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {x.title} · {x.dueDate ? `${late ? "kasni od" : "dospijeva"} ${fmtDay(x.dueDate)}` : "bez roka"}
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{eur(num(x.total))}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold">Nedavno</h2>
          {feed.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{loaded ? "Još nema aktivnosti." : "Učitavam…"}</p>
          ) : (
            <ul className="mt-4 space-y-1">
              {feed.map((f, i) => (
                <li key={i}>
                  <Link
                    to={f.to}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <f.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{f.text}</span>
                      <span className="block truncate text-xs text-muted-foreground">{f.sub}</span>
                    </span>
                    <time className="shrink-0 text-xs tabular-nums text-muted-foreground" dateTime={f.at}>
                      {fmtDay(f.at)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
