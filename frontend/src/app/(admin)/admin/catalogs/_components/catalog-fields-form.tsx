"use client";

// Shared, consistent form for ANY catalog item. Every field renders the same
// way — a label + a plain input. Translatable fields use the page-language
// LocalizedInput (JSON {en,ru,kk}); everything else is a plain text input.
// This is the common component professions and data catalogs share, so they're
// consistent. Output variables are just more fields in the same list.

import type { Localized } from "@/lib/localized";
import { LocalizedInput } from "./localized-input";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

export type CatalogField =
  | {
      id: string;
      label: string;
      kind: "text";
      value: string;
      onChange: (v: string) => void;
      onBlur?: () => void;
      placeholder?: string;
    }
  | {
      id: string;
      label: string;
      kind: "localized";
      value: Localized;
      onChange: (v: Localized) => void;
      onBlur?: () => void;
      placeholder?: string;
    };

export function CatalogFieldsForm({ fields }: { fields: CatalogField[] }) {
  return (
    <div className="max-w-2xl space-y-4">
      {fields.map((f) => (
        <div key={f.id}>
          <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-gray-400">
            {f.label}
          </label>
          <div
            onBlur={(e) => {
              if (f.onBlur && !e.currentTarget.contains(e.relatedTarget as Node)) f.onBlur();
            }}
          >
            {f.kind === "localized" ? (
              <LocalizedInput
                value={f.value}
                onChange={f.onChange}
                placeholder={f.placeholder}
                className={inputClass}
              />
            ) : (
              <input
                type="text"
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                className={inputClass}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
