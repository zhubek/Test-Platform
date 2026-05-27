# Test constructor

The test editor lives at `/admin/tests/[id]` and is driven by `test-editor-shell.tsx`, which holds all authoring state and renders a tab bar. Components live under `src/app/(admin)/admin/tests/[id]/_components/`.

## Tabs

`tab-bar.tsx` defines five tabs:

| Tab | Component | Purpose |
|-----|-----------|---------|
| **General** | `general-tab.tsx` | Metadata: name, description, color, icon, category, visibility tags + rule, duration, draft/published state |
| **Questions** | `questions-tab.tsx` | Section/question authoring with live preview + JSON view |
| **Calculation** | `calculation-tab.tsx` | Variables, catalog mappings, characteristic/custom formulas |
| **Result** | `result-view-tab.tsx` | Result page layout & variable bindings → see [result-and-dashboard.md](./result-and-dashboard.md) |
| **Dashboard** | `dashboard-tab.tsx` | SQL analytics widgets → see [result-and-dashboard.md](./result-and-dashboard.md) |

Tabs are stateless components that receive state + handlers from the shell. Only the shell's **Save** button persists, via one patch (see [data-layer.md](./data-layer.md)).

## Questions

### Question types

Defined in the editor's `mock-data.ts`: `single`, `multiple`, `likert`, `dropdown`, `rating`, `boolean`, `imagepicker`.

### The numeric choice-value model

Answer choices (`AnswerChoice`) carry a **numeric `value`**:

- `value?: number` — the value stored when the choice is selected. If omitted, it defaults to the **1-based position** (`effectiveChoiceValue` in `src/lib/surveyjs.ts`).
- `text: Localized` — the multilingual label.
- `visibleIf?: string` — per-choice conditional visibility.
- `imageUrl?` — for imagepicker.

All answers resolve to numbers; this is foundational to the scoring model (text values are reconstructed later via variable *value translations*, never stored as scores). This was a deliberate decision: store numbers, render text at result time.

**Likert and rating** are modeled as single-choice over a fixed numeric scale:

- Likert: 5 preset labels ("Strongly Disagree" → "Strongly Agree"), values 1–5.
- Rating: 1..`rateMax` (default 5), numeric labels; author can change `rateMax`.

Both are editable like single-choice (you can rename the options).

### Per-question logic

A question can carry `visibleIf`, `enableIf`, `requiredIf` expression strings (e.g. `{q1} = 'yes'`) that reference other answers/variables.

## SurveyJS integration

SurveyJS is **not** used to render the editor. It's a **schema generator and type bridge** (`src/lib/surveyjs.ts`):

- `sectionsToSurveyJson(...)` turns the authored sections into a SurveyJS schema:
  - each `Section` → a `SurveyJsPage`,
  - each `Question` → a `SurveyJsQuestion` of the right SurveyJS type (`radiogroup`, `checkbox`, `rating`, `boolean`, `imagepicker`),
  - choice values emitted as numbers (`effectiveChoiceValue`),
  - `visibleIf` / `enableIf` / `requiredIf` copied through as raw expression strings,
  - all text emitted as a `SurveyJsLocalized` object (`{ default, en, ru, kz }`).
- `effectiveQuestionName(q, globalIndex)` produces the stable SurveyJS name (`qN`) used as the variable name for choice-bound variables.

The actual **take-test runtime** (public side) renders from this schema with custom React renderers.

## The calculation / variable model

The Calculation tab turns answers into **variables**. There are five `VariableKind`s:

| Kind | How it's created | Formula | Value translations |
|------|------------------|---------|--------------------|
| `characteristic` | **Auto-synced** from catalog mappings | authored (e.g. `realistic*0.6 + artistic*0.4`) | none (pure numeric dimension) |
| `custom` | Free-form, author-defined | any math expression | author-set, optional |
| `singlechoice` | Bound to a `single` question | fixed `{qN}` (read-only) | auto-seeded from choices; author edits labels only |
| `multiplechoice` | Bound to a `multiple` question | fixed `{qN}` (resolves to an array of codes) | auto-seeded from choices |
| `profession` | Derived from a catalog mapping (one per rank) | computed at runtime (read-only) | seeded from catalog items (code → name) |

Key types (editor `mock-data.ts`):

- `Variable` — `{ name, label, kind, formula?, scope, valueTranslations?, source?, mappingId?, rank?, questionId? }`.
- `VariableScope` — `result | dashboard | both` (where the variable is computed/visible).
- `valueTranslations` — `{ value: number → label: Localized }`, used to render a coded number (e.g. profession code → name) as text in the result view.

### Catalog mappings

`CatalogMapping` — `{ id, catalogId, groupId, method, topN }`:

- Links a characteristic group (e.g. RIASEC) to a catalog (e.g. professions).
- `method` is a distance metric (`euclidean`, `manhattan`, `cosine`, `chebyshev`) from `catalog-characteristics.ts`.
- `topN` (1–50) controls how many ranked matches are produced.
- Each mapping generates **N derived `profession` variables** (one per rank) plus drives the **`characteristic` variables**.

### Characteristics auto-sync

`src/lib/characteristics-sync.ts` exposes `syncCharacteristics(mappings, variables)`. Characteristic variables are **entirely mapping-driven** — they're regenerated whenever mappings change. This sync runs in the always-mounted editor shell (not inside the Calculation tab), so characteristics exist even before you visit that tab (an earlier bug where the Result view showed no data until Calculation was opened).

### Profession (catalog) variables

These are hidden behind a collapsible "Data Catalog Variables" section in the Calculation tab. They're read-only in the editor (computed by the backend at runtime) and seeded with value translations from catalog items.

## JSON views

The Questions, Calculation, Result, and Dashboard surfaces each have a read-only **View JSON** toggle (icon-only) that shows the serialized authored structure — useful for debugging and for the future API contract. The Calculation JSON excludes the data-catalog (profession) variables.
