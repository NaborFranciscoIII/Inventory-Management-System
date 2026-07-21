import { useEffect, useState } from "react";
import { Bell, Boxes, LogOut, Menu, Search } from "lucide-react";
import { navItems } from "./data/mockData";
import { LoginPage } from "./pages/LoginPage";
import { getCurrentUser, logout, sessionStore, type AuthSession } from "./services/backend";
import {
  CategoriesPage,
  CustomersPage,
  DashboardPage,
  InventoryPage,
  ProductsPage,
  PurchasesPage,
  ReportsPage,
  SalesPage,
  SettingsPage,
  SuppliersPage,
  UserManagementPage,
} from "./pages/LivePages";
import { LiveDataProvider } from "./data/liveData";

function ApplicationShell({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (active) {
      case "dashboard":
        return <DashboardPage />;
      case "products":
        return <ProductsPage />;
      case "categories":
        return <CategoriesPage />;
      case "suppliers":
        return <SuppliersPage />;
      case "customers":
        return <CustomersPage />;
      case "purchases":
        return <PurchasesPage />;
      case "sales":
        return <SalesPage />;
      case "inventory":
        return <InventoryPage />;
      case "reports":
        return <ReportsPage />;
      case "users":
        return <UserManagementPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <aside className={`flex-shrink-0 flex flex-col transition-all duration-200 ${sidebarOpen ? "w-56" : "w-14"}`} style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: "var(--sidebar-border)", height: 56 }}>
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Boxes size={14} className="text-white" />
          </div>
          {sidebarOpen && <span className="font-semibold text-sm text-white tracking-tight">StockWise</span>}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.filter((item) => session.user.role === "Admin" || item.id !== "users").map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 mx-0 text-left transition-colors relative group ${isActive ? "text-white" : "text-sidebar-foreground hover:text-white"}`}
                style={isActive ? { background: "var(--sidebar-accent)" } : undefined}
              >
                {isActive && <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r bg-primary" />}
                <Icon size={15} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-xs font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t py-3 px-4" style={{ borderColor: "var(--sidebar-border)" }}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">{initials(session.user.name)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{session.user.name}</div>
                <div className="text-[10px] text-sidebar-foreground">{session.user.role}</div>
              </div>
              <button onClick={onLogout} aria-label="Sign out" className="text-sidebar-foreground hover:text-white transition-colors"><LogOut size={13} /></button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{initials(session.user.name)}</div>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-5 border-b border-border bg-card h-14 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
            <Menu size={15} />
          </button>
          <div className="flex-1 relative max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full pl-8 pr-3 py-1.5 rounded-md bg-muted/40 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" placeholder="Quick search…" />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button className="relative p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={15} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <div title={`${session.user.name} (${session.user.role})`} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary cursor-default">{initials(session.user.name)}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    const sessionToken = sessionStore.get();
    if (!sessionToken) {
      setIsRestoringSession(false);
      return;
    }

    getCurrentUser(sessionToken)
      .then((user) => setSession({ sessionToken, expiresAt: "", user }))
      .catch(() => sessionStore.clear())
      .finally(() => setIsRestoringSession(false));
  }, []);

  async function handleLogout() {
    if (session) {
      try {
        await logout(session.sessionToken);
      } finally {
        sessionStore.clear();
        setSession(null);
      }
    }
  }

  if (isRestoringSession) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-muted-foreground">Restoring secure session…</div>;
  }

  if (!session) {
    return <LoginPage onAuthenticated={setSession} />;
  }

  return (
    <LiveDataProvider session={session}>
      <ApplicationShell session={session} onLogout={handleLogout} />
    </LiveDataProvider>
  );
}
