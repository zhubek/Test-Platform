# Authoring Guide — Blocks, Tests, Calculations, Result Views & Data Catalogs

This is a **practical, example-driven cookbook** for creating content on Test-Platform.
It is written so an AI agent (or a developer) can author new **blocks**, **test
questions**, **calculations**, **result/dashboard views**, **data catalogs**, and
**catalog views** by copy-pasting and adapting working examples.

Everything here is real and verified against the running system. Where a feature
is mid-rewrite it is marked **⚠ evolving**.

---

## 0. Mental model (read first)

The platform is built from one reusable primitive — the **block** — used in three
contexts:

| Context | Block `type` | Renders with | Data source |
|---|---|---|---|
| Data-catalog views (profession/university pages) | `CATALOG` | `ViewRenderer` (view-only) | catalog item values |
| Result pages a student sees | `RESULT` | `ViewRenderer` | a completed test's computed result |
| Org dashboards | `DASHBOARD` | `ViewRenderer` | aggregated analytics |
| Test questions | `TEST` | `ViewRenderer` + interactive widgets | the respondent's answers |

A **block** is just `HTML + Tailwind` plus a declared list of **props** (its data
slots). Props are filled in wherever the block is *used* — never hard-coded into
the template. Section titles and labels ("Key Responsibilities", "Public",
"Contacts") are **static text in the template**; props are **data only**.

Two render engines exist; you almost always want the first:

- **`ViewRenderer`** (`src/lib/view-renderer.tsx`) — the universal, view-only
  engine. Walks author HTML into React elements (no `dangerouslySetInnerHTML`),
  resolves `{{ expressions }}`, runs directives (`data-each`, `data-if`, …),
  mounts `<widget>` charts/controls, and embeds nested `<block>`s. **All library
  blocks (CATALOG/RESULT/DASHBOARD/TEST) render through this.**
- `BlockRenderer` (`src/lib/block-renderer.tsx`) — a narrower legacy engine for
  the test-editor's question canvas. Ignore it for authoring.

Security: only an allow-listed set of tags/attributes is ever emitted. No
`<script>`, no `<iframe>`, no JS from templates is executed.

---

## 1. Blocks — the core

### 1.1 Anatomy

A block is a database row (`uc_blocks`) / seed object with this shape:

```ts
{
  type: 'CATALOG' | 'RESULT' | 'DASHBOARD' | 'TEST',
  name: 'Profession · Description',         // unique-ish display name
  description: 'What this block is for',
  html: '<div>…template…</div>',            // HTML + Tailwind, with {{ }} + directives
  props: [                                   // the declared prop SCHEMA (data slots)
    { name: 'title', type: 'text',   value: 'Data Scientist' },
    { name: 'items', type: 'json',   value: [{ name: 'R', value: 72 }] },
  ],
  sampleProps: { title: 'Data Scientist', items: [...] },  // see 1.2
}
```

### 1.2 Props and `sampleProps`

- **`props`** declares each prop's `name`, `type`, and a default `value`.
- **`sampleProps`** is a `{ name: value }` map of the author's *sample* values —
  what the block renders with when nothing has been chosen (library thumbnails,
  catalog-page previews, freshly-picked blocks). When you save a block in the
  editor, the control values become `sampleProps` automatically. In seeds, set
  `sampleProps = Object.fromEntries(props.map(p => [p.name, p.value]))` (the seed
  scripts do this for you).

**Prop types** (the control the editor shows, and the value shape):

| `type` | Value | Editor control |
|---|---|---|
| `text` | string | text input |
| `number` | number | number input |
| `boolean` | boolean | toggle |
| `color` | `"#rrggbb"` | color picker |
| `list` | `string[]` | comma list |
| `json` | any parsed JSON (objects/arrays) | JSON textarea |
| `ref` | `{ $catalog, ids }` — points into a data catalog | catalog + item picker |

Use `json` for chart data, row arrays, and structured objects. Use `ref` to pull
live data from another catalog (see §6.4).

### 1.3 Template syntax

**Interpolation** — `{{ expression }}` anywhere in text or an attribute value:

```html
<h3 class="font-bold">{{ title }}</h3>
<span class="{{ if(score >= 70, 'text-emerald-600', 'text-red-600') }}">{{ score }}%</span>
```

The expression language (full reference in §1.5) supports paths, arithmetic,
comparisons, ternaries, `??` fallback, and allow-listed helper functions.

**Directives** (HTML attributes the renderer interprets):

| Attribute | Meaning |
|---|---|
| `data-each="expr"` | Repeat this element once per array item. Inside, `{{item}}` is the element and `{{index}}` the 0-based position. |
| `data-sort="key dir"` | Sort the `data-each` list by item field `key` (`asc`/`desc`). `data-sort="value desc"`. |
| `data-shuffle` + `data-seed="7"` | Seeded random order of the list. |
| `data-pick="3"` / `data-limit="3"` | Keep only the first N items. |
| `data-if="expr"` | Render this element only when `expr` is truthy. Works on normal tags, `<widget>`, and `<block>`. |
| `<widget name="…" …>` | Mount a registered widget (charts, test controls). See §1.6 / §2. |
| `<block name="…" data-x="…">` | Embed another library block by name. See §1.4. |

`data-each` example:

```html
<ul class="space-y-1" data-each="responsibilities">
  <li class="list-disc ml-4 text-sm text-gray-600">{{ item }}</li>
</ul>

<!-- list of objects: item.period / item.text -->
<ul data-each="typicalDay">
  <li><strong>{{ item.period }}:</strong> {{ item.text }}</li>
</ul>

<!-- numeric loop via the range() helper -->
<div class="flex gap-1.5" data-each="range(1, 5)">
  <span class="h-2 w-2 rounded-full {{ if(item <= level, 'bg-blue-500', 'bg-gray-200') }}"></span>
</div>
```

**Allowed HTML tags:** `div span p section article header footer main aside h1–h6
strong em b i small mark blockquote ul ol li dl dt dd table thead tbody tr td th
img a button br hr label details summary` — plus `<widget>` and `<block>`.
`<details>/<summary>` give you native, JS-free accordions. Anything else is
dropped.

**Links & images** are sanitized: `<a href>` must match `https:` `/` `#` or
`mailto:`; `<img src>` must be `https:`, `data:image/`, or `/`.

### 1.4 Nesting blocks (`<block>`)

Embed another block by **name**; pass data down via `data-*` attributes (each is
evaluated against the current scope, so you can hand whole arrays/objects to the
child):

```html
<!-- parent renders each university through the "University card" block -->
<div class="grid grid-cols-2 gap-3" data-each="universities">
  <block name="University card" data-university="item"></block>
</div>
```

The child block receives `university` = the current `item`. Unset child props
fall back to the child's own `sampleProps`. Nesting depth is capped (5) and
cycles render nothing.

### 1.5 Expression language reference

`src/lib/view-expr.ts`. Safe (no `eval`). Used in `{{ }}`, `data-if`, `data-each`,
`data-sort`, and widget `data-source`.

- **Literals:** `42`, `3.14`, `'text'`, `"text"`, `true`, `false`, `null`
- **Paths:** `name`, `item.city`, `result.scales.R`
- **Unary:** `!x`, `-x`
- **Binary:** `+ - * / %`  `< > <= >=`  `== != === !==`  `&& ||`  `??` (empty-fallback)
- **Ternary:** `cond ? a : b`
- **Member on a call:** `top(scales).name`

**Helper functions** (the only callables):

| Function | Does |
|---|---|
| `round(x)` `round1(x)` `floor` `ceil` `abs` `sqrt` `pow(x,y)` | math |
| `min(…)` `max(…)` `sum(list)` `avg(list)` | aggregates |
| `pct(part, whole)` | percentage 0–100 |
| `len(x)` | count of array/string/object keys |
| `if(cond, a, b)` | inline conditional |
| `default(v, d)` / `v ?? d` | fallback when empty |
| `upper` `lower` `capitalize` | text case |
| `join(list, sep)` | list → string |
| `plural(n, one, many[, manyRu])` | word form by count (2 forms EN, 3 forms RU) |
| `format(n, dec?)` | thousands separators: `format(650000)` → `650 000` |
| `date(iso, fmt?)` | `date(x, 'DD.MM.YYYY')`; tokens `YYYY MM MMM DD D` |
| `range(a, b, step?)` | number list, e.g. `range(1, 5)` → `[1,2,3,4,5]` |
| `top(scales, n?)` | highest entry as `{name,value}`; with `n` → array. `top(scales).name` |
| `rank(scales, key)` | 1-based rank of `key` by value, 1 = highest |

A typo or unknown path evaluates to empty (`""`) rather than throwing — templates
degrade gracefully.

### 1.6 Display widgets (charts) reference

Mount with `<widget name="…" data-source="…" …>`. `data-source` is an
**expression** yielding the data (usually a prop name holding a `json` array);
every other `data-*` is an interpolated string. Add Tailwind via `class=` and a
height via `style="height: 240px"` or a class.

| `name` | Data shape (`data-source`) | Key attributes (defaults) |
|---|---|---|
| `bar-chart` | `[{name, value}]` | `data-x` (`name`) `data-y` (`value`) `data-color` |
| `line-chart` | `[{name, value}]` | `data-x` `data-y` `data-color` |
| `area-chart` | `[{name, value}]` | `data-x` `data-y` `data-color` |
| `pie-chart` | `[{name, value}]` | `data-name-key` (`name`) `data-value-key` (`value`) `data-inner` |
| `donut-chart` | `[{name, value}]` | same as pie (inner default 58) |
| `radar-chart` | `[{subject, value}]` | `data-subject-key` (`subject`) `data-value-key` (`value`) `data-color` |
| `radial-gauge` | — | `data-value` `data-max` (100) `data-label` `data-color` |
| `scatter-chart` | `[{x, y}]` | `data-x` (`x`) `data-y` (`y`) `data-color` |
| `unt-chart` | `{general:[…], aul:[…], …}` per grant type | (none) — the legacy UNT chart with a grant switcher |

`data-color` accepts a token (`teal blue indigo violet amber rose green gray`) or
a hex. Registry: `src/lib/view-widgets.tsx` (`WIDGETS`).

```html
<div class="rounded-2xl border bg-white p-5">
  <h3 class="mb-3 text-sm font-bold text-gray-500">Scores</h3>
  <widget name="bar-chart" data-source="scores" data-x="name" data-y="value"
          data-color="teal" style="height: 240px"></widget>
</div>
```
with `props: [{ name: 'scores', type: 'json', value: [{name:'R',value:72},{name:'I',value:65}] }]`.

### 1.7 Worked example — a CATALOG block from scratch

A "Stat tile" showing a labelled number with an accent bar:

```ts
{
  type: 'CATALOG',
  name: 'Stat tile',
  description: 'A labelled metric with an accent bar.',
  html: `<div class="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-sm">
  <div class="h-1 w-10 rounded-full mb-3" style="background: {{ accent }}"></div>
  <div class="text-xs font-semibold uppercase tracking-wider text-gray-400">{{ label }}</div>
  <div class="mt-1 text-3xl font-extrabold text-gray-900">{{ value }}</div>
  <div class="mt-1 text-xs text-gray-500" data-if="hint">{{ hint }}</div>
</div>`,
  props: [
    { name: 'label', type: 'text',   value: 'Average salary' },
    { name: 'value', type: 'text',   value: '₸650,000' },
    { name: 'hint',  type: 'text',   value: 'mid-level, Almaty' },
    { name: 'accent', type: 'color', value: '#0d9488' },
  ],
}
```

To add it: append to `backend/prisma/catalog-blocks.seed-data.ts` →
`npm run db:seed:blocks` (see §8). Or POST it (see §1.8).

### 1.8 Creating blocks at runtime (API / UI)

- **UI:** `/admin/blocks` → "New block" (Test or Views surface) → the block editor
  (`/admin/blocks/<id>`): write the template, declare props, fill sample values,
  Save.
- **API** (`/blocks`, auth required):
  - `GET /blocks?type=CATALOG` — list
  - `POST /blocks` — `{ type, name, description?, html?, props?, sampleProps? }`
  - `PATCH /blocks/:id` — partial update
  - `POST /blocks/:id/duplicate`
  - `DELETE /blocks/:id`

---

## 2. Test blocks (questions)

A `TEST` block is a question. It renders the same way (`ViewRenderer`) but uses
**interactive widgets** that report the respondent's answer into a **variable**.

Each answer widget takes:
- `data-field="q1"` — the **variable name** the answer is written to (used later
  in calculations).
- `data-source="options"` — (choice widgets) an array of `{ text, value }`, where
  `value` is the **scoring value** for that option.

Test widget reference (`src/lib/view-widgets-test.tsx`, registered into `WIDGETS`):

| `name` | Reports | Extra attributes |
|---|---|---|
| `single-choice` | selected option's `value` | `data-field` `data-source` |
| `multi-choice` | array of selected `value`s | `data-field` `data-source` |
| `likert` | 1..N | `data-field` `data-scale` (5) `data-min-label` `data-max-label` |
| `rating` | 1..N stars | `data-field` `data-max` (5) |
| `slider` | number | `data-field` `data-min` `data-max` `data-step` |
| `dropdown` | option `value` | `data-field` `data-source` `data-placeholder` |
| `short-text` / `long-text` | text | `data-field` `data-placeholder` |
| `yes-no` | 1 / 0 | `data-field` `data-yes-label` `data-no-label` |
| `rank` | ordered `value`s (top first) | `data-field` `data-source` |

### 2.1 Worked example — a single-choice question block

```ts
{
  type: 'TEST',
  name: 'Single-choice question',
  description: 'Pick one option. Each option carries a scoring value.',
  html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{ prompt }}</h3>
  <div class="mt-4">
    <widget name="single-choice" data-field="{{ field }}" data-source="options"></widget>
  </div>
</div>`,
  props: [
    { name: 'prompt', type: 'text', value: 'Which activity sounds most appealing?' },
    { name: 'field',  type: 'text', value: 'interest' },
    { name: 'options', type: 'json', value: [
      { text: 'Build or repair something', value: 1 },
      { text: 'Help or teach someone',     value: 2 },
      { text: 'Analyze data or research',  value: 3 },
    ] },
  ],
}
```

At runtime a wrapper (`AnswersProvider`) collects `(field, value)` pairs; in the
editor preview the widget is live but reporting is a no-op. The starter test
blocks live in `backend/prisma/blocks.seed-data.ts`.

---

## 3. Calculations (variables → scores)  ⚠ evolving

> The Calculations / Result / Dashboard logic in the test editor is undergoing a
> rewrite. Treat this section as the current shape, not a stable contract.
> Source of truth: `src/lib/calculation-json.ts`, the test editor under
> `src/app/(admin)/admin/tests/[id]/`, and `docs/test-constructor.md`.

A test owns **variables** of these kinds (`Variable.kind`):

- `custom` — author-defined values / formulas
- `characteristic` — tied to a characteristic dimension (see §5 catalogs)
- `singlechoice` / `multiplechoice` — derived from a question's selected option
  value(s)
- (derived data-catalog variables are produced from **catalog mappings**, not
  stored directly)

The saved configuration is a `CalculationJson`:

```ts
{
  mappings: CatalogMapping[],          // how scores map onto catalog items (professions)
  variables: { custom, characteristics, singleChoice, multipleChoice }
}
```

Conceptually: question widgets write option `value`s into variables → formulas /
mappings turn variables into **scales** (e.g. RIASEC R/I/A/S/E/C) and into
matches against data-catalog items → those scales feed result views.

---

## 4. Result views & dashboards  ⚠ evolving

Result pages and dashboards are **blocks of type `RESULT` / `DASHBOARD`**,
composed into pages the same way catalog views are (§7). They render the
**computed result** of a completed test (the scales/variables from §3) using the
display widgets in §1.6.

- A Result View is a list of pages, each a list of blocks: `ResultJson = { pages }`
  (`src/lib/result-json.ts`). Saved shape is exactly the editor's.
- Bind result data into block props the same way as catalog views: a block prop
  is filled with the result's value (e.g. a `radar-chart` whose `data-source` is
  the RIASEC scales array).

Example result block (RESULT type) — a RIASEC radar:

```ts
{
  type: 'RESULT', name: 'RIASEC radar',
  html: `<div class="rounded-2xl border bg-white p-5">
  <h3 class="mb-2 text-base font-bold text-gray-900">Your interests</h3>
  <widget name="radar-chart" data-source="scales" data-subject-key="name"
          data-value-key="value" style="height: 280px"></widget>
  <p class="mt-3 text-sm text-gray-600">Top match: <strong>{{ top(scales).name }}</strong></p>
</div>`,
  props: [{ name: 'scales', type: 'json', value: [
    {name:'Realistic',value:72},{name:'Investigative',value:65},{name:'Artistic',value:48},
    {name:'Social',value:81},{name:'Enterprising',value:57},{name:'Conventional',value:40},
  ] }],
}
```

The `RESULT`/`DASHBOARD` blocks appear under the **Views** surface in
`/admin/blocks` (everything that isn't a `TEST` block).

---

## 5. Data catalogs

A **data catalog** is a typed collection of items (professions, universities,
…). The **group owns the schema**; **items own only data**.

Backend tables (all prefixed `dc_`, see `backend/prisma/schema.prisma`):

| Table | What |
|---|---|
| `dc_catalog_groups` | a catalog group; `name` is its FE id/slug, `info` json (`{label, builtIn}`) |
| `dc_extra_variables` | the group's **extra-variable slots** (localized-text fields); first 5 = table columns |
| `dc_catalogs` | an **item**; `title`/`description` json, `params` json (relations, e.g. education program ids) |
| `dc_catalog_extra_values` | an item's value for one extra variable |
| `dc_characteristic_groups` / `dc_characteristics` | reusable **numeric** dimension sets (RIASEC, Skills, …); names are plain strings |
| `dc_group_characteristic_groups` | which characteristic groups a catalog group attaches |
| `dc_catalog_characteristic_values` | an item's numeric value for one characteristic |
| `dc_group_pages` / `dc_group_page_blocks` | the group's **page templates** (catalog views, §7) |
| `dc_catalog_page_props` | per-item prop values for a template block |

### 5.1 Group schema = extra variables + characteristics

- **Extra variables** (slots): named localized-text fields every item fills in.
  Defined on the group's **Parameters** tab; the first five show as columns on
  the Items table.
- **Characteristics**: attach characteristic groups to a catalog group; every
  item then gets a **numeric** input per characteristic (shown under extra
  variables on the item's General tab).

### 5.2 API

- Groups: `GET/POST /catalog-groups`, `GET/PATCH/DELETE /catalog-groups/:id`
  - PATCH body can carry `{ name, info, variables, pages, characteristicGroupIds }`
    (variables synced by `varName`, pages+blocks by id).
- Items: `GET/POST /catalog-groups/:id/items`, `GET/PATCH/DELETE /catalog-items/:id`
  - PATCH body: `{ title, description, params, values, pageProps, characteristicValues }`
    (`values` keyed by varName; `characteristicValues` keyed by characteristic id;
    `pageProps` keyed by template-block id; `null` deletes).
- Characteristics: `GET/POST /characteristic-groups`,
  `GET/PATCH /characteristic-groups/:id`,
  `POST /characteristic-groups/:id/characteristics`, `PATCH /characteristics/:id`.

The FE client wrapper is `src/lib/dc-catalogs.ts` (a shared groups cache keyed by
group **name**); thin adapters are `catalog-extras.ts`, `custom-catalogs.ts`,
`catalog-pages-api.ts`, `catalog-refs.ts`.

### 5.3 Worked example — a new catalog group (seed)

Add to `backend/prisma/seed-dc-catalogs.ts` (or create via the UI: `/admin/catalogs`
→ "New catalog"). The group's `name` becomes its slug everywhere:

```ts
// 1. group + slots
const g = await prisma.dataCatalogGroup.upsert({
  where: { name: 'scholarships' },
  update: { info: { label: 'Scholarships', builtIn: true } },
  create: { name: 'scholarships', info: { label: 'Scholarships', builtIn: true } },
});
for (const [i, varName] of ['amount', 'deadline', 'summary'].entries()) {
  await prisma.extraVariable.upsert({
    where: { groupId_varName: { groupId: g.id, varName } },
    update: { order: i }, create: { groupId: g.id, varName, order: i },
  });
}
// 2. an item (use a deterministic id so reseeds keep links stable)
await prisma.dataCatalog.create({
  data: {
    id: 'dc-scholarships-bolashak',
    groupId: g.id,
    title: { en: 'Bolashak', ru: 'Болашак', kk: 'Болашақ' },
    description: { en: 'International scholarship', ru: '', kk: '' },
    params: {},
  },
});
```

**Deterministic ids matter:** the seed derives item ids like
`dc-<group>-<slugified-title>` so re-running `db:seed:dc` keeps the same ids and
open tabs/links survive.

---

## 6. Catalog views (page templates)

A catalog group's **Pages** tab defines page templates every item renders with.
A page is an ordered set of **blocks**; each **item** fills in its own prop
values for those blocks (`dc_catalog_page_props`). Labels are static in the
block; only data is per-item.

This is what powers `/explore` (each item's "Card" page) and
`/professions/<id>` (every other page as a tab), via `src/lib/public-catalog.tsx`.

### 6.1 How a page renders for an item

For each block instance on the page, props are merged in this order:

```
block.sampleProps  →  template props (usually empty {})  →  the item's pageProps[blockInstanceId]
```

then `{{ }}`/directives resolve and `ref` props are fetched (§6.4). Same merge in
admin previews and on public pages — one source of truth.

### 6.2 Creating a page template

- **UI:** open the catalog group → **Pages** → add a page → pick blocks.
- **API:** `PATCH /catalog-groups/:id` with
  `{ pages: [{ id?, pageName, blocks: [{ id?, blockId, props? }] }] }`.
  Pages sync by `id`, blocks by `id` — keep existing ids so items' `pageProps`
  survive edits.

### 6.3 Setting an item's values for a page

`PATCH /catalog-items/:id` with
`{ pageProps: { "<templateBlockId>": { title: 'Data Scientist', icon: '📊', … } } }`
(pass `null` to clear a block's overrides). In the UI: open the item → **Pages** →
fill the prop controls per block.

### 6.4 References (`ref` props) — catalog-in-catalog

A `ref` prop points into another catalog: `{ $catalog: 'univerPrograms', ids: [...] }`
where `$catalog` is a group **name** and `ids` are item ids. At render time the
renderer **resolves** the ids into template-shaped data (and follows relations:
a program ref brings its universities → cities). Resolution lives in
`src/lib/catalog-refs.ts`.

Example — a profession's Education page references university programs by id; the
"University programs" block iterates them and embeds a "University card" per
university:

```html
<!-- "Profession · Education" block -->
<details open class="rounded-2xl border bg-white">
  <summary class="px-5 py-4 font-bold text-gray-800">Universities</summary>
  <div class="px-5 pb-5">
    <block name="University programs" data-programs="universityPrograms"></block>
  </div>
</details>
```
with `props: [{ name: 'universityPrograms', type: 'ref',
value: { $catalog: 'univerPrograms', ids: [] } }]`. The item sets the actual ids
in its Education `pageProps`.

The **ref picker** is locked to the catalog the block declares (so item editors
can only pick the right kind), but in the block editor the author chooses the
catalog and may pick default sample ids.

### 6.5 Worked example — give a catalog group a "Card" view

1. Author a `CATALOG` block named e.g. `Scholarship · Card` (props: `title`,
   `amount`, `accent`, `detailsUrl`, …).
2. On the group's **Pages** tab, add a page named **"Card"** containing that block.
   (`/explore`-style lists render the page literally named `Card`; the detail page
   shows every *other* page as a tab.)
3. For each item, **Pages** → fill the card's props.

---

## 7. How the public pages consume all this

`/explore` and `/professions/<id>` are rendered by `src/lib/public-catalog.tsx`:
it loads the block library + the `professions` group's pages + the items (with
`pageProps`), merges props (§6.1), and renders through `ResolvedViewRenderer`
(which also resolves `ref` props). So **whatever you compose in the admin is what
the public sees** — no separate templates.

To add a profession view that shows publicly: add a page to the `professions`
group (it becomes a tab), or edit the `Card` page (it becomes the explore card).

---

## 8. Seeding & conventions

**Table prefixes** split the DB into modules: `core_*` (identity/tenancy),
`uc_*` (blocks), `dc_*` (data catalogs). Prisma model names stay PascalCase;
`@@map` carries the prefix.

**Seed scripts** (run from `backend/`, in this order on a fresh DB):

```
npm run db:seed          # roles, super-admin, demo projects, starter + catalog blocks
npm run db:seed:blocks   # upsert catalog view blocks by name (idempotent top-up)
npm run db:seed:dc       # port catalog groups, items, characteristics, page templates
```

- Block seeds: `backend/prisma/blocks.seed-data.ts` (TEST + chart starters) and
  `backend/prisma/catalog-blocks.seed-data.ts` (CATALOG views). `db:seed:blocks`
  upserts by `name`, so editing a seed + rerunning updates the live block.
- Catalog seed: `backend/prisma/seed-dc-catalogs.ts` (groups, slots,
  characteristics, items with relations, default page templates, per-item
  `pageProps`). Uses deterministic ids.

**After backend code/schema changes:** `npx prisma migrate deploy` (or generate a
migration) → `npx prisma generate` → rebuild (`npm run build`) → restart. Prefer
`npm run start:dev` (watch mode) during development to avoid stale-`dist` 404s.

---

## 9. File map (where to look)

| Concern | File(s) |
|---|---|
| Render engine + directives + `<block>`/`<widget>` | `src/lib/view-renderer.tsx` |
| Expression language + helper functions | `src/lib/view-expr.ts` |
| Display widgets (charts) | `src/lib/view-widgets.tsx` |
| Test-question widgets | `src/lib/view-widgets-test.tsx` |
| Resolve `ref` props (catalog data) | `src/lib/catalog-refs.ts` |
| dc backend client + groups cache | `src/lib/dc-catalogs.ts` |
| Public explore/detail rendering | `src/lib/public-catalog.tsx` |
| Block library UI / editor | `src/app/(admin)/admin/blocks/` |
| Catalog hub / item editor / pages / parameters | `src/app/(admin)/admin/catalogs/` |
| Block model + CRUD (backend) | `backend/src/blocks/` |
| Data-catalogs module (backend) | `backend/src/data-catalogs/` |
| Schema (tables) | `backend/prisma/schema.prisma` |
| Seeds | `backend/prisma/*.seed-data.ts`, `backend/prisma/seed*.ts` |

---

## 10. Authoring checklist (for an AI creating content)

1. **Decide the type** — `CATALOG` (catalog page), `RESULT`/`DASHBOARD` (test
   output), or `TEST` (question).
2. **Write HTML + Tailwind.** Static labels in the template; data via `{{ props }}`.
   Use `data-each`/`data-if`/`<widget>`/`<block>` as needed. Only allow-listed tags.
3. **Declare props** — every dynamic value gets a prop with a sensible default;
   chart data is `json`; cross-catalog data is `ref`.
4. **Set `sampleProps`** so previews/thumbnails render (seed scripts auto-derive
   from prop defaults).
5. **Verify the expressions** against §1.5 (unknown helper/path → empty render).
6. **Place it:** add to the relevant seed file + run the matching `db:seed*`
   script, or `POST /blocks`.
7. **For a catalog view:** add a page to the group (Pages tab / `PATCH
   /catalog-groups/:id`) and fill each item's `pageProps`.
8. **Preview** at `/admin/blocks/<id>`, the group's Pages tab, and the public
   page (`/explore`, `/professions/<id>`).
