import type { ElementType } from "react";
import {
  LayoutDashboard,
  Package,
  Tag,
  Truck,
  Users,
  ShoppingCart,
  TrendingUp,
  Archive,
  BarChart2,
  UserCog,
  Settings,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon: ElementType;
  badge?: number;
};

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "customers", label: "Customers", icon: Users },
  { id: "purchases", label: "Purchases", icon: ShoppingCart },
  { id: "sales", label: "Sales", icon: TrendingUp },
  { id: "inventory", label: "Inventory", icon: Archive },
  { id: "reports", label: "Reports", icon: BarChart2 },
  { id: "users", label: "Users", icon: UserCog },
  { id: "settings", label: "Settings", icon: Settings },
];

export const revenueData = [
  { month: "Jan", revenue: 42000, purchases: 18000, profit: 24000 },
  { month: "Feb", revenue: 38500, purchases: 16000, profit: 22500 },
  { month: "Mar", revenue: 51000, purchases: 21000, profit: 30000 },
  { month: "Apr", revenue: 47800, purchases: 19500, profit: 28300 },
  { month: "May", revenue: 63200, purchases: 24000, profit: 39200 },
  { month: "Jun", revenue: 58900, purchases: 22800, profit: 36100 },
  { month: "Jul", revenue: 71400, purchases: 27000, profit: 44400 },
];

export const categoryDistribution = [
  { name: "Electronics", value: 38, color: "#10B981" },
  { name: "Clothing", value: 22, color: "#3B82F6" },
  { name: "Food & Bev", value: 17, color: "#F59E0B" },
  { name: "Furniture", value: 13, color: "#8B5CF6" },
  { name: "Other", value: 10, color: "#64748B" },
];

export const products = [
  { id: "P-001", name: 'MacBook Pro 14"', sku: "MBP-14-2024", category: "Electronics", stock: 24, reorder: 10, price: 1999, status: "Active", supplier: "Apple Inc." },
  { id: "P-002", name: "Sony WH-1000XM5", sku: "SONY-XM5-BLK", category: "Electronics", stock: 6, reorder: 15, price: 349, status: "Low Stock", supplier: "Sony Corp." },
  { id: "P-003", name: "Levi's 501 Jeans", sku: "LEV-501-32W", category: "Clothing", stock: 112, reorder: 30, price: 79, status: "Active", supplier: "Levi Strauss" },
  { id: "P-004", name: "Herman Miller Aeron", sku: "HM-AERON-BLK", category: "Furniture", stock: 3, reorder: 5, price: 1450, status: "Low Stock", supplier: "Herman Miller" },
  { id: "P-005", name: "Nespresso Vertuo", sku: "NESP-VERT-GRY", category: "Electronics", stock: 47, reorder: 20, price: 199, status: "Active", supplier: "Nestlé S.A." },
  { id: "P-006", name: "Patagonia Fleece", sku: "PAT-FLC-NVY-M", category: "Clothing", stock: 0, reorder: 25, price: 149, status: "Out of Stock", supplier: "Patagonia Inc." },
  { id: "P-007", name: "Cold Brew Concentrate", sku: "CB-CONC-32OZ", category: "Food & Bev", stock: 88, reorder: 50, price: 14, status: "Active", supplier: "Blue Bottle Coffee" },
  { id: "P-008", name: 'LG 27" 4K Monitor', sku: "LG-27UK-SLV", category: "Electronics", stock: 18, reorder: 8, price: 599, status: "Active", supplier: "LG Electronics" },
];

export const categories = [
  { id: "C-001", name: "Electronics", description: "Computers, phones, gadgets", products: 142, value: 284600, status: "Active" },
  { id: "C-002", name: "Clothing", description: "Apparel and accessories", products: 87, value: 42300, status: "Active" },
  { id: "C-003", name: "Food & Beverage", description: "Consumables and drinks", products: 63, value: 18900, status: "Active" },
  { id: "C-004", name: "Furniture", description: "Office and home furniture", products: 34, value: 127400, status: "Active" },
  { id: "C-005", name: "Sports", description: "Equipment and apparel", products: 51, value: 38200, status: "Active" },
  { id: "C-006", name: "Books", description: "Print and digital media", products: 29, value: 5800, status: "Inactive" },
];

export const suppliers = [
  { id: "S-001", name: "Apple Inc.", contact: "vendor@apple.com", phone: "+1 408 996 1010", country: "USA", products: 18, rating: 5, status: "Active" },
  { id: "S-002", name: "Sony Corporation", contact: "orders@sony.com", phone: "+81 3 6748 2111", country: "Japan", products: 32, rating: 4, status: "Active" },
  { id: "S-003", name: "Levi Strauss & Co.", contact: "wholesale@levi.com", phone: "+1 415 501 6000", country: "USA", products: 45, rating: 5, status: "Active" },
  { id: "S-004", name: "Herman Miller", contact: "trade@hermanmiller.com", phone: "+1 616 654 3000", country: "USA", products: 12, rating: 4, status: "Active" },
  { id: "S-005", name: "Blue Bottle Coffee", contact: "wholesale@bluebottle.com", phone: "+1 510 653 3394", country: "USA", products: 8, rating: 3, status: "Active" },
  { id: "S-006", name: "LG Electronics", contact: "b2b@lg.com", phone: "+82 2 3777 1114", country: "South Korea", products: 27, rating: 4, status: "Inactive" },
];

export const customers = [
  { id: "CU-001", name: "Meridian Corp.", email: "procurement@meridian.com", phone: "+1 212 555 0140", city: "New York", orders: 24, spent: 48600, status: "VIP" },
  { id: "CU-002", name: "Starfield Solutions", email: "orders@starfield.io", phone: "+1 415 555 0182", city: "San Francisco", orders: 11, spent: 22100, status: "Active" },
  { id: "CU-003", name: "Pinnacle Retail", email: "buying@pinnacle.co", phone: "+1 312 555 0193", city: "Chicago", orders: 38, spent: 91400, status: "VIP" },
  { id: "CU-004", name: "Harbor Tech", email: "supply@harbortech.com", phone: "+1 617 555 0221", city: "Boston", orders: 7, spent: 14200, status: "Active" },
  { id: "CU-005", name: "Vega Distributors", email: "vega@vegadist.com", phone: "+1 305 555 0167", city: "Miami", orders: 3, spent: 4800, status: "New" },
  { id: "CU-006", name: "Crestwood Group", email: "ops@crestwood.biz", phone: "+1 713 555 0210", city: "Houston", orders: 0, spent: 0, status: "Inactive" },
];

export const purchases = [
  { id: "PO-2024-0087", supplier: "Apple Inc.", date: "2024-07-08", items: 4, total: 42800, status: "Received" },
  { id: "PO-2024-0086", supplier: "Sony Corporation", date: "2024-07-06", items: 6, total: 18400, status: "Pending" },
  { id: "PO-2024-0085", supplier: "Herman Miller", date: "2024-07-04", items: 2, total: 8700, status: "In Transit" },
  { id: "PO-2024-0084", supplier: "Levi Strauss & Co.", date: "2024-07-02", items: 12, total: 7200, status: "Received" },
  { id: "PO-2024-0083", supplier: "Blue Bottle Coffee", date: "2024-06-30", items: 8, total: 1120, status: "Received" },
  { id: "PO-2024-0082", supplier: "LG Electronics", date: "2024-06-28", items: 5, total: 14750, status: "Cancelled" },
];

export const sales = [
  { id: "SO-2024-0312", customer: "Meridian Corp.", date: "2024-07-09", items: 3, total: 6400, status: "Fulfilled" },
  { id: "SO-2024-0311", customer: "Pinnacle Retail", date: "2024-07-09", items: 7, total: 18900, status: "Processing" },
  { id: "SO-2024-0310", customer: "Starfield Solutions", date: "2024-07-08", items: 2, total: 3998, status: "Fulfilled" },
  { id: "SO-2024-0309", customer: "Harbor Tech", date: "2024-07-07", items: 1, total: 1999, status: "Shipped" },
  { id: "SO-2024-0308", customer: "Vega Distributors", date: "2024-07-06", items: 5, total: 4750, status: "Fulfilled" },
  { id: "SO-2024-0307", customer: "Meridian Corp.", date: "2024-07-05", items: 9, total: 22600, status: "Refunded" },
];

export const inventoryItems = [
  { id: "P-001", name: 'MacBook Pro 14"', sku: "MBP-14-2024", warehouse: "WH-A", onHand: 24, reserved: 3, available: 21, reorder: 10, status: "OK" },
  { id: "P-002", name: "Sony WH-1000XM5", sku: "SONY-XM5-BLK", warehouse: "WH-A", onHand: 6, reserved: 0, available: 6, reorder: 15, status: "Low" },
  { id: "P-003", name: "Levi's 501 Jeans", sku: "LEV-501-32W", warehouse: "WH-B", onHand: 112, reserved: 24, available: 88, reorder: 30, status: "OK" },
  { id: "P-004", name: "Herman Miller Aeron", sku: "HM-AERON-BLK", warehouse: "WH-A", onHand: 3, reserved: 1, available: 2, reorder: 5, status: "Critical" },
  { id: "P-005", name: "Nespresso Vertuo", sku: "NESP-VERT-GRY", warehouse: "WH-B", onHand: 47, reserved: 8, available: 39, reorder: 20, status: "OK" },
  { id: "P-006", name: "Patagonia Fleece", sku: "PAT-FLC-NVY-M", warehouse: "WH-B", onHand: 0, reserved: 0, available: 0, reorder: 25, status: "Out" },
  { id: "P-007", name: "Cold Brew Concentrate", sku: "CB-CONC-32OZ", warehouse: "WH-C", onHand: 88, reserved: 15, available: 73, reorder: 50, status: "OK" },
  { id: "P-008", name: 'LG 27" 4K Monitor', sku: "LG-27UK-SLV", warehouse: "WH-A", onHand: 18, reserved: 2, available: 16, reorder: 8, status: "OK" },
];

export const usersData = [
  { id: "U-001", name: "Elena Vasquez", email: "elena@stockwise.io", role: "Admin", lastLogin: "2024-07-09 14:23", status: "Active" },
  { id: "U-002", name: "Marcus Okafor", email: "marcus@stockwise.io", role: "Manager", lastLogin: "2024-07-09 11:47", status: "Active" },
  { id: "U-003", name: "Priya Sharma", email: "priya@stockwise.io", role: "Sales Rep", lastLogin: "2024-07-08 16:02", status: "Active" },
  { id: "U-004", name: "Tom Andersson", email: "tom@stockwise.io", role: "Warehouse", lastLogin: "2024-07-07 08:30", status: "Active" },
  { id: "U-005", name: "Chloe Martin", email: "chloe@stockwise.io", role: "Sales Rep", lastLogin: "2024-07-01 09:15", status: "Inactive" },
];

export const recentActivity = [
  { action: "Stock received", detail: '42 units of MacBook Pro 14"', time: "10 min ago", type: "in" },
  { action: "Order fulfilled", detail: "SO-2024-0312 — Meridian Corp.", time: "32 min ago", type: "out" },
  { action: "Low stock alert", detail: "Sony WH-1000XM5 below reorder point", time: "1 hr ago", type: "warn" },
  { action: "New customer", detail: "Vega Distributors onboarded", time: "3 hr ago", type: "info" },
  { action: "PO raised", detail: "PO-2024-0087 sent to Apple Inc.", time: "5 hr ago", type: "in" },
  { action: "Out of stock", detail: "Patagonia Fleece — 0 units remaining", time: "6 hr ago", type: "warn" },
];
