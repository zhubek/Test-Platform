# Snapshot — Test Editor: Calculation / Result View / Dashboard (2026-06-08)

> **Why this file exists.** The logic behind the **Calculation**, **Result View**, and
> **Dashboard** tabs of the test editor (`/admin/tests/[id]`) is about to change
> **drastically**. This is a frozen "before" record of how those three tabs looked and
> worked on 2026-06-08, captured from **test 1 — "Holland Career Test"** running on the
> in-memory mock data. Refer back here when comparing old vs. new behaviour.
>
> Captured at: `http://localhost:3001/admin/tests/1` (frontend-only, mock data).

## At a glance — state of test 1 on this date

| Tab | State on test 1 | Notes |
|-----|-----------------|-------|
| **Calculation** | **Populated** | 1 catalog mapping + 6 auto characteristics; all *other* variable groups empty |
| **Result View** | **Empty** | `0 pages` — "No result components yet" |
| **Dashboard** | **Empty** | `0 pages` — "No dashboard pages yet" |

(The user described all three as "so far empty" — accurate for Result View & Dashboard;
the Calculation tab already carries the Holland mapping + RIASEC characteristics.)

Screenshots (full-page, EN locale):
- `./test1-calculation.png`
- `./test1-result-view.png`
- `./test1-dashboard.png`

---

## Shared shell

All three tabs live inside `TestEditorShell`
(`frontend/src/app/(admin)/admin/tests/[id]/_components/test-editor-shell.tsx`).

- **Tab bar** (`tab-bar.tsx`): `general · questions · calculation · result · dashboard`.
  Tab state is **local `useState`** in the shell — *no URL deep-link per tab*.
- **Header row**: color dot + test name (left); `Draft/Published` toggle, `Preview`
  (opens `/admin/tests/[id]/preview`), and `Save` (right).
- **Save payload** (the shape the editor writes back via `onSave`):
  ```ts
  {
    name, desc, color, icon, category,
    visibilityTags, visibilityRule, duration, state,
    vars:             { variables },                              // Variable[]
    calcLogic:        { characteristicSections, mappings },       // Calculation tab
    surveyLogic,
    resultViewLogic:  { widgets: resultWidgets, pages: resultPages }, // Result View tab
    dashboardViewLogic: { pages: dashboardPages },                // Dashboard tab
  }
  ```
- Characteristic variables are kept in sync with the mappings by the shell via
  `syncCharacteristics(mappings, variables)` (runs regardless of the open tab), so Result
  View always sees the characteristic vars produced by Calculation.

---

## 1. Calculation tab

File: `_components/calculation-tab.tsx` (+ `variable-card.tsx`, `lib/calculation-json.ts`,
`lib/catalog-characteristics.ts`, `lib/surveyjs.ts`).

**Purpose today:** turn survey answers into named variables, and match answers against a
catalog (e.g. professions) by a distance method.

**Layout (top → bottom):**

1. **Toolbar** — collapsible *Formula Reference* (Arithmetic: `+ - * / ^ ( )`;
   Functions: `round/floor/ceil`, `min/max/avg`, `if(cond,a,b)`) + a `</>` **View JSON**
   button (read-only `buildCalculationJson(mappings, variables)` snapshot, copyable).
2. **Variables (formula)** — custom vars (`kind: "custom"`). Each is a `VariableCard`
   (name, localized label, formula, scope). `+ Add Variable` and a *Survey vars* dropdown
   that lists copyable `{q1}`, `{q2}`… question names + survey-level calculated values.
   *Empty on test 1* → "No variables yet".
3. **Catalog Mappings** — rows of `{ catalog, matchBy (group), method, topN }`.
   - Catalogs/groups/methods come from `CATALOGS` / `DISTANCE_METHODS` in
     `lib/catalog-characteristics.ts`.
   - `+ Add Mapping` opens a modal (`MappingDialog`); mapping is created on confirm.
   - **test 1 has one mapping:** `Professions · Interests (RIASEC) · Euclidean · top 5`.
4. **Characteristics** *(auto from mappings, only shown when present)* — read-only-ish
   `VariableCard`s with `kind: "characteristic"`, one per group dimension.
   **test 1:** `realistic, investigative, artistic, social, enterprising, conventional`
   (the six RIASEC axes), each with a small formula like `( q… ) / 2`.
5. **Single Choice Variables** — bound to `type: "single"` questions; added via a dropdown
   of available single-choice questions. `lockName`, `readOnlyFormula`, `fixedValues`.
   *Empty on test 1.*
6. **Multiple Choice Variables** — same pattern for `type: "multiple"` questions.
   *Empty on test 1.*
7. **Data Catalog Variables** *(derived, collapsed by default)* — `topN` rows per mapping
   (`<group>_match_1..N`), value→label = catalog items; `kind: "profession"`, read-only.

**Key data shapes** (`_components/mock-data.ts`):
- `Variable { id, name, label:Localized, kind: "custom"|"characteristic"|"singlechoice"|"multiplechoice"|"profession", formula, scope, valueTranslations?, source?, mappingId?, rank?, questionId? }`
- `CatalogMapping { id, catalogId, groupId, method, topN }`
- `CharacteristicSection[]` (passed as `sections`, currently not surfaced much in UI).

---

## 2. Result View tab

File: `_components/result-view-tab.tsx` (+ `result-component.tsx`, `variable-select.tsx`,
`lib/result-json.ts`).

**Purpose today:** author the page/block layout a student sees after finishing — bound to
the characteristic variables and catalog mappings.

**Layout:** split-pane (`lg:grid-cols-2`).
- **Left = constructor:** header (`Result View · N pages`, `+ Add page`, `</>` JSON).
  Pages are drag-sortable cards; each page has a localized title, a list of block configs
  (drag-sortable), and a dashed `+ Add block` button. JSON mode swaps the pane for a
  read-only `buildResultJson(pages)` dump (copyable).
- **Right = live preview:** one page at a time with page pills + prev/next, rendering each
  block via `ResultComponentView` against **fabricated sample data** (`sampleScore`,
  `sampleData`, `sampleVars`).

**Block palette** (`COMPONENT_TYPES`, grouped in the Add-block modal):
- **Text** (`{var}` template): `heading`, `text`, `summary_text`
- **Single numeric var**: `score_card`, `gauge`
- **Multi numeric vars (charts)**: `characteristics_bar`, `characteristics_radar`,
  `characteristics_pie`, `score_table`, `stat_grid`
- **Catalog matching**: `matches_list`, `match_detail`
- **Layout**: `divider`

**Per-block config** depends on its `group`:
- text → a localized `{var}` template; single → one numeric var (+ `maxScale` for gauge,
  show-values toggle); multi → multi-select of vars + sort (`score_desc/score_asc/as_is`)
  + show-values + `maxScale`; catalog → `fromMapping` + `parameter` (catalog field) +
  `count` (for `matches_list`); divider → nothing.

**Key data shapes:**
- `ResultPage { id, title:Localized, components: ResultComponent[] }`
- `ResultComponent { id, type, title:Localized, binding, variableNames[], options, params[], content?, catalogFieldId? }`
- `binding.kind`: `characteristics | variable | mapping`.

**State on test 1:** `0 pages` → left shows "No result components yet. Add one above.",
right shows "Add a page to preview the result." (See `./test1-result-view.png`.)

---

## 3. Dashboard tab

File: `_components/dashboard-tab.tsx` (+ `widget-preview.tsx`, `lib/dashboard-json.ts`).

**Purpose today:** author **SQL-driven** analytics widgets an organization sees. Each
widget has a chart type, localized title, and a SQL query; a **read-only scope suffix**
(`DASHBOARD_SCOPE_SUFFIX`) is auto-appended to every query (shown locked under the editor).

**Layout:** split-pane like Result View.
- **Left = constructor:** header (`Dashboard · N pages`, `Preview` (full-screen modal),
  `+ Add page`, `</>` JSON). Drag-sortable pages, each with drag-sortable widget configs
  and a `+ Add block` button. JSON mode = read-only `buildDashboardJson(pages)`.
- **Right = live preview:** single column; each widget rendered by `WidgetPreview` against
  `mockRows(sql)` — fabricated rows from `SAMPLE_LABELS` (the six RIASEC names) whenever
  the SQL roughly matches `SELECT … FROM`.
- **Full-screen Preview** modal: 2-col grid of widget cards.

**Chart palette** (`CHART_TYPES`): `bar_chart`, `pie_chart`, `radar_chart`, `score_table`,
`stat_card`, `summary_text`, `custom_html`.

**Widget config** (`WidgetConfig`): chart-type chip + localized title + a dark-themed SQL
`Textarea` (default `SELECT name, COUNT(*) AS value FROM characteristic_scores GROUP BY name`)
+ the locked auto-appended scope suffix line.

**Key data shapes:**
- `DashboardPage { id, title:Localized, widgets: DashboardBlock[] }`
- `DashboardBlock { id, componentType: WidgetComponentType, title:Localized, sql:string }`

**State on test 1:** `0 pages` → "No dashboard pages yet. Add one above." +
"Add a page to preview the dashboard." (See `./test1-dashboard.png`.)

---

## Things likely to matter when the logic changes

- **Dashboard is SQL-first** today (free-text SQL + auto-scope suffix), driven by mock
  rows — no real query engine. A drastic change here probably swaps the SQL model.
- **Result View binds to *characteristic* variables only** (`charVars`); previews use
  fabricated sample scores, not real computed results.
- **Calculation couples mappings → characteristics** automatically via
  `syncCharacteristics`. If the calculation model changes, that sync + the auto
  `*_match_N` profession vars are the load-bearing pieces.
- **No per-tab routing** — tab is local state; deep-linking a tab needs new plumbing.
- The three **JSON builders** (`calculation-json.ts`, `result-json.ts`, `dashboard-json.ts`)
  define the persisted/exported contract for each tab — check these for the "old" schema.
