"use client";

import { useState } from "react";
import type { Localized } from "@/lib/localized";

interface Props {
  value: Localized;
  onChange: (value: Localized) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function LocalizedInput({ value, onChange, placeholder, className, autoFocus }: Props) {
  const [activeLang, setActiveLang] = useState<"kz" | "ru" | "en">("kz");

  return (
    <div className="relative">
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 z-10">
        {(["kz", "ru", "en"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveLang(lang)}
            className={`px-1.5 py-0.5 text-[0.62rem] font-bold uppercase rounded transition-colors ${
              activeLang === lang
                ? "bg-teal-100 text-teal-700"
                : "text-gray-300 hover:text-gray-500"
            }${lang !== activeLang && !value[lang] ? "" : ""}`}
          >
            {lang}
            {lang !== activeLang && !value[lang] && (
              <span className="ml-0.5 inline-block w-1 h-1 rounded-full bg-amber-400 align-middle" />
            )}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={value[activeLang]}
        onChange={(e) => onChange({ ...value, [activeLang]: e.target.value })}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        style={{ paddingRight: "6.5rem" }}
      />
    </div>
  );
}
