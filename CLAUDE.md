# CLAUDE.md — AI Assistant Reference for telegram-client

This file provides guidance for AI assistants working in this codebase.

---

## Project Overview

A multi-account Telegram client platform that allows teams to manage multiple Telegram accounts across organizational units called "cabinets." Key features include role-based access control, daily message rate limiting, real-time messaging via Socket.IO, and CRM integration hooks.

**The Telegram API integration is currently stubbed/mocked** — actual MTProto calls are not implemented in this reference scaffold.

---

## Repository Structure

```
telegram-client/
├── backend/                    # Express + TypeScript API server
│   ├── .env.example            # Required environment variable template
│   ├── package.json
│   ├── tsconfig.json           # Target: ES2020, output: dist/
│   ├── prisma/
│   │   └── schema.prisma       # PostgreSQL schema (Prisma ORM)
│   └── src/
│       ├── index.ts            # Server entry point (port 4000)
│       ├── middleware/
│       │   ├── authMiddleware.ts   # JWT verification + role checks
│       │   └── errorHandler.ts    # Centralized error handling
│       ├── routes/
│       │   ├── auth.ts             # POST /api/auth/register|login
│       │   ├── cabinets.ts         # GET|POST /api/cabinets
│       │   ├── telegramAccounts.ts # /api/telegram/accounts
│       │   └── chats.ts            # /api/chats
│       ├── services/
│       │   ├── authService.ts      # Registration, login, JWT
│       │   ├── cabinetService.ts   # Cabinet management
│       │   ├── limiterService.ts   # Daily rate limiting logic
│       │   └── crmIntegrationService.ts  # CRM event hooks
│       ├── telegram/
│       │   └── telegramManager.ts  # Telegram account lifecycle (stubbed)
│       └── types/
│           └── limits.ts           # TypeScript interfaces for rate limits
└── frontend/                   # React + Vite SPA
    ├── index.html
    ├── vite.config.ts          # Dev server on port 5173
    ├── tsconfig.json
    └── src/
        ├── main.tsx            # React entry (StrictMode)
        ├── App.tsx             # Root state: auth, cabinets, accounts
        ├── api/
        │   └── client.ts       # Axios instance with auth header injection
        └── components/
            ├── LoginForm.tsx       # Auth UI
            ├── CabinetSelector.tsx # Sidebar: cabinets + accounts
            ├── ChatPanel.tsx       # Chat list + message input
            └── MessageList.tsx     # Message rendering (in/out direction)
```

---

## Technology Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Node.js 18+, Express 4.19, TypeScript 5.4 |
| Database   | PostgreSQL via Prisma ORM 5.14      |
| Auth       | JWT (jsonwebtoken 9), bcryptjs 2.4  |
| Real-time  | Socket.IO 4.7 (server + client)     |
| Frontend   | React 18.2, Vite 5.2, TypeScript 5.4 |
| HTTP client| Axios 1.6                           |

---

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### Backend

```bash
cd backend
cp .env.example .env        # Fill in required values
npm install
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Apply DB migrations
npm run dev                 # Hot-reload dev server on :4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # Vite dev server on :5173
```

### Environment Variables (`backend/.env`)

| Variable          | Description                          |
|-------------------|--------------------------------------|
| `DATABASE_URL`    | PostgreSQL connection string         |
| `JWT_SECRET`      | Secret for signing JWT tokens        |
| `TELEGRAM_API_ID` | Telegram app ID (from my.telegram.org) |
| `TELEGRAM_API_HASH` | Telegram app hash                  |
| `PORT`            | Server port (default: 4000)          |

---

## Scripts Reference

### Backend (`backend/`)

| Script               | Command                             | Purpose                     |
|----------------------|-------------------------------------|-----------------------------|
| `npm run dev`        | `ts-node-dev --respawn src/index.ts`| Hot-reload development      |
| `npm run build`      | `tsc`                               | Compile TS → `dist/`        |
| `npm run start`      | `node dist/index.js`               | Run production build        |
| `npm run prisma:generate` | `prisma generate`              | Regenerate Prisma client    |
| `npm run prisma:migrate`  | `prisma migrate dev`           | Run pending migrations      |

### Frontend (`frontend/`)

| Script           | Purpose                             |
|------------------|-------------------------------------|
| `npm run dev`    | Vite dev server with HMR on :5173   |
| `npm run build`  | Production bundle to `dist/`        |
| `npm run preview`| Preview production build locally    |

---

## Database Schema (Prisma)

### Core Models

- **User** — Platform user with hashed password; has many cabinets via `UserCabinet`
- **Cabinet** — Organizational unit; contains Telegram accounts and users
- **UserCabinet** — Join table; assigns a `Role` (admin | manager) per cabinet
- **TelegramAccount** — Telegram account with phone/session; status lifecycle
- **Chat** — Individual Telegram chat tracked per account; has `ChatStatus`
- **Message** — Individual messages; direction (in | out)
- **AccountDailyLimit** — Tracks daily first-message count per account per date
- **CrmEvent** — Audit log of CRM-relevant events (message sends, status changes)

### Key Enums

```
Role:         admin | manager
AccountStatus: active | paused | risk | error
ChatStatus:   not_contacted | first_sent | responded
MessageDirection: in | out
```

---

## API Endpoints

### Authentication
| Method | Path                  | Auth | Description               |
|--------|-----------------------|------|---------------------------|
| POST   | `/api/auth/register`  | No   | Register new user         |
| POST   | `/api/auth/login`     | No   | Login, returns JWT token  |

### Cabinets
| Method | Path                          | Role  | Description                  |
|--------|-------------------------------|-------|------------------------------|
| GET    | `/api/cabinets`               | any   | List user's cabinets         |
| POST   | `/api/cabinets`               | admin | Create new cabinet           |
| POST   | `/api/cabinets/:id/users`     | admin | Assign user to cabinet       |

### Telegram Accounts
| Method | Path                                    | Role  | Description              |
|--------|-----------------------------------------|-------|--------------------------|
| GET    | `/api/telegram/accounts`               | any   | List accounts            |
| POST   | `/api/telegram/accounts`               | admin | Create account           |
| POST   | `/api/telegram/accounts/:id/send-code` | admin | Initiate Telegram login  |
| POST   | `/api/telegram/accounts/:id/confirm-code` | admin | Confirm login code    |

### Chats & Messages
| Method | Path                      | Auth | Description                  |
|--------|---------------------------|------|------------------------------|
| GET    | `/api/chats?accountId=X`  | any  | List chats for account       |
| GET    | `/api/chats/:id/messages` | any  | List messages in chat        |
| POST   | `/api/chats/:id/messages` | any  | Send message (rate-limited)  |

### Real-time (Socket.IO)
- Event `new_message` — emitted to all connected clients when a new message arrives

---

## Architecture Patterns

### Backend Service Layer
Business logic lives in `services/`. Routes delegate to services rather than containing logic directly. Services use factory functions accepting a Prisma client, enabling dependency injection.

```typescript
// Pattern: factory function receiving prismaClient
export const createAuthService = (prisma: PrismaClient) => ({
  register: async (email, password) => { ... },
  login: async (email, password) => { ... },
});
```

### Authentication & Authorization
- JWT tokens are verified in `authMiddleware.ts` and attached to `req.user`
- Access token: 1 hour expiry; refresh token: 7 days
- Role checks are inline in route handlers using `req.user.role`
- Admin-only operations (create cabinet, create account, send-code) throw 403 for managers

### Rate Limiting
`limiterService.ts` tracks daily first-message counts in `AccountDailyLimit`. Default limit is 20 first messages per account per day. Logic checks `ChatStatus` — only `not_contacted` chats consume the limit.

### CRM Integration
`crmIntegrationService.ts` provides an event logging layer. Call `logEvent(prisma, type, payload)` at key points (message sent, status changed). Events are stored in `CrmEvent` table for external CRM consumption.

### Frontend State Management
`App.tsx` holds all shared state (auth token, selected cabinet, selected account) using `useState`. State is passed down as props — no external state manager. The Axios client in `api/client.ts` reads the token from localStorage and injects it as a Bearer header.

---

## Coding Conventions

- **TypeScript strict mode** is enabled in both frontend and backend `tsconfig.json` — avoid `any` types
- **Functional components with hooks** — no class components in the React frontend
- **Centralized error handling** — backend route handlers use `try/catch` and pass errors to `next(err)`, which flows to `errorHandler.ts`
- **Prisma for all DB access** — do not write raw SQL; use Prisma query API
- **No test framework is configured** — this is a reference scaffold; add tests (Vitest for frontend, Jest/Supertest for backend) before production use
- **Environment variables** — never hardcode secrets; all config comes from `.env` via `dotenv`
- **CORS** — configured in `index.ts`; update allowed origins before deploying

---

## Important Notes for AI Assistants

1. **Telegram login is stubbed** — `telegramManager.ts` mocks authentication. Real implementation would use a library like `gramjs` (GramJS/telegram) with actual MTProto sessions.

2. **No tests exist** — when adding features, consider adding tests. The infrastructure to do so is not yet set up; choose Vitest for frontend and Jest + Supertest for backend.

3. **No CI/CD pipeline** — there are no GitHub Actions or other CI configuration files.

4. **Frontend talks to backend at relative paths** — the Vite dev proxy or a production reverse proxy must route `/api` to port 4000. Check `vite.config.ts` if adding a dev proxy.

5. **Session storage for Telegram** — `TelegramAccount.sessionString` stores the MTProto session. In production this must be encrypted at rest.

6. **Socket.IO room management** — currently broadcasts `new_message` to all connected clients. In production, scope events to specific cabinet/account rooms.

7. **Database migrations** — always create a new Prisma migration (`npm run prisma:migrate`) when modifying `schema.prisma`. Never edit migration SQL files manually.

8. **Branch conventions** — active development branches follow the pattern `claude/<task-id>`. The main branch is `master`.
