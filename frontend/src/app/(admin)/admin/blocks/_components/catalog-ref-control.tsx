"use client";

// Editor control for "ref" props: point the prop into a data catalog and pick
// items by id — or flip to "Raw value" and paste data directly (the "entire
// value" escape hatch). Selection order is preserved and becomes the render
// order.
//
// `fixedCatalog` locks the control to the catalog the block was DESIGNED for
// (taken from the block's declared default): usages can only pick ids from
// that catalog. Without it (the block editor), the author chooses the catalog
// AND may pick default items (assumes the catalogs already exist).

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { localize, type Localized } from "@/lib/localized";
import {
  catalogRefLabel,
  fetchCatalogEntityOptions,
  isCatalogRef,
  useCatalogRefOptions,
  type CatalogRef,
} from "@/lib/catalog-refs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Mode = "ref" | "value";

export function CatalogRefControl({
  value,
  onChange,
  fixedCatalog,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  fixedCatalog?: string;
}) {
  const { locale } = useLocale();
  const catalogOptions = useCatalogRefOptions();
  const raw: CatalogRef = isCatalogRef(value) ? value : { $catalog: "universities", ids: [] };
  // The designed catalog always wins; ids from a mismatched catalog are dropped.
  const ref: CatalogRef =
    fixedCatalog && raw.$catalog !== fixedCatalog ? { $catalog: fixedCatalog, ids: [] } : raw;

  const [mode, setMode] = useState<Mode>(isCatalogRef(value) ? "ref" : "value");
  const [options, setOptions] = useState<{ id: string; name: Localized }[]>([]);
  const [rawText, setRawText] = useState(() => {
    try { return JSON.stringify(isCatalogRef(value) ? [] : value, null, 2); } catch { return "[]"; }
  });
  const [rawError, setRawError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "ref") return;
    let alive = true;
    fetchCatalogEntityOptions(ref.$catalog).then((opts) => {
      if (alive) setOptions(opts);
    });
    return () => {
      alive = false;
    };
  }, [ref.$catalog, mode]);

  const toggle = (id: string) => {
    const ids = ref.ids.includes(id) ? ref.ids.filter((x) => x !== id) : [...ref.ids, id];
    onChange({ ...ref, ids });
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-2.5">
      {/* Mode switch: pick by id vs. paste the entire value */}
      <div className="mb-2 inline-flex rounded-md border bg-card p-0.5">
        {(["ref", "value"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              if (m === "ref" && !isCatalogRef(value)) onChange(ref);
            }}
            className={cn(
              "rounded px-2.5 py-1 text-[0.7rem] font-semibold transition-colors",
              mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "ref" ? "By reference" : "Raw value"}
          </button>
        ))}
      </div>

      {mode === "ref" ? (
        <div className="space-y-2">
          {fixedCatalog ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="rounded-md border bg-card px-2 py-1 font-semibold text-foreground">
                {catalogRefLabel(fixedCatalog)}
              </span>
              <span>— this block is designed for this catalog</span>
            </div>
          ) : (
            <Select
              value={ref.$catalog}
              onValueChange={(v) => onChange({ $catalog: v ?? "universities", ids: [] })}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {catalogOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="max-h-44 space-y-0.5 overflow-auto rounded-md border bg-card p-1.5">
            {options.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">No items in this catalog.</p>
            ) : (
              options.map((o) => {
                const checked = ref.ids.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm transition-colors hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(o.id)}
                      className="h-3.5 w-3.5 accent-teal-600"
                    />
                    <span className={cn("truncate", !checked && "text-muted-foreground")}>
                      {localize(o.name, locale) || `#${o.id}`}
                    </span>
                  </label>
                );
              })
            )}
          </div>
          <p className="text-[0.66rem] text-muted-foreground">
            {ref.ids.length} selected — data is pulled from the catalog at render time.
          </p>
        </div>
      ) : (
        <div>
          <textarea
            value={rawText}
            spellCheck={false}
            onChange={(e) => {
              const next = e.target.value;
              setRawText(next);
              try {
                onChange(JSON.parse(next));
                setRawError(null);
              } catch (err) {
                setRawError((err as Error).message);
              }
            }}
            className="h-32 w-full resize-y rounded-md border bg-gray-50 p-2 font-mono text-[0.72rem] leading-relaxed outline-none focus:border-ring"
          />
          {rawError ? (
            <p className="mt-1 text-[0.66rem] text-red-500">Invalid JSON: {rawError}</p>
          ) : (
            <p className="mt-1 text-[0.66rem] text-muted-foreground">
              Inline data, used as-is instead of a catalog lookup.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
