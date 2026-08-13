# RentRight — Technical Document

**Team 1** · PRJ566NAA · [GitHub](https://github.com/TejasviP1605/PRJ566NAA-Team02)

RentRight is a shared rental management web app. Roommates create a household, add members, split expenses, upload documents, log maintenance, and review activity history.

---

## 1. Purpose

Roommates often track rent, utilities, and receipts in chats or spreadsheets. RentRight gives one household a single place to:

- Manage household details and members
- Split expenses (equal, percentage, or custom amounts)
- Store lease and receipt files
- Track maintenance requests
- View a filterable activity history
- Update profile, address, and password

---

## 2. Architecture

RentRight uses a **Backend-as-a-Service** model. There is no custom Node/Express API. The React app talks to Supabase over HTTPS using a JWT session.

```
┌──────────────────────────────────────────┐
│  Browser (React 18 + Vite + Tailwind)    │
│  Pages: Dashboard, Expenses, Documents,  │
│  Maintenance, Activity, Profile          │
│  State: src/context/AppContext.jsx       │
└────────────────────┬─────────────────────┘
                     │ HTTPS + JWT
                     ▼
┌──────────────────────────────────────────┐
│  Supabase Cloud                          │
│  • Auth (email/password, hashed)         │
│  • PostgreSQL + Row Level Security       │
│  • Storage (household-documents)         │
└──────────────────────────────────────────┘
                     │
                     ▼
           Vercel production host
```

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Lucide icons |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Address lookup | OpenStreetMap Nominatim (free, no API key) |
| Hosting | Vercel |
| CI | GitHub Actions (`npm ci` + `vite build`) |

---

## 3. Application structure

```
RentRight/
├── docs/                      # Technical, install, and public-server docs
├── supabase/
│   ├── schema.sql             # Full database reset-and-rebuild
│   ├── profile-columns.sql    # Non-destructive schema patch
│   └── membership.sql         # Membership helper SQL
├── src/
│   ├── lib/supabase.js        # Supabase client
│   ├── context/AppContext.jsx # Auth and all data operations
│   ├── pages/                 # Login, Register, Dashboard, Expenses, …
│   ├── components/            # Layout, Header, AddressLookup, …
│   └── utils/                 # Expense split math
├── .env.example               # Template for local keys (do not commit .env)
└── package.json
```

---

## 4. Authentication

1. **Register** — `supabase.auth.signUp()` creates a row in `auth.users` (password hashed). A database trigger creates a matching `public.profiles` row.
2. **Login** — `supabase.auth.signInWithPassword()` returns a JWT session stored by the Supabase client.
3. **Protected routes** — `ProtectedRoute.jsx` redirects unauthenticated users to `/login`.
4. **Password change** — Profile page calls `supabase.auth.updateUser({ password })`.

Passwords are never stored in application tables.

---

## 5. Database

Defined in `supabase/schema.sql`.

| Table | Purpose |
|-------|---------|
| `profiles` | Display name, email, phone, address, active household |
| `households` | Property name, unit, address |
| `household_members` | People in a household (role: leaseholder or tenant) |
| `expenses` | Shared bills |
| `expense_splits` | Each member’s share and paid flag |
| `documents` | File metadata |
| `maintenance_requests` | Maintenance tickets |
| `activities` | Household activity log |

**Relationships**

```
auth.users (id)
  └── profiles (id = auth.users.id)
        └── household_members.user_id
              └── households
                    ├── expenses → expense_splits
                    ├── documents
                    ├── maintenance_requests
                    └── activities
```

**Security:** Row Level Security (RLS) is enabled on all app tables. Helper `is_household_member(household_id)` limits access to households the signed-in user belongs to.

---

## 6. Main features

| Area | What it does |
|------|----------------|
| Dashboard | Household members (avatars, edit/delete), summary balances |
| Profile | Account, address lookup, password, create/edit/delete household |
| Expenses | Add/edit/delete, split modes, mark shares paid |
| Documents | Upload/download via Supabase Storage |
| Maintenance | Create and update request status |
| Activity | Filter by category and date range |

---

## 7. Environment variables

Local development only (never commit `.env`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Production uses the same names in the Vercel project settings. The publishable key is safe in the browser; RLS still blocks access to other households’ data.

---

## 8. Related documents

- [Installation](INSTALLATION.md) — run locally
- [Public server](PUBLIC-SERVER.md) — live URL and test accounts
