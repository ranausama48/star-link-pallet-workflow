# Starlinks Pallet Flow

Warehouse pallet inbound/outbound tracking with admin master data, analytics, and Oracle WMS integration hooks.

## Stack

- **Next.js 15** (App Router) — UI + `/api/*` Route Handlers
- **PostgreSQL on Supabase** — persistence via **Prisma**
- **Tailwind CSS v4**

## Prerequisites

- Node.js 20+
- Supabase project with `DATABASE_URL` (pooler, port 6543) and `DIRECT_URL` (direct, port 5432)

URL-encode special characters in the database password (e.g. `@` → `%40`).

## Setup

1. Copy env template and fill in Supabase URLs:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Apply migrations and seed baseline data from `data/warehouse_db.json`:

   ```bash
   set -a && source .env.local && set +a
   npm run db:migrate
   npm run db:seed
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:migrate` | Prisma migrate (uses shell env / `.env.local`) |
| `npm run db:seed` | Re-import baseline JSON into Postgres |
| `npm run db:studio` | Prisma Studio |

## Project layout

- `src/app/` — Next.js pages and API catch-all route
- `src/components/` — React UI (Admin panel split planned incrementally)
- `src/lib/server/` — Prisma sync, Express-compatible API layer, Supabase access
- `prisma/` — Schema and migrations
- `data/warehouse_db.json` — Seed / reset baseline snapshot

Legacy `server.ts` (Vite + Express) is retained for reference only; **use `npm run dev` (Next.js)** for local development.
