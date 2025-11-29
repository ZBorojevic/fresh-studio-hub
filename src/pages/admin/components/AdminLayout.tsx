import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Mail,
  Server,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import LogoDark from "@/assets/logo-dark.svg";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Blog", href: "/admin/blog", icon: FileText },
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Campaigns", href: "/admin/campaigns", icon: Mail },
  { name: "Services", href: "/admin/services", icon: Server },
];

interface AdminProfile {
  id: number;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const raw = localStorage.getItem("fs_admin_profile");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AdminProfile;
        setProfile(parsed);
      } catch {
        setProfile(null);
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem("fs_auth_token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("fs_auth_token");
    localStorage.removeItem("fs_admin_email");
    localStorage.removeItem("fs_admin_profile");
    navigate("/login");
  };

  const displayName =
    (profile?.firstName || profile?.lastName)
      ? `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
      : profile?.username ?? "Admin";

  const displayEmail = profile?.email ?? "hello@freshstudio.hr";

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* HEADER S LOGOM */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
            <img
              src={LogoDark}
              alt="Fresh Studio"
              className="h-7 w-auto select-none pointer-events-none"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground hover:text-sidebar-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* NAV */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="group flex items-center rounded-lg px-3 py-2 text-sm font-medium text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
                activeClassName="bg-sidebar-accent text-sidebar-foreground"
              >
                <item.icon className="mr-3 h-4 w-4" />
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            ))}
          </nav>

          {/* FOOTER / PROFIL */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-[10px] font-semibold uppercase">
                    {displayName
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                )}

                <div className="text-xs text-sidebar-muted">
                  <div className="font-medium text-sidebar-foreground">
                    {displayName}
                  </div>
                  <div className="truncate">{displayEmail}</div>
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
