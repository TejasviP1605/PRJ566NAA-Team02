# RentRight — Installation Instructions

These steps run RentRight on a local computer for development.

## Requirements

- **Node.js 20** or later ([nodejs.org](https://nodejs.org))
- **npm** (included with Node.js)
- **Git**
- A **Supabase** project (free tier is enough)
- Team members should use the **same** Supabase project so they share one database

---

## 1. Clone the repository

```bash
git clone https://github.com/TejasviP1605/PRJ566NAA-Team02.git
cd PRJ566NAA-Team02
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and add values from **Supabase → Project Settings → API**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

- **Project URL** → `VITE_SUPABASE_URL`
- **Publishable key** (or legacy anon key) → `VITE_SUPABASE_PUBLISHABLE_KEY`

Do **not** commit `.env`. Share keys with teammates privately, not in GitHub.

---

## 4. Set up the database (first time, or after a reset)

1. Open **Supabase → SQL Editor**
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and **Run**

This script rebuilds app tables. Existing household/expense data is wiped; **auth users are kept**.

If you already have data and only need profile/household policy updates, run `supabase/profile-columns.sql` instead (non-destructive).

---

## 5. Configure authentication

In **Supabase → Authentication → Providers → Email**:

- Turn **off** “Confirm email”

Otherwise new users cannot log in until they confirm an email.

---

## 6. Start the development server

```bash
npm run dev
```

Open **http://localhost:3000**

You should see the Login page. Register a new account, or use the [test accounts](PUBLIC-SERVER.md#test-accounts) if this machine points at the team Supabase project.

---

## 7. First-time usage

1. Register or log in
2. Open **Profile** (avatar menu, top right) and create a household
3. On **Dashboard**, add members
4. Add an expense on **Expenses**
5. Upload a file on **Documents**

---

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development server (port 3000) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank white screen | Create `.env` from `.env.example`, add keys, restart `npm run dev` |
| “Email not confirmed” | Disable Confirm email in Supabase Auth |
| Households missing after login | Re-run `supabase/schema.sql` |
| Document upload fails | Confirm storage bucket `household-documents` exists (created by `schema.sql`) |
| Port already in use | Stop the other process, or change `server.port` in `vite.config.js` |

Windows (PowerShell) uses the same commands. If `cp` is not available:

```powershell
Copy-Item .env.example .env
```
