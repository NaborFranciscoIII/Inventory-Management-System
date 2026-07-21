use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use rusqlite::{params, types::ValueRef, Connection, OptionalExtension, Transaction};
use serde::Serialize;
use serde_json::{json, Map, Value};
use std::{collections::HashMap, fs, path::PathBuf, sync::Mutex};
use uuid::Uuid;

const TEST_ADMIN_EMAIL: &str = "admin@stockwise.local";
const TEST_ADMIN_PASSWORD: &str = "Admin123!";
const SESSION_HOURS: i64 = 8;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String,
    pub status: String,
    pub created_at: String,
    pub last_login: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponse {
    pub session_token: String,
    pub expires_at: String,
    pub user: User,
}

#[derive(Debug, Clone)]
struct Session {
    user_id: String,
    role: String,
    expires_at: chrono::DateTime<Utc>,
}

pub struct AppState {
    database: Mutex<Database>,
    sessions: Mutex<HashMap<String, Session>>,
}

impl AppState {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            database: Mutex::new(Database::open()?),
            sessions: Mutex::new(HashMap::new()),
        })
    }
}

pub struct Database {
    conn: Connection,
}

impl Database {
    fn open() -> Result<Self, String> {
        let path = database_path()?;
        let conn = Connection::open(path).map_err(sql_error("open the SQLite database"))?;
        conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")
            .map_err(sql_error("configure SQLite"))?;
        let mut database = Self { conn };
        database.migrate()?;
        database.seed()?;
        Ok(database)
    }

    fn migrate(&mut self) -> Result<(), String> {
        self.conn
            .execute_batch(
                r#"
                CREATE TABLE IF NOT EXISTS roles (
                    name TEXT PRIMARY KEY,
                    description TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL REFERENCES roles(name),
                    status TEXT NOT NULL CHECK(status IN ('Active', 'Inactive')),
                    created_at TEXT NOT NULL,
                    last_login TEXT
                );

                CREATE TABLE IF NOT EXISTS categories (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    description TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'Active'
                );

                CREATE TABLE IF NOT EXISTS suppliers (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    contact_name TEXT NOT NULL DEFAULT '',
                    email TEXT NOT NULL DEFAULT '',
                    phone TEXT NOT NULL DEFAULT '',
                    country TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'Active'
                );

                CREATE TABLE IF NOT EXISTS customers (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL DEFAULT '',
                    phone TEXT NOT NULL DEFAULT '',
                    city TEXT NOT NULL DEFAULT '',
                    tier TEXT NOT NULL DEFAULT 'Standard',
                    status TEXT NOT NULL DEFAULT 'Active'
                );

                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    sku TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    name TEXT NOT NULL,
                    category_id TEXT NOT NULL REFERENCES categories(id),
                    supplier_id TEXT REFERENCES suppliers(id),
                    price REAL NOT NULL CHECK(price >= 0),
                    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
                    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK(reorder_level >= 0),
                    status TEXT NOT NULL DEFAULT 'Active'
                );

                CREATE TABLE IF NOT EXISTS purchases (
                    id TEXT PRIMARY KEY,
                    product_id TEXT NOT NULL REFERENCES products(id),
                    supplier_id TEXT NOT NULL REFERENCES suppliers(id),
                    quantity INTEGER NOT NULL CHECK(quantity > 0),
                    unit_price REAL NOT NULL CHECK(unit_price >= 0),
                    total REAL NOT NULL CHECK(total >= 0),
                    purchase_date TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'Received'
                );

                CREATE TABLE IF NOT EXISTS sales (
                    id TEXT PRIMARY KEY,
                    product_id TEXT NOT NULL REFERENCES products(id),
                    customer_id TEXT NOT NULL REFERENCES customers(id),
                    quantity INTEGER NOT NULL CHECK(quantity > 0),
                    unit_price REAL NOT NULL CHECK(unit_price >= 0),
                    total REAL NOT NULL CHECK(total >= 0),
                    sale_date TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'Fulfilled'
                );

                CREATE TABLE IF NOT EXISTS inventory_movements (
                    id TEXT PRIMARY KEY,
                    product_id TEXT NOT NULL REFERENCES products(id),
                    movement_type TEXT NOT NULL CHECK(movement_type IN ('IN', 'OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT')),
                    quantity INTEGER NOT NULL CHECK(quantity > 0),
                    reference TEXT NOT NULL DEFAULT '',
                    notes TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    created_by TEXT NOT NULL REFERENCES users(id)
                );

                CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
                CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
                CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(product_id);
                CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
                CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
                "#,
            )
            .map_err(sql_error("create the SQLite schema"))
    }

    fn seed(&mut self) -> Result<(), String> {
        for (name, description) in [
            ("Admin", "Full access, including users and roles."),
            (
                "Manager",
                "Full access to business records, except user administration.",
            ),
            (
                "Sales",
                "Customers and sales, with read-only catalogue access.",
            ),
            (
                "Warehouse",
                "Products, purchasing, suppliers and stock movements.",
            ),
        ] {
            self.conn
                .execute(
                    "INSERT OR IGNORE INTO roles (name, description) VALUES (?1, ?2)",
                    params![name, description],
                )
                .map_err(sql_error("seed roles"))?;
        }

        let admin_exists: Option<String> = self
            .conn
            .query_row(
                "SELECT id FROM users WHERE email = ?1",
                params![TEST_ADMIN_EMAIL],
                |row| row.get(0),
            )
            .optional()
            .map_err(sql_error("look up the seed administrator"))?;

        if admin_exists.is_none() {
            self.conn.execute(
                "INSERT INTO users (id, name, email, password_hash, role, status, created_at) VALUES (?1, ?2, ?3, ?4, 'Admin', 'Active', ?5)",
                params![new_id(), "Elena Vasquez", TEST_ADMIN_EMAIL, hash_password(TEST_ADMIN_PASSWORD)?, now()],
            ).map_err(sql_error("create the test administrator"))?;
        }

        let category_count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM categories", [], |row| row.get(0))
            .map_err(sql_error("inspect categories"))?;
        if category_count == 0 {
            self.conn.execute("INSERT INTO categories (id, name, description) VALUES ('cat-electronics', 'Electronics', 'Computers, phones, and gadgets')", [])
                .map_err(sql_error("seed categories"))?;
        }

        let supplier_count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM suppliers", [], |row| row.get(0))
            .map_err(sql_error("inspect suppliers"))?;
        if supplier_count == 0 {
            self.conn.execute("INSERT INTO suppliers (id, name, contact_name, email, phone, country) VALUES ('sup-apple', 'Apple Inc.', 'Vendor desk', 'vendor@apple.example', '+1 408 996 1010', 'USA')", [])
                .map_err(sql_error("seed suppliers"))?;
        }
        Ok(())
    }

    fn authenticate(&mut self, email: &str, password: &str) -> Result<Option<User>, String> {
        let user = self.user_by_email(email)?;
        let Some(user) = user else {
            return Ok(None);
        };
        let hash: String = self
            .conn
            .query_row(
                "SELECT password_hash FROM users WHERE id = ?1",
                params![user.id],
                |row| row.get(0),
            )
            .map_err(sql_error("load the password hash"))?;
        if user.status != "Active" || !verify_password(password, &hash) {
            return Ok(None);
        }
        let timestamp = now();
        self.conn
            .execute(
                "UPDATE users SET last_login = ?1 WHERE id = ?2",
                params![timestamp, user.id],
            )
            .map_err(sql_error("record the login"))?;
        self.user_by_id(&user.id)
    }

    fn user_by_email(&self, email: &str) -> Result<Option<User>, String> {
        self.conn.query_row(
            "SELECT id, name, email, role, status, created_at, last_login FROM users WHERE email = ?1",
            params![email], user_from_row,
        ).optional().map_err(sql_error("load the user"))
    }

    fn user_by_id(&self, id: &str) -> Result<Option<User>, String> {
        self.conn.query_row(
            "SELECT id, name, email, role, status, created_at, last_login FROM users WHERE id = ?1",
            params![id], user_from_row,
        ).optional().map_err(sql_error("load the user"))
    }

    fn list(&self, entity: &str) -> Result<Vec<Value>, String> {
        let sql = match entity {
            "users" => "SELECT id, name, email, role, status, created_at, last_login FROM users ORDER BY name",
            "categories" => "SELECT c.id, c.name, c.description, c.status, COUNT(p.id) AS products, COALESCE(SUM(p.stock * p.price), 0) AS value FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.name",
            "suppliers" => "SELECT s.id, s.name, s.contact_name, s.email, s.phone, s.country, s.status, COUNT(p.id) AS products FROM suppliers s LEFT JOIN products p ON p.supplier_id = s.id GROUP BY s.id ORDER BY s.name",
            "customers" => "SELECT c.id, c.name, c.email, c.phone, c.city, c.tier, c.status, COUNT(s.id) AS orders, COALESCE(SUM(s.total), 0) AS spent FROM customers c LEFT JOIN sales s ON s.customer_id = c.id GROUP BY c.id ORDER BY c.name",
            "products" => "SELECT p.id, p.sku, p.name, p.category_id, c.name AS category, p.supplier_id, COALESCE(s.name, '') AS supplier, p.price, p.stock, p.reorder_level, p.status FROM products p JOIN categories c ON c.id = p.category_id LEFT JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.name",
            "purchases" => "SELECT p.id, p.product_id, pr.name AS product, p.supplier_id, s.name AS supplier, p.quantity, p.unit_price, p.total, p.purchase_date, p.status FROM purchases p JOIN products pr ON pr.id = p.product_id JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.purchase_date DESC",
            "sales" => "SELECT s.id, s.product_id, p.name AS product, s.customer_id, c.name AS customer, s.quantity, s.unit_price, s.total, s.sale_date, s.status FROM sales s JOIN products p ON p.id = s.product_id JOIN customers c ON c.id = s.customer_id ORDER BY s.sale_date DESC",
            "inventory_movements" => "SELECT m.id, m.product_id, p.name AS product, m.movement_type, m.quantity, m.reference, m.notes, m.created_at, m.created_by FROM inventory_movements m JOIN products p ON p.id = m.product_id ORDER BY m.created_at DESC",
            _ => return Err("Unsupported entity.".into()),
        };
        query_json(&self.conn, sql)
    }

    fn get(&self, entity: &str, id: &str) -> Result<Value, String> {
        self.list(entity)?
            .into_iter()
            .find(|record| record["id"] == id)
            .ok_or_else(|| "Record not found.".into())
    }

    fn create(&mut self, entity: &str, payload: Value, actor_id: &str) -> Result<Value, String> {
        let values = object(&payload)?;
        let id = value_or(values, "id", new_id());
        match entity {
            "users" => {
                let password = required(values, "password")?;
                validate_password(password)?;
                let role = required(values, "role")?;
                self.ensure_role(role)?;
                self.conn.execute("INSERT INTO users (id, name, email, password_hash, role, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)", params![id, required(values, "name")?, required(values, "email")?, hash_password(password)?, role, value_or(values, "status", "Active".into()), now()]).map_err(sql_error("create user"))?;
            }
            "categories" => {
                self.conn.execute("INSERT INTO categories (id, name, description, status) VALUES (?1, ?2, ?3, ?4)", params![id, required(values, "name")?, value_or(values, "description", String::new()), value_or(values, "status", "Active".into())]).map_err(sql_error("create category"))?;
            }
            "suppliers" => {
                self.conn.execute("INSERT INTO suppliers (id, name, contact_name, email, phone, country, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)", params![id, required(values, "name")?, value_or(values, "contactName", String::new()), value_or(values, "email", String::new()), value_or(values, "phone", String::new()), value_or(values, "country", String::new()), value_or(values, "status", "Active".into())]).map_err(sql_error("create supplier"))?;
            }
            "customers" => {
                self.conn.execute("INSERT INTO customers (id, name, email, phone, city, tier, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)", params![id, required(values, "name")?, value_or(values, "email", String::new()), value_or(values, "phone", String::new()), value_or(values, "city", String::new()), value_or(values, "tier", "Standard".into()), value_or(values, "status", "Active".into())]).map_err(sql_error("create customer"))?;
            }
            "products" => self.create_product(&id, values, actor_id)?,
            "purchases" => self.create_purchase(&id, values, actor_id)?,
            "sales" => self.create_sale(&id, values, actor_id)?,
            "inventory_movements" => self.create_movement(&id, values, actor_id)?,
            _ => return Err("Unsupported entity.".into()),
        };
        self.get(entity, &id)
    }

    fn update(
        &mut self,
        entity: &str,
        id: &str,
        payload: Value,
        actor_id: &str,
    ) -> Result<Value, String> {
        let values = object(&payload)?;
        match entity {
            "users" => self.update_user(id, values)?,
            "categories" => update_simple(
                &self.conn,
                "categories",
                id,
                values,
                &["name", "description", "status"],
            )?,
            "suppliers" => update_simple(
                &self.conn,
                "suppliers",
                id,
                values,
                &[
                    "name",
                    "contact_name",
                    "email",
                    "phone",
                    "country",
                    "status",
                ],
            )?,
            "customers" => update_simple(
                &self.conn,
                "customers",
                id,
                values,
                &["name", "email", "phone", "city", "tier", "status"],
            )?,
            "products" => self.update_product(id, values, actor_id)?,
            "purchases" => self.replace_purchase(id, values, actor_id)?,
            "sales" => self.replace_sale(id, values, actor_id)?,
            "inventory_movements" => self.replace_movement(id, values, actor_id)?,
            _ => return Err("Unsupported entity.".into()),
        }
        self.get(entity, id)
    }

    fn delete(&mut self, entity: &str, id: &str) -> Result<(), String> {
        match entity {
            "purchases" => self.reverse_document("purchases", id, 1)?,
            "sales" => self.reverse_document("sales", id, -1)?,
            "inventory_movements" => self.reverse_movement(id)?,
            "users" | "categories" | "suppliers" | "customers" | "products" => {
                self.conn
                    .execute(&format!("DELETE FROM {entity} WHERE id = ?1"), params![id])
                    .map_err(sql_error("delete record"))?;
            }
            _ => return Err("Unsupported entity.".into()),
        }
        Ok(())
    }

    fn ensure_role(&self, role: &str) -> Result<(), String> {
        let exists: Option<String> = self
            .conn
            .query_row(
                "SELECT name FROM roles WHERE name = ?1",
                params![role],
                |row| row.get(0),
            )
            .optional()
            .map_err(sql_error("validate role"))?;
        if exists.is_some() {
            Ok(())
        } else {
            Err("Role does not exist.".into())
        }
    }

    fn create_product(
        &mut self,
        id: &str,
        v: &Map<String, Value>,
        actor_id: &str,
    ) -> Result<(), String> {
        let stock = integer(v, "stock", 0)?;
        self.conn.execute("INSERT INTO products (id, sku, name, category_id, supplier_id, price, stock, reorder_level, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7, ?8)", params![id, required(v, "sku")?, required(v, "name")?, required(v, "categoryId")?, optional(v, "supplierId"), number(v, "price", 0.0)?, integer(v, "reorderLevel", 0)?, value_or(v, "status", "Active".into())]).map_err(sql_error("create product"))?;
        if stock > 0 {
            self.insert_movement(
                id,
                "ADJUSTMENT_IN",
                stock,
                "Opening balance",
                "Initial product stock",
                actor_id,
            )?;
        }
        Ok(())
    }

    fn update_product(
        &mut self,
        id: &str,
        v: &Map<String, Value>,
        _actor_id: &str,
    ) -> Result<(), String> {
        if v.contains_key("stock") {
            return Err(
                "Change product stock by creating an inventory movement, purchase, or sale.".into(),
            );
        }
        update_simple(
            &self.conn,
            "products",
            id,
            v,
            &[
                "sku",
                "name",
                "category_id",
                "supplier_id",
                "price",
                "reorder_level",
                "status",
            ],
        )
    }

    fn create_purchase(
        &mut self,
        id: &str,
        v: &Map<String, Value>,
        actor: &str,
    ) -> Result<(), String> {
        let product = required(v, "productId")?;
        let quantity = integer(v, "quantity", 0)?;
        if quantity <= 0 {
            return Err("quantity must be greater than zero.".into());
        }
        let unit_price = number(v, "unitPrice", 0.0)?;
        let transaction = self
            .conn
            .transaction()
            .map_err(sql_error("start purchase transaction"))?;
        transaction.execute("INSERT INTO purchases (id, product_id, supplier_id, quantity, unit_price, total, purchase_date, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)", params![id, product, required(v, "supplierId")?, quantity, unit_price, quantity as f64 * unit_price, required(v, "purchaseDate")?, value_or(v, "status", "Received".into())]).map_err(sql_error("create purchase"))?;
        insert_movement_tx(
            &transaction,
            &new_id(),
            product,
            "IN",
            quantity,
            id,
            "Stock received from purchase",
            actor,
        )?;
        transaction
            .commit()
            .map_err(sql_error("commit purchase transaction"))
    }

    fn create_sale(&mut self, id: &str, v: &Map<String, Value>, actor: &str) -> Result<(), String> {
        let product = required(v, "productId")?;
        let quantity = integer(v, "quantity", 0)?;
        if quantity <= 0 {
            return Err("quantity must be greater than zero.".into());
        }
        let unit_price = number(v, "unitPrice", 0.0)?;
        let transaction = self
            .conn
            .transaction()
            .map_err(sql_error("start sale transaction"))?;
        transaction.execute("INSERT INTO sales (id, product_id, customer_id, quantity, unit_price, total, sale_date, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)", params![id, product, required(v, "customerId")?, quantity, unit_price, quantity as f64 * unit_price, required(v, "saleDate")?, value_or(v, "status", "Fulfilled".into())]).map_err(sql_error("create sale"))?;
        insert_movement_tx(
            &transaction,
            &new_id(),
            product,
            "OUT",
            quantity,
            id,
            "Stock issued for sale",
            actor,
        )?;
        transaction
            .commit()
            .map_err(sql_error("commit sale transaction"))
    }

    fn create_movement(
        &mut self,
        id: &str,
        v: &Map<String, Value>,
        actor: &str,
    ) -> Result<(), String> {
        let product = required(v, "productId")?;
        let movement_type = required(v, "movementType")?;
        let quantity = integer(v, "quantity", 0)?;
        self.insert_movement_with_id(
            id,
            product,
            movement_type,
            quantity,
            &value_or(v, "reference", String::new()),
            &value_or(v, "notes", String::new()),
            actor,
        )
    }

    fn replace_purchase(
        &mut self,
        id: &str,
        v: &Map<String, Value>,
        actor: &str,
    ) -> Result<(), String> {
        self.delete("purchases", id)?;
        self.create_purchase(id, v, actor)
    }
    fn replace_sale(
        &mut self,
        id: &str,
        v: &Map<String, Value>,
        actor: &str,
    ) -> Result<(), String> {
        self.delete("sales", id)?;
        self.create_sale(id, v, actor)
    }
    fn replace_movement(
        &mut self,
        id: &str,
        v: &Map<String, Value>,
        actor: &str,
    ) -> Result<(), String> {
        self.delete("inventory_movements", id)?;
        self.create_movement(id, v, actor)
    }

    fn reverse_document(&mut self, table: &str, id: &str, multiplier: i64) -> Result<(), String> {
        let record: Option<(String, i64)> = self
            .conn
            .query_row(
                &format!("SELECT product_id, quantity FROM {table} WHERE id = ?1"),
                params![id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()
            .map_err(sql_error("load transaction"))?;
        let Some((product, quantity)) = record else {
            return Err("Record not found.".into());
        };
        let transaction = self
            .conn
            .transaction()
            .map_err(sql_error("start delete transaction"))?;
        adjust_stock_tx(&transaction, &product, quantity * multiplier)?;
        transaction
            .execute(
                "DELETE FROM inventory_movements WHERE reference = ?1",
                params![id],
            )
            .map_err(sql_error("delete the linked inventory movement"))?;
        transaction
            .execute(&format!("DELETE FROM {table} WHERE id = ?1"), params![id])
            .map_err(sql_error("delete transaction"))?;
        transaction
            .commit()
            .map_err(sql_error("commit delete transaction"))
    }

    fn reverse_movement(&mut self, id: &str) -> Result<(), String> {
        let record: Option<(String, String, i64)> = self
            .conn
            .query_row(
                "SELECT product_id, movement_type, quantity FROM inventory_movements WHERE id = ?1",
                params![id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .optional()
            .map_err(sql_error("load movement"))?;
        let Some((product, movement_type, quantity)) = record else {
            return Err("Record not found.".into());
        };
        let transaction = self
            .conn
            .transaction()
            .map_err(sql_error("start movement deletion"))?;
        adjust_stock_tx(
            &transaction,
            &product,
            -signed_quantity(&movement_type, quantity)?,
        )?;
        transaction
            .execute("DELETE FROM inventory_movements WHERE id = ?1", params![id])
            .map_err(sql_error("delete movement"))?;
        transaction
            .commit()
            .map_err(sql_error("commit movement deletion"))
    }

    fn insert_movement(
        &mut self,
        product: &str,
        movement_type: &str,
        quantity: i64,
        reference: &str,
        notes: &str,
        actor: &str,
    ) -> Result<(), String> {
        self.insert_movement_with_id(
            &new_id(),
            product,
            movement_type,
            quantity,
            reference,
            notes,
            actor,
        )
    }

    fn insert_movement_with_id(
        &mut self,
        id: &str,
        product: &str,
        movement_type: &str,
        quantity: i64,
        reference: &str,
        notes: &str,
        actor: &str,
    ) -> Result<(), String> {
        let transaction = self
            .conn
            .transaction()
            .map_err(sql_error("start inventory movement"))?;
        insert_movement_tx(
            &transaction,
            id,
            product,
            movement_type,
            quantity,
            reference,
            notes,
            actor,
        )?;
        transaction
            .commit()
            .map_err(sql_error("commit inventory movement"))
    }

    fn update_user(&mut self, id: &str, v: &Map<String, Value>) -> Result<(), String> {
        if let Some(role) = optional(v, "role") {
            self.ensure_role(&role)?;
        }
        if let Some(password) = optional(v, "password") {
            validate_password(&password)?;
            self.conn
                .execute(
                    "UPDATE users SET password_hash = ?1 WHERE id = ?2",
                    params![hash_password(&password)?, id],
                )
                .map_err(sql_error("update password"))?;
        }
        update_simple(
            &self.conn,
            "users",
            id,
            v,
            &["name", "email", "role", "status"],
        )
    }
}

fn insert_movement_tx(
    transaction: &Transaction<'_>,
    id: &str,
    product: &str,
    movement_type: &str,
    quantity: i64,
    reference: &str,
    notes: &str,
    actor: &str,
) -> Result<(), String> {
    if quantity <= 0 {
        return Err("quantity must be greater than zero.".into());
    }
    adjust_stock_tx(
        transaction,
        product,
        signed_quantity(movement_type, quantity)?,
    )?;
    transaction
        .execute(
            "INSERT INTO inventory_movements (id, product_id, movement_type, quantity, reference, notes, created_at, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![id, product, movement_type, quantity, reference, notes, now(), actor],
        )
        .map_err(sql_error("create inventory movement"))?;
    Ok(())
}

fn adjust_stock_tx(
    transaction: &Transaction<'_>,
    product_id: &str,
    change: i64,
) -> Result<(), String> {
    let stock: Option<i64> = transaction
        .query_row(
            "SELECT stock FROM products WHERE id = ?1",
            params![product_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(sql_error("load product stock"))?;
    let Some(stock) = stock else {
        return Err("Product not found.".into());
    };
    if stock + change < 0 {
        return Err("This operation would make product stock negative.".into());
    }
    transaction
        .execute(
            "UPDATE products SET stock = ?1 WHERE id = ?2",
            params![stock + change, product_id],
        )
        .map_err(sql_error("update product stock"))?;
    Ok(())
}

#[tauri::command]
pub fn login(
    state: tauri::State<'_, AppState>,
    email: String,
    password: String,
) -> Result<AuthResponse, String> {
    let mut database = state
        .database
        .lock()
        .map_err(|_| "Database lock was poisoned.".to_string())?;
    let user = database
        .authenticate(&email, &password)?
        .ok_or_else(|| "Invalid email or password.".to_string())?;
    drop(database);
    let expires_at = Utc::now() + Duration::hours(SESSION_HOURS);
    let token = Uuid::new_v4().to_string();
    state
        .sessions
        .lock()
        .map_err(|_| "Session lock was poisoned.".to_string())?
        .insert(
            token.clone(),
            Session {
                user_id: user.id.clone(),
                role: user.role.clone(),
                expires_at,
            },
        );
    Ok(AuthResponse {
        session_token: token,
        expires_at: expires_at.to_rfc3339(),
        user,
    })
}

#[tauri::command]
pub fn logout(state: tauri::State<'_, AppState>, session_token: String) -> Result<(), String> {
    state
        .sessions
        .lock()
        .map_err(|_| "Session lock was poisoned.".to_string())?
        .remove(&session_token);
    Ok(())
}

#[tauri::command]
pub fn current_user(
    state: tauri::State<'_, AppState>,
    session_token: String,
) -> Result<User, String> {
    let session = session(&state, &session_token)?;
    state
        .database
        .lock()
        .map_err(|_| "Database lock was poisoned.".to_string())?
        .user_by_id(&session.user_id)?
        .ok_or_else(|| "User not found.".into())
}

#[tauri::command]
pub fn list_roles(
    state: tauri::State<'_, AppState>,
    session_token: String,
) -> Result<Vec<Value>, String> {
    require(&state, &session_token, "roles", Action::Read)?;
    query_json(
        &state
            .database
            .lock()
            .map_err(|_| "Database lock was poisoned.".to_string())?
            .conn,
        "SELECT name, description FROM roles ORDER BY name",
    )
}

#[tauri::command]
pub fn list_records(
    state: tauri::State<'_, AppState>,
    session_token: String,
    entity: String,
) -> Result<Vec<Value>, String> {
    require(&state, &session_token, &entity, Action::Read)?;
    state
        .database
        .lock()
        .map_err(|_| "Database lock was poisoned.".to_string())?
        .list(&entity)
}

#[tauri::command]
pub fn get_record(
    state: tauri::State<'_, AppState>,
    session_token: String,
    entity: String,
    id: String,
) -> Result<Value, String> {
    require(&state, &session_token, &entity, Action::Read)?;
    state
        .database
        .lock()
        .map_err(|_| "Database lock was poisoned.".to_string())?
        .get(&entity, &id)
}

#[tauri::command]
pub fn create_record(
    state: tauri::State<'_, AppState>,
    session_token: String,
    entity: String,
    payload: Value,
) -> Result<Value, String> {
    let actor = require(&state, &session_token, &entity, Action::Create)?;
    state
        .database
        .lock()
        .map_err(|_| "Database lock was poisoned.".to_string())?
        .create(&entity, payload, &actor.user_id)
}

#[tauri::command]
pub fn update_record(
    state: tauri::State<'_, AppState>,
    session_token: String,
    entity: String,
    id: String,
    payload: Value,
) -> Result<Value, String> {
    let actor = require(&state, &session_token, &entity, Action::Update)?;
    state
        .database
        .lock()
        .map_err(|_| "Database lock was poisoned.".to_string())?
        .update(&entity, &id, payload, &actor.user_id)
}

#[tauri::command]
pub fn delete_record(
    state: tauri::State<'_, AppState>,
    session_token: String,
    entity: String,
    id: String,
) -> Result<(), String> {
    require(&state, &session_token, &entity, Action::Delete)?;
    state
        .database
        .lock()
        .map_err(|_| "Database lock was poisoned.".to_string())?
        .delete(&entity, &id)
}

#[derive(Clone, Copy)]
enum Action {
    Read,
    Create,
    Update,
    Delete,
}

fn session(state: &AppState, token: &str) -> Result<Session, String> {
    let mut sessions = state
        .sessions
        .lock()
        .map_err(|_| "Session lock was poisoned.".to_string())?;
    sessions.retain(|_, value| value.expires_at > Utc::now());
    sessions
        .get(token)
        .cloned()
        .ok_or_else(|| "Your session has expired. Please sign in again.".into())
}

fn require(state: &AppState, token: &str, entity: &str, action: Action) -> Result<Session, String> {
    let current = session(state, token)?;
    let allowed = match current.role.as_str() {
        "Admin" => true,
        "Manager" => entity != "users" && entity != "roles",
        "Sales" => match action {
            Action::Read => matches!(
                entity,
                "categories" | "products" | "customers" | "sales" | "inventory_movements"
            ),
            _ => matches!(entity, "customers" | "sales"),
        },
        "Warehouse" => match action {
            Action::Read => matches!(
                entity,
                "categories" | "suppliers" | "products" | "purchases" | "inventory_movements"
            ),
            _ => matches!(
                entity,
                "categories" | "suppliers" | "products" | "purchases" | "inventory_movements"
            ),
        },
        _ => false,
    };
    if allowed {
        Ok(current)
    } else {
        Err("Your role is not allowed to perform this action.".into())
    }
}

fn query_json(conn: &Connection, sql: &str) -> Result<Vec<Value>, String> {
    let mut statement = conn.prepare(sql).map_err(sql_error("prepare query"))?;
    let names = statement
        .column_names()
        .iter()
        .map(|name| (*name).to_string())
        .collect::<Vec<_>>();
    let rows = statement
        .query_map([], |row| {
            let mut item = Map::new();
            for (index, name) in names.iter().enumerate() {
                let value = match row.get_ref(index)? {
                    ValueRef::Null => Value::Null,
                    ValueRef::Integer(value) => json!(value),
                    ValueRef::Real(value) => json!(value),
                    ValueRef::Text(value) => {
                        Value::String(String::from_utf8_lossy(value).into_owned())
                    }
                    ValueRef::Blob(_) => Value::Null,
                };
                item.insert(snake_to_camel(name), value);
            }
            Ok(Value::Object(item))
        })
        .map_err(sql_error("run query"))?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(sql_error("read query results"))
}

fn update_simple(
    conn: &Connection,
    table: &str,
    id: &str,
    values: &Map<String, Value>,
    permitted: &[&str],
) -> Result<(), String> {
    let mut updates = Vec::new();
    let mut bindings: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    for field in permitted {
        let camel = snake_to_camel(field);
        if let Some(value) = values.get(&camel).or_else(|| values.get(*field)) {
            updates.push(format!("{field} = ?"));
            bindings.push(Box::new(json_to_sql(value)?));
        }
    }
    if updates.is_empty() {
        return Ok(());
    }
    bindings.push(Box::new(id.to_string()));
    let query = format!("UPDATE {table} SET {} WHERE id = ?", updates.join(", "));
    let affected = conn
        .execute(
            &query,
            rusqlite::params_from_iter(bindings.iter().map(|item| item.as_ref())),
        )
        .map_err(sql_error("update record"))?;
    if affected == 0 {
        return Err("Record not found.".into());
    }
    Ok(())
}

fn json_to_sql(value: &Value) -> Result<rusqlite::types::Value, String> {
    match value {
        Value::Null => Ok(rusqlite::types::Value::Null),
        Value::Bool(value) => Ok(rusqlite::types::Value::Integer(i64::from(*value))),
        Value::Number(value) => value
            .as_i64()
            .map(rusqlite::types::Value::Integer)
            .or_else(|| value.as_f64().map(rusqlite::types::Value::Real))
            .ok_or_else(|| "Invalid number.".into()),
        Value::String(value) => Ok(rusqlite::types::Value::Text(value.clone())),
        _ => Err("Fields must be strings, numbers, booleans, or null.".into()),
    }
}

fn user_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<User> {
    Ok(User {
        id: row.get(0)?,
        name: row.get(1)?,
        email: row.get(2)?,
        role: row.get(3)?,
        status: row.get(4)?,
        created_at: row.get(5)?,
        last_login: row.get(6)?,
    })
}
fn object(payload: &Value) -> Result<&Map<String, Value>, String> {
    payload
        .as_object()
        .ok_or_else(|| "payload must be a JSON object.".into())
}
fn required<'a>(values: &'a Map<String, Value>, field: &str) -> Result<&'a str, String> {
    values
        .get(field)
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| format!("{field} is required."))
}
fn optional(values: &Map<String, Value>, field: &str) -> Option<String> {
    values.get(field).and_then(Value::as_str).map(str::to_owned)
}
fn value_or(values: &Map<String, Value>, field: &str, default: String) -> String {
    optional(values, field).unwrap_or(default)
}
fn integer(values: &Map<String, Value>, field: &str, default: i64) -> Result<i64, String> {
    values
        .get(field)
        .map(|value| {
            value
                .as_i64()
                .ok_or_else(|| format!("{field} must be an integer."))
        })
        .unwrap_or(Ok(default))
}
fn number(values: &Map<String, Value>, field: &str, default: f64) -> Result<f64, String> {
    values
        .get(field)
        .map(|value| {
            value
                .as_f64()
                .ok_or_else(|| format!("{field} must be a number."))
        })
        .unwrap_or(Ok(default))
}
fn signed_quantity(kind: &str, quantity: i64) -> Result<i64, String> {
    match kind {
        "IN" | "ADJUSTMENT_IN" => Ok(quantity),
        "OUT" | "ADJUSTMENT_OUT" => Ok(-quantity),
        _ => Err("movementType must be IN, OUT, ADJUSTMENT_IN, or ADJUSTMENT_OUT.".into()),
    }
}
fn snake_to_camel(value: &str) -> String {
    let mut result = String::new();
    let mut upper = false;
    for character in value.chars() {
        if character == '_' {
            upper = true;
        } else if upper {
            result.extend(character.to_uppercase());
            upper = false;
        } else {
            result.push(character);
        }
    }
    result
}
fn new_id() -> String {
    Uuid::new_v4().to_string()
}
fn now() -> String {
    Utc::now().to_rfc3339()
}
fn sql_error(context: &'static str) -> impl FnOnce(rusqlite::Error) -> String {
    move |error| format!("Could not {context}: {error}")
}
fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::encode_b64(Uuid::new_v4().as_bytes())
        .map_err(|_| "Could not generate password salt.".to_string())?;
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|_| "Could not hash password.".into())
}
fn verify_password(password: &str, hash: &str) -> bool {
    PasswordHash::new(hash)
        .ok()
        .and_then(|parsed| {
            Argon2::default()
                .verify_password(password.as_bytes(), &parsed)
                .ok()
        })
        .is_some()
}
fn validate_password(password: &str) -> Result<(), String> {
    if password.len() >= 12
        && password.chars().any(char::is_uppercase)
        && password.chars().any(char::is_lowercase)
        && password.chars().any(|character| character.is_ascii_digit())
    {
        Ok(())
    } else {
        Err("Passwords must be at least 12 characters and include upper-case, lower-case, and numeric characters.".into())
    }
}
fn database_path() -> Result<PathBuf, String> {
    let base = std::env::var_os("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));
    let directory = base.join("StockWise");
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Could not create the application-data folder: {error}"))?;
    Ok(directory.join("inventory-management.sqlite"))
}
