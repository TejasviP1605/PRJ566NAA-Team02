# RentRight — Team Presentation Guide

Read this before your presentation. It covers setup, architecture, database design, and demo talking points for the whole team.

The main project README (`README.md`) stays unchanged — this file is only for your team prep.

---

## Table of contents

1. [What the app does](#what-the-app-does)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Setup (for all team members)](#setup-for-all-team-members)
5. [How the backend works](#how-the-backend-works)
6. [How authentication works](#how-authentication-works)
7. [Where data is stored](#where-data-is-stored)
8. [Database schema](#database-schema)
9. [Security (Row Level Security)](#security-row-level-security)
10. [Key features explained](#key-features-explained)
11. [Presentation demo script](#presentation-demo-script)
12. [Common professor questions](#common-professor-questions)
13. [Troubleshooting](#troubleshooting)
14. [Team checklist](#team-checklist-before-presenting)

---

## What the app does

| Page | Status | Description |
|------|--------|-------------|
| **Dashboard** | Done | Create households, add members, view summary stats |
| **Expenses** | Done | Add/edit/delete expenses, split costs (equal / % / amount), mark shares paid |
| **Documents** | Done | Upload and download household files (lease, bills, receipts) |
| **Maintenance** | Placeholder | UI shell for future work |
| **Activity** | Placeholder | UI shell for future work |

**Typical user flow**

1. Register / log in
2. Create a household (name, address, unit)
3. Add household members (roommates)
4. Add expenses and split them between members
5. Mark shares as paid when people settle up
6. Upload shared documents

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Icons | Lucide React |
| Backend | **Supabase** (no custom Node/Express server) |
| Database | PostgreSQL (hosted by Supabase) |
| Auth | Supabase Auth (email + password) |
| File storage | Supabase Storage (`household-documents` bucket) |
| API access | `@supabase/supabase-js` client from the browser |

**Important:** We use a **Backend-as-a-Service (BaaS)** model. The React app talks directly to Supabase over HTTPS. Security is enforced in the database with **Row Level Security (RLS)**, not by hiding API keys.

---

## Project structure

```
RentRight/
├── supabase/
│   └── schema.sql          # Full database: tables, RLS, triggers, storage
├── src/
│   ├── lib/
│   │   └── supabase.js     # Supabase client (URL + publishable key)
│   ├── context/
│   │   └── AppContext.jsx  # Auth, all CRUD, data loading
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Expenses.jsx
│   │   └── Documents.jsx
│   ├── components/         # Forms, layout, protected routes
│   └── utils/
│       ├── splits.js       # You owe / your share calculations
│       └── expenseSplits.js # Split validation and math
├── .env.example            # Template for Supabase keys
└── package.json
```

---

## Setup (for all team members)

### ⚠️ If you see a blank screen

The zip **does not include `.env`** (it is gitignored). Without it the app cannot connect to Supabase.

**Fix (every teammate must do this):**

```bash
cp .env.example .env
```

Then open `.env` and paste the **same** Supabase URL and publishable key your team lead uses (share via Slack/Teams — not in the zip).

Restart the dev server after saving `.env`:

```bash
npm run dev
```

You should see the **Login** page (not a blank screen).

### 1. Clone and install

```bash
npm install
cp .env.example .env
```

### 2. Add Supabase credentials

In Supabase → **Project Settings → API**, copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **Publishable key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

Your `.env` should look like:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

> Use the **same Supabase project** for the whole team so you share one database during the demo.

### 3. Run the database schema

1. Open Supabase → **SQL Editor**
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and **Run**

For a **brand-new** project, run the whole file once.

If the database **already exists** and you only need expense/document updates, run from `-- Expense split type` through the end of the file.

### 4. Configure auth

Supabase → **Authentication → Providers → Email** → turn **off** “Confirm email”.

Otherwise new users must confirm email before they can log in.

### 5. Start the app

```bash
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173 or http://localhost:3000).

### 6. First-time app usage

1. **Register** a new account
2. On **Dashboard**, create a household
3. Add members (roommates)
4. Go to **Expenses** and add a bill

---

## How the backend works

We did **not** build a separate REST API server. Supabase **is** our backend.

```
┌─────────────────┐
│  React (Browser) │
│  AppContext.jsx  │
└────────┬────────┘
         │ HTTPS + JWT (session token)
         ▼
┌─────────────────────────────────────┐
│           Supabase Cloud            │
│  ┌─────────┐  ┌──────────────────┐  │
│  │  Auth   │  │  PostgreSQL DB   │  │
│  │ (users) │  │  + RLS policies  │  │
│  └─────────┘  └──────────────────┘  │
│  ┌─────────────────────────────────┐│
│  │  Storage (document files)       ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Example — adding an expense**

The UI calls `addExpense()` in `AppContext.jsx`, which runs:

```js
supabase.from('expenses').insert({ ... })
supabase.from('expense_splits').insert([ ... ])
```

Supabase translates that into real SQL `INSERT` statements on PostgreSQL.

**Where “backend logic” lives**

| Location | What it does |
|----------|----------------|
| `supabase/schema.sql` | Tables, constraints, triggers, RLS policies |
| `src/context/AppContext.jsx` | When to insert/update/delete; loads data after auth |
| `src/utils/*.js` | Client-side validation and balance calculations |

---

## How authentication works

### Registration

1. User enters name, email, password on `/register`
2. App calls `supabase.auth.signUp()`
3. Supabase creates a row in **`auth.users`** (password is hashed — never stored in plain text)
4. A database **trigger** automatically creates a matching row in **`public.profiles`**
5. Supabase returns a **JWT session**; the browser stores it

### Login

1. User enters email + password on `/login`
2. App calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials and issues a new session token

### Protected pages

`ProtectedRoute.jsx` checks `isAuthenticated`. If not logged in, the user is redirected to `/login`.

Dashboard, Expenses, Documents, etc. are only available after login.

### Session persistence

On page refresh, `supabase.auth.getSession()` restores the session so users stay logged in.

---

## Where data is stored

Use the **Supabase Dashboard** to show your professor exactly where everything lives.

| Data | Where it is saved | How to view in Supabase |
|------|-------------------|-------------------------|
| Email & password | `auth.users` (hashed password) | **Authentication → Users** |
| Display name, active household | `public.profiles` | **Table Editor → profiles** |
| Household info | `public.households` | **Table Editor → households** |
| Roommates / members | `public.household_members` | **Table Editor → household_members** |
| Bills / expenses | `public.expenses` | **Table Editor → expenses** |
| Per-member splits & paid status | `public.expense_splits` | **Table Editor → expense_splits** |
| Document metadata | `public.documents` | **Table Editor → documents** |
| Actual uploaded files | Storage bucket `household-documents` | **Storage → household-documents** |

### How users link together

```
auth.users (id: abc-123)
    │
    └── profiles (id: abc-123)     ← same UUID, 1:1 link
            │
            └── household_members (user_id: abc-123)
                    │
                    └── households (household_id)
```

- **`profiles.id`** = **`auth.users.id`** (foreign key)
- **`household_members.user_id`** links a logged-in user to their member row
- Members added manually (roommates who haven’t registered) can have `user_id = null` until they sign up

### What is NOT stored in our app

- No passwords in `public` tables
- No expense/household data in `localStorage` — everything loads from Supabase on login
- Only the auth session token is kept in the browser (managed by Supabase client)

---

## Database schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | App profile per user (name, email, active household) |
| `households` | Rental property (name, unit, address) |
| `household_members` | People in a household (name, email, phone, role) |
| `expenses` | A bill (description, amount, category, who paid, split mode) |
| `expense_splits` | Each member’s share of an expense + `paid` flag |
| `documents` | Metadata for uploaded files |

### Enums

- `member_role`: `leaseholder` | `tenant`
- `expense_split_mode`: `equal` | `percentage` | `amount`

### Relationships (simplified)

```
households
  ├── household_members (many)
  ├── expenses (many)
  │     └── expense_splits (many, one per member)
  └── documents (many)

profiles
  ├── household_members (optional link via user_id)
  ├── expenses.created_by
  └── documents.uploaded_by
```

### Automatic behaviors (triggers)

- **`handle_new_user`** — creates `profiles` row when someone registers
- **`set_updated_at`** — updates `updated_at` on row changes

---

## Security (Row Level Security)

Every app table has **RLS enabled**. Users can only access data for households they belong to.

Core helper function:

```sql
is_household_member(household_id)
  → true if auth.uid() appears in household_members for that household
```

**Examples**

- You can only **read your own** profile (`id = auth.uid()`)
- You can only **see expenses** for households where you are a member
- Storage files are only accessible if the path’s household ID matches your membership

Even though the publishable key is in the frontend `.env`, strangers cannot read other users’ data because PostgreSQL enforces RLS on every query.

---

## Key features explained

### Expenses — summary cards

| Card | Meaning |
|------|---------|
| **You owe** | Your unpaid share across all expenses (goes down when you mark paid) |
| **Your share** | Your total responsibility (does not change when marked paid) |
| **Household total** | Sum of all expenses in the household |

### Expense splits

When you add an expense, the app creates rows in `expense_splits` — one per selected member.

Split modes:

- **Equal** — amount ÷ number of members
- **Percentage** — custom % per member (must total 100%)
- **Specific amounts** — custom dollar amounts (must total expense amount)

### Mark as paid

Clicking **Mark my share paid** updates `expense_splits.paid = true` and sets `paid_at` to the current time.

If you paid the bill, you can mark **other members** as paid when they pay you back.

### Documents

1. File uploads to Supabase Storage (`household-documents/{household_id}/...`)
2. Metadata (title, path, size) saves to `documents` table
3. Download uses a signed URL (temporary link, 1 hour)

---

## Presentation demo script

Suggested 5–8 minute walkthrough. Assign roles so each teammate speaks to one part.

### 1. Intro (30 sec)

> “RentRight helps roommates manage shared rentals — expenses, splits, and documents in one app. We built a React frontend with Supabase as our backend — PostgreSQL, auth, and file storage in the cloud.”

### 2. Register / login (1 min)

- Show Register page
- Log in as demo user
- Mention: credentials live in `auth.users`, profile auto-created in `profiles`

### 3. Dashboard — household setup (1 min)

- Create or show existing household
- Add a member
- Open Supabase **Table Editor** → show `households` and `household_members` rows updating

### 4. Expenses (2–3 min)

- Show the three summary cards: You owe, Your share, Household total
- Add a new expense (or show existing ones)
- Explain split between members
- Click **Mark my share paid** → show **You owe** decrease
- Open `expenses` and `expense_splits` in Supabase to show `paid` column

### 5. Documents (1 min)

- Upload a file
- Show it in Storage bucket + `documents` table

### 6. Architecture wrap-up (1 min)

- Show `schema.sql` (RLS policies)
- Show `AppContext.jsx` (Supabase calls)
- Emphasize: no custom server, security at database level

---

## Common professor questions

**Q: How did you implement the backend?**

> We used Supabase as a Backend-as-a-Service. PostgreSQL stores all data. Supabase Auth handles users and JWT sessions. The React app calls Supabase through `@supabase/supabase-js`. We defined tables, relationships, and Row Level Security in `supabase/schema.sql`.

**Q: How does authentication work?**

> Users register with `supabase.auth.signUp()`. Supabase stores hashed passwords in `auth.users`. A trigger creates a `profiles` row with the same user ID. On login, Supabase returns a JWT. Every database request includes that token, and RLS uses `auth.uid()` to decide what rows the user can see.

**Q: Where is user data saved?**

> Passwords: `auth.users` (Supabase Auth). Profile: `public.profiles`. Household data: `households`, `household_members`, `expenses`, `expense_splits`, `documents`. Files: Supabase Storage bucket `household-documents`. We can show all of this live in the Supabase Dashboard.

**Q: Why no Express / Flask / Spring backend?**

> For our scope, Supabase removed boilerplate while still giving us a real PostgreSQL database and server-side security via RLS. Trade-off: complex business rules live in SQL or the React client rather than a custom API layer.

**Q: How do you prevent users from seeing other households’ data?**

> Row Level Security policies check `is_household_member(household_id)` on every query. Only authenticated members of a household can read or write that household’s rows.

**Q: How are expense splits calculated?**

> Split math runs in the React app (`src/utils/expenseSplits.js` and `splits.js`). The results are stored in `expense_splits`. “You owe” sums unpaid splits for the current member.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Blank white screen** | Create `.env` from `.env.example` and add Supabase keys; restart `npm run dev`. Do **not** open `index.html` directly — use the Vite URL (e.g. http://localhost:3000) |
| Blank page / config error | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to `.env`, restart `npm run dev` |
| “Email not confirmed” on register | Turn off “Confirm email” in Supabase Auth settings |
| `expense_splits` does not exist | Run `supabase/schema.sql` in SQL Editor |
| Mark paid fails | Run the `paid` / `paid_at` columns section in `schema.sql` |
| Document upload fails | Ensure storage bucket `household-documents` exists (end of `schema.sql`) |
| “Profile not found” | Log out and log back in; `ensureProfileRow` runs on login |
| Stack depth / RLS error | Re-run `is_household_member` function from `schema.sql` (uses `security definer`) |

---

## Team checklist before presenting

- [ ] Everyone has `.env` pointing to the **same** Supabase project
- [ ] `schema.sql` has been run successfully
- [ ] Email confirmation is **off** in Supabase
- [ ] Demo household has members and at least 2 expenses
- [ ] Supabase Dashboard tabs are bookmarked (Users, profiles, expenses, expense_splits, Storage)
- [ ] Each teammate knows which section they present (auth, database, expenses, demo)
- [ ] `npm run build` passes with no errors

---

## Who presents what (suggested split)

| Teammate | Topic | Read these sections |
|----------|--------|---------------------|
| Person 1 | Intro + live demo (login, dashboard) | Demo script §1–3, Auth |
| Person 2 | Expenses feature + mark paid | Key features, `expense_splits` table |
| Person 3 | Database + where data lives | Where data is stored, Database schema |
| Person 4 | Backend + security (RLS) | How backend works, Security, Professor Q&A |

Good luck with your presentation.
