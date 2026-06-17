# RentRight

Shared rental management. **Login, profiles, households, and members** are stored in Supabase (Auth + Postgres).

---

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** [Supabase](https://supabase.com) — Auth + PostgreSQL

---

## Setup

```bash
npm install
cp .env.example .env
```

Add **Project URL** and **publishable key** from Supabase → Project Settings → API.

1. Run **`supabase/schema.sql`** in Supabase → SQL Editor.
2. **Authentication → Providers → Email** → turn **off** “Confirm email” (see comments at top of `supabase/schema.sql`).

```bash
npm run dev
```

Open http://localhost:3000 → **Register** → create households on the Dashboard.

---

## Architecture

```
Register / Login  →  Supabase Auth (auth.users)
                 →  profiles (same id as auth user)

Dashboard       →  households, household_members in Supabase
```

---

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User id, name, email, active household |
| `households` | Property name, unit, address |
| `household_members` | People per household |
| `expenses` | Shared costs per household |
| `documents` | File metadata (files in Storage bucket `household-documents`) |

Open `supabase/schema.sql`, copy all SQL, paste into Supabase SQL Editor, and run. If the database already exists, run only from `-- Expense split type` through the end.

See `supabase/schema.sql` for your database report.
