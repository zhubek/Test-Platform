# Architecture

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI runtime | React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, `tw-animate-css` |
| UI primitives | shadcn-style components on **Base UI** (`@base-ui/react`) |
| Charts | Recharts |
| Drag & drop | dnd-kit (`@dnd-kit/core`, `/sortable`, `/utilities`) |
| Test runtime | SurveyJS (`survey-core`, `survey-react-ui`) — used as a schema/type bridge |
| Code editor | Monaco (`@monaco-editor/react`) for SQL/JSON surfaces |
| Data | **In-memory mocks** (`src/lib/api.ts`, `src/lib/methodic-api.ts`) — no live backend yet |

## Audiences and route groups

The App Router uses three **route groups** under `src/app/`, each with its own layout and topbar. Route groups (`(name)`) don't appear in the URL — they only scope layout.

### `(public)` — students

`src/app/(public)/layout.tsx` wraps pages in `PublicTopbar` with a narrower container. Pages:

| Route | Purpose |
|-------|---------|
| `/home` | Student dashboard: assigned / completed / available tests |
| `/tests` | Browse/discover tests |
| `/tests/[id]/take` | Take a test (SurveyJS-rendered runtime) |
| `/tests/[id]/result/[resultId]` | The computed result view for a completed attempt |
| `/t/[token]` | Magic-link entry (license/token-based access) |
| `/characteristics` | The student's trait summaries (Interests, Personality, Skills, Values) |
| `/explore`, `/professions`, `/professions/[id]` | Profession explorer + rich detail pages (charts, education, labor market) |

### `(admin)` — content authors

`src/app/(admin)/layout.tsx` wraps pages in `AdminTopbar` (with a project picker) and a `ProjectProvider` context. Pages:

| Route | Purpose |
|-------|---------|
| `/admin/tests`, `/admin/tests/[id]` | Test list + the **test editor** (the core constructor) |
| `/admin/tests/[id]/preview` | Full preview of the authored test |
| `/admin/catalogs` + sub-routes | The **Catalogs** feature (professions, programs, institutions, cities, characteristics) — see [catalogs.md](./catalogs.md) |
| `/admin/surveys` | Survey list/editor (sibling to tests) |
| `/admin/dashboards` | Standalone dashboard management |
| `/admin/organizations`, `/admin/licenses` | Access management (grouped under the "Access" topbar menu) |
| `/admin/parameters` | Global parameters |

### `(orgadmin)` — organization staff

`src/app/(orgadmin)/layout.tsx` wraps pages in `OrgAdminTopbar`. Pages: `/org-admin/dashboard`, `/org-admin/licenses`.

## The admin topbar nav

`src/components/admin-topbar.tsx` defines the nav. It supports both flat links and **submenus** (a `NavItem` is either `{label, href}` or `{label, children[]}`):

- **Tests**
- **Catalogs**
- **Access** ▸ (Organizations, Licenses) — a dropdown submenu
- **Dashboards**
- **Parameters**

Submenu items render as `DropdownMenuItem render={<Link/>}` (the Base UI render-prop pattern).

## Rendering model

- Most interactive pages are **client components** (`"use client"`), because the app is a stateful authoring tool driven by in-memory data and React state.
- Navigation between detail pages historically uses `window.location.href` (full reload) in some catalog tables — simple and robust for the mock data, at the cost of a reload.
- There is no server-side data fetching against a real API yet; "fetch" functions resolve from module-level arrays.

## Where the three constructors live

The test editor at `/admin/tests/[id]` is a **tabbed shell** (`test-editor-shell.tsx`) holding all authoring state. Its tabs are the three constructors plus metadata:

```
General · Questions · Calculation · Result · Dashboard
```

- **Questions** → the test constructor ([test-constructor.md](./test-constructor.md))
- **Calculation** → the variable/scoring model ([test-constructor.md](./test-constructor.md))
- **Result** → the result-view builder ([result-and-dashboard.md](./result-and-dashboard.md))
- **Dashboard** → the SQL dashboard builder ([result-and-dashboard.md](./result-and-dashboard.md))

All authoring state is held in the shell and persisted in a single save patch (see [data-layer.md](./data-layer.md)).
