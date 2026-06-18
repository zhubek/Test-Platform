// Authored-content translation. See docs/i18n-rework.md for the target design.
//
// `Localized` is a DYNAMIC language→string map keyed by BCP-47 codes — it can
// hold any per-project language set (en / ru / kk / tr / …), not a fixed shape.
// Kazakh is `kk` (the old `kz` key was renamed across code and stored data).
// `localize()` resolves whatever keys are present, so the system handles dynamic
// languages. UI-chrome translation (`t("key")`, lib/i18n.ts) is separate.

/**
 * A translated leaf: language code → string. Keys are BCP-47 codes
 * (`en`, `ru`, `kk`, …). A missing key means "not yet translated".
 */
export type Localized = Record<string, string>;

/** First non-empty value in the map (insertion order), or "". */
export function firstNonEmpty(field: Localized): string {
  for (const k in field) {
    const v = field[k];
    if (v) return v;
  }
  return "";
}

/**
 * Resolve the string for `locale`, falling back through the project's default
 * language, then any present translation. With dynamic languages there is no
 * universal default, so callers that know the project pass `projectDefault`;
 * `en` and "first present" remain as transitional fallbacks so existing
 * en/ru/kz content always resolves.
 */
export function localize(
  field: Localized | null | undefined,
  locale: string,
  projectDefault?: string,
): string {
  if (!field) return "";
  return (
    field[locale] ||
    (projectDefault ? field[projectDefault] : "") ||
    field.en ||
    firstNonEmpty(field)
  );
}

/**
 * Shorthand to build a Localized value. Legacy positional form
 * `l(en, ru?, kk?)` — kept so the 600+ existing call sites keep working.
 * New code should prefer `loc(defaultCode, text, more)`.
 */
export function l(en: string, ru: string = "", kk: string = ""): Localized {
  return { en, ru, kk };
}

/**
 * Like `localize`, but tolerates a plain string — legacy single-language values
 * (e.g. a prompt stored before localization) resolve to themselves instead of
 * being treated as a `Localized` map. Use at boundaries that read possibly-legacy
 * authored text.
 */
export function localizeLoose(
  field: Localized | string | null | undefined,
  locale: string,
  projectDefault?: string,
): string {
  if (field == null) return "";
  if (typeof field === "string") return field;
  return localize(field, locale, projectDefault);
}

/**
 * Build a Localized value anchored on a project's default language code, with
 * optional extra translations. This is the forward-looking constructor from the
 * i18n rework (`loc("kk", "Балалар", { en: "Children" })`).
 */
export function loc(
  defaultCode: string,
  text: string,
  more: Record<string, string> = {},
): Localized {
  return { [defaultCode]: text, ...more };
}
