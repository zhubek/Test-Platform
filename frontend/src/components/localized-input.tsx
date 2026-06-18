"use client";

import { useState, useRef, useLayoutEffect } from "react";
import type { Localized } from "@/lib/localized";
import type { Locale } from "@/lib/i18n";
import { useContentLanguages } from "@/lib/project-context";
import { cn } from "@/lib/utils";

interface Props {
  value: Localized;
  onChange: (value: Localized) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

// Localized text field with the language switch ABOVE the field (so it
// doesn't eat input space) and an auto-growing textarea (expandable).
export function LocalizedInput({ value, onChange, label, placeholder, className, autoFocus }: Props) {
  const { codes, default: defaultLang } = useContentLanguages();
  const [lang, setLang] = useState<Locale>(defaultLang);
  const activeLang = codes.includes(lang) ? lang : codes[0];
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow to fit content.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, activeLang]);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Label (left) + language switch (right) on one line */}
      <div className="flex items-center gap-2">
        {label && (
          <span className="text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
        {codes.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={cn(
              "rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase transition-colors",
              activeLang === code
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/40 hover:text-muted-foreground",
            )}
          >
            {code}
            {code !== activeLang && !value[code] && (
              <span className="ml-0.5 inline-block h-1 w-1 rounded-full bg-amber-400 align-middle" />
            )}
          </button>
        ))}
        </div>
      </div>

      <textarea
        ref={ref}
        rows={1}
        value={value[activeLang] ?? ""}
        onChange={(e) => onChange({ ...value, [activeLang]: e.target.value })}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full resize-none overflow-hidden rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  );
}
