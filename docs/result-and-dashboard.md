# Result view & dashboard constructors

Both are tabs of the test editor and share a visual language: a **split-pane editor + live preview**, **pages of blocks**, **drag-reorder** (dnd-kit), and a read-only **JSON view**. They differ in what a block is bound to: the result view binds to **computed variables**; the dashboard binds to **SQL queries**.

## Result view constructor

`result-view-tab.tsx` + renderers in `result-component.tsx`. JSON builder: `src/lib/result-json.ts`.

### Structure: pages → blocks

- A result view is `{ pages: ResultPage[] }`.
- Each `ResultPage` has `id`, `title` (localized), and `components[]` (the blocks).
- Pages and blocks are dnd-kit sortable (drag IDs prefixed `rp:` for pages, `rc:` for blocks); manual order wins.

### Block types (13, in 5 groups)

| Group | Types | Binding |
|-------|-------|---------|
| **Text** | `heading`, `text`, `summary_text` | template string with `{var}` placeholders |
| **Single** | `score_card`, `gauge` | one numeric variable |
| **Multi** | `characteristics_bar`, `characteristics_radar`, `characteristics_pie`, `score_table`, `stat_grid` | many numeric variables |
| **Catalog** | `matches_list`, `match_detail` | a catalog mapping + a displayed field |
| **Divider** | `divider` | none |

### The 4-group binding model

A `ResultComponent` binds via one of four shapes:

1. **Text / divider** — no binding; text blocks use a `content` template.
2. **Single variable** — `kind: "variable"`, `variableName`.
3. **Multi variables** — `kind: "characteristics"`, optional `variableNames[]` (subset, else all characteristics). The multi-select is a dropdown of grouped checkboxes; picked variables show as draggable chips whose order you can rearrange.
4. **Catalog** — `kind: "mapping"`, `mappingId`, `catalogFieldId` (which catalog item field to show — `name` / `description` / `score` / a custom field).

Other config:

- `options: ResultDisplayOptions` — `count`, `sort` (`score_desc | score_asc | as_is`), `showValues`, `maxScale`.
- `params` — free-form escape hatch.
- `content` — the template for text blocks.

### Text templates

`src/lib/result-template.ts` → `resolveTemplate(template, vars)` replaces three placeholder forms per variable:

| Placeholder | Resolves to |
|-------------|-------------|
| `{var}` | the localized **label** if one exists, else the raw number |
| `{var.value}` | always the raw **number** |
| `{var.label}` | always the **label** (falls back to number) |

`vars` is a `Record<name, { value: number\|string; label? }>`.

### Renderers

`result-component.tsx` has a renderer per block type — `BarChart`, `RadarChart`, `PieChart`, `ScoreTable`, `StatGrid`, `ScoreCard`, `Gauge`, `MatchesList`, `MatchDetail`, plus text/heading/divider/summary via template resolution. All data maps are keyed by index (not label) to avoid duplicate-key warnings when a catalog field repeats values.

### JSON view

`buildResultJson(pages)` produces a copyable, read-only `{ pages }` snapshot. A toggle swaps the constructor for the JSON.

## Dashboard constructor

`dashboard-tab.tsx` + previews in `widget-preview.tsx`. JSON builder: `src/lib/dashboard-json.ts`.

### Structure: pages → widgets (SQL)

- A dashboard is `{ pages: DashboardPage[] }`; each page has `widgets: DashboardBlock[]`.
- Dnd-kit sortable (drag IDs `dp:` pages, `dw:` widgets).
- Unlike result blocks, widgets are **SQL-driven** — each has a `sql` field, not a variable binding.

### Widget config & chart types

`DashboardBlock` — `{ id, componentType, title (localized), sql }`. Seven chart types:

`bar_chart`, `pie_chart`, `radar_chart`, `score_table`, `stat_card`, `summary_text`, `custom_html`.

### Automatic org scoping

Authors write only the `SELECT … GROUP BY …`. The org scope is appended automatically and shown **read-only** (with a lock icon + "AUTO-APPENDED" hint):

```
DASHBOARD_SCOPE_SUFFIX = "WHERE organization_id = :organization_id"
```

(exported from `dashboard-json.ts`). This guarantees every widget is scoped to the viewing organization.

### Split-pane + full-screen preview

- **Left**: the constructor — pages of widgets, each with a chart-type picker, a localized title, an SQL textarea, and the read-only scope line.
- **Right**: an inline **single-column** live preview of the active page using `mockRows(sql)` for sample data.
- A **Preview** button (eye icon) opens a full-screen overlay laying widgets out in a **two-column** grid.

`widget-preview.tsx` routes each `componentType` to a chart renderer; `toDataPairs()` derives `(label, value)` from the first string + first number column of the SQL rows. `custom_html` embeds an iframe with the rows exposed as `window.__rows__`.

### JSON view

`buildDashboardJson(pages)` → copyable read-only `{ pages }`, with a constructor/JSON toggle (icon-only).

## Why SQL for dashboards but variables for results

- A **result view** is per-respondent — it visualizes one person's computed variables, so it binds to those variables directly.
- A **dashboard** is per-organization aggregate analytics — it runs SQL aggregation over many stored results, scoped to the org. This matches the intended tall-table result storage + SQL aggregation model (see project history / scoring notes).
