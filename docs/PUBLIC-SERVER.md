# RentRight — Running on a Public Server

The production app is hosted on **Vercel**. The database, auth, and file storage stay on **Supabase**.

## Live URL

**https://prj-566-naa-team02.vercel.app/login**

GitHub repository: https://github.com/TejasviP1605/PRJ566NAA-Team02

---

## Test accounts

Use these accounts to log in on the public site. Passwords meet the app’s 8-character minimum.

| Role | Username (email) | Password |
|------|------------------|----------|
| Leaseholder (admin) | `leaseholder@rentright.test` | `RentRight123` |
| Roommate (member) | `roommate@rentright.test` | `RentRight123` |

### How to try them

1. Open https://prj-566-naa-team02.vercel.app/login
2. Enter one of the emails and the password above
3. Click **Log in**

The leaseholder account can create a household from **Profile**, add members on **Dashboard**, and use Expenses, Documents, Maintenance, and Activity.

You may also **Register** a new account on `/register` if you prefer your own login.

These accounts are for course demonstration only. Do not use them for real personal data.

---

## How the public deployment works

```
GitHub (main branch)
        │  push
        ▼
GitHub Actions CI  →  npm ci && vite build
        │
        ▼
Vercel Production  →  https://prj-566-naa-team02.vercel.app
        │
        ▼
Supabase (Auth + PostgreSQL + Storage)
```

Vercel builds the React app from `main`. Environment variables on Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) point the live site at the team Supabase project.

---

## Redeploying (team members)

After merging or pushing to `main`:

1. GitHub Actions runs the CI build
2. Vercel deploys automatically (usually 1–3 minutes)
3. Hard refresh the live site: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

Preview deployments are created for pull requests. Use the **Production** URL above for grading and demos, not a PR preview link.

---

## Deploying your own copy (optional)

If you need a separate public instance:

1. Fork or clone the repo
2. Create a Vercel project and import the GitHub repo
3. Set environment variables in **Vercel → Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Run `supabase/schema.sql` on that Supabase project
5. Disable **Confirm email** in Supabase Auth
6. Deploy the `main` branch

Do not put the Supabase **service role** key in Vercel or the frontend.

---

## What markers / testers should verify

- Login with both test accounts
- Create or open a household (Profile)
- Add a member (Dashboard)
- Add an expense and mark a share paid
- Upload a document
- Filter Activity by category or date
- Log out from the profile dropdown
