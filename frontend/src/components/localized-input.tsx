"use client";

import { useState } from "react";
import type { Localized } from "@/lib/localized";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
      <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 gap-0.5">
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
      <Input
        type="text"
        value={value[activeLang]}
        onChange={(e) => onChange({ ...value, [activeLang]: e.target.value })}
        placeholder={placeholder}
        className={cn("pr-26", className)}
        autoFocus={autoFocus}
      />
    </div>
  );
}
