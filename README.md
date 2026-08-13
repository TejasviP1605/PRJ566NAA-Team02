# RentRight

**Team 1** — shared rental management for roommates.

Login, profiles, households, expenses, documents, maintenance, and activity history are stored in **Supabase** (Auth + PostgreSQL + Storage). The UI is a React app hosted on **Vercel**.

**Live site:** https://prj-566-naa-team02.vercel.app/login

---

## Project documents

| Document | Contents |
|----------|----------|
| [Technical document](docs/TECHNICAL.md) | Architecture, stack, database, security |
| [Installation instructions](docs/INSTALLATION.md) | How to run locally |
| [Public server](docs/PUBLIC-SERVER.md) | Live URL, deploy notes, **test account usernames and passwords** |

---

## Quick start (local)

```bash
git clone https://github.com/TejasviP1605/PRJ566NAA-Team02.git
cd PRJ566NAA-Team02
npm install
cp .env.example .env
```

Add your Supabase URL and publishable key to `.env`, run `supabase/schema.sql` in the SQL Editor, then:

```bash
npm run dev
```

Open http://localhost:3000

Full steps: [docs/INSTALLATION.md](docs/INSTALLATION.md)

---

## Test accounts (public site)

| Username | Password |
|----------|----------|
| `leaseholder@rentright.test` | `RentRight123` |
| `roommate@rentright.test` | `RentRight123` |

Details: [docs/PUBLIC-SERVER.md](docs/PUBLIC-SERVER.md)

---

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** [Supabase](https://supabase.com) — Auth + PostgreSQL + Storage
- **Hosting:** Vercel

---

## AI assistance disclosure

AI tools (GitHub Copilot) were used occasionally for code suggestions during development.
