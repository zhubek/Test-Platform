# Test-Platform

A platform for building tests, result views, and dashboards — with a future MCP/AI bot layer that helps users author them.

## Stack

- **Frontend** — Next.js 16 (App Router, Turbopack)
- **Backend** — NestJS 11
- **Database** — PostgreSQL (Docker)
- **ORM** — Prisma 7
- **Test runtime** — SurveyJS Form Library (engine only, custom React renderers)

## Structure

```
Test-Platform/
├── frontend/              Next.js app — public site + admin UI + constructors
├── backend/               NestJS API — auth, tests, results, scoring
├── docker-compose.yml     Postgres for local dev
└── README.md
```

## Local development

Prereqs: Node 20+, Docker, pnpm or npm.

```bash
# 1. Start Postgres
docker compose up -d

# 2. Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run start:dev      # http://localhost:3001

# 3. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

## What's in scope

- Test constructor (closed palette of question types — single, multiple, likert, rating, text, etc.)
- Result view constructor (closed widget palette bound to computed result)
- Dashboard constructor (analytics widgets, drag-arrangeable grid)
- Catalogs (professions, programs, institutions, cities, characteristics) with per-item output variables
- Localization: en / ru / kz
- MCP layer (later)

> **Note:** the app currently runs **frontend-only on in-memory mock data** (`frontend/src/lib/api.ts`, `frontend/src/lib/methodic-api.ts`). The backend steps above describe the intended target, not a wired-in dependency — `cd frontend && npm install && npm run dev` is enough to run everything today.

## Documentation

Developer documentation lives in [`docs/`](./docs/README.md):

- [Architecture](./docs/architecture.md) — route groups, layouts, the three audiences
- [Data layer](./docs/data-layer.md) — the in-memory mock APIs, data model, save model
- [i18n](./docs/i18n.md) — localization (en/ru/kz)
- [Test constructor](./docs/test-constructor.md) — question types, SurveyJS, the variable/calculation model
- [Result & dashboard](./docs/result-and-dashboard.md) — the result-view and SQL dashboard builders
- [Catalogs](./docs/catalogs.md) — the 7-entity catalog hub, detail editors, output variables, matching
- [Components](./docs/components.md) — shared components, Base UI primitives
- [Development](./docs/development.md) — running locally + Turbopack/memory gotchas
