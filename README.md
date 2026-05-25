# PRJ566NAA-Team02 — RentRight Frontend

Capstone project repository for PRJ566NAA (2026), maintained by Team 02.

## RentRight — Rental Management Platform

A complete frontend for managing shared households, rent, expenses, maintenance, and documents.

---

## Getting Started

```bash
npm install
npm run dev
```

The app runs at **http://localhost:3000**

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Tenant | `alex.tenant@example.com` | `Password1` |
| Leaseholder | `sarah.leaseholder@example.com` | `Password1` |
| Property Manager | `mark.pm@example.com` | `Password1` |
| System Admin | `admin@rentright.com` | `Password1` |

These are available as quick-fill buttons on the login page.

---

## Tech Stack

- **Next.js 14** (App Router) — file-based routing, layouts, and pages
- **TypeScript** — full type safety throughout
- **Tailwind CSS** — utility-first styling with custom design tokens
- **Zustand** — lightweight auth + UI state management (persisted)
- **TanStack Query** — data fetching, caching, and mutations
- **React Hook Form + Zod** — form handling with schema validation
- **Framer Motion** — subtle, performant animations
- **Recharts** — dashboard charts and data visualization
- **Lucide React** — consistent icon set

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/            # Login, Register, Forgot/Reset Password
│   │   └── layout.tsx     # Auth shell (dark gradient background)
│   ├── app/               # Protected app routes
│   │   ├── layout.tsx     # App shell (sidebar + topbar)
│   │   ├── dashboard/     # Role-aware dashboard routing
│   │   ├── household/     # Household info + members
│   │   ├── expenses/      # Expense list, create, detail
│   │   ├── payments/      # Payment tracking
│   │   ├── maintenance/   # Maintenance tickets
│   │   ├── documents/     # Document management
│   │   ├── activity/      # Activity feed
│   │   └── admin/         # Admin-only: users, logs, security
│   ├── layout.tsx         # Root layout (fonts, providers)
│   ├── providers.tsx      # TanStack Query + Toast providers
│   └── globals.css        # Global styles + Tailwind layers
│
├── components/
│   ├── ui/                # Reusable primitives (Button, Input, Card, Modal, etc.)
│   ├── layout/            # App shell (Sidebar, Topbar, MobileDrawer)
│   └── dashboard/         # Role-specific dashboard components
│
├── data/
│   └── mock.ts            # Sample data for development and demos
│
├── lib/
│   ├── api/               # Data service layer (auth, household, expenses, etc.)
│   ├── utils.ts           # Formatting helpers (currency, dates, initials)
│   └── validations.ts     # Zod schemas for all forms
│
├── store/
│   ├── auth.store.ts      # Zustand auth store (persisted)
│   └── ui.store.ts        # Zustand UI store (sidebar, notifications)
│
└── types/
    └── index.ts           # All TypeScript interfaces and types
```

---

## Key Architecture Notes

### Role-Based Access
- Auth state lives in `useAuthStore` (Zustand + `persist`)
- The app layout checks `isAuthenticated` and redirects to `/login` if not
- Dashboards route by role: `/app/dashboard` renders `TenantDashboard`, `LeaseholderDashboard`, `PropertyManagerDashboard`, or `AdminDashboard` based on `user.role`
- Sidebar navigation filters items by role
- UI elements (edit/delete buttons, invite controls) conditionally render based on role checks

### State Management
- **Auth** → `useAuthStore` (Zustand, persisted to `localStorage`)
- **Data** → TanStack Query (fetching, caching, invalidation)
- **UI** → `useUIStore` (Zustand, sidebar open, notifications)
