"use client";

// Page-level editing-language: instead of a language picker on every field, a
// single picker at the top of a catalog detail page selects which language all
// localized fields edit. The active language set comes from project parameters.

import { createContext, useContext, useState, type ReactNode } from "react";
import { useProject, projectLanguages } from "@/lib/project-context";
import { useLocale, LocaleOverride } from "@/lib/locale-context";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface EditLanguageValue {
  lang: Locale;
  setLang: (l: Locale) => void;
  languages: Locale[];
}

const EditLanguageContext = createContext<EditLanguageValue | null>(null);

/** Localized inputs read this to render in single-language mode. Null = not on a page. */
export function useEditLanguage(): EditLanguageValue | null {
  return useContext(EditLanguageContext);
}

/**
 * The locale to display catalog content in. Inside a detail page it's the
 * page-level editing language (so previews follow the language picker);
 * elsewhere it falls back to the global UI locale.
 */
export function useContentLocale(): Locale {
  const edit = useContext(EditLanguageContext);
  const { locale } = useLocale();
  return edit ? edit.lang : (locale as Locale);
}

/**
 * Renders catalog preview content in the page's editing language. Wrap any
 * preview in this so every nested component (including shared public ones)
 * follows the language picker — one consistent mechanism everywhere.
 */
export function PreviewLocaleScope({ children }: { children: ReactNode }) {
  const loc = useContentLocale();
  return <LocaleOverride locale={loc}>{children}</LocaleOverride>;
}

export function EditLanguageProvider({ children }: { children: ReactNode }) {
  const { project } = useProject();
  const { locale } = useLocale();
  const languages = projectLanguages(project);
  // Default the editing language to the UI locale if it's active, else the first active one.
  const [lang, setLang] = useState<Locale>(
    languages.includes(locale as Locale) ? (locale as Locale) : languages[0],
  );
  const safeLang = languages.includes(lang) ? lang : languages[0];
  return (
    <EditLanguageContext.Provider value={{ lang: safeLang, setLang, languages }}>
      {children}
    </EditLanguageContext.Provider>
  );
}

/** The single language picker shown at the top of the page. Hidden when only one language is active. */
export function PageLanguageBar() {
  const ctx = useEditLanguage();
  if (!ctx || ctx.languages.length <= 1) return null;
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-muted p-0.5">
      {ctx.languages.map((lc) => (
        <button
          key={lc}
          type="button"
          onClick={() => ctx.setLang(lc)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-all",
            ctx.lang === lc
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {lc}
        </button>
      ))}
    </div>
  );
}
