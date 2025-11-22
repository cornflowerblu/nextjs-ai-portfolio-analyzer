# Quickstart: Prisma + Neon + Firebase Integration

This guide helps you set up the database schema, environment, and basic API usage for the Rendering Strategy Analyzer persistence layer.

## Prerequisites

- Neon (or Vercel Postgres) database
- Firebase project with Web Auth and Admin SDK credentials
- Node.js 18+

## Environment Variables

Create `.env.local` with:

```
# Database (primary)
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB?sslmode=require

# Optional Vercel Postgres optimized URL (preferred in prod)
# POSTGRES_PRISMA_URL=...

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
# Note: Replace \n with real newlines or wrap in quotes properly
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

## Install Dependencies

```bash
npm install prisma @prisma/client firebase-admin
```

## Initialize Prisma

```bash
npx prisma init --datasource-provider postgresql
# Replace prisma/schema.prisma with the one implemented for this feature
npx prisma generate
```

## Migrate Database

```bash
npx prisma migrate dev --name init_persistence
```

## Runtime Notes

- DB-backed routes set `export const runtime = 'nodejs'`.
- Use Prisma Client singleton (`lib/db/prisma.ts`) to avoid connection storms.
- Verify Firebase ID tokens server-side; derive `userId` from token.

## Example Requests

Set `TOKEN` to a valid Firebase ID token for a signed-in user.

```bash
# Create analysis session
curl -X POST http://localhost:3000/api/analyses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","summary":"AI summary","recommendations":"Do X, Y"}'

# Add Web Vitals metric
curl -X POST http://localhost:3000/api/web-vitals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","strategy":"SSR","lcpMs":1200,"cls":0.03,"inpMs":180,"ttfbMs":150}'

# Record Lighthouse snapshot
curl -X POST http://localhost:3000/api/lighthouse \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","performance":95,"accessibility":98,"bestPractices":100,"seo":96}'

# Request report generation
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format":"MARKDOWN"}'
```

## Performance & Security

- Indices ensure `(userId, createdAt)` and `(userId, url, strategy)` queries meet p95 budgets.
- Paginate lists with `limit` ≤ 100 and cursor when available.
- Never accept `userId` from client payloads.
