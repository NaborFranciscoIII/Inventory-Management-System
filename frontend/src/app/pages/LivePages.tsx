import { useMemo, useState, type FormEvent, type ReactNode } from "react";
// ✅ CORRECT
import { DollarSign, ShoppingCart, Boxes, AlertTriangle, ArrowDownRight, ArrowUpRight, Pencil, Plus, RefreshCw, Trash2, X, ShieldAlert, ArrowLeft} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";
import { KpiCard, PageHeader, StatusBadge, TableContainer, Td, Th, fmtCurrency } from "../components/common";
import { useLiveData, type LiveData, type Product } from "../data/liveData";
import type { BackendEntity, RecordPayload } from "../services/backend";
import { useSettings } from "../contexts/SettingsContext";

type Row = Record<string, unknown>;
type Column = { label: string; render: (record: Row) => ReactNode; mono?: boolean };
type Field = { key: string; label: string; type?: "text" | "email" | "password" | "number" | "date" | "select" | "textarea"; options?: Array<{ value: string; label: string }>; optional?: boolean };

const statuses = ["Active", "Inactive"];
const purchaseStatuses = ["Received", "Pending", "In Transit", "Cancelled"];
const saleStatuses = ["Fulfilled", "Processing", "Shipped", "Refunded"];

const row = (value: unknown) => value as Row;
const string = (value: unknown) => value == null ? "" : String(value);
const number = (value: unknown) => typeof value === "number" ? value : Number(value ?? 0);
const today = () => new Date().toISOString().slice(0, 10);

export function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in zoom-in-95 duration-300">
      {/* Icon Container */}
      <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-200 dark:border-red-500/20">
        <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
      </div>
      
      {/* Text Content */}
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
        Access Restricted
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        Your current account role does not have the necessary permissions to view this module. If you believe you need access, please contact your system administrator.
      </p>
      
      {/* Return Action */}
      <button
        onClick={() => window.history.back()} 
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
      >
        <ArrowLeft size={16} />
        Return to Previous Page
      </button>
    </div>
  );
}

function ActionButton({ children, onClick, tone = "primary" }: { children: ReactNode; onClick: () => void; tone?: "primary" | "secondary" }) {
  return <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tone === "primary" ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border bg-card hover:bg-muted/50"}`}>{children}</button>;
}

function LoadingState() {
  return <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading local inventory data…</div>;
}

function PageError() {
  const { error } = useLiveData();
  return error ? <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null;
}

function fieldsFor(entity: BackendEntity, data: LiveData, roleNames: string[], editing: boolean): Field[] {
  const productOptions = data.products.map((item) => ({ value: item.id, label: `${item.sku} — ${item.name}` }));
  const categoryOptions = data.categories.map((item) => ({ value: item.id, label: item.name }));
  const supplierOptions = data.suppliers.map((item) => ({ value: item.id, label: item.name }));
  const customerOptions = data.customers.map((item) => ({ value: item.id, label: item.name }));
  const statusField: Field = { key: "status", label: "Status", type: "select", options: statuses.map((value) => ({ value, label: value })) };

  switch (entity) {
    case "categories": return [{ key: "name", label: "Name" }, { key: "description", label: "Description", type: "textarea", optional: true }, statusField];
    case "suppliers": return [{ key: "name", label: "Company name" }, { key: "contactName", label: "Contact name", optional: true }, { key: "email", label: "Email", type: "email", optional: true }, { key: "phone", label: "Phone", optional: true }, { key: "country", label: "Country", optional: true }, statusField];
    case "customers": return [{ key: "name", label: "Customer name" }, { key: "email", label: "Email", type: "email", optional: true }, { key: "phone", label: "Phone", optional: true }, { key: "city", label: "City", optional: true }, { key: "tier", label: "Tier", optional: true }, statusField];
    case "products": return [
      { key: "sku", label: "SKU" }, { key: "name", label: "Product name" }, { key: "categoryId", label: "Category", type: "select", options: categoryOptions },
      { key: "supplierId", label: "Supplier", type: "select", options: supplierOptions, optional: true }, { key: "price", label: "Unit price", type: "number" },
      ...(editing ? [] : [{ key: "stock", label: "Opening stock", type: "number", optional: true } as Field]), { key: "reorderLevel", label: "Reorder level", type: "number" }, statusField,
    ];
    case "purchases": return [{ key: "productId", label: "Product", type: "select", options: productOptions }, { key: "supplierId", label: "Supplier", type: "select", options: supplierOptions }, { key: "quantity", label: "Quantity", type: "number" }, { key: "unitPrice", label: "Unit price", type: "number" }, { key: "purchaseDate", label: "Purchase date", type: "date" }, { key: "status", label: "Status", type: "select", options: purchaseStatuses.map((value) => ({ value, label: value })) }];
    case "sales": return [{ key: "productId", label: "Product", type: "select", options: productOptions }, { key: "customerId", label: "Customer", type: "select", options: customerOptions }, { key: "quantity", label: "Quantity", type: "number" }, { key: "unitPrice", label: "Unit price", type: "number" }, { key: "saleDate", label: "Sale date", type: "date" }, { key: "status", label: "Status", type: "select", options: saleStatuses.map((value) => ({ value, label: value })) }];
    case "inventory_movements": return [{ key: "productId", label: "Product", type: "select", options: productOptions }, { key: "movementType", label: "Movement type", type: "select", options: ["IN", "OUT", "ADJUSTMENT_IN", "ADJUSTMENT_OUT"].map((value) => ({ value, label: value.replace("_", " ") })) }, { key: "quantity", label: "Quantity", type: "number" }, { key: "reference", label: "Reference", optional: true }, { key: "notes", label: "Notes", type: "textarea", optional: true }];
    case "users": return [{ key: "name", label: "Full name" }, { key: "email", label: "Email", type: "email" }, ...(editing ? [] : [{ key: "password", label: "Temporary password", type: "password" } as Field]), { key: "role", label: "Role", type: "select", options: roleNames.map((value) => ({ value, label: value })) }, statusField];
  }
}

function RecordDialog({ entity, record, onClose }: { entity: BackendEntity; record?: Row; onClose: () => void }) {
  const { data, roles, create, update } = useLiveData();
  const editing = Boolean(record);
  const fields = fieldsFor(entity, data, roles.map((role) => role.name), editing);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((field) => [field.key, string(record?.[field.key] ?? (field.key.endsWith("Date") ? today() : field.key === "status" ? "Active" : ""))] )));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: RecordPayload = {};
    for (const field of fields) {
      const value = values[field.key]?.trim() ?? "";
      if (!value && field.optional) continue;
      if (!value) { setError(`${field.label} is required.`); return; }
      payload[field.key] = field.type === "number" ? Number(value) : value;
    }
    setSaving(true);
    setError("");
    try {
      if (editing && record) await update(entity, string(record.id), payload);
      else await create(entity, payload);
      onClose();
    } catch (reason) {
      setError(String(reason).replace(/^Error:\s*/, ""));
    } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
    <form onSubmit={submit} className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-base font-semibold">{editing ? "Edit" : "Add"} {entity.replace("_", " ")}</h2><p className="text-xs text-muted-foreground mt-0.5">Changes are saved to the local SQLite database.</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-muted"><X size={18} /></button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
        {fields.map((field) => <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-xs font-medium text-foreground">{field.label}{field.optional && <span className="text-muted-foreground"> (optional)</span>}</span>{field.type === "select" ? <select required={!field.optional} value={values[field.key] ?? ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"><option value="">Select…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "textarea" ? <textarea value={values[field.key] ?? ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" /> : <input required={!field.optional} type={field.type ?? "text"} min={field.type === "number" ? 0 : undefined} step={field.key.includes("Price") || field.key === "price" ? "0.01" : undefined} value={values[field.key] ?? ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />}</label>)}
      </div>
      {error && <p className="mx-5 mb-4 rounded bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-border px-5 py-4"><ActionButton tone="secondary" onClick={onClose}>Cancel</ActionButton><button disabled={saving} type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : editing ? "Save changes" : "Create record"}</button></div>
    </form>
  </div>;
}

function CrudPage({ entity, title, sub, addLabel, records, columns }: { entity: BackendEntity; title: string; sub: string; addLabel: string; records: Row[]; columns: Column[] }) {
  const { remove, isLoading, refresh } = useLiveData();
  const [dialogRecord, setDialogRecord] = useState<Row | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState("");
  const filtered = records.filter((record) => Object.values(record).some((value) => string(value).toLowerCase().includes(query.toLowerCase())));

  async function deleteRecord(record: Row) {
    if (!window.confirm(`Delete ${string(record.name ?? record.id)}? This cannot be undone.`)) return;
    setDeleting(string(record.id));
    try { await remove(entity, string(record.id)); } catch { /* The shared error banner explains the failure. */ } finally { setDeleting(""); }
  }

  return <div>
    <PageHeader title={title} sub={sub} action={<><div className="relative"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}…`} className="w-48 rounded-md border border-border bg-card px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary" /></div><ActionButton tone="secondary" onClick={() => void refresh()}><RefreshCw size={13} /> Refresh</ActionButton><ActionButton onClick={() => { setDialogRecord(undefined); setDialogOpen(true); }}><Plus size={13} /> {addLabel}</ActionButton></>} />
    <PageError />
    {isLoading ? <LoadingState /> : <TableContainer><thead><tr>{columns.map((column) => <Th key={column.label} mono={column.mono}>{column.label}</Th>)}<Th>Actions</Th></tr></thead><tbody>{filtered.map((record) => <tr key={string(record.id)} className="hover:bg-muted/20 transition-colors">{columns.map((column) => <Td key={column.label} mono={column.mono}>{column.render(record)}</Td>)}<Td><div className="flex gap-1"><button onClick={() => { setDialogRecord(record); setDialogOpen(true); }} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit"><Pencil size={13} /></button><button disabled={deleting === string(record.id)} onClick={() => void deleteRecord(record)} className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label="Delete"><Trash2 size={13} /></button></div></Td></tr>)}{filtered.length === 0 && <tr><Td colSpan={columns.length + 1}><span className="text-muted-foreground">No records found.</span></Td></tr>}</tbody></TableContainer>}
    {dialogOpen && <RecordDialog key={`${entity}-${string(dialogRecord?.id ?? "new")}`} entity={entity} record={dialogRecord} onClose={() => setDialogOpen(false)} />}
  </div>;
}

export function DashboardPage() {
  const { data, isLoading, refresh } = useLiveData();
  const { formatCurrency } = useSettings();
  
  // Calculate live financial metrics from SQLite data
  const revenue = data.sales.reduce((sum, sale) => sum + sale.total, 0);
  const purchases = data.purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const profit = revenue - purchases;
  const lowStock = data.products.filter((product) => product.stock <= product.reorderLevel).length;

  // Group data by month for Recharts
  const months = useMemo(() => {
    const values = new Map<string, { month: string; revenue: number; purchases: number; profit: number }>();
    
    for (const sale of data.sales) { 
      const month = sale.saleDate.slice(0, 7); 
      const entry = values.get(month) ?? { month, revenue: 0, purchases: 0, profit: 0 }; 
      entry.revenue += sale.total; 
      entry.profit += sale.total * 0.4; // Calculated profit margin model
      values.set(month, entry); 
    }
    for (const purchase of data.purchases) { 
      const month = purchase.purchaseDate.slice(0, 7); 
      const entry = values.get(month) ?? { month, revenue: 0, purchases: 0, profit: 0 }; 
      entry.purchases += purchase.total; 
      values.set(month, entry); 
    }
    return [...values.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [data.purchases, data.sales]);

  // Calculate live distribution by Category from actual products & categories
  const categoryDistribution = useMemo(() => {
    const colors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899", "#64748B"];
    const totalProducts = data.products.length || 1;
    
    return data.categories.map((cat, index) => {
      const count = data.products.filter(p => p.categoryId === cat.id || p.category === cat.name).length;
      const percentage = Math.round((count / totalProducts) * 100);
      return {
        name: cat.name,
        value: percentage > 0 ? percentage : (index === 0 ? 100 : 0),
        color: colors[index % colors.length]
      };
    }).filter(item => item.value > 0);
  }, [data.categories, data.products]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        sub="Live overview from your local SQLite database" 
        action={
          <ActionButton tone="secondary" onClick={() => void refresh()}><RefreshCw size={13} /> Refresh</ActionButton>
        } 
      />
      <PageError />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Revenue" value={formatCurrency(revenue)} change="+14.2%" icon={DollarSign} color="bg-emerald-500" />
        <KpiCard title="Sales Orders" value={String(data.sales.length)} change="+8.7%" icon={ShoppingCart} color="bg-blue-500" />
        <KpiCard title="Products" value={String(data.products.length)} change="+3.1%" icon={Boxes} color="bg-violet-500" />
        <KpiCard title="Low Stock" value={String(lowStock)} change={lowStock ? "Alert" : "Stable"} icon={AlertTriangle} color="bg-amber-500" />
      </div>

{/* Row 1: Area Chart & By Category Donut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-foreground">Revenue vs Purchases</span>
              <span className="text-xs text-muted-foreground">Live SQLite Timeline</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val / 1000).replace(/\.00$/, "") + "k"} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#rev)" name="Revenue" />
                <Area type="monotone" dataKey="purchases" stroke="#3B82F6" strokeWidth={2} fill="url(#pur)" name="Purchases" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-foreground">By Category</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2}>
                  {categoryDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2 overflow-y-auto max-h-[80px]">
              {categoryDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                    <span className="text-foreground truncate max-w-[120px]">{entry.name}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Recent Activity & Monthly Profit Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Recent Activity</span>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[220px]">
              {data.inventoryMovements.slice(0, 5).map((movement) => {
                const isIncoming = movement.movementType.includes("IN");
                const isWarn = movement.movementType.includes("ADJUSTMENT");
                return (
                  <div key={movement.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isIncoming ? "bg-emerald-100" : isWarn ? "bg-amber-100" : "bg-blue-100"}`}>
                      {isIncoming ? <ArrowDownRight size={12} className="text-emerald-600" /> : <ArrowUpRight size={12} className="text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground">{movement.product}</div>
                      <div className="text-xs text-muted-foreground truncate">{movement.quantity} units · {movement.reference || movement.movementType}</div>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{movement.createdAt ? movement.createdAt.slice(11, 16) : "Just now"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Monthly Profit</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val / 1000).replace(/\.00$/, "") + "k"} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
    </div>
  );
}

export function ProductsPage() { 
  const { formatCurrency } = useSettings();
  const { data } = useLiveData(); return <CrudPage entity="products" title="Products" sub={`${data.products.length} live products`} addLabel="Add Product" records={data.products.map(row)} columns={[{ label: "SKU", mono: true, render: (item) => string(item.sku) }, { label: "Name", render: (item) => <span className="font-medium">{string(item.name)}</span> }, { label: "Category", render: (item) => string(item.category) }, { label: "Supplier", render: (item) => string(item.supplier) || "—" }, { label: "Price", mono: true, render: (item) => formatCurrency(number(item.price)) }, { label: "Stock", mono: true, render: (item) => <span className={number(item.stock) <= number(item.reorderLevel) ? "font-semibold text-amber-600" : ""}>{number(item.stock)}</span> }, { label: "Reorder", mono: true, render: (item) => number(item.reorderLevel) }, { label: "Status", render: (item) => <StatusBadge status={string(item.status)} /> }]} />; }
export function CategoriesPage() {
  const { data, refresh } = useLiveData();
  const [dialogRecord, setDialogRecord] = useState<Row | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState("");
  const { remove, isLoading } = useLiveData();
  const { formatCurrency } = useSettings();

  const filteredCategories = data.categories.filter((cat) => 
    string(cat.name).toLowerCase().includes(query.toLowerCase())
  );

  async function deleteCategory(id: string, name: string) {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await remove("categories", id);
    } finally {
      setDeleting("");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Categories" 
        sub={`${data.categories.length} live categories`} 
        action={
          <>
            <div className="relative">
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search categories…" 
                className="w-48 rounded-md border border-border bg-card px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary" 
              />
            </div>
            <ActionButton tone="secondary" onClick={() => void refresh()}><RefreshCw size={13} /> Refresh</ActionButton>
            <ActionButton onClick={() => { setDialogRecord(undefined); setDialogOpen(true); }}><Plus size={13} /> Add Category</ActionButton>
          </>
        } 
      />
      <PageError />
      
      {isLoading ? <LoadingState /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-card rounded-lg border border-border p-4 hover:shadow-sm transition-shadow group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-foreground">{category.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{category.description || "No description provided."}</div>
                </div>
                <StatusBadge status={category.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-md p-2.5">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Products</div>
                  <div className="text-lg font-semibold font-mono text-foreground mt-0.5">{category.products}</div>
                </div>
                <div className="bg-muted/40 rounded-md p-2.5">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Stock Value</div>
                  <div className="text-lg font-semibold font-mono text-foreground mt-0.5">{formatCurrency(category.value)}</div>
                </div>
              </div>
              <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setDialogRecord(category as unknown as Row); setDialogOpen(true); }} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] border border-border bg-card hover:bg-muted/50 transition-colors"><Pencil size={11} /> Edit</button>
                <button disabled={deleting === category.id} onClick={() => void deleteCategory(category.id, category.name)} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] border border-border bg-card hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"><Trash2 size={11} /> Delete</button>
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No categories found.
            </div>
          )}
        </div>
      )}

      {dialogOpen && <RecordDialog key={`categories-${string(dialogRecord?.id ?? "new")}`} entity="categories" record={dialogRecord} onClose={() => setDialogOpen(false)} />}
    </div>
  );
}
export function SuppliersPage() {
   const { data } = useLiveData(); return <CrudPage entity="suppliers" title="Suppliers" sub={`${data.suppliers.length} live suppliers`} addLabel="Add Supplier" records={data.suppliers.map(row)} columns={[{ label: "Name", render: (item) => <span className="font-medium">{string(item.name)}</span> }, { label: "Contact", render: (item) => string(item.contactName) || string(item.email) || "—" }, { label: "Phone", mono: true, render: (item) => string(item.phone) || "—" }, { label: "Country", render: (item) => string(item.country) || "—" }, { label: "Products", mono: true, render: (item) => number(item.products) }, { label: "Status", render: (item) => <StatusBadge status={string(item.status)} /> }]} />; }
export function CustomersPage() { 
  const { formatCurrency } = useSettings();
  const { data } = useLiveData(); return <CrudPage entity="customers" title="Customers" sub={`${data.customers.length} live customers`} addLabel="Add Customer" records={data.customers.map(row)} columns={[{ label: "Name", render: (item) => <span className="font-medium">{string(item.name)}</span> }, { label: "Email", render: (item) => string(item.email) || "—" }, { label: "Phone", mono: true, render: (item) => string(item.phone) || "—" }, { label: "City", render: (item) => string(item.city) || "—" }, { label: "Orders", mono: true, render: (item) => number(item.orders) }, { label: "Total Spent", mono: true, render: (item) => formatCurrency(number(item.spent)) }, { label: "Status", render: (item) => <StatusBadge status={string(item.status)} /> }]} />; }
export function PurchasesPage() { 
  const { formatCurrency } = useSettings();
  const { data } = useLiveData(); return <CrudPage entity="purchases" title="Purchases" sub={`${data.purchases.length} live purchase records`} addLabel="New Purchase" records={data.purchases.map(row)} columns={[{ label: "Reference", mono: true, render: (item) => string(item.id).slice(0, 8) }, { label: "Product", render: (item) => string(item.product) }, { label: "Supplier", render: (item) => string(item.supplier) }, { label: "Date", mono: true, render: (item) => string(item.purchaseDate) }, { label: "Quantity", mono: true, render: (item) => number(item.quantity) }, { label: "Total", mono: true, render: (item) => formatCurrency(number(item.total)) }, { label: "Status", render: (item) => <StatusBadge status={string(item.status)} /> }]} />; }
export function SalesPage() { 
  const { formatCurrency } = useSettings();
  const { data } = useLiveData(); return <CrudPage entity="sales" title="Sales" sub={`${data.sales.length} live sales records`} addLabel="New Sale" records={data.sales.map(row)} columns={[{ label: "Reference", mono: true, render: (item) => string(item.id).slice(0, 8) }, { label: "Product", render: (item) => string(item.product) }, { label: "Customer", render: (item) => string(item.customer) }, { label: "Date", mono: true, render: (item) => string(item.saleDate) }, { label: "Quantity", mono: true, render: (item) => number(item.quantity) }, { label: "Total", mono: true, render: (item) => formatCurrency(number(item.total)) }, { label: "Status", render: (item) => <StatusBadge status={string(item.status)} /> }]} />; }

function inventoryStatus(product: Product) { return product.stock === 0 ? "Out" : product.stock <= product.reorderLevel ? "Low" : "OK"; }
export function InventoryPage() { const { data } = useLiveData(); const low = data.products.filter((product) => product.stock > 0 && product.stock <= product.reorderLevel).length; const out = data.products.filter((product) => product.stock === 0).length; return <div className="space-y-5"><PageHeader title="Inventory" sub="Live stock levels and movement history" /><PageError /><div className="grid grid-cols-3 gap-4"><div className="rounded-lg border border-border bg-card p-3"><div className="text-lg font-semibold">{data.products.length - low - out}</div><div className="text-[11px] text-muted-foreground">In stock</div></div><div className="rounded-lg border border-amber-200 bg-card p-3"><div className="text-lg font-semibold">{low}</div><div className="text-[11px] text-muted-foreground">Low stock</div></div><div className="rounded-lg border border-red-200 bg-card p-3"><div className="text-lg font-semibold">{out}</div><div className="text-[11px] text-muted-foreground">Out of stock</div></div></div><CrudPage entity="inventory_movements" title="Inventory Movements" sub="Use adjustments to change current stock" addLabel="Add Adjustment" records={data.inventoryMovements.map(row)} columns={[{ label: "Product", render: (item) => string(item.product) }, { label: "Type", render: (item) => <StatusBadge status={string(item.movementType)} /> }, { label: "Quantity", mono: true, render: (item) => number(item.quantity) }, { label: "Reference", render: (item) => string(item.reference) || "—" }, { label: "Notes", render: (item) => string(item.notes) || "—" }, { label: "Created", mono: true, render: (item) => string(item.createdAt).slice(0, 10) }]} /><div><h2 className="mb-3 text-sm font-semibold">Current Stock</h2><TableContainer><thead><tr><Th>SKU</Th><Th>Product</Th><Th mono>On Hand</Th><Th mono>Reorder At</Th><Th>Status</Th></tr></thead><tbody>{data.products.map((product) => <tr key={product.id}><Td mono>{product.sku}</Td><Td>{product.name}</Td><Td mono>{product.stock}</Td><Td mono>{product.reorderLevel}</Td><Td><StatusBadge status={inventoryStatus(product)} /></Td></tr>)}</tbody></TableContainer></div></div>; }

export function ReportsPage() {
  const { data } = useLiveData();
  const [tab, setTab] = useState<"sales" | "inventory" | "suppliers">("sales");
  const { formatCurrency } = useSettings();

  // ─── Data Aggregation for Charts ───────────────────────────────────────────

  // 1. Sales Trend & Rev/Pur/Profit by Month
  const monthlyData = useMemo(() => {
    const values = new Map<string, { month: string; revenue: number; purchases: number; profit: number }>();
    for (const sale of data.sales) { 
      const month = sale.saleDate.slice(0, 7); 
      const entry = values.get(month) ?? { month, revenue: 0, purchases: 0, profit: 0 }; 
      entry.revenue += sale.total; 
      entry.profit += sale.total * 0.4; // 40% margin model for demonstration
      values.set(month, entry); 
    }
    for (const purchase of data.purchases) { 
      const month = purchase.purchaseDate.slice(0, 7); 
      const entry = values.get(month) ?? { month, revenue: 0, purchases: 0, profit: 0 }; 
      entry.purchases += purchase.total; 
      values.set(month, entry); 
    }
    return [...values.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [data.purchases, data.sales]);

  // 2. Sales by Category (Distribution)
  const categorySales = useMemo(() => {
    const colors = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#64748B"];
    const salesMap = new Map<string, number>();
    
    data.sales.forEach(sale => {
      // Look up product to find category
      const product = data.products.find(p => p.sku === sale.product || p.name === sale.product);
      const catName = product ? (product.category || "Other") : "Other";
      salesMap.set(catName, (salesMap.get(catName) || 0) + sale.total);
    });

    const total = Array.from(salesMap.values()).reduce((a, b) => a + b, 0) || 1;
    
    return Array.from(salesMap.entries()).map(([name, amount], index) => ({
      name,
      amount,
      share: Math.round((amount / total) * 100),
      color: colors[index % colors.length]
    })).sort((a, b) => b.amount - a.amount);
  }, [data.sales, data.products]);

  // 3. Inventory Stock Levels
  const stockLevels = useMemo(() => {
    return data.products.map(p => ({
      name: p.sku || p.name,
      onHand: p.stock,
      available: Math.max(0, p.stock - 5), // Mock calculation for available
      reserved: p.stock > 5 ? 5 : 0       // Mock calculation for reserved
    })).slice(0, 8); // Limit to top 8 for clean chart UI
  }, [data.products]);

  // 4. Supplier Performance
  const supplierData = useMemo(() => {
    return data.suppliers.map(s => {
      const productCount = data.products.filter(p => p.supplier === s.name).length;
      return {
        name: s.name,
        products: productCount,
        rating: 100 - (Math.random() * 20) // Mock rating between 80-100
      };
    });
  }, [data.suppliers, data.products]);


  // ─── UI Rendering ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports" 
        sub="Analytics and business insights" 
        action={
          <ActionButton tone="secondary">Export PDF</ActionButton>
        } 
      />
      <PageError />
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b border-border pb-px">
        {(["sales", "inventory", "suppliers"] as const).map((reportTab) => (
          <button 
            key={reportTab} 
            onClick={() => setTab(reportTab)} 
            className={`px-5 py-2 text-sm font-medium capitalize transition-colors border-b-2 ${
              tab === reportTab 
                ? "border-primary text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {reportTab}
          </button>
        ))}
      </div>

      {/* ─── SALES TAB ─── */}
      {tab === "sales" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Sales Trend */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-6 text-sm font-semibold text-foreground">Monthly Sales Trend</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val / 1000).replace(/\.00$/, "") + "k"} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Sales by Category */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-6 text-sm font-semibold text-foreground">Sales by Category</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categorySales} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(value: number, name: string, props: any) => [`${props.payload.share}%`, "Share"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="share" radius={[0, 4, 4, 0]} barSize={24}>
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue vs Purchases vs Profit */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-6 text-sm font-semibold text-foreground">Revenue vs Purchases vs Profit — 2024</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val / 1000).replace(/\.00$/, "") + "k"} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="purchases" fill="#3B82F6" name="Purchases" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="profit" fill="#8B5CF6" name="Profit" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="w-3 h-3 rounded-full bg-emerald-500"/> Revenue</div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="w-3 h-3 rounded-full bg-blue-500"/> Purchases</div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="w-3 h-3 rounded-full bg-violet-500"/> Profit</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── INVENTORY TAB ─── */}
      {tab === "inventory" && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-6 text-sm font-semibold text-foreground">Stock Levels by Product</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stockLevels} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="onHand" fill="#10B981" name="On Hand" radius={[4, 4, 0, 0]} />
              <Bar dataKey="available" fill="#3B82F6" name="Available" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reserved" fill="#F59E0B" name="Reserved" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─── SUPPLIERS TAB ─── */}
      {tab === "suppliers" && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-6 text-sm font-semibold text-foreground">Supplier Performance</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={supplierData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="products" fill="#10B981" name="Products Supplied" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="rating" fill="#8B5CF6" name="Rating Score" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
export function UserManagementPage() { const { data } = useLiveData(); return <CrudPage entity="users" title="Users" sub={`${data.users.length} local accounts`} addLabel="Add User" records={data.users.map(row)} columns={[{ label: "Name", render: (item) => <span className="font-medium">{string(item.name)}</span> }, { label: "Email", render: (item) => string(item.email) }, { label: "Role", render: (item) => <StatusBadge status={string(item.role)} /> }, { label: "Last Login", mono: true, render: (item) => string(item.lastLogin).slice(0, 16) || "Never" }, { label: "Status", render: (item) => <StatusBadge status={string(item.status)} /> }]} />; }
export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "security" | "integrations">("general");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Application and account preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-px">
        {(["general", "notifications", "security", "integrations"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content: General Settings */}
      {activeTab === "general" && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm max-w-3xl">
          <h2 className="text-sm font-bold text-foreground mb-6">General Settings</h2>

          <div className="space-y-6">
            {/* Company Name */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Company Name</label>
                <span className="text-xs text-muted-foreground">Your business name shown in reports and invoices</span>
              </div>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => updateSettings({ companyName: e.target.value })}
                className="w-full sm:w-64 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Currency */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Currency</label>
                <span className="text-xs text-muted-foreground">Default currency for all transactions</span>
              </div>
              <select
                value={settings.currency}
                onChange={(e) => updateSettings({ currency: e.target.value })}
                className="w-full sm:w-64 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="USD">USD ($)</option>
                <option value="PHP">PHP (₱)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {/* Fiscal Year Start */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Fiscal Year Start</label>
                <span className="text-xs text-muted-foreground">When your accounting year begins</span>
              </div>
              <select
                value={settings.fiscalYearStart}
                onChange={(e) => updateSettings({ fiscalYearStart: e.target.value })}
                className="w-full sm:w-64 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="January">January</option>
                <option value="April">April</option>
                <option value="July">July</option>
                <option value="October">October</option>
              </select>
            </div>

            {/* Low Stock Threshold */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Low Stock Threshold</label>
                <span className="text-xs text-muted-foreground">Alert when stock falls below this percentage of reorder point</span>
              </div>
              <input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => updateSettings({ lowStockThreshold: Number(e.target.value) })}
                className="w-full sm:w-64 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Auto Reorder Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Auto Reorder</label>
                <span className="text-xs text-muted-foreground">Automatically generate purchase orders at reorder point</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.autoReorder}
                  onChange={(e) => updateSettings({ autoReorder: e.target.checked })}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      )}
    {/* Tab Content: Notifications */}
      {activeTab === "notifications" && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm max-w-3xl animate-in fade-in">
          <h2 className="text-sm font-bold text-foreground mb-6">Notification Preferences</h2>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Critical Stock Alerts</label>
                <span className="text-xs text-muted-foreground">Push a notification when items drop below the reorder point</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Application Updates</label>
                <span className="text-xs text-muted-foreground">Notify me when a new version of StockWise is available</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Daily Summary Reports</label>
                <span className="text-xs text-muted-foreground">Receive a summary of all sales and purchases at end-of-day</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Security */}
      {activeTab === "security" && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm max-w-3xl animate-in fade-in">
          <h2 className="text-sm font-bold text-foreground mb-6">Security & Access</h2>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Session Timeout</label>
                <span className="text-xs text-muted-foreground">Automatically log out inactive users</span>
              </div>
              <select className="w-full sm:w-64 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">App Lock</label>
                <span className="text-xs text-muted-foreground">Require password when waking from sleep mode</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <div className="pt-2">
              <button className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-md border border-border hover:bg-muted/80 transition-colors">
                Change Admin Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Integrations */}
      {activeTab === "integrations" && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm max-w-3xl animate-in fade-in">
          <h2 className="text-sm font-bold text-foreground mb-6">System Integrations</h2>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/50">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Hardware Barcode Scanner</label>
                <span className="text-xs text-muted-foreground">Enable rapid-entry mode for USB/Bluetooth barcode scanners</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
              <div className="flex-1">
                <label className="text-sm font-semibold text-foreground block">Local Data Backup</label>
                <span className="text-xs text-muted-foreground">Export your SQLite database to a local CSV/JSON file</span>
              </div>
              <button className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-md border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>  
  );
}