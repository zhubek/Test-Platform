"use client";

import { useState } from "react";
import type { Localized } from "@/lib/localized";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  value: Localized;
  onChange: (value: Localized) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  spellCheck?: boolean;
}

export function LocalizedTextarea({ value, onChange, placeholder, className, rows = 3, spellCheck }: Props) {
  const [activeLang, setActiveLang] = useState<"kz" | "ru" | "en">("kz");

  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10 flex gap-0.5">
        {(["kz", "ru", "en"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveLang(lang)}
            className={cn(
              "rounded px-1.5 py-0.5 text-[0.62rem] font-bold uppercase transition-colors",
              activeLang === lang
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/40 hover:text-muted-foreground",
            )}
          >
            {lang}
            {lang !== activeLang && !value[lang] && (
              <span className="ml-0.5 inline-block h-1 w-1 rounded-full bg-amber-400 align-middle" />
            )}
          </button>
        ))}
      </div>
      <Textarea
        value={value[activeLang]}
        onChange={(e) => onChange({ ...value, [activeLang]: e.target.value })}
        placeholder={placeholder}
        rows={rows}
        className={cn("pr-26", className)}
        spellCheck={spellCheck}
      />
    </div>
  );
}
