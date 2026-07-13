# RentRight

RentRight is a shared rental management app for households, members, expenses, maintenance, and documents.

User authentication and core data are managed with Supabase (Auth + Postgres + Storage).

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS
- Backend: [Supabase](https://supabase.com) (Auth, PostgreSQL, Storage)

## Features

- Email/password registration and login
- Household creation and member management
- Shared expense tracking and split records
- Maintenance request tracking
- Document uploads to the `household-documents` storage bucket
- Household activity feed

## Prerequisites

- Node.js 18+ and npm
- A Supabase project

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

   Get these values from **Supabase → Project Settings → API**.

3. Configure the database:
   - Open `supabase/schema.sql`.
   - Run the SQL in **Supabase → SQL Editor**.
   - Important: this schema contains `drop` statements meant for fresh/dev environments and will remove existing data.

4. Configure authentication in Supabase:
   - Go to **Authentication → Providers → Email**.
   - Turn off **Confirm email** for local testing (as indicated in schema comments).

5. Start the app:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`, register an account, then create your first household from the dashboard.

## Architecture

```text
Register / Login  -> Supabase Auth (auth.users)
                 -> profiles (same id as auth user)

App pages        -> households, household_members, expenses,
                    expense_splits, documents, maintenance_requests, activities
```

## Database Tables

| Table | Purpose |
| --- | --- |
| `profiles` | User profile linked to `auth.users` |
| `households` | Household/property details |
| `household_members` | Members and roles per household |
| `expenses` | Shared household expenses |
| `expense_splits` | Per-member split details for each expense |
| `documents` | File metadata for uploaded household documents |
| `maintenance_requests` | Maintenance tickets and statuses |
| `activities` | Household activity log |

Storage bucket used by the app: `household-documents`.

## Notes

- If Supabase credentials are missing, the app will show configuration guidance on protected routes.
- For complete schema details (RLS policies, RPC functions, storage policies), see `supabase/schema.sql`.

## AI Assistance Disclosure

AI tools (GitHub Copilot) were used occasionally for code suggestions during development.
