"use client";

import { Plus, Trash2, BarChart3, Radar, Trophy, ListOrdered } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize, l } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import { LocalizedInput } from "@/components/localized-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findGroup } from "@/lib/catalog-characteristics";
import { ResultComponentView, type ResultDatum } from "./result-component";
import type {
  ResultComponent,
  ResultComponentType,
  CatalogMapping,
  Variable,
} from "../../../_components/mock-data";

interface Props {
  components: ResultComponent[];
  variables: Variable[];
  mappings: CatalogMapping[];
  onChange: (components: ResultComponent[]) => void;
}

const COMPONENT_TYPES: { type: ResultComponentType; icon: typeof BarChart3; key: string; bindingKind: ResultComponent["binding"]["kind"] }[] = [
  { type: "characteristics_bar", icon: BarChart3, key: "cm.resultView.typeBar", bindingKind: "characteristics" },
  { type: "characteristics_radar", icon: Radar, key: "cm.resultView.typeRadar", bindingKind: "characteristics" },
  { type: "score_card", icon: Trophy, key: "cm.resultView.typeCard", bindingKind: "characteristics" },
  { type: "matches_list", icon: ListOrdered, key: "cm.resultView.typeMatches", bindingKind: "mapping" },
];

export function ResultViewTab({ components, variables, mappings, onChange }: Props) {
  const { t, locale } = useLocale();

  const charVars = variables.filter((v) => v.kind === "characteristic");

  const add = (type: ResultComponentType) => {
    const def = COMPONENT_TYPES.find((c) => c.type === type)!;
    const binding: ResultComponent["binding"] =
      def.bindingKind === "mapping"
        ? { kind: "mapping", mappingId: mappings[0]?.id }
        : type === "score_card"
          ? { kind: "characteristics" }
          : { kind: "characteristics" };
    onChange([
      ...components,
      { id: `rc_${Date.now()}`, type, title: { en: "", ru: "", kz: "" }, binding },
    ]);
  };
  const update = (id: string, partial: Partial<ResultComponent>) =>
    onChange(components.map((c) => (c.id === id ? { ...c, ...partial } : c)));
  const remove = (id: string) => onChange(components.filter((c) => c.id !== id));

  // Sample data for a component's binding, so the preview shows something real.
  const sampleData = (c: ResultComponent): ResultDatum[] => {
    if (c.binding.kind === "mapping") {
      const m = mappings.find((x) => x.id === c.binding.mappingId);
      const group = m && findGroup(m.catalogId, m.groupId);
      const items = (group?.items ?? []).slice(0, m?.topN ?? 5);
      // fabricate descending match scores
      return items.map((it, i) => ({ label: localize(it.name, locale), value: 95 - i * 11 }));
    }
    // characteristics: use the char vars with fabricated scores
    return charVars.map((v, i) => ({
      label: localize(v.label, locale) || v.name,
      value: 30 + ((i * 37) % 60),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[0.88rem] font-semibold text-foreground">
            {t("cm.resultView.heading")}
          </h3>
          <p className="mt-0.5 text-[0.75rem] text-muted-foreground">{t("cm.resultView.sub")}</p>
        </div>
      </div>

      {/* Component palette */}
      <div className="flex flex-wrap gap-2">
        {COMPONENT_TYPES.map((ct) => (
          <Button key={ct.type} variant="outline" size="sm" onClick={() => add(ct.type)}>
            <ct.icon className="h-3.5 w-3.5" />
            {t(ct.key)}
          </Button>
        ))}
      </div>

      {components.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-[0.78rem] text-muted-foreground">
          {t("cm.resultView.empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {components.map((c) => {
            const def = COMPONENT_TYPES.find((x) => x.type === c.type)!;
            return (
              <div key={c.id} className="rounded-xl border bg-muted/30 p-3">
                {/* Config row */}
                <div className="mb-3 flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("cm.resultView.component")}
                    </label>
                    <span className="flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-[0.78rem]">
                      <def.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {t(def.key)}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("cm.resultView.title")}
                    </label>
                    <LocalizedInput
                      value={c.title}
                      onChange={(v) => update(c.id, { title: v })}
                      placeholder={t("cm.resultView.titlePlaceholder")}
                    />
                  </div>

                  {/* Binding picker */}
                  {c.binding.kind === "mapping" && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("cm.resultView.fromMapping")}
                      </label>
                      <Select
                        value={c.binding.mappingId ?? ""}
                        onValueChange={(v) => update(c.id, { binding: { kind: "mapping", mappingId: v ?? undefined } })}
                      >
                        <SelectTrigger size="sm" className="w-52">
                          <SelectValue>
                            {() => {
                              const m = mappings.find((x) => x.id === c.binding.mappingId);
                              const g = m && findGroup(m.catalogId, m.groupId);
                              return g ? localize(g.name, locale) : t("cm.resultView.noMapping");
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {mappings.length === 0 ? (
                            <SelectItem value="" disabled>{t("cm.resultView.noMapping")}</SelectItem>
                          ) : (
                            mappings.map((m) => {
                              const g = findGroup(m.catalogId, m.groupId);
                              return (
                                <SelectItem key={m.id} value={m.id}>
                                  {g ? localize(g.name, locale) : m.id} · top {m.topN}
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(c.id)}
                    className="ml-auto text-muted-foreground hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Live preview against sample data */}
                <ResultComponentView
                  component={{ ...c, title: c.title.en || c.title.ru || c.title.kz ? c.title : l(t(def.key)) }}
                  data={sampleData(c)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
