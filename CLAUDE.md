# Telegram Client - Project Context

## What is this project?
Multi-account Telegram client for mass outreach, account management, and CRM integration.
Sales/outreach teams use it to manage multiple Telegram accounts, send messages with rate-limiting (20 first messages/day per account), and track chat funnels.

## Tech Stack
- **Backend**: Express + TypeScript, Prisma ORM, PostgreSQL, Socket.IO, GramJS (Telegram MTProto)
- **Frontend**: React + TypeScript, Vite, Tailwind CSS
- **Infrastructure**: Docker Compose (PostgreSQL 16 + backend + frontend/nginx)

## Current State
- **Main branch** (`main`): Original scaffold only
- **Feature branch** (`claude/analyze-repo-documentation-TPeTH`): Full MVP with all improvements:
  - Security fixes (JWT validation, CORS, role protection, Socket.IO auth, authorization checks)
  - Prisma schema with @@unique constraints
  - Zod validation on all endpoints
  - GramJS adapter for real Telegram integration
  - Tailwind UI components (login, dashboard, cabinets, chats, messages)
  - Docker setup (compose + Dockerfiles + nginx + entrypoint)
  - Backend tests (vitest, 11 tests passing)
  - Full documentation (DOCS.md)

## Important: This branch needs to be merged to main
The feature branch has NOT been merged yet. To get the full project:
```bash
git checkout claude/analyze-repo-documentation-TPeTH
# or merge it into main
```

## Key Files
- `DOCS.md` — Full project documentation
- `backend/src/config.ts` — Environment validation (crashes if JWT_SECRET missing)
- `backend/src/telegram/gramjsAdapter.ts` — GramJS wrapper
- `backend/src/telegram/telegramManager.ts` — Account management, messaging, sync
- `backend/prisma/schema.prisma` — Data model
- `docker-compose.yml` — Full stack orchestration

## Environment
Requires `.env` in root with:
- `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` (from https://my.telegram.org)
- `JWT_SECRET`
- `DATABASE_URL` (provided by docker-compose)
- `CORS_ORIGIN` (default http://localhost:5173)

## Running
```bash
docker compose up --build
# Frontend: http://localhost:5173
# Default login: admin@local.dev / admin123
```

## What's Next (not yet done)
1. Merge feature branch to main
2. Test full Docker build end-to-end
3. Real Telegram account login flow testing
4. Contact import / CSV upload
5. Campaign/broadcast management UI
6. CRM webhook integration
7. Admin panel (user management, analytics)
8. CI/CD pipeline
