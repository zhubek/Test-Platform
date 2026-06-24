"use client";

// Characteristics on a catalog ITEM's General tab — shown right under extra
// variables. The set of characteristics comes from the characteristic groups
// ATTACHED to this catalog group (on its Parameters tab); here you fill in this
// item's numeric value for each (0–100), stored by characteristic id.

import { attachedCharacteristicGroups, useDcGroups } from "@/lib/dc-catalogs";
import { useLocale } from "@/lib/locale-context";

interface Props {
  catalog: string;
  value: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
  onBlur?: () => void;
}

export function CharacteristicVariables({ catalog, value, onChange, onBlur }: Props) {
  const { t } = useLocale();
  useDcGroups(); // subscribe so attachments stay in sync
  const charGroups = attachedCharacteristicGroups(catalog);

  if (charGroups.length === 0) return null;

  return (
    <div className="max-w-2xl">
      <div className="mb-1 mt-2 border-t border-gray-100 pt-5">
        <h3 className="text-[0.72rem] font-semibold uppercase tracking-wider text-gray-400">
          {t("admin.catUi.characteristics")}
        </h3>
        <p className="mt-0.5 text-xs text-gray-400">
          {t("admin.catUi.characteristicsHint")}
        </p>
      </div>

      <div
        className="space-y-5 pt-3"
        onBlur={(e) => {
          if (onBlur && !e.currentTarget.contains(e.relatedTarget as Node)) onBlur();
        }}
      >
        {charGroups.map((cg) => (
          <div key={cg.id}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: cg.color ?? "#6b7280" }}
              />
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-gray-500">
                {cg.name}
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {cg.characteristics.map((c) => {
                const v = value[c.id];
                return (
                  <label key={c.id} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm text-gray-700">
                      {c.name}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={v ?? ""}
                      onChange={(e) => {
                        const next = { ...value };
                        if (e.target.value === "") delete next[c.id];
                        else next[c.id] = Number(e.target.value);
                        onChange(next);
                      }}
                      placeholder="—"
                      className="w-20 shrink-0 rounded-lg border border-gray-200 px-2.5 py-1.5 text-right text-sm text-gray-900 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
