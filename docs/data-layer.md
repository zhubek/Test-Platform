# Data layer

The app is **frontend-only**. There is no live backend wired in. Two modules provide all data as in-memory mocks:

- `src/lib/api.ts` — tests, sections, questions, answers, results, the public side.
- `src/lib/methodic-api.ts` — the Catalogs entities (professions, programs, institutions, cities, characteristics).

Both expose `fetch* / create* / update* / delete*` functions that **resolve from module-level arrays** instead of calling HTTP. State persists for the lifetime of the page load; a reload resets it to the seed data.

> The intended target is a NestJS + Postgres + Prisma backend (see the repo-root `README.md`). The mock function signatures are shaped to mirror that future HTTP API, so swapping the implementation later should be mostly mechanical.

## `api.ts` — tests and results

### Core types

- `Localized` — `Record<string, string>` keyed by BCP-47 code (e.g. `{ en, ru, kk }`; the authored-content string type; see [i18n.md](./i18n.md)).
- `TestRow` — a test: `name`, `desc`, `color`, `icon`, `category`, `state` (draft/published), plus the four authored logic blobs: `vars`, `calcLogic`, `surveyLogic`, `resultViewLogic`, `dashboardViewLogic`, and nested `sections`.
- `SectionRow` → `QuestionRow` → `AnswerRow` — the question tree.
- `PublicTestSummary` — the trimmed shape the public site lists.
- `ResultRecord` — a completed attempt's computed result.

### Functions (representative)

- Admin: `fetchTests()`, `fetchTest(id)`, `createTest()`, `updateTest(id, patch)`, plus section/question/answer CRUD.
- Public: `fetchPublicTests()`, `submitTestResult(testId, answers)`, `fetchResult(resultId)`.

### Seed data

Three seeded tests with full logic chains:

1. **Holland RIASEC** (#1) — characteristic mapping to a professions catalog (euclidean distance).
2. **Big Five** (#2).
3. **EQ** (#3).

Each carries a realistic `surveyLogic` (triggers, calculated values), `calcLogic.mappings`, and `resultViewLogic`.

## `methodic-api.ts` — catalogs

Mirrors a "Methodic" backend with CRUD for each catalog entity. Every type re-exports its own `Localized` and `*Row` / `*Input` / `*Params` interfaces so the catalog components import everything from this one module.

Entities and their key fields:

| Entity | Notable fields |
|--------|----------------|
| `CityRow` | `name` |
| `UniversityRow` / `CollegeRow` | `cityId` + resolved `city`, `type` (public/private), `params` (address, contacts, socials, photo, **`output`**) |
| `UniverProgramRow` | `code`, `subjects`, `params` (UNT `points` by year, linked `universities`, **`output`**) |
| `CollegeProgramRow` | `code`, `params` (linked `colleges` with durations, **`output`**) |
| `CharacteristicTypeRow` | `color`, `archived`, nested `characteristics[]`, `params` (incl. **`output`**) |
| `ProfessionGroupRow` | `name`, `desc` |
| `ProfessionRow` | `popular`, `complexityLevel`, `code`, `profGroupId` + resolved `profGroup`, `params` (`description`, `education`, `labor_market`, `content`, **`output`**) |
| `ProfessionCharacteristicRow` | links a profession ↔ characteristic with a 0–100 `level` |

### Seeding & helpers

- IDs come from a `nextId()` counter; timestamps from `now()`.
- Reads return **clones** (`delay(clone(v))`) so callers can't mutate the store by reference.
- Profession #1 ("Data Scientist") is seeded with a **full detail payload** (`params.description / education / labor_market / content`) sourced from the public professions mock data, so its editor previews render real charts and lists. Its `params.education` is shaped for the editor (`{ specializations: number[], collegeSpecs: number[] }`), not the public blob — a mismatch there once caused a render crash, so keep editor-shaped data in editor params.
- `params.output` (on every entity's params) holds the **output variables** — see [catalogs.md](./catalogs.md).

## How authoring state is saved

The test editor holds all state in `test-editor-shell.tsx` and persists it in **one save patch** via `updateTest(id, patch)`:

```ts
{
  name, desc, color, icon, category,
  visibilityTags, visibilityRule, duration, state,
  vars:               { variables: Variable[] },
  calcLogic:          { characteristicSections, mappings },
  surveyLogic:        { /* triggers, calculatedValues, completedHtmlOnCondition */ },
  resultViewLogic:    { widgets, pages },
  dashboardViewLogic: { pages },
}
```

Most authoring happens purely in React state — no API calls mid-edit — and is flushed on save. The exception is **section/question/answer CRUD** in the Questions tab, which calls the API immediately (optimistic local update + persist). Section reordering is local-only today.
