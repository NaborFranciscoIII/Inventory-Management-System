# 📦 StockWise — Desktop Inventory Management System

A high-performance, cross-platform desktop application built for local-first inventory control, purchasing, sales tracking, and role-based user management.

---

## 🏛️ Architectural Highlights & Privacy-First Design

Unlike traditional web applications that rely on remote server hardware or cloud databases, **StockWise** is engineered around a **Zero-Cloud, Offline-First Framework**:

* **Local-Only Architecture:** All operational data—including inventory levels, user credentials, sales logs, and purchase orders—is stored securely in an embedded **SQLite** database directly inside the user's local host machine (`%APPDATA%`).
* **Native Rust Backend Engine:** Powered by **Tauri**, the lightweight Rust core manages secure database transactions, session tokens, and cryptographic password hashing (**Argon2**) natively without exposing network ports or external API surfaces.
* **Modern Reactive Frontend:** Built with **React**, **Vite**, **Tailwind CSS**, **Lucide Icons**, and **Recharts**, providing an enterprise-grade UI translated directly from complex design specifications.

---

## 🚀 Core Features

1. **Secure Authentication & RBAC:** Role-based access control supporting Admin, Manager, and Staff roles with session persistence.
2. **Real-Time Dashboard:** Dynamic overview tracking revenue trends, low-stock warnings, monthly sales vs. purchases, and recent inventory movements.
3. **Full CRUD Modules:** Complete create, read, update, and delete support for:
   * **Products & Categories** (with automated reorder alerts)
   * **Suppliers & Customers** * **Purchase Orders (PO) & Sales Orders (SO)**
   * **Inventory Adjustments / Movements**
   * **User Account Management & Permissions**
4. **Standalone Packaging:** Compiled into a native Windows executable (`.exe`) and installer (`.msi`) running completely independently of external runtimes.

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts
* **Desktop Wrapper:** Tauri (v2)
* **Backend Core:** Rust, Rusqlite, Argon2 (Password Hashing), Chrono, UUID
* **Database:** SQLite (Embedded Local Storage)

---

## 🏁 Getting Started for Developers

If you want to clone and run this project locally in development mode, follow these steps:

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your system
* [Rust toolchain](https://www.rust-lang.org/tools/install) installed
* Tauri CLI prerequisites configured for Windows/macOS/Linux

### Installation & Execution

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/NaborFranciscoIII/Inventory-Management-System.git](https://github.com/NaborFranciscoIII/Inventory-Management-System.git)
   cd Inventory-Management-System

Project Installer: https://drive.google.com/drive/folders/1wLyrfANoG0KgmmFuQBcMcjnP4Zo9N3t0?usp=sharing
