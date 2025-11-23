# Quick Start: Live Web Vitals Dashboard Integration

**Branch**: `004-database-interactions` | **Updated**: 2025-01-22

## Prerequisites

- Node.js 20+ and npm installed
- Git repository cloned
- Firebase project configured (spec 002)
- Neon PostgreSQL database connected (spec 003)
- Environment variables set in `.env.local`:

  ```bash
  # Firebase (from spec 002)
  FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
  NEXT_PUBLIC_FIREBASE_API_KEY=...
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

  # Database (from spec 003)
  DATABASE_URL='postgresql://...' # or POSTGRES_PRISMA_URL for Vercel Postgres
  DIRECT_URL='postgresql://...'    # or POSTGRES_URL_NON_POOLING for Vercel Postgres
  ```

## Setup Steps

### 1. Switch to Feature Branch

```bash
git checkout 004-database-interactions
```

If branch doesn't exist locally:

```bash
git fetch origin
git checkout -b 004-database-interactions origin/004-database-interactions
```

### 2. Install Dependencies

```bash
npm install
```

All required packages already in `package.json`:

- `web-vitals@4.2.4` (Web Vitals capture)
- `prisma@7.0.0` (ORM)
- `@prisma/adapter-neon@7.0.0` (Neon HTTP driver)
- `recharts@2.15.0` (optional charts)

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates TypeScript types from `prisma/schema.prisma`.

### 4. Push Database Schema (If Fresh Database)

If this is a fresh database or schema changes were made:

```bash
npm run db:push
```

This creates the `web_vitals_metrics` table if it doesn't exist.

**Note**: If you completed spec 003, the table already exists. Skip this step.

### 5. Generate Demo Data

Run the seed script to populate the database with 337 realistic metrics:

```bash
npm run db:seed
```

Expected output:

```
🌱 Seeding database...
🔄 Generating SSG metrics... (1/4)
✅ Created 100 SSG metrics
🔄 Generating ISR metrics... (2/4)
✅ Created 87 ISR metrics
🔄 Generating CACHE metrics... (3/4)
✅ Created 75 CACHE metrics
🔄 Generating SSR metrics... (4/4)
✅ Created 75 SSR metrics
🎉 Seed complete! Generated 337 metrics across 7 days
```

**Seed is idempotent**: Run multiple times safely. Uses `skipDuplicates` to avoid errors.

### 6. Start Development Server

```bash
npm run dev
```

Server starts at: `http://localhost:3000`

### 7. Login with Firebase

1. Navigate to `http://localhost:3000/login`
2. Sign in with Google (or email if configured)
3. Session cookie set (14 days expiry)

**Important**: Must login with the SAME Google account used during seed script (or update `demoUserId` in seed script).

### 8. View Dashboard

Navigate to: `http://localhost:3000/dashboard`

**Expected Result**:

- 4 strategy cards: SSG, ISR, CACHE, SSR
- Each card shows 5 metrics: LCP, CLS, INP, FID, TTFB
- Values are averages from last 24 hours of seed data
- SSG shows fastest metrics (~600ms LCP)
- SSR shows slowest metrics (~1800ms LCP)

**If Empty Dashboard**:

- Check you logged in with same Google account as seed script
- Check console logs for database connection errors
- Run `npm run db:studio` to verify data exists
- Run `npm run db:seed` again if needed

### 9. Generate Live Metrics (Optional)

Browse lab pages to generate real metrics:

```bash
# Open in browser:
http://localhost:3000/lab/ssg
http://localhost:3000/lab/ssr
http://localhost:3000/lab/isr
http://localhost:3000/lab/cache
```

**Behavior**:

- Web Vitals captured automatically (LCP, CLS, INP, FID, TTFB)
- Sent to `/api/web-vitals` on metric finalization
- Saved to database with strategy determined from URL
- Dashboard updates on next page load (Server Component re-render)

**Metrics fire when**:

- LCP: Page visibility changes (switch tabs, close page)
- CLS: Page visibility changes
- INP: Page visibility changes or 30s timeout
- FID: First user interaction (click, tap, key press)
- TTFB: Page load (immediate)

## Verification

### Check Database with Prisma Studio

```bash
npm run db:studio
```

Opens: `http://localhost:5555`

**Navigate to**:

- `web_vitals_metrics` table
- Filter by your `userId` (Firebase UID)
- Should see 337 rows (from seed) + any live metrics

**Useful Queries**:

```sql
-- Count metrics per strategy
SELECT strategy, COUNT(*)
FROM web_vitals_metrics
GROUP BY strategy;

-- Average LCP per strategy
SELECT strategy, AVG(value)
FROM web_vitals_metrics
WHERE name = 'LCP'
GROUP BY strategy;
```

### Check API Endpoint

Test Web Vitals POST endpoint:

```bash
curl -X POST http://localhost:3000/api/web-vitals \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{
    "url": "http://localhost:3000/lab/ssg",
    "strategy": "SSG",
    "name": "LCP",
    "value": 1234.5
  }'
```

Expected response:

```json
{
  "success": true,
  "metricId": "uuid-here"
}
```

**Get session cookie**:

1. Login at `/login`
2. Open DevTools → Application → Cookies
3. Copy `session` cookie value

### Run Tests

```bash
# Unit + integration tests
npm test

# Watch mode
npm run test:watch

# E2E tests (optional)
npm run e2e
```

**Expected**:

- 41 existing tests passing (from spec 003)
- Additional tests for seed script (if implemented)

## Troubleshooting

### Empty Dashboard After Seed

**Problem**: Dashboard shows "No metrics yet" despite seed running

**Solutions**:

1. Check `userId` in seed script matches logged-in user:

   ```bash
   # In prisma/seed.ts, find:
   const demoUserId = 'YOUR_FIREBASE_UID_HERE';

   # Get your Firebase UID:
   # 1. Login at /login
   # 2. Open DevTools console
   # 3. Run: document.cookie (look for session cookie payload)
   ```

2. Verify data exists:

   ```bash
   npm run db:studio
   # Check web_vitals_metrics table has rows
   ```

3. Check session cookie valid:
   ```bash
   # Dashboard should show your email in header
   # If not, session expired - login again
   ```

### Database Connection Error

**Problem**: `PrismaClientInitializationError: Can't reach database server`

**Solutions**:

1. Check `DATABASE_URL` in `.env.local`:

   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

2. Verify Neon database running:
   - Login to Neon console
   - Check project status
   - Copy connection string again if needed

3. Regenerate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

### Web Vitals Not Capturing

**Problem**: Browse lab pages but no new metrics in database

**Solutions**:

1. Check browser console for errors:

   ```javascript
   // Should see logs like:
   // "LCP: 1234.5ms"
   // "Saving metric: LCP"
   ```

2. Check Network tab for POST to `/api/web-vitals`:
   - Should see 200 OK response
   - If 401: Session expired, login again
   - If 400: Check request body format

3. Verify WebVitalsReporter component loaded:
   ```javascript
   // In DevTools console:
   document.querySelector("script").textContent.includes("onLCP");
   // Should return true
   ```

### Seed Script Fails

**Problem**: `npm run db:seed` throws error

**Solutions**:

1. Check Prisma Client generated:

   ```bash
   ls lib/generated/prisma
   # Should see index.js, index.d.ts, etc.
   ```

2. Check database schema up-to-date:

   ```bash
   npm run db:push
   # Applies latest schema changes
   ```

3. Check DATABASE_URL environment variable:
   ```bash
   npm run verify-env
   # Should show DATABASE_URL present
   ```

## Development Workflow

### Typical Development Session

1. Start dev server: `npm run dev`
2. Login: `/login`
3. View dashboard: `/dashboard` (shows seed data)
4. Browse lab pages: `/lab/ssg`, `/lab/ssr`, etc. (generates live metrics)
5. Refresh dashboard: See updated averages

### Reset Demo Data

To clear and regenerate seed data:

```bash
# Option 1: Truncate table (fast)
npm run db:studio
# In Prisma Studio: Delete all rows from web_vitals_metrics

# Option 2: Reset entire database (slow)
npm run db:reset
# WARNING: Deletes ALL data, re-runs migrations, runs seed

# Then regenerate:
npm run db:seed
```

### Add More Seed Data

Edit `prisma/seed.ts`:

```typescript
const STRATEGY_COUNTS = {
  SSG: 200, // Increase from 100
  ISR: 150, // Increase from 87
  CACHE: 100, // Increase from 75
  SSR: 100, // Increase from 75
};
```

Re-run: `npm run db:seed`

## Next Steps

1. **Phase 2 (Optional)**: Add time-series chart
   - File: `components/dashboard/vitals-chart.tsx`
   - Shows LCP trend over 24 hours
   - Uses Recharts LineChart

2. **E2E Test (Optional)**: Playwright bot for bulk data
   - File: `tests/e2e/web-vitals-capture.spec.ts`
   - Automates browsing lab pages
   - Generates 100+ metrics for stress testing

3. **Production Deployment**: Deploy to Vercel
   - Configure Vercel Postgres (Neon)
   - Set environment variables in Vercel dashboard
   - Run seed script in production (or use Vercel Cron)

## Useful Commands Reference

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Production build
npm run start              # Start production server

# Database
npm run db:seed            # Generate demo data (337 metrics)
npm run db:studio          # Open Prisma Studio GUI
npm run db:push            # Push schema to database (no migrations)
npm run db:reset           # Reset database (WARNING: destructive)

# Prisma
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate dev # Create migration (if needed)
npm run prisma:studio      # Alias for db:studio

# Testing
npm test                   # Run unit + integration tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run e2e                # Playwright E2E tests
npm run e2e:ui             # Playwright UI mode

# Verification
npm run verify-env         # Check environment variables
npm run lint               # ESLint check
npm run type-check         # TypeScript check (if script exists)
```

## Resources

- **Spec 003**: Prisma + Neon setup guide
- **Spec 004**: This feature specification
- **Data Model**: `/specs/004-database-interactions/data-model.md`
- **Research**: `/specs/004-database-interactions/research.md`
- **Web Vitals Docs**: https://web.dev/vitals/
- **Prisma Docs**: https://www.prisma.io/docs/
- **Neon Docs**: https://neon.tech/docs/

## Support

If issues persist:

1. Check `/specs/004-database-interactions/` for detailed docs
2. Review existing tests: `__tests__/lib/db/web-vitals.test.ts`
3. Check Neon console for database errors
4. Review Vercel logs (if deployed)
