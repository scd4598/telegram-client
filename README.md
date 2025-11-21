# Telegram client (internal multi-account)

This repository contains a reference implementation for an internal multi-account Telegram client. It ships with:

- **Backend**: Express + TypeScript, Prisma ORM (PostgreSQL), JWT auth, Socket.IO notifications, MTProto login placeholders, first-message limiter, and CRM hooks.
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

The backend exposes REST endpoints under `/api` (auth, cabinets, telegram accounts, chats/messages) and emits `new_message` Socket.IO events. Login/confirm-code endpoints are stubbed for MTProto development but persist session data for reconnects.

### Frontend
1. `cd frontend`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

The SPA assumes the backend is reachable at the same host under `/api`.

### Notes
- First-message limiting, chat statuses, and CRM integration hooks are implemented on the backend and can be extended for production.
- Access control ensures managers only see cabinets/accounts they are assigned to; admins see everything.
- Socket.IO is used for real-time chat updates; REST covers login, cabinet/account listing, chat history, and sending messages.
