# Test-Platform — Documentation

Test-Platform is a web application for **authoring psychometric/vocational tests, the result views students see, and the analytics dashboards organizations see** — with a planned MCP/AI layer that helps users author all three.

This `docs/` folder is the developer reference. Start here, then drill into the area you care about.

## Contents

| Doc | What it covers |
|-----|----------------|
| **[authoring-guide.md](./authoring-guide.md)** | **Cookbook for creating content (blocks, test questions, calculations, result/dashboard views, data catalogs, catalog views) — example-driven, written for AI agents.** Start here to author. |
| [architecture.md](./architecture.md) | High-level system shape, route groups, layouts, the three audiences (admin / org-admin / public) |
| [data-layer.md](./data-layer.md) | The in-memory mock APIs (`api.ts`, `methodic-api.ts`), the data model, how state is seeded and saved |
| [i18n.md](./i18n.md) | Localization: the `Localized` type, `localize()`/`l()`, the `i18n.ts` key map, the locale context |
| [i18n-rework.md](./i18n-rework.md) | **Instruction (planned):** reworking authored-content translation — dynamic per-project languages, "translate leaves not the tree", the `PropValue` union for blocks/tests/catalogs |
| [test-constructor.md](./test-constructor.md) | The test editor: tabs, question types, SurveyJS integration, the variable/calculation model |
| [result-and-dashboard.md](./result-and-dashboard.md) | The result-view builder and the SQL dashboard builder, including JSON views |
| [catalogs.md](./catalogs.md) | The Catalogs feature (ported "Methodic"): 7 entity types, detail editors, output variables, catalog matching |
| [components.md](./components.md) | Shared components, the shadcn/Base UI primitives, localized inputs, topbars |
| [development.md](./development.md) | Running locally, the Turbopack/memory gotchas, conventions |
| [snapshots/](./snapshots/) | Frozen "before" records of UI/logic about to change — e.g. [test-editor-calc-result-dashboard-2026-06.md](./snapshots/test-editor-calc-result-dashboard-2026-06.md) |

## TL;DR

- **Frontend-only today.** The whole app runs on **in-memory mock data** (`src/lib/api.ts`, `src/lib/methodic-api.ts`). There is no live backend wired in; edits persist only for the page-session. A NestJS + Postgres + Prisma backend is the intended target (see the repo-root `README.md`).
- **Next.js 16 (App Router, Turbopack), React 19, TypeScript.**
- **Three audiences, three route groups:** `(admin)` (content authors), `(orgadmin)` (organization staff), `(public)` (students taking tests / exploring professions).
- **Tri-lingual throughout:** English, Russian, Kazakh (`en` / `ru` / `kk`). Authored content uses a dynamic per-project language set — see [i18n-rework.md](./i18n-rework.md).
- **UI:** shadcn-style primitives built on **Base UI** (`@base-ui/react`), Tailwind CSS v4, Recharts for charts, dnd-kit for drag-reorder, SurveyJS (`survey-core`) as a schema/type bridge.

## The three things you author

1. **Tests** — sections of questions (single/multiple/likert/rating/etc.), with conditional logic and a **calculation model** that turns answers into variables (characteristics, custom formulas, catalog matches).
2. **Result views** — what the student sees after finishing: a page/block layout of charts, score cards, and catalog matches, bound to the computed variables.
3. **Dashboards** — what an organization sees: SQL-driven analytics widgets, automatically scoped to the org.

These three constructors share a visual language (split-pane editor + live preview, JSON view, drag-reorder) and live inside the **test editor** at `/admin/tests/[id]`.

## Repo layout (relevant to the frontend)

```
Test-Platform/
├── frontend/                 Next.js app (this is what the docs describe)
│   └── src/
│       ├── app/              App Router routes, grouped by audience
│       ├── components/       Shared components + ui/ primitives
│       └── lib/              Data layer, i18n, catalog logic, helpers
├── docs/                     ← you are here
└── README.md                 Repo-level overview + intended backend stack
```
