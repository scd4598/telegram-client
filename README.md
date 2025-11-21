# Telegram client (internal multi-account)

This repository contains a lightweight reference implementation for an internal multi-account Telegram client. It includes:

- **Backend**: Express + TypeScript, Prisma ORM, JWT auth, Socket.IO notifications, MTProto placeholders.
- **Frontend**: React + TypeScript (Vite) dashboard for cabinets, accounts, chats, and messaging.
- **Database**: PostgreSQL schema defined via Prisma.

## Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend
1. `cd backend`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `JWT_SECRET`, `TELEGRAM_API_ID`, and `TELEGRAM_API_HASH`.
3. Install dependencies: `npm install`
4. Generate Prisma client and run migrations: `npm run prisma:generate` then `npm run prisma:migrate`
5. Start development server: `npm run dev`

The backend exposes REST endpoints under `/api` and serves Socket.IO events for `new_message`.

### Frontend
1. `cd frontend`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

The SPA assumes the backend is reachable at the same host under `/api`.

### Notes
- Telegram login flows are stubbed for local development but follow the documented API shape (`/api/telegram/accounts/:id/send-code` and `confirm-code`).
- First-message limiting, chat statuses, and CRM integration hooks are implemented on the backend and can be extended for production.
