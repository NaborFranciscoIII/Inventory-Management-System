import type { ReactNode, ElementType } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Eye,
  Search,
  Plus,
  Star,
  Trash2,
} from "lucide-react";

export const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
export const fmtCurrency = (n: number) => `$${fmt(n)}`;

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Low Stock": "bg-amber-50 text-amber-700 ring-amber-200",
    "Out of Stock": "bg-red-50 text-red-700 ring-red-200",
    Inactive: "bg-slate-100 text-slate-500 ring-slate-200",
    Received: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    "In Transit": "bg-blue-50 text-blue-700 ring-blue-200",
    Cancelled: "bg-red-50 text-red-700 ring-red-200",
    Fulfilled: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Processing: "bg-blue-50 text-blue-700 ring-blue-200",
    Shipped: "bg-purple-50 text-purple-700 ring-purple-200",
    Refunded: "bg-orange-50 text-orange-700 ring-orange-200",
    OK: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Low: "bg-amber-50 text-amber-700 ring-amber-200",
    Critical: "bg-red-50 text-red-700 ring-red-200",
    Out: "bg-slate-100 text-slate-500 ring-slate-200",
    Admin: "bg-purple-50 text-purple-700 ring-purple-200",
    Manager: "bg-blue-50 text-blue-700 ring-blue-200",
    "Sales Rep": "bg-teal-50 text-teal-700 ring-teal-200",
    Warehouse: "bg-orange-50 text-orange-700 ring-orange-200",
    VIP: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    New: "bg-sky-50 text-sky-700 ring-sky-200",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ring-1 ${map[status] ?? "bg-slate-100 text-slate-500 ring-slate-200"}`}>
      {status}
    </span>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= n ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
      ))}
    </span>
  );
}

export function KpiCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  icon: ElementType;
  color: string;
}) {
  const up = change.startsWith("+");
  return (
    <div className="bg-card rounded-lg p-4 border border-border flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-foreground font-mono">{value}</div>
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span>{change} vs last month</span>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="flex gap-2">{action}</div>
    </div>
  );
}

export function TableContainer({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <th className={`px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border ${mono ? "font-mono" : ""}`}>
      {children}
    </th>
  );
}

export function Td({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <td className={`px-4 py-3 text-foreground border-b border-border last:border-0 ${mono ? "font-mono text-[11px]" : ""}`}>
      {children}
    </td>
  );
}

export function RowActions() {
  return (
    <div className="flex items-center gap-1">
      <button className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"><Eye size={13} /></button>
      <button className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={13} /></button>
      <button className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
    </div>
  );
}

export function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input className="pl-8 pr-3 py-1.5 rounded-md border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary w-48 placeholder:text-muted-foreground" placeholder={placeholder} />
    </div>
  );
}

export function AddBtn({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
      <Plus size={13} /> {label}
    </button>
  );
}
