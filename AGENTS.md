# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, layouts, and route handlers; keep route-specific logic here.
- `components/`: Reusable UI elements (shadcn/Tailwind) and feature widgets.
- `lib/`: Domain logic, adapters, utilities (Lighthouse, AI prompts, storage helpers).
- `types/`: Shared TypeScript contracts; extend here before duplicating shapes.
- `public/`: Static assets; prefer importing from `public` instead of remote where possible.
- `__tests__/`: Unit/integration tests (Vitest + Testing Library); mirrors `app`, `components`, and `lib` structure.
- `tests/e2e/`: Playwright specs and fixtures; `test-results/` and `coverage/` are generated.
- `docs/` and `specs/`: Product/architecture reference; check `specs/001-nextjs-render-analyzer/` before adding new features.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server at `localhost:3000`.
- `npm run build`: Production build (fails on type or lint errors).
- `npm run start`: Run the built app.
- `npm run lint`: ESLint with Next.js rules; run before PRs.
- `npm test` / `npm run test:watch`: Vitest suites; use watch while developing.
- `npm run test:coverage`: Vitest with V8 coverage report.
- `npm run e2e` / `npm run e2e:ui`: Playwright headless/UI for smoke and auth flows.
- `npm run verify-env`: Quick check for required env vars.

## Coding Style & Naming Conventions
- TypeScript-first; keep strict types and narrow unions. Prefer `async`/`await` over `.then`.
- Functional React components; PascalCase for components, camelCase for functions/vars, SCREAMING_SNAKE_CASE for env keys.
- Co-locate style definitions with components; rely on Tailwind utility classes and `tailwind-merge` for overrides.
- Keep side effects in server actions or route handlers; pure helpers in `lib/`.
- Run `npm run lint` to auto-fix where possible; avoid mixing default exports and named exports in the same module.

## Testing Guidelines
- Unit/integration: Vitest + Testing Library. Name files `*.test.ts` or `*.test.tsx` under `__tests__/` mirroring source path.
- E2E: Playwright specs in `tests/e2e/*.spec.ts`; keep flows short and assert UI + network side effects.
- Add fixtures/mocks under `__mocks__/` when isolating third-party APIs.
- Aim to touch critical paths (rendering strategy metrics, Lighthouse parsing, AI prompts) with at least one test per change; include coverage when altering data pipelines.

## Commit & Pull Request Guidelines
- Follow conventional-style prefixes seen in history (`fix:`, `test:`, `feat:`, `chore:`, `docs:`). Include a short scope when helpful.
- Keep commits small and focused; include screenshots or HAR diffs for UI changes.
- PRs: clear summary, linked issue/Jira if applicable, list of verification commands run (lint/tests/e2e), and notes on env vars or migrations.

## Security & Configuration Tips
- Never commit secrets; use `.env.local` for local keys (OpenAI/Anthropic, Firebase, Redis, Vercel Edge Config).
- Run `npm run verify-env` before builds/deploys; document any new keys in `docs/` with purpose and scope.
- When adding integrations, guard server routes and actions with input validation (Zod) and avoid returning raw error stacks to clients.
