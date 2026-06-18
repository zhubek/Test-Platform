"use client";

import { useState } from "react";
import type { Localized } from "@/lib/localized";
import type { Locale } from "@/lib/i18n";
import { useContentLanguages } from "@/lib/project-context";
import { useEditLanguage } from "./edit-language";

interface Props {
  value: Localized;
  onChange: (value: Localized) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function LocalizedInput({ value, onChange, placeholder, className, autoFocus }: Props) {
  const edit = useEditLanguage();
  const { codes, default: defaultLang } = useContentLanguages();
  const [fallbackLang, setFallbackLang] = useState<Locale>(defaultLang);
  const activeLang = codes.includes(fallbackLang) ? fallbackLang : codes[0];

  // Page-level language mode: one input, language chosen by the page picker.
  if (edit) {
    return (
      <input
        type="text"
        value={value[edit.lang] ?? ""}
        onChange={(e) => onChange({ ...value, [edit.lang]: e.target.value })}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
      />
    );
  }

  // Standalone fallback: per-field language tabs (used outside a detail page).
  return (
    <div className="relative">
      <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 gap-0.5">
        {codes.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setFallbackLang(lang)}
            className={`rounded px-1.5 py-0.5 text-[0.62rem] font-bold uppercase transition-colors ${
              activeLang === lang
                ? "bg-teal-100 text-teal-700"
                : "text-gray-300 hover:text-gray-500"
            }`}
          >
            {lang}
            {lang !== activeLang && !value[lang] && (
              <span className="ml-0.5 inline-block h-1 w-1 rounded-full bg-amber-400 align-middle" />
            )}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={value[activeLang] ?? ""}
        onChange={(e) => onChange({ ...value, [activeLang]: e.target.value })}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        style={{ paddingRight: "6.5rem" }}
      />
    </div>
  );
}
