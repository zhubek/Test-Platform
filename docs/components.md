# Components

## UI primitives (`src/components/ui/`)

shadcn-style components built on **Base UI** (`@base-ui/react`), styled with Tailwind v4 and `class-variance-authority` (CVA) for variants. Present primitives:

`badge` · `button` · `card` · `checkbox` · `dialog` · `dropdown-menu` · `input` · `label` · `select` · `separator` · `switch` · `tabs` · `textarea` · `tooltip`

### Base UI quirks worth knowing

Because these wrap Base UI (not Radix), a few APIs differ from stock shadcn:

- **`Button` uses a `render` prop** to become another element (e.g. a link): `<Button render={<Link href=… />}>`. `ButtonLink` (`src/components/button-link.tsx`) wraps this so a Button renders a semantic `<a>`.
- **`Select.onValueChange`** yields `string | null`.
- **`SelectValue`** takes a children render function.
- **`DropdownMenuLabel`** must sit inside a `DropdownMenuGroup`.
- **`DropdownMenuItem` / `CheckboxItem`** support `closeOnClick={false}` (used for the multi-select variable picker).
- **`DropdownMenuItem render={<Link/>}`** is the pattern for nav links inside menus (used by the Access submenu).

Variants (button): `default | outline | secondary | ghost | destructive | link`; sizes `xs | sm | default | lg | icon`.

## Shared components (`src/components/`)

| Component | Role |
|-----------|------|
| `admin-topbar.tsx` | Admin nav: project picker + Tests / Catalogs / Access ▸ / Dashboards / Parameters, plus locale switch. Supports flat links and submenus. |
| `orgadmin-topbar.tsx` | Org-admin nav. |
| `public-topbar.tsx` | Student nav: Home / Characteristics / Explore + locale switch + Admin link. |
| `localized-input.tsx` | Single-line localized field with a KZ/RU/EN switch and an amber "missing translation" dot. |
| `localized-textarea.tsx` | Multi-line localized field (`rows` prop), same switcher. |
| `button-link.tsx` | A `Button` that renders as a Next `Link`. |
| `sql-editor.tsx` | SQL textarea with line numbers, copy button, custom tab handling. |

### Two flavors of localized input

The top-level `src/components/localized-input.tsx` / `localized-textarea.tsx` are the **shadcn-styled** versions (language switch above the field, auto-grow, ignore a passed `className`).

The **Catalogs** feature keeps its own teal-styled copies at `src/app/(admin)/admin/catalogs/_components/localized-input.tsx` / `localized-textarea.tsx` — these put the language switch inline and **respect a passed `className`**, matching the original Methodic styling. When working inside Catalogs, import the local copies, not the top-level ones.

## The professions public detail tree

`src/app/(public)/professions/[id]/_components/` renders the rich profession detail (and is reused as the live preview inside the Catalogs profession editor):

| Component | Renders |
|-----------|---------|
| `detail-shell.tsx` | Tabbed orchestrator (description / characteristics / education / labor), query-param synced (`?tab=&sub=`) |
| `detail-header.tsx` | Hero: name, code, group badge, popularity, fit % pills, illustration |
| `description-tab.tsx` | Description text with clickable skill links |
| `characteristics-tab.tsx` | Horizontal bar chart per trait category, color-graded by level, hover tooltips |
| `education-tab.tsx` | Sub-tabs: universities / colleges / courses (filterable by skill) |
| `labor-market-tab.tsx` | Labor stats + salary chart |
| `university-list.tsx`, `college-list.tsx`, `course-list.tsx` | Tabular listings |
| `salary-chart.tsx`, `unt-chart.tsx` | Hand-rolled SVG charts (UNT points by year, salary bands) |
| `institution-tooltip.tsx` | Hover detail for institutions |
| `profession-illustration.tsx` | Decorative SVG |

The mock data behind these is `src/app/(public)/professions/_components/mock-data.ts` (e.g. `professionDetails[1]` = a fully-populated Data Scientist; others default to empty params).

## Drag & drop

dnd-kit is used across the constructors for reordering (questions, sections, result pages/blocks, dashboard pages/widgets, picked-variable chips). Patterns in use: `useSortable`, `SortableContext` with vertical/horizontal strategies, `arrayMove`, custom collision detection that filters candidates by an id-prefix "kind" (e.g. `rp:` vs `rc:`), nested `DndContext`s, and a `PointerSensor` with a small `activationConstraint.distance` so clicks aren't swallowed.
