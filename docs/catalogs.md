# Catalogs

The **Catalogs** feature (a faithful port of the previous app's "Methodic" feature) is the reference-data hub: professions, education programs, institutions, cities, and characteristic types. It lives at `/admin/catalogs` and is backed entirely by the in-memory `src/lib/methodic-api.ts` (see [data-layer.md](./data-layer.md)).

## The hub

`/admin/catalogs` is a 7-tab hub (`page.tsx`), styled to match the original (teal accent, `gray-100` borders):

| Tab | List style |
|-----|-----------|
| **Professions** | filterable table (search + group + popular + complexity), group/complexity/popular badges |
| **University Programs** | searchable table |
| **College Programs** | searchable table |
| **Universities** | searchable table |
| **Colleges** | searchable table |
| **Cities** | inline-editable list (add/rename/delete in place) |
| **Characteristics** | card grid (color dot, item count, description, chips) |

List tab components live in `src/app/(admin)/admin/catalogs/_components/`.

## Detail editors

Each entity has a detail editor under `catalogs/<entity>/[id]/page.tsx`. They follow a **standardized tabbed layout**:

```
General  ·  …entity-specific tabs…  ·  Output Variables
```

- **General is always first** (contains at least the name).
- **Output Variables is always last** (see below).

### Professions detail (the richest)

`catalogs/professions/[id]/page.tsx` has six+ tabs:

`General · Description · Characteristics · Education · Labor Market · Content · Output Variables`

The middle tabs are **split-pane editors with live previews** that reuse the **public profession-detail component tree** (`src/app/(public)/professions/[id]/_components/`): salary charts, UNT score charts, course/university/college lists, etc. Editing the left form updates the right preview live. This is why the public professions tree was carried into the app — the catalog editor previews depend on it.

> Gotcha: the profession `params` consumed by these editors must be in the **editor's** shape, not the public display blob. For example the Education editor expects `params.education = { specializations: number[], collegeSpecs: number[] }` (program IDs), not an array of full program objects. Seeding the wrong shape once caused an "Objects are not valid as a React child" crash.

### Simple detail editors

Universities, colleges, and both program types use a flatter editor (`EditorLayout` form + preview card) wrapped in a `General / Output Variables` tab bar. Characteristics has `General / Characteristics / Output Variables`.

## Output variables

This is the standardized **last tab** on every catalog detail page.

- **What:** a fixed, per-catalog-type set of **single-text** (localized) fields that each item fills in.
- **Why:** these are the texts you can pick when choosing what to show in dashboards (and, in future, result views).
- **Where stored:** on the item's `params.output`, keyed by field id → `Localized`.

The field sets are defined centrally in `src/lib/catalog-output.ts`:

```ts
export const CATALOG_OUTPUT_FIELDS: Record<CatalogType, OutputFieldDef[]> = {
  professions:     [salary, demand, outlook, summary],
  univerPrograms:  [minScore, tuition, summary],
  collegePrograms: [duration, tuition, summary],
  universities:    [ranking, tuition, summary],
  colleges:        [ranking, tuition, summary],
  cities:          [population, summary],
  characteristics: [summary, highNote, lowNote],
};
```

To add/rename/remove an output variable for a catalog, edit this map — every item of that type immediately exposes the new field set.

The tab itself is a shared component, `catalogs/_components/output-variables-tab.tsx`: it takes the catalog `type`, the current `output` record, and an `onChange`, and renders one localized input per field. Each detail page wires `onChange` to persist into `params.output` (and the simple pages flush on blur via their existing `saveParams`/`saveAll`).

## Catalog matching (`catalog-characteristics.ts`)

Separate from output variables, `src/lib/catalog-characteristics.ts` defines the **matching** model used by the test calculation/result layer:

- `CatalogDef` — `{ id, name, groups[], fields? }`.
- `CharacteristicGroupDef` — `{ id, name, keys[], items[] }`. A group is a characteristic space (e.g. "Interests (RIASEC)").
- `CharacteristicKey` — `{ key, label }`, one matching dimension (e.g. `realistic`).
- `CatalogItem` — `{ code, name, description?, vector, fields? }`, where `vector` maps each group key → a numeric value (the item's position in the space).
- `CatalogFieldDef` — `{ id, label, kind: "text" | "number" }`. Built-in ids: `name`, `description`, `score`; custom fields (e.g. `salary`, `demand`) add to these. `catalogFields(catalogId)` returns built-in + custom.
- `DistanceMethod` — `euclidean | manhattan | cosine | chebyshev`.

A test's `CatalogMapping` (see [test-constructor.md](./test-constructor.md)) picks a catalog + group + distance method + `topN` to compute the nearest items to a respondent's characteristic vector. Result-view catalog blocks then display a chosen `catalogFieldId` of those matches.

### Two field systems — don't confuse them

- `CatalogFieldDef` (in `catalog-characteristics.ts`) = item fields used in **matching/result display** (e.g. show each matched profession's `salary`).
- `OutputFieldDef` (in `catalog-output.ts`) = the per-item **output variable** texts edited on the catalog detail page's Output Variables tab, intended for **dashboards**.

They overlap conceptually (both are "extra texts on a catalog item") but are currently separate sources. Unifying them is a reasonable future step.
