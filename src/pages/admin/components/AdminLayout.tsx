// /var/www/fresh-studio-hub/src/pages/admin/components/AdminLayout.tsx
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  Users,
  Mail,
  Server,
  HardDrive,
  Receipt,
  Menu,
  X,
  LogOut,
  Plus,
  Search,
  PenLine,
  UserPlus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import logoDark from "@/assets/logo-dark.svg";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, key: "D" },
  { name: "Blog", href: "/admin/blog", icon: FileText, key: "B" },
  { name: "Media", href: "/admin/media", icon: HardDrive, key: "M" },
  { name: "Campaigns", href: "/admin/campaigns", icon: Mail, key: "C" },
  { name: "Leads", href: "/admin/leads", icon: Users, key: "L" },
  { name: "Ponude", href: "/admin/ponude", icon: FileSignature, key: "P" },
  { name: "Računi", href: "/admin/racuni", icon: Receipt, key: "R" },
  { name: "Services", href: "/admin/services", icon: Server, key: "S" },
];

/** Sidebar groups by job: make things, sell things, keep things running. */
const NAV_GROUPS = [
  { label: "", items: navigation.slice(0, 1) },
  { label: "Stvaraj", items: navigation.slice(1, 4) },
  { label: "Prodaj", items: navigation.slice(4, 7) },
  { label: "Sustav", items: navigation.slice(7) },
];

const CREATE = [
  { name: "New blog post", href: "/admin/blog/new", icon: PenLine },
  { name: "New lead", href: "/admin/leads/new", icon: UserPlus },
  { name: "Nova ponuda", href: "/admin/ponude/nova", icon: FileSignature },
  { name: "Novi račun", href: "/admin/racuni/novi", icon: Receipt },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const token = localStorage.getItem("fs_auth_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fullName = localStorage.getItem("fs_admin_fullname");
    const username = localStorage.getItem("fs_admin_username");
    const email = localStorage.getItem("fs_admin_email");
    const avatar = localStorage.getItem("fs_admin_avatar_url");

    setAdminName(fullName || username || "Admin");
    setAdminEmail(email);
    setAvatarUrl(avatar);
  }, [navigate, location.pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // ⌘K / Ctrl+K opens the palette; "G then D/B/M/…" jumps between sections.
  useEffect(() => {
    let g = 0;
    const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === "g") {
        g = Date.now();
        return;
      }
      if (Date.now() - g < 900) {
        const hit = navigation.find((n) => n.key.toLowerCase() === e.key.toLowerCase());
        if (hit) {
          g = 0;
          navigate(hit.href);
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("fs_auth_token");
    localStorage.removeItem("fs_admin_username");
    localStorage.removeItem("fs_admin_fullname");
    localStorage.removeItem("fs_admin_email");
    localStorage.removeItem("fs_admin_avatar_url");
    navigate("/login");
  };

  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Check if a nav item is active (exact for dashboard, startsWith for others)
  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  /* ======================================================================== */
  /* MOBILE LAYOUT                                                             */
  /* ======================================================================== */
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Mobile top header */}
        <header
          className="shrink-0 flex items-center justify-between border-b bg-card px-4"
          style={{
            height: "calc(3rem + var(--safe-top))",
            paddingTop: "var(--safe-top)",
          }}
        >
          <img src={logoDark} alt="Fresh Studio" className="h-6 w-auto invert" />

          <div className="flex items-center gap-2">
            {/* User avatar / initials */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={adminName}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">
                {initials || "FS"}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>

        {/* Bottom navigation */}
        <nav
          className="shrink-0 border-t bg-card flex items-center justify-around"
          style={{
            height: "calc(var(--bottom-nav-height) + var(--safe-bottom))",
            paddingBottom: "var(--safe-bottom)",
          }}
        >
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg transition-colors flex-1",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                activeClassName=""
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active && "text-foreground"
                  )}
                />
                <span className="text-[10px] font-medium leading-none">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    );
  }

  /* ======================================================================== */
  /* DESKTOP LAYOUT — "Fresh night" shell                                      */
  /* ======================================================================== */
  const current = [...navigation].reverse().find((n) => isActive(n.href));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Dobro jutro" : hour < 18 ? "Dobar dan" : "Dobra večer";
  const firstName = adminName.split(" ")[0];

  return (
    <div className="h-full">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="relative flex h-16 items-center gap-3 px-5">
            <img src={logoDark} alt="Fresh Studio" className="h-8 w-auto" />
            <span className="ml-auto rounded-full border border-sidebar-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">Hub</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-4 text-sidebar-foreground hover:text-sidebar-primary lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="mx-3 mb-3 flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-3 py-2 text-sm text-sidebar-muted transition-colors hover:border-sidebar-ring/40 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="flex-1 text-left">Search or jump…</span>
            <kbd className="rounded border border-sidebar-border px-1.5 text-[10px]">⌘K</kbd>
          </button>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2" aria-label="Main">
            {NAV_GROUPS.map((g) => (
              <div key={g.label}>
                {g.label && <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted/70">{g.label}</p>}
                <div className="space-y-0.5">
                  {g.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        end={item.href === "/admin"}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                          active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        )}
                        activeClassName=""
                      >
                        <span
                          className={cn(
                            "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-all duration-300",
                            active ? "opacity-100 shadow-[0_0_12px_hsl(var(--sidebar-primary))]" : "opacity-0"
                          )}
                          aria-hidden
                        />
                        <item.icon className={cn("h-4 w-4 transition-colors", active ? "text-sidebar-primary" : "")} aria-hidden />
                        <span className="flex-1">{item.name}</span>
                        <kbd className="hidden rounded border border-sidebar-border px-1 text-[10px] text-sidebar-muted opacity-0 transition-opacity group-hover:opacity-100 xl:inline">
                          G {item.key}
                        </kbd>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-3 rounded-lg p-2">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-sidebar-primary/40" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(80_96%_58%)] to-[hsl(188_90%_55%)] text-xs font-bold text-[hsl(228_40%_7%)]">
                  {initials || "FS"}
                </div>
              )}
              <div className="min-w-0 flex-1 text-xs leading-tight">
                <div className="truncate font-medium text-sidebar-foreground">{adminName}</div>
                <div className="truncate text-sidebar-muted">{adminEmail}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex h-full flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border/60 bg-background/70 px-6 backdrop-blur-xl">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground lg:hidden" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {location.pathname === "/admin" ? `${greeting}, ${firstName}` : current?.name ?? "Hub"}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("hr-HR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden w-72 items-center gap-2 rounded-lg border bg-card/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
            >
              <Search className="h-4 w-4" aria-hidden />
              <span className="flex-1 text-left">Search, jump, create…</span>
              <kbd className="rounded border px-1.5 text-[10px]">⌘K</kbd>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="glow-primary inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0">
                  <Plus className="h-4 w-4" aria-hidden /> New
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {CREATE.map((c) => (
                  <DropdownMenuItem key={c.href} onSelect={() => navigate(c.href)} className="gap-2">
                    <c.icon className="h-4 w-4 text-primary" aria-hidden /> {c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 2xl:p-8">
          <div key={location.pathname} className="page-enter h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Type a page or an action…" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup heading="Create">
            {CREATE.map((c) => (
              <CommandItem key={c.href} onSelect={() => (setPaletteOpen(false), navigate(c.href))} className="gap-2">
                <c.icon className="h-4 w-4 text-primary" aria-hidden /> {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Go to">
            {navigation.map((n) => (
              <CommandItem key={n.href} onSelect={() => (setPaletteOpen(false), navigate(n.href))} className="gap-2">
                <n.icon className="h-4 w-4" aria-hidden /> {n.name}
                <span className="ml-auto text-xs text-muted-foreground">G {n.key}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
