import { useEffect, useState } from "react";
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

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Blog", href: "/admin/blog", icon: FileText },
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Campaigns", href: "/admin/campaigns", icon: Mail },
  { name: "Services", href: "/admin/services", icon: Server },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on route change (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const goDashboard = () => {
    setSidebarOpen(false);
    navigate("/admin");
  };

  const handleLogout = () => {
    localStorage.removeItem("fs_auth_token");
    localStorage.removeItem("fs_admin_username");
    localStorage.removeItem("fs_admin_fullname");
    localStorage.removeItem("fs_admin_email");
    localStorage.removeItem("fs_admin_avatar_url");

    setSidebarOpen(false);
    navigate("/login");
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {/* Backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

          {/* Sidebar */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out lg:translate-x-0",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div className="flex h-full flex-col">
              {/* Header linija prikazuj samo na mobilnim uređajima */}
              <div className="flex items-center justify-between px-6 border-b border-sidebar-border h-16 lg:hidden">
                <button
                  type="button"
                  onClick={goDashboard}
                  className="text-left text-xl font-bold text-sidebar-primary hover:opacity-90"
                  aria-label="Go to Dashboard"
                >
                  Fresh Studio
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-sidebar-foreground hover:text-sidebar-primary"
                  aria-label="Close menu"
                  type="button"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-4 overflow-auto">
                {navigation.map((item) => (
                  <div
                    key={item.name}
                    onClick={() => setSidebarOpen(false)}
                    className="cursor-pointer"
                  >
                    <NavLink
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </NavLink>
                  </div>
                ))}
              </nav>
              <div className="border-t border-sidebar-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold">
                      FS
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Admin</p>
                      <p className="text-xs text-sidebar-foreground/60">
                        admin@freshstudio.hr
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
                    aria-label="Logout"
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </aside>
          {/* Main area */}
          <div className="h-full lg:pl-64 overflow-hidden">
            {/* Mobile top bar (only for hamburger) */}
            <header
              className={cn(
                "lg:hidden border-b bg-card",
                "h-14 flex items-center px-4 gap-3"
              )}
              style={{
                paddingTop: "env(safe-area-inset-top)",
                height: "calc(3.5rem + env(safe-area-inset-top))",
              }}
            >
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-foreground p-2 -ml-2 rounded-md active:scale-[0.98]"
                aria-label="Open menu"
                type="button"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="font-semibold">Fresh Studio</div>
              <div className="flex-1" />
            </header>
            <main
              className={cn(
                "h-full overflow-hidden",
                "p-4 sm:p-6",
                "lg:pt-6",
                "lg:pl-0"
              )}
              style={{
                height: "100%",
              }}
            >
              <div className="h-full overflow-hidden">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
    );
} 