# Translation Rework — Instruction

How authored content is translated across **tests, blocks, and data catalogs**. This is the
target design and the rules to follow when reworking the content model. It supersedes the
fixed `{ en, ru, kz }` shape described in [i18n.md](./i18n.md) for *authored content*; the
**UI-chrome** mechanism (`t("some.key")`) is unchanged and out of scope here.

> Status: **planned rework, not yet implemented.** Code below is the contract to build to,
> not a description of current code. Today content uses a fixed-key `Localized` and the
> backend stores it in `Json` columns.

---

## 0. The two mechanisms stay separate (unchanged)

Do not merge these. They have different lifecycles and different homes.

| Kind | Example | Home | Scope |
|---|---|---|---|
| **UI chrome** | button labels, menu text, validation msgs | `src/lib/i18n.ts` key map | app-wide, ships with code |
| **Authored content** | test names, block text, catalog titles | database (JSONB) | **per project** |

Everything in this document is about **authored content only**. Never put UI chrome in the
database; never scope it to a project.

---

## 1. Core principle: translate leaves, not the tree

Authored content is a *tree* of structure, components, variables, and text. **Only the leaf
text values are translated. Structure is never duplicated per language.**

For every piece of content, classify each part into exactly one of three kinds:

| Part | Example | Translated? |
|---|---|---|
| **Structure** — HTML templates, component layout, ordering | `<div class="card"><h1>{{heading}}</h1></div>` | **No.** One copy, ever. |
| **Binding** — a reference to data | `{ $bind: "result.topScore" }` | **No.** Resolves to data that is *already* localized at its own leaf. |
| **Text literal** — words an author typed | `{ "en": "Your results", "kk": "…" }` | **Yes.** This is the *only* thing that carries a `Localized` map. |

Consequence: a block's `html` template, a catalog page template, and the component tree are
**language-neutral**. JSONB lands only on text-typed leaf values, which are few and discrete.
If translation feels like it touches "every text everywhere," structure and text have been
entangled — fix the model (§4), don't fix the storage.

**Authoring constraint that makes this hold:** authors must not freetype prose into raw HTML.
Prose goes through a **text prop / slot**. Structural HTML carries no words. The editor is
responsible for enforcing this — text is always a slot, never baked into the template string.

---

## 2. `Localized` becomes a dynamic language→string map

The fixed `{ en, ru, kz }` shape cannot represent per-project language sets. Replace it.

```ts
// BEFORE (fixed keys — cannot do per-project languages)
type Localized = { en: string; ru: string; kz: string };

// AFTER (dynamic — keys are BCP-47 language codes)
type Localized = Record<string, string>;   // { "en": "…", "kk": "…", "tr": "…" }
```

Rules for the map:

- **Keys are stable BCP-47 codes**, not language row ids (codes are portable, survive
  re-seeding, are readable inside the JSON). Use the global `Language` row's `code`, not its
  `id`, as the JSON key.
- **Fix `kz` → `kk`.** Kazakh is `kk` in ISO 639-1; `kz` is the *country* code. Do this
  rename as part of the migration while it is cheap.
- A missing key is allowed (means "not yet translated") and is resolved by fallback (§3).
- Empty string `""` is treated the same as a missing key for fallback purposes.

`localize()` and `l()` change accordingly (see §3 for `localize`):

```ts
// l() takes the project's default language code as the anchor key.
function l(defaultCode: string, text: string, more: Record<string, string> = {}): Localized {
  return { [defaultCode]: text, ...more };
}
```

---

## 3. Per-project languages and fallback

Projects already select languages via `Language` + `ProjectLanguage`. Two additions make
content translation work against a *dynamic* set:

1. **Add a default/source language to `Project`.**
   - New field: `Project.defaultLanguageId` (FK → `Language`), required.
   - This is the fallback anchor. With the old fixed shape, `en` was the hardcoded fallback;
     with dynamic languages there is no universal `en`, so each project declares its own.

2. **`localize()` falls back through the project default, then anything present.**

```ts
function localize(field: Localized, locale: string, projectDefault: string): string {
  return field[locale] || field[projectDefault] || firstNonEmpty(field) || "";
}
```

3. **Validate language keys at the service layer, not in the DB.**
   - On every write of a `Localized` value, reject any key that is not in this project's
     `ProjectLanguage` set. JSONB cannot enforce this itself — pay the check in the service.
   - "Find untranslated content" stays a JSONB query, e.g. `WHERE NOT (name ? 'kk')`
     (GIN-indexable). No separate translations table is needed for completeness reporting.

---

## 4. The central type: `PropValue` (tagged union)

Every prop value — in block sample props and in every block *instance* (`TestBlock.props`,
`DcgPageBlock.props`, `DataCatalogPageProp.props`) — is exactly one of:

```ts
type PropValue =
  | { kind: "text";    value: Localized }                 // translated leaf → JSONB map
  | { kind: "richtext"; value: Localized }                // localized HTML/markup leaf (see §4.1)
  | { kind: "binding"; $bind: string }                    // resolves to already-localized data
  | { kind: "number" | "boolean" | "color"; value: number | boolean | string }; // language-neutral
```

- A prop's declared `type` (already on `Block.props` as `[{ name, type, value }]`) decides
  which variant its value uses.
- The editor renders **language tabs only for `text` / `richtext` props**, a binding picker
  for bindings, and a plain control for the rest. The translation surface is bounded by how
  many text props a block declares — not by how much HTML it contains.

### 4.1 Rich text with inline variables

A `richtext` value is a `Localized` map whose strings contain **language-neutral merge
tokens** (`{{score}}`) and/or markup. The prose is translated; the tokens are identical in
every language and resolved at render against the localized data context.

```ts
body: {
  en: "Your score is <b>{{score}}</b>, above average.",
  kk: "Сіздің балыңыз <b>{{score}}</b>, орташадан жоғары."
}
```

This is how "HTML inside a prop" is handled — it is still just a translated leaf.

---

## 5. How each content domain changes

### 5.1 Blocks (`uc_blocks`)

- `Block.html` — **stays single-language structure** (`{{prop}}` placeholders only). NOT a
  `Localized` value. Never per-language HTML blobs.
- `Block.props` (declared schema) — gains/keeps a `type` per prop; `text`/`richtext` types
  mark translatable props.
- `Block.sampleProps` — each entry is a `PropValue`; text props hold a `Localized` map.

### 5.2 Test content (`test_tests`, `test_blocks`)

- `Test.name`, `Test.category` — `Localized` leaves (JSONB), already shaped this way.
- `Test.info`, `Test.advancedParams` — keep as structured `Json`; any **text** inside them
  (e.g. a description) must be a `Localized` leaf, not a bare string. Calculation/visibility
  logic is language-neutral and stays as-is.
- `TestBlock.props` — each value is a `PropValue` (text override = `Localized`, data =
  `$bind`). `TestBlock.advancedParams` (instance logic) is language-neutral.

### 5.3 Data catalogs (`dc_*`)

The schema is **already built for "translate leaves, not the tree"** — preserve that:

- Leaf content fields stay `Localized`: `DataCatalog.title` / `description`,
  `DataCatalogExtraValue.value`, `ExtraVariableOption.optionValue`,
  `DataCatalogGroupPage.pageName`.
- `DataCatalog.params` — ids/relations, **language-neutral, never translated.**
- Page **templates** (`DataCatalogGroupPage` → `DcgPageBlock.props`) — structure + `{$bind}`,
  **not translated.** A page renders in any language by binding to each item's already-
  localized leaf field; there is no per-language template.
- Characteristic names/descriptions are currently **single-language** strings
  (`dc_characteristics`, `dc_characteristic_groups`). Decide explicitly: either keep them as
  admin-facing single-language metadata, or promote to `Localized` if students ever see them.
  Do not leave it implicit.

---

## 6. The render path (resolver contract)

One function resolves a prop tree for a given locale. It is the only place translation and
binding happen, and it is small precisely because structure is never translated:

```
resolveProps(props, ctx) → resolvedProps
  for each prop value:
    text | richtext → localize(value, ctx.locale, ctx.projectDefault)   // + merge tokens for richtext
    binding         → read ctx.data at $bind path  (that value is itself a localized leaf → localize it)
    number|boolean|color → pass through unchanged
```

- `ctx` carries `{ locale, projectDefault, data }`.
- Bindings resolve against `data`; if the bound value is itself `Localized`, localize it with
  the same rule. This is why catalog pages need no per-language templates.

---

## 7. Storage decision (do not revisit)

- **Store `Localized` as JSONB keyed by language code.** This is the default for all authored
  content and is already how the backend stores it (`Json` columns).
- **Do NOT build a global `translations(entity_type, entity_id, field, lang, value)` table.**
  Polymorphic FKs cannot be enforced, every read becomes a join + pivot, and content spread
  across many tables all pays the tax forever.
- **Only** introduce per-entity `*_translations` side tables (real FK + `(entityId, languageId)`
  unique) **if** translation becomes a managed *workflow* — per-translation status
  (machine/draft/reviewed), translator attribution, assignment, completeness dashboards. That
  is a separate, later decision. Storage alone does not justify it. If it happens, it is a
  side table **per entity**, never the polymorphic EAV version.

---

## 8. Migration steps (ordered)

1. Change the `Localized` type to `Record<string, string>`; update `localize()` to take the
   project default; update `l()`.
2. Add `Project.defaultLanguageId` (FK, required) + backfill existing projects (default `en`).
3. Data migration: rename `kz` keys to `kk` in every stored `Localized` value.
4. Introduce the `PropValue` union and a prop `type` for blocks; migrate `sampleProps` and all
   instance `props` (`TestBlock`, `DcgPageBlock`, `DataCatalogPageProp`) to tagged values.
5. Add the service-layer key validator (reject codes outside the project's `ProjectLanguage`).
6. Update the editor: language tabs for `text`/`richtext` props only; binding picker for
   bindings; enforce "no prose in raw HTML."
7. Update the resolver/render path (§6).
8. Replace the two `localized-input` / `localized-textarea` variants so their language switch
   is driven by the **project's** language list, not a hardcoded KZ/RU/EN.

---

## 9. Hard rules (do not violate)

- Never translate structure: block `html`, component trees, page templates carry no language.
- Never put prose in raw HTML — text is always a `text`/`richtext` prop.
- Never store a bare author-typed string where it could be `Localized`; wrap it.
- Never use a fixed `{ en, ru, kz }` shape — keys are dynamic BCP-47 codes.
- Never use `kz` for Kazakh — it is `kk`.
- Never validate allowed languages in the DB — do it in the service against `ProjectLanguage`.
- Never build a global polymorphic translations table.
- Never duplicate a catalog page template per language — bind to localized leaves instead.
- UI chrome stays in `i18n.ts`; never in the database, never project-scoped.
