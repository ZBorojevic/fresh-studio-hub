// /var/www/fresh-studio-hub/src/components/AdminLayout.tsx
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
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import logoDark from "@/assets/logo-dark.svg";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Blog", href: "/admin/blog", icon: FileText },
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Campaigns", href: "/admin/campaigns", icon: Mail },
  { name: "Services", href: "/admin/services", icon: Server },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center px-6 border-b border-sidebar-border relative">
            <img src={logoDark} alt="Fresh Studio" className="h-10 w-auto" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute right-4 text-sidebar-foreground hover:text-sidebar-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links */}
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

          {/* Footer / user info */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={adminName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-foreground">
                    {initials || "FS"}
                  </div>
                )}

                <div className="text-xs text-sidebar-muted leading-tight min-w-0">
                  <div className="font-medium text-sidebar-foreground truncate">
                    {adminName}
                  </div>
                  <div className="truncate">{adminEmail}</div>
                </div>
              </div>

              {/* 🔥 FIXED LOGOUT BUTTON */}
              <button
                onClick={handleLogout}
                className="
                  h-8 w-8 flex items-center justify-center rounded-md
                  text-sidebar-muted hover:text-sidebar-foreground
                  hover:bg-sidebar-accent transition-colors
                "
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
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
