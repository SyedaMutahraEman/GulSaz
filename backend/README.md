# GUL SAZ POS Backend

Node.js + Express + TypeScript + PostgreSQL + Prisma API for the clothing brand POS.

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL) **or** a local PostgreSQL instance

> **Windows note:** This project path contains `&`, which breaks some native npm install scripts.
> Password hashing uses `bcryptjs` (compatible bcrypt API) for that reason.
> Prefer running Prisma/tsx via `node node_modules/...` if `npx` fails.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Start PostgreSQL:

```bash
docker compose up -d
```

Migrate + seed:

```bash
node node_modules/prisma/build/index.js migrate dev
node node_modules/tsx/dist/cli.mjs prisma/seed.ts
```

## Run

```bash
# development
node node_modules/tsx/dist/cli.mjs watch src/server.ts

# production build
node node_modules/typescript/bin/tsc
node dist/server.js
```

API: `http://localhost:5000`
Health: `GET /api/health`

## Seed credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pos.com | admin123 |
| Employee | employee@pos.com | employee123 |

## Key endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `CRUD /api/categories`
- `CRUD /api/products`
- `GET /api/products/barcode/:barcode`
- `POST /api/inventory/add|remove|adjust`
- `GET /api/inventory/movements`
- `POST|GET /api/sales`
- `CRUD /api/users` (admin)
- `GET|PUT /api/settings`
- `GET /api/dashboard` (admin)
