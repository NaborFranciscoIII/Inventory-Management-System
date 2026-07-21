import { invoke } from "@tauri-apps/api/core";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
};

export type AuthSession = {
  sessionToken: string;
  expiresAt: string;
  user: AuthUser;
};

export type BackendEntity =
  | "users"
  | "categories"
  | "suppliers"
  | "customers"
  | "products"
  | "purchases"
  | "sales"
  | "inventory_movements";

export type RecordPayload = Record<string, string | number | null>;

const sessionKey = "stockwise.session-token";

export const sessionStore = {
  get: () => sessionStorage.getItem(sessionKey),
  save: (sessionToken: string) => sessionStorage.setItem(sessionKey, sessionToken),
  clear: () => sessionStorage.removeItem(sessionKey),
};

export function login(email: string, password: string) {
  return invoke<AuthSession>("login", { email, password });
}

export function getCurrentUser(sessionToken: string) {
  return invoke<AuthUser>("current_user", { sessionToken });
}

export function logout(sessionToken: string) {
  return invoke("logout", { sessionToken });
}

export function listRecords<T>(sessionToken: string, entity: BackendEntity) {
  return invoke<T[]>("list_records", { sessionToken, entity });
}

export function listRoles(sessionToken: string) {
  return invoke<Array<{ name: string; description: string }>>("list_roles", { sessionToken });
}

export function createRecord<T>(sessionToken: string, entity: BackendEntity, payload: RecordPayload) {
  return invoke<T>("create_record", { sessionToken, entity, payload });
}

export function updateRecord<T>(sessionToken: string, entity: BackendEntity, id: string, payload: RecordPayload) {
  return invoke<T>("update_record", { sessionToken, entity, id, payload });
}

export function deleteRecord(sessionToken: string, entity: BackendEntity, id: string) {
  return invoke("delete_record", { sessionToken, entity, id });
}
