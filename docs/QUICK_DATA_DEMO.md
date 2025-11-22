# 60-Minute Dynamic Data Demo (Vercel-native)

A minimal path to ship a dynamic rendering demo that reads and writes data using Vercel-managed primitives in under an hour. The goal is to visibly demonstrate Next.js 16 cache controls (ISR vs dynamic fetch) plus Vercel Postgres + KV in the lab UI.

## What you’ll build
- A tiny "Recent Analyses" list backed by **Vercel Postgres** (via `@vercel/postgres`), cached in **Vercel KV**.
- A **Server Action** to insert a new analysis row and revalidate the cached read.
- Two read endpoints to contrast **ISR** vs **force-dynamic** fetches, with a cache-hit badge.

## Prereqs (5 minutes)
- Set environment vars locally or in Vercel: `POSTGRES_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`.
- Install the Postgres client if missing: `npm install @vercel/postgres`.

## Data model (5 minutes)
Create a lean table:
```sql
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  strategy text NOT NULL,
  score int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
Seed 1–2 rows so the UI has immediate content.

## Read path (15 minutes)
1. Add `app/api/analyses/route.ts`:
   - `export const revalidate = 60;` (ISR) and `fetchCache = "force-cache"`.
   - Read from KV key `analysis:list` first; on miss, `SELECT ... ORDER BY created_at DESC LIMIT 5` from Postgres, then `kv.set` the list with a short TTL.
2. Add `app/api/analyses/live/route.ts` with `export const dynamic = "force-dynamic";` to bypass cache and show fresh latency.

## Write path (10 minutes)
- In the lab page (e.g., `app/lab/cache/page.tsx`), add a **Server Action** form that inserts `{ url, strategy, score }` into Postgres and calls `revalidatePath("/api/analyses")`. Use `useOptimistic` to show the pending row instantly.

## UI wiring (15 minutes)
- Display two panels side by side:
  - **Cached (ISR+KV)**: fetch `/api/analyses`, show `cacheHit: true/false`, and the last revalidated timestamp.
  - **Live (dynamic)**: fetch `/api/analyses/live`, show measured latency (Edge vs Serverless if you set `export const runtime = "edge"` on the live route).
- Add a small badge for cache hits and a toggle to force-refresh (call the live endpoint).

## Proof points for interviewers
- Code visibly exports `revalidate`, `dynamic`, and `fetchCache` in routes.
- KV logs include hit/miss counters; surface them in the UI.
- "Last updated" timestamps prove ISR is working; latency text demonstrates Edge vs Serverless.

## Time budget recap
- 5m env + install
- 5m SQL/seed
- 15m read endpoints
- 10m write action
- 15m UI hooks
- 10m buffer for polish
