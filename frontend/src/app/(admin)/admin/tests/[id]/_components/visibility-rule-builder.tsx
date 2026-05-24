"use client";

import { Plus, Trash2, FolderPlus } from "lucide-react";
import { useProject, type ProjectParameter } from "@/lib/project-context";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type {
  VisibilityRule,
  RuleCondition,
  RuleGroup,
  ConditionOperator,
  Combinator,
} from "@/lib/visibility-rule";

let seq = 0;
const uid = (p: string) => `${p}-${Date.now()}-${++seq}`;

const SINGLE_OPS: ConditionOperator[] = ["is", "isNot"];
const MULTI_OPS: ConditionOperator[] = ["includesAny", "includesAll"];
const OP_LABEL: Record<ConditionOperator, string> = {
  is: "is",
  isNot: "is not",
  includesAny: "includes any of",
  includesAll: "includes all of",
};

interface Props {
  value: VisibilityRule;
  onChange: (next: VisibilityRule) => void;
}

export function VisibilityRuleBuilder({ value, onChange }: Props) {
  const { project } = useProject();
  const { locale } = useLocale();
  const params = project.parameters;

  const paramById = (id: string): ProjectParameter | undefined =>
    params.find((p) => p.id === id);

  const newCondition = (): RuleCondition => {
    const first = params[0];
    return {
      id: uid("c"),
      kind: "condition",
      parameterId: first?.id ?? "",
      operator: first?.type === "multiple" ? "includesAny" : "is",
      values: [],
    };
  };

  // ── top-level mutations ──
  const setCombinator = (combinator: Combinator) => onChange({ ...value, combinator });

  const addCondition = () =>
    onChange({ ...value, items: [...value.items, newCondition()] });

  const addGroup = () =>
    onChange({
      ...value,
      items: [
        ...value.items,
        { id: uid("g"), kind: "group", combinator: "any", conditions: [newCondition()] } as RuleGroup,
      ],
    });

  const removeItem = (id: string) =>
    onChange({ ...value, items: value.items.filter((i) => i.id !== id) });

  const updateItem = (id: string, next: RuleCondition | RuleGroup) =>
    onChange({ ...value, items: value.items.map((i) => (i.id === id ? next : i)) });

  // ── condition editor (shared by top-level and group) ──
  const renderCondition = (
    c: RuleCondition,
    onCondChange: (next: RuleCondition) => void,
    onRemove: () => void,
  ) => {
    const param = paramById(c.parameterId);
    const isMulti = param?.type === "multiple";
    const ops = isMulti ? MULTI_OPS : SINGLE_OPS;
    const singleValue = c.values[0] ?? "";

    return (
      <div key={c.id} className="flex flex-wrap items-center gap-2">
        {/* parameter */}
        <Select
          value={c.parameterId}
          onValueChange={(v) => {
            const np = paramById(v ?? "");
            onCondChange({
              ...c,
              parameterId: v ?? "",
              operator: np?.type === "multiple" ? "includesAny" : "is",
              values: [],
            });
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Parameter">
              {(v) => {
                const p = paramById(v as string);
                return p ? localize(p.label, locale) : "Parameter";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {params.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {localize(p.label, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* operator */}
        <Select
          value={c.operator}
          onValueChange={(v) => onCondChange({ ...c, operator: (v as ConditionOperator) ?? ops[0] })}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ops.map((op) => (
              <SelectItem key={op} value={op}>
                {OP_LABEL[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* value(s) */}
        {param ? (
          isMulti ? (
            <div className="flex flex-wrap gap-1">
              {param.options.map((opt, i) => {
                const optId = String(i);
                const active = c.values.includes(optId);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      onCondChange({
                        ...c,
                        values: active
                          ? c.values.filter((x) => x !== optId)
                          : [...c.values, optId],
                      })
                    }
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {localize(opt, locale)}
                  </button>
                );
              })}
            </div>
          ) : (
            <Select
              value={singleValue}
              onValueChange={(v) => onCondChange({ ...c, values: v ? [v] : [] })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Value">
                  {(v) => {
                    const opt = param.options[Number(v)];
                    return opt ? localize(opt, locale) : "Value";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {param.options.map((opt, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {localize(opt, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        ) : (
          <span className="text-xs text-muted-foreground">No parameters defined</span>
        )}

        <Button variant="ghost" size="icon-sm" onClick={onRemove} title="Remove">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (params.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        No project parameters defined yet. Add them on the Parameters page to
        build a visibility rule.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      {/* top-level combinator */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Match</span>
        <Select value={value.combinator} onValueChange={(v) => setCombinator((v as Combinator) ?? "all")}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">all</SelectItem>
            <SelectItem value="any">any</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">of the following</span>
      </div>

      {value.items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No conditions — this test is visible to everyone.
        </p>
      )}

      {value.items.map((item) =>
        item.kind === "condition" ? (
          <div key={item.id} className="rounded-md border bg-background p-2.5">
            {renderCondition(
              item,
              (next) => updateItem(item.id, next),
              () => removeItem(item.id),
            )}
          </div>
        ) : (
          <div key={item.id} className="rounded-md border bg-background p-2.5">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Group — match</span>
              <Select
                value={item.combinator}
                onValueChange={(v) =>
                  updateItem(item.id, { ...item, combinator: (v as Combinator) ?? "any" })
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  <SelectItem value="any">any</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                onClick={() => removeItem(item.id)}
                title="Remove group"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 pl-3">
              {item.conditions.map((c) =>
                renderCondition(
                  c,
                  (next) =>
                    updateItem(item.id, {
                      ...item,
                      conditions: item.conditions.map((x) => (x.id === c.id ? next : x)),
                    }),
                  () =>
                    updateItem(item.id, {
                      ...item,
                      conditions: item.conditions.filter((x) => x.id !== c.id),
                    }),
                ),
              )}
              <button
                type="button"
                onClick={() =>
                  updateItem(item.id, {
                    ...item,
                    conditions: [...item.conditions, newCondition()],
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add condition
              </button>
            </div>
          </div>
        ),
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={addCondition}>
          <Plus className="mr-1 h-4 w-4" /> Add condition
        </Button>
        <Button variant="outline" size="sm" onClick={addGroup}>
          <FolderPlus className="mr-1 h-4 w-4" /> Add group
        </Button>
      </div>
    </div>
  );
}
