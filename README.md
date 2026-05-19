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
- Localization: en / ru / kz
- MCP layer (later)
