import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createRecord,
  deleteRecord,
  listRecords,
  listRoles,
  updateRecord,
  type AuthSession,
  type AuthUser,
  type BackendEntity,
  type RecordPayload,
} from "../services/backend";

export type Category = { id: string; name: string; description: string; status: string; products: number; value: number };
export type Supplier = { id: string; name: string; contactName: string; email: string; phone: string; country: string; status: string; products: number };
export type Customer = { id: string; name: string; email: string; phone: string; city: string; tier: string; status: string; orders: number; spent: number };
export type Product = { id: string; sku: string; name: string; categoryId: string; category: string; supplierId: string | null; supplier: string; price: number; stock: number; reorderLevel: number; status: string };
export type Purchase = { id: string; productId: string; product: string; supplierId: string; supplier: string; quantity: number; unitPrice: number; total: number; purchaseDate: string; status: string };
export type Sale = { id: string; productId: string; product: string; customerId: string; customer: string; quantity: number; unitPrice: number; total: number; saleDate: string; status: string };
export type InventoryMovement = { id: string; productId: string; product: string; movementType: string; quantity: number; reference: string; notes: string; createdAt: string; createdBy: string };

export type LiveData = {
  users: AuthUser[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  inventoryMovements: InventoryMovement[];
};

const emptyData: LiveData = { users: [], categories: [], suppliers: [], customers: [], products: [], purchases: [], sales: [], inventoryMovements: [] };

type LiveDataContextValue = {
  data: LiveData;
  roles: Array<{ name: string; description: string }>;
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
  create: (entity: BackendEntity, payload: RecordPayload) => Promise<void>;
  update: (entity: BackendEntity, id: string, payload: RecordPayload) => Promise<void>;
  remove: (entity: BackendEntity, id: string) => Promise<void>;
};

const LiveDataContext = createContext<LiveDataContextValue | null>(null);

async function loadAllowed<T>(request: Promise<T[]>) {
  try {
    return await request;
  } catch {
    return [] as T[];
  }
}

export function LiveDataProvider({ session, children }: { session: AuthSession; children: ReactNode }) {
  const [data, setData] = useState<LiveData>(emptyData);
  const [roles, setRoles] = useState<Array<{ name: string; description: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = session.sessionToken;
      const [users, categories, suppliers, customers, products, purchases, sales, inventoryMovements, availableRoles] = await Promise.all([
        loadAllowed(listRecords<AuthUser>(token, "users")),
        loadAllowed(listRecords<Category>(token, "categories")),
        loadAllowed(listRecords<Supplier>(token, "suppliers")),
        loadAllowed(listRecords<Customer>(token, "customers")),
        loadAllowed(listRecords<Product>(token, "products")),
        loadAllowed(listRecords<Purchase>(token, "purchases")),
        loadAllowed(listRecords<Sale>(token, "sales")),
        loadAllowed(listRecords<InventoryMovement>(token, "inventory_movements")),
        loadAllowed(listRoles(token)),
      ]);
      setData({ users, categories, suppliers, customers, products, purchases, sales, inventoryMovements });
      setRoles(availableRoles);
    } catch (reason) {
      setError(String(reason).replace(/^Error:\s*/, "") || "Could not load local data.");
    } finally {
      setIsLoading(false);
    }
  }, [session.sessionToken]);

  useEffect(() => { void refresh(); }, [refresh]);

  const runMutation = useCallback(async (operation: () => Promise<unknown>) => {
    setError("");
    try {
      await operation();
      await refresh();
    } catch (reason) {
      const message = String(reason).replace(/^Error:\s*/, "") || "The change could not be saved.";
      setError(message);
      throw new Error(message);
    }
  }, [refresh]);

  const value = useMemo(() => ({
    data,
    roles,
    isLoading,
    error,
    refresh,
    create: (entity: BackendEntity, payload: RecordPayload) => runMutation(() => createRecord(session.sessionToken, entity, payload)),
    update: (entity: BackendEntity, id: string, payload: RecordPayload) => runMutation(() => updateRecord(session.sessionToken, entity, id, payload)),
    remove: (entity: BackendEntity, id: string) => runMutation(() => deleteRecord(session.sessionToken, entity, id)),
  }), [data, error, isLoading, refresh, roles, runMutation, session.sessionToken]);

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData() {
  const context = useContext(LiveDataContext);
  if (!context) throw new Error("useLiveData must be used inside LiveDataProvider.");
  return context;
}
