import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Boxes,
  CheckCircle,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  ShoppingCart,
  Upload,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AddBtn,
  KpiCard,
  PageHeader,
  RowActions,
  SearchBar,
  Stars,
  StatusBadge,
  TableContainer,
  Td,
  Th,
  fmt,
  fmtCurrency,
} from "../components/common";
import {
  categoryDistribution,
  categories,
  customers,
  inventoryItems,
  products,
  purchases,
  recentActivity,
  revenueData,
  sales,
  suppliers,
  usersData,
} from "../data/mockData";

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Thursday, July 10 2024 — Overview</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Revenue" value="$71,400" change="+14.2%" icon={DollarSign} color="bg-emerald-500" />
        <KpiCard title="Orders" value="1,284" change="+8.7%" icon={ShoppingCart} color="bg-blue-500" />
        <KpiCard title="Products" value="406" change="+3.1%" icon={Boxes} color="bg-violet-500" />
        <KpiCard title="Low Stock" value="12" change="+4" icon={AlertTriangle} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-foreground">Revenue vs Purchases</span>
            <span className="text-xs text-muted-foreground">Jan – Jul 2024</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip formatter={(value: number) => fmtCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#rev)" name="Revenue" />
              <Area type="monotone" dataKey="purchases" stroke="#3B82F6" strokeWidth={2} fill="url(#pur)" name="Purchases" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-foreground">By Category</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={2}>
                {categoryDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryDistribution.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                  <span className="text-foreground">{entry.name}</span>
                </div>
                <span className="font-mono text-muted-foreground">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Recent Activity</span>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-0">
            {recentActivity.map((activity, index) => (
              <div key={`${activity.action}-${index}`} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === "in" ? "bg-emerald-100" : activity.type === "out" ? "bg-blue-100" : activity.type === "warn" ? "bg-amber-100" : "bg-slate-100"}`}>
                  {activity.type === "in" && <ArrowDownRight size={12} className="text-emerald-600" />}
                  {activity.type === "out" && <ArrowUpRight size={12} className="text-blue-600" />}
                  {activity.type === "warn" && <AlertTriangle size={12} className="text-amber-600" />}
                  {activity.type === "info" && <CheckCircle size={12} className="text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">{activity.action}</div>
                  <div className="text-xs text-muted-foreground truncate">{activity.detail}</div>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Monthly Profit</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip formatter={(value: number) => fmtCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ProductsPage() {
  return (
    <div>
      <PageHeader title="Products" sub={`${products.length} items`} action={
        <>
          <SearchBar placeholder="Search products…" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-xs font-medium hover:bg-muted/50 transition-colors"><Filter size={12} /> Filter</button>
          <AddBtn label="Add Product" />
        </>
      } />
      <TableContainer>
        <thead>
          <tr>
            <Th>SKU</Th>
            <Th>Name</Th>
            <Th>Category</Th>
            <Th>Supplier</Th>
            <Th mono>Price</Th>
            <Th mono>Stock</Th>
            <Th mono>Reorder</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-muted/20 transition-colors">
              <Td mono>{product.sku}</Td>
              <Td><span className="font-medium">{product.name}</span></Td>
              <Td>{product.category}</Td>
              <Td>{product.supplier}</Td>
              <Td mono>{fmtCurrency(product.price)}</Td>
              <Td mono>
                <span className={product.stock === 0 ? "text-red-500" : product.stock < product.reorder ? "text-amber-600" : ""}>{product.stock}</span>
              </Td>
              <Td mono>{product.reorder}</Td>
              <Td><StatusBadge status={product.status} /></Td>
              <Td><RowActions /></Td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </div>
  );
}

function CategoriesPage() {
  return (
    <div>
      <PageHeader title="Categories" sub={`${categories.length} categories`} action={
        <>
          <SearchBar placeholder="Search categories…" />
          <AddBtn label="Add Category" />
        </>
      } />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-card rounded-lg border border-border p-4 hover:shadow-sm transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-sm text-foreground">{category.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{category.description}</div>
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
                <div className="text-lg font-semibold font-mono text-foreground mt-0.5">{fmtCurrency(category.value)}</div>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex items-center gap-1 px-2 py-1 rounded text-[11px] border border-border bg-card hover:bg-muted/50 transition-colors"><RefreshCw size={11} /> Edit</button>
              <button className="flex items-center gap-1 px-2 py-1 rounded text-[11px] border border-border bg-card hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"><XCircle size={11} /> Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuppliersPage() {
  return (
    <div>
      <PageHeader title="Suppliers" sub={`${suppliers.length} suppliers`} action={
        <>
          <SearchBar placeholder="Search suppliers…" />
          <AddBtn label="Add Supplier" />
        </>
      } />
      <TableContainer>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Name</Th>
            <Th>Contact</Th>
            <Th>Phone</Th>
            <Th>Country</Th>
            <Th mono>Products</Th>
            <Th>Rating</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id} className="hover:bg-muted/20 transition-colors">
              <Td mono>{supplier.id}</Td>
              <Td><span className="font-medium">{supplier.name}</span></Td>
              <Td><a className="text-primary hover:underline">{supplier.contact}</a></Td>
              <Td mono>{supplier.phone}</Td>
              <Td>{supplier.country}</Td>
              <Td mono>{supplier.products}</Td>
              <Td><Stars n={supplier.rating} /></Td>
              <Td><StatusBadge status={supplier.status} /></Td>
              <Td><RowActions /></Td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </div>
  );
}

function CustomersPage() {
  return (
    <div>
      <PageHeader title="Customers" sub={`${customers.length} customers`} action={
        <>
          <SearchBar placeholder="Search customers…" />
          <AddBtn label="Add Customer" />
        </>
      } />
      <TableContainer>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>City</Th>
            <Th mono>Orders</Th>
            <Th mono>Total Spent</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-muted/20 transition-colors">
              <Td mono>{customer.id}</Td>
              <Td><span className="font-medium">{customer.name}</span></Td>
              <Td><a className="text-primary hover:underline">{customer.email}</a></Td>
              <Td mono>{customer.phone}</Td>
              <Td>{customer.city}</Td>
              <Td mono>{customer.orders}</Td>
              <Td mono>{fmtCurrency(customer.spent)}</Td>
              <Td><StatusBadge status={customer.status} /></Td>
              <Td><RowActions /></Td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </div>
  );
}

function PurchasesPage() {
  return (
    <div>
      <PageHeader title="Purchases" sub={`${purchases.length} orders`} action={
        <>
          <SearchBar placeholder="Search PO…" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-xs font-medium hover:bg-muted/50 transition-colors"><Upload size={12} /> Import</button>
          <AddBtn label="New PO" />
        </>
      } />
      <TableContainer>
        <thead>
          <tr>
            <Th>PO Number</Th>
            <Th>Supplier</Th>
            <Th>Date</Th>
            <Th mono>Items</Th>
            <Th mono>Total</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr key={purchase.id} className="hover:bg-muted/20 transition-colors">
              <Td mono>{purchase.id}</Td>
              <Td><span className="font-medium">{purchase.supplier}</span></Td>
              <Td mono>{purchase.date}</Td>
              <Td mono>{purchase.items}</Td>
              <Td mono>{fmtCurrency(purchase.total)}</Td>
              <Td><StatusBadge status={purchase.status} /></Td>
              <Td><RowActions /></Td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </div>
  );
}

function SalesPage() {
  return (
    <div>
      <PageHeader title="Sales" sub={`${sales.length} orders`} action={
        <>
          <SearchBar placeholder="Search SO…" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-xs font-medium hover:bg-muted/50 transition-colors"><Download size={12} /> Export</button>
          <AddBtn label="New Sale" />
        </>
      } />
      <TableContainer>
        <thead>
          <tr>
            <Th>SO Number</Th>
            <Th>Customer</Th>
            <Th>Date</Th>
            <Th mono>Items</Th>
            <Th mono>Total</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className="hover:bg-muted/20 transition-colors">
              <Td mono>{sale.id}</Td>
              <Td><span className="font-medium">{sale.customer}</span></Td>
              <Td mono>{sale.date}</Td>
              <Td mono>{sale.items}</Td>
              <Td mono>{fmtCurrency(sale.total)}</Td>
              <Td><StatusBadge status={sale.status} /></Td>
              <Td><RowActions /></Td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </div>
  );
}

function InventoryPage() {
  const critical = inventoryItems.filter((item) => item.status === "Critical" || item.status === "Out").length;
  const low = inventoryItems.filter((item) => item.status === "Low").length;

  return (
    <div>
      <PageHeader title="Inventory" sub="Real-time stock levels across all warehouses" action={
        <>
          <SearchBar placeholder="Search SKU…" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-xs font-medium hover:bg-muted/50 transition-colors"><RefreshCw size={12} /> Sync</button>
        </>
      } />
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-card rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><CheckCircle size={16} className="text-emerald-600" /></div>
          <div><div className="text-lg font-semibold font-mono text-foreground">{inventoryItems.filter((item) => item.status === "OK").length}</div><div className="text-[11px] text-muted-foreground">In Stock</div></div>
        </div>
        <div className="bg-card rounded-lg border border-amber-200 p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><AlertTriangle size={16} className="text-amber-600" /></div>
          <div><div className="text-lg font-semibold font-mono text-foreground">{low}</div><div className="text-[11px] text-muted-foreground">Low Stock</div></div>
        </div>
        <div className="bg-card rounded-lg border border-red-200 p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><XCircle size={16} className="text-red-600" /></div>
          <div><div className="text-lg font-semibold font-mono text-foreground">{critical}</div><div className="text-[11px] text-muted-foreground">Critical / Out</div></div>
        </div>
      </div>
      <TableContainer>
        <thead>
          <tr>
            <Th>SKU</Th>
            <Th>Product</Th>
            <Th>Warehouse</Th>
            <Th mono>On Hand</Th>
            <Th mono>Reserved</Th>
            <Th mono>Available</Th>
            <Th mono>Reorder At</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {inventoryItems.map((item) => (
            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
              <Td mono>{item.sku}</Td>
              <Td><span className="font-medium">{item.name}</span></Td>
              <Td>{item.warehouse}</Td>
              <Td mono>{item.onHand}</Td>
              <Td mono>{item.reserved}</Td>
              <Td mono>
                <span className={item.available === 0 ? "text-red-500 font-semibold" : item.available < item.reorder ? "text-amber-600 font-semibold" : ""}>{item.available}</span>
              </Td>
              <Td mono>{item.reorder}</Td>
              <Td><StatusBadge status={item.status} /></Td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </div>
  );
}

function ReportsPage() {
  const [tab, setTab] = useState<"sales" | "inventory" | "suppliers">("sales");

  return (
    <div>
      <PageHeader title="Reports" sub="Analytics and business insights" action={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"><Download size={13} /> Export PDF</button>
      } />
      <div className="flex gap-1 mb-5 bg-muted/40 p-1 rounded-lg w-fit border border-border">
        {(["sales", "inventory", "suppliers"] as const).map((reportTab) => (
          <button key={reportTab} onClick={() => setTab(reportTab)} className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${tab === reportTab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {reportTab}
          </button>
        ))}
      </div>

      {tab === "sales" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-sm font-semibold text-foreground mb-4">Monthly Sales Trend</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip formatter={(value: number) => fmtCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="Profit" strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-sm font-semibold text-foreground mb-4">Sales by Category</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryDistribution} layout="vertical" margin={{ top: 0, right: 4, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Share">
                    {categoryDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-sm font-semibold text-foreground mb-4">Revenue vs Purchases vs Profit — 2024</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip formatter={(value: number) => fmtCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="purchases" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Purchases" />
                <Bar dataKey="profit" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm font-semibold text-foreground mb-4">Stock Levels by Product</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={inventoryItems.map((item) => ({ name: item.sku.substring(0, 10), onHand: item.onHand, available: item.available, reserved: item.reserved }))} margin={{ top: 4, right: 4, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="onHand" fill="#10B981" radius={[4, 4, 0, 0]} name="On Hand" />
              <Bar dataKey="available" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Available" />
              <Bar dataKey="reserved" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Reserved" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === "suppliers" && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm font-semibold text-foreground mb-4">Supplier Performance</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={suppliers.map((supplier) => ({ name: supplier.name.split(" ")[0], products: supplier.products, rating: supplier.rating * 20 }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="products" fill="#10B981" radius={[4, 4, 0, 0]} name="Products" />
              <Bar dataKey="rating" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Rating Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function UserManagementPage() {
  return (
    <div>
      <PageHeader title="Users" sub={`${usersData.length} team members`} action={
        <>
          <SearchBar placeholder="Search users…" />
          <AddBtn label="Invite User" />
        </>
      } />
      <TableContainer>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Last Login</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {usersData.map((user) => (
            <tr key={user.id} className="hover:bg-muted/20 transition-colors">
              <Td mono>{user.id}</Td>
              <Td>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                    {user.name.split(" ").map((segment) => segment[0]).join("")}
                  </div>
                  <span className="font-medium">{user.name}</span>
                </div>
              </Td>
              <Td><a className="text-primary hover:underline">{user.email}</a></Td>
              <Td><StatusBadge status={user.role} /></Td>
              <Td mono>{user.lastLogin}</Td>
              <Td><StatusBadge status={user.status} /></Td>
              <Td><RowActions /></Td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => setOn(!on)} className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center px-0.5 ${on ? "bg-primary" : "bg-muted"}`} style={{ height: 22 }}>
      <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} style={{ minWidth: 16, minHeight: 16 }} />
    </button>
  );
}

function SettingsPage() {
  const [settingsTab, setSettingsTab] = useState<"general" | "notifications" | "security" | "integrations">("general");

  return (
    <div>
      <PageHeader title="Settings" sub="Application and account preferences" />
      <div className="flex gap-1 mb-6 bg-muted/40 p-1 rounded-lg w-fit border border-border">
        {(["general", "notifications", "security", "integrations"] as const).map((tab) => (
          <button key={tab} onClick={() => setSettingsTab(tab)} className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${settingsTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-border p-5 max-w-2xl">
        {settingsTab === "general" && (
          <div>
            <div className="text-sm font-semibold text-foreground mb-4">General Settings</div>
            <SettingRow label="Company Name" description="Your business name shown in reports and invoices">
              <input defaultValue="StockWise Inc." className="px-3 py-1.5 rounded-md border border-border bg-input-background text-xs w-48 focus:outline-none focus:ring-1 focus:ring-primary" />
            </SettingRow>
            <SettingRow label="Currency" description="Default currency for all transactions">
              <select className="px-3 py-1.5 rounded-md border border-border bg-input-background text-xs w-32 focus:outline-none focus:ring-1 focus:ring-primary">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </SettingRow>
            <SettingRow label="Fiscal Year Start" description="When your accounting year begins">
              <select className="px-3 py-1.5 rounded-md border border-border bg-input-background text-xs w-32 focus:outline-none focus:ring-1 focus:ring-primary">
                <option>January</option>
                <option>April</option>
                <option>July</option>
              </select>
            </SettingRow>
            <SettingRow label="Low Stock Threshold" description="Alert when stock falls below this percentage of reorder point">
              <input type="number" defaultValue={20} className="px-3 py-1.5 rounded-md border border-border bg-input-background text-xs w-20 font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
            </SettingRow>
            <SettingRow label="Auto Reorder" description="Automatically generate purchase orders at reorder point">
              <Toggle defaultOn />
            </SettingRow>
          </div>
        )}
        {settingsTab === "notifications" && (
          <div>
            <div className="text-sm font-semibold text-foreground mb-4">Notification Preferences</div>
            <SettingRow label="Low Stock Alerts" description="Notify when products reach reorder point"><Toggle defaultOn /></SettingRow>
            <SettingRow label="New Orders" description="Notify on incoming sales orders"><Toggle defaultOn /></SettingRow>
            <SettingRow label="Purchase Order Updates" description="Updates on PO status changes"><Toggle defaultOn /></SettingRow>
            <SettingRow label="Daily Summary Email" description="Receive a daily digest at 8:00 AM"><Toggle /></SettingRow>
            <SettingRow label="Critical Stock Alerts (SMS)" description="SMS notifications for out-of-stock items"><Toggle /></SettingRow>
          </div>
        )}
        {settingsTab === "security" && (
          <div>
            <div className="text-sm font-semibold text-foreground mb-4">Security Settings</div>
            <SettingRow label="Two-Factor Authentication" description="Require 2FA for all user accounts"><Toggle /></SettingRow>
            <SettingRow label="Session Timeout" description="Auto-logout after inactivity">
              <select className="px-3 py-1.5 rounded-md border border-border bg-input-background text-xs w-36 focus:outline-none focus:ring-1 focus:ring-primary">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>8 hours</option>
              </select>
            </SettingRow>
            <SettingRow label="Password Policy" description="Minimum password requirements"><Toggle defaultOn /></SettingRow>
            <SettingRow label="Audit Log Retention" description="How long to keep activity logs">
              <select className="px-3 py-1.5 rounded-md border border-border bg-input-background text-xs w-36 focus:outline-none focus:ring-1 focus:ring-primary">
                <option>90 days</option>
                <option>180 days</option>
                <option>1 year</option>
              </select>
            </SettingRow>
          </div>
        )}
        {settingsTab === "integrations" && (
          <div>
            <div className="text-sm font-semibold text-foreground mb-4">Integrations</div>
            {[
              { name: "Shopify", desc: "Sync products and orders", active: true },
              { name: "QuickBooks", desc: "Export invoices and expenses", active: true },
              { name: "Slack", desc: "Send alerts to channels", active: false },
              { name: "Zapier", desc: "Automate workflows", active: false },
              { name: "FedEx API", desc: "Track shipments in real time", active: true },
            ].map((integration) => (
              <SettingRow key={integration.name} label={integration.name} description={integration.desc}>
                <div className="flex items-center gap-3">
                  <StatusBadge status={integration.active ? "Active" : "Inactive"} />
                  <button className="text-xs text-primary hover:underline">{integration.active ? "Configure" : "Connect"}</button>
                </div>
              </SettingRow>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export {
  DashboardPage,
  ProductsPage,
  CategoriesPage,
  SuppliersPage,
  CustomersPage,
  PurchasesPage,
  SalesPage,
  InventoryPage,
  ReportsPage,
  UserManagementPage,
  SettingsPage,
};
