import type { Locale } from "./i18n";

/**
 * A string that has EN, RU, and KZ versions.
 * Used for authored content (test names, questions, descriptions) — not UI chrome.
 */
export type Localized = {
  en: string;
  ru: string;
  kz: string;
};

/** Extract the string for the current locale, falling back to EN. */
export function localize(field: Localized, locale: Locale): string {
  return field[locale] || field.en;
}

/** Shorthand to create a Localized value. RU and KZ default to "" (falls back to EN at render). */
export function l(en: string, ru: string = "", kz: string = ""): Localized {
  return { en, ru, kz };
}
