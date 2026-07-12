# 🚚 TransitOps — Premium Fleet Operations & Analytics Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](#)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwindcss&logoColor=white)](#)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](#)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)](#)

TransitOps is a production-grade, enterprise-ready Transport and Fleet Operations management system. Built with React (Vite) on the frontend and Express + Prisma (SQLite) on the backend, the platform enables real-time dispatch monitoring, dynamic ROI metrics, role-based controls, document tracking, and automated reminder alerts.

---

## 🌟 Core Features

### 1. Advanced Role-Based Access Control (RBAC)
Enforces strict client-side page protections, sidebar layout navigation adjustments, and action permissions (Create/Edit/Delete) mapped to 5 operational roles:
*   **Fleet Manager (ADMIN)**: Master administrative override, overall system access, full CRUD controls.
*   **Dispatcher**: Focuses on trip schedule planning and route dispatch, can create/edit trips.
*   **Safety Officer**: Monitors vehicle compliance and schedules maintenance logs/job cards.
*   **Financial Analyst**: Reviews cost ledgers, records expenses, views analytics, and generates financial/mileage reports.
*   **Driver**: Operational profile with limited access to view their own trips and submit fuel refills.

### 2. High-Fidelity Operations Dashboard
Features 7 live Recharts integrations analyzing real-time data from the SQLite database:
*   **Fleet Utilization Trend**: Monthly active load logs.
*   **Vehicle Status Distribution**: Pie chart illustrating active/maintenance fleet proportions.
*   **Trip Status Distribution**: Breakdown of scheduled, en-route, completed, and cancelled trips.
*   **Monthly Revenue vs Expenses**: Dual-bar charts reflecting operational margins.
*   **Fuel Consumption Trend**: Liter statistics over time.
*   **Maintenance Cost Trend**: Track service expenditures.
*   **Top Vehicles by Mileage**: Ranking high-usage fleet units.

### 3. Compliance Document Management
*   **Upload & Track**: Store physical scans of vehicle registration certificates (RC), Insurance, Pollution (PUC), Fitness, and Permits.
*   **Automated Expiry Checker**: Calculates compliance status flags (`ACTIVE`, `EXPIRING_SOON`, `EXPIRED`) in real-time.
*   **Nodemailer Notifications**: Automated background reminder job checking daily for documents expiring in **30 days** or **15 days**, notifying drivers/managers via email alerts.

### 4. Interactive UX/UI & Theme Settings
*   **Immersive Dark Mode**: Crafted with an ultra-premium deep-space theme matching state-of-the-art dashboards.
*   **Show/Hide Passwords**: In-built visibility toggle controls on both the Login and Register page forms.
*   **Interactive Register Checks**: Live password strength meter (Weak to Strong) and real-time mismatch validation tags.
*   **PDF Export Engine**: Built-in CSS print media directives to capture reports, vehicle specs, and logs directly to PDF formatting.

---

## 🏗 System Architecture

```text
Oddo-Hackathon/
├── backend/
│   ├── prisma/             # Schema definitions, migrations & SQLite DB seed files
│   └── src/
│       ├── controllers/    # API Request handlers (auth, fleet, analytics, documents)
│       ├── middlewares/    # Auth verification, Multer upload engine, Error handlers
│       ├── repositories/   # DB transactions & query criteria abstraction layer
│       ├── routes/         # Express endpoint route mapping
│       ├── services/       # Core business logic (cron alerts, ROI analytics)
│       └── utils/          # Paginated query parser helper
└── frontend/
    └── src/
        ├── components/     # Document managers, dynamic filters & tables
        ├── contexts/       # React context state for auth
        ├── layouts/        # Root Layout shell with RBAC sidebar navigation
        ├── pages/          # Dashboard, Fleet, Trips, Maintenance, Expenses, Reports
        └── utils/          # RBAC configurations, formatting parsers
```

---

## ⚡ Quick Setup Guide

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed on your local computer.

### 2. Backend Setup
1. Open a terminal in the `/backend` directory:
   ```bash
   cd backend
   ```
2. Install dependecies:
   ```bash
   npm install
   ```
3. Configure the `.env` file in the backend root:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_security_secret_key_here
   JWT_EXPIRES_IN=7d
   
   # SMTP Email reminders configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FROM_EMAIL=noreply@transitops.com
   ```
4. Perform database setup (run migrations and seed basic roles/data):
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
5. Spin up the dev server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a terminal in the `/frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the compiler developer server:
   ```bash
   npm run dev
   ```
4. Access the web app at `http://localhost:5173`.

---

## 🔑 Demo Access Accounts

Use these pre-seeded roles to evaluate different RBAC layout tiers:

| Role Name | Email Address | Password | Sidebar Pages Accessible |
|:---|:---|:---|:---|
| **Fleet Manager (ADMIN)** | `admin@transitops.com` | `admin123` | Dashboard, Vehicles, Drivers, Trips, Maintenance, Fuel, Expenses, Reports |
| **Dispatcher** | `dispatcher@transitops.com` | `dispatcher123` | Dashboard, Vehicles, Drivers, Trips |
| **Safety Officer** | `safety@transitops.com` | `safety123` | Dashboard, Vehicles, Drivers, Maintenance |
| **Financial Analyst** | `finance@transitops.com` | `finance123` | Dashboard, Expenses, Fuel Logs, Reports |
| **Driver** | `driver@transitops.com` | `driver123` | Dashboard, Trips, Fuel Logs |

---

*TransitOps is maintained by the DevOps and Engineering teams.*
