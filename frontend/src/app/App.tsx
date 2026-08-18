import { useEffect, useState, ReactNode } from "react";
import { Bell, Boxes, LogOut, Menu, Search, ShieldAlert, ArrowLeft } from "lucide-react";
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
import { SettingsProvider } from "./contexts/SettingsContext";
import { NotificationsWidget } from './components/NotificationsWidget';

// ─── Security Components ──────────────────────────────────────────────────

function UnauthorizedPage({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-200 dark:border-red-500/20">
        <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
        Access Restricted
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        Your current account role does not have the necessary permissions to view this module. If you believe you need access, please contact your system administrator.
      </p>
      <button
        onClick={onReturn}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
      >
        <ArrowLeft size={16} />
        Return to Dashboard
      </button>
    </div>
  );
}

function ProtectedRoute({ 
  children, 
  allowedRoles, 
  userRole, 
  onReturn 
}: { 
  children: ReactNode; 
  allowedRoles: string[]; 
  userRole: string; 
  onReturn: () => void;
}) {
  if (!allowedRoles.includes(userRole)) {
    return <UnauthorizedPage onReturn={onReturn} />;
  }
  return <>{children}</>;
}

// ─── Main Application Shell ───────────────────────────────────────────────

function ApplicationShell({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const userRole = session.user.role;

const renderPage = () => {
    switch (active) {
      // 🟢 Universal Routes (Accessible to Everyone)
      case "dashboard":
        return <DashboardPage />;
      case "products":
        return <ProductsPage />;
      case "categories":
        return <CategoriesPage />;
      case "inventory":
        return <InventoryPage />;
      
      // 📦 Warehouse & Management Routes (Blocked for Sales)
      case "suppliers":
        return (
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Warehouse"]} userRole={userRole} onReturn={() => setActive("dashboard")}>
            <SuppliersPage />
          </ProtectedRoute>
        );
      case "purchases":
        return (
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Warehouse"]} userRole={userRole} onReturn={() => setActive("dashboard")}>
            <PurchasesPage />
          </ProtectedRoute>
        );

      // 🛒 Sales & Management Routes (Blocked for Warehouse)
      case "customers":
        return (
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Sales"]} userRole={userRole} onReturn={() => setActive("dashboard")}>
            <CustomersPage />
          </ProtectedRoute>
        );
      case "sales":
        return (
          <ProtectedRoute allowedRoles={["Admin", "Manager", "Sales"]} userRole={userRole} onReturn={() => setActive("dashboard")}>
            <SalesPage />
          </ProtectedRoute>
        );

      // 🔒 High-Level Restricted Routes (Management Only)
      case "reports":
        return (
          <ProtectedRoute allowedRoles={["Admin", "Manager"]} userRole={userRole} onReturn={() => setActive("dashboard")}>
            <ReportsPage />
          </ProtectedRoute>
        );
      case "settings":
        return (
          <ProtectedRoute allowedRoles={["Admin", "Manager"]} userRole={userRole} onReturn={() => setActive("dashboard")}>
            <SettingsPage />
          </ProtectedRoute>
        );
        
      // 🔐 Admin Only
      case "users":
        return (
          <ProtectedRoute allowedRoles={["Admin"]} userRole={userRole} onReturn={() => setActive("dashboard")}>
            <UserManagementPage />
          </ProtectedRoute>
        );
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
          {navItems.map((item) => {
            // Hide Users tab entirely if not an Admin
            if (item.id === "users" && userRole !== "Admin") return null;
            // Optionally hide Settings/Reports for lower roles, but leaving them visible 
            // allows the UnauthorizedPage to do its job gracefully.
            
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
              <NotificationsWidget />
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
    <SettingsProvider>
      <LiveDataProvider session={session}>
        <ApplicationShell session={session} onLogout={handleLogout} />
      </LiveDataProvider>
    </SettingsProvider>
  );
}