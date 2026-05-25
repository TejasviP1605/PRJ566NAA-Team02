# PRJ566NAA-Team02 — RentRight Frontend

Capstone project repository for PRJ566NAA (2026), maintained by Team 02.

## RentRight — Rental Management Platform

A complete, production-quality frontend for managing shared households, rent, expenses, maintenance, and documents.

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

- **Next.js 14** (App Router) — file-based routing, layouts, server components
- **TypeScript** — full type safety throughout
- **Tailwind CSS** — utility-first styling with custom design tokens
- **Zustand** — lightweight auth + UI state management (persisted)
- **TanStack Query** — server state, caching, and mutations
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
│   ├── (app)/             # Protected app routes
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
│   └── mock.ts            # Realistic mock data for all entities
│
├── lib/
│   ├── api/               # Fake API service layer (ready for real backend)
│   │   ├── auth.service.ts
│   │   ├── household.service.ts
│   │   ├── expense.service.ts
│   │   ├── payment.service.ts
│   │   ├── maintenance.service.ts
│   │   ├── document.service.ts
│   │   └── activity.service.ts
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

### Mock API Layer
Each service in `src/lib/api/` follows the same pattern:
- Async functions that simulate network delay (`mockFetch`)
- Return typed `ApiResponse<T>` objects
- Easy to swap: just replace `mockFetch(data)` with `fetch('/api/...')`

### Backend Integration Points
To connect a real backend:
1. Replace `mockFetch(data, delay)` calls in each `*.service.ts` with real `fetch()` or `axios` calls
2. Update `authService.login()` to call your real `/api/auth/login` endpoint and store the JWT
3. Add interceptors/middleware to attach the auth token from `useAuthStore` to all API calls
4. Update `mockUsers` / `mockHousehold` etc. with real API responses (or remove entirely)

### State Management
- **Auth** → `useAuthStore` (Zustand, persisted to `localStorage`)
- **Server state** → TanStack Query (all API calls, caching, invalidation)
- **UI state** → `useUIStore` (Zustand, sidebar open, notifications)

---

## Features Implemented

✅ Authentication (Login, Register, Forgot/Reset Password)  
✅ Role-based routing and navigation (4 roles)  
✅ App shell with collapsible sidebar, topbar, mobile drawer  
✅ Notification center  
✅ Tenant Dashboard with charts and payment summary  
✅ Leaseholder Dashboard with rent collection stats  
✅ Property Manager Dashboard with maintenance overview  
✅ Admin Dashboard with user management and system health  
✅ Household management (create, view, lease progress)  
✅ Member management (invite, roles, rent shares)  
✅ Expense management (create, split rules, settle, delete)  
✅ Payment tracking (mark paid, reminders, overdue)  
✅ Maintenance requests (submit, timeline, status updates)  
✅ Document management (upload, access control, download)  
✅ Activity logs (filterable, grouped by date)  
✅ Admin: User management table  
✅ Admin: Audit logs  
✅ Admin: Security & permissions panel  
✅ Loading states, empty states, error states  
✅ Toast notifications  
✅ Responsive layout (mobile drawer)  
✅ Framer Motion animations  
✅ Full TypeScript types  
