"use client";

import { ChevronDown, GripVertical, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import type { Variable, VariableKind } from "../../../_components/mock-data";

// Variable kinds shown as groups, mirroring the Calculation tab order.
const KIND_GROUPS: { kind: VariableKind; key: string }[] = [
  { kind: "characteristic", key: "cm.calculation.kindCharacteristic" },
  { kind: "custom", key: "cm.calculation.kindCustom" },
  { kind: "singlechoice", key: "cm.calculation.kindSinglechoice" },
  { kind: "multiplechoice", key: "cm.calculation.kindMultiplechoice" },
];

interface BaseProps {
  variables: Variable[];
  numericOnly?: boolean; // exclude nothing for now; reserved (all current vars are numeric)
  placeholder?: string;
  className?: string;
}

// ── Single-select ───────────────────────────────────────────────
export function VariableSelect({
  variables,
  value,
  onChange,
  placeholder,
  className,
}: BaseProps & { value?: string; onChange: (name: string | undefined) => void }) {
  const { t, locale } = useLocale();
  const byName = new Map(variables.map((v) => [v.name, v]));
  const groups = KIND_GROUPS.map((g) => ({ ...g, vars: variables.filter((v) => v.kind === g.kind) })).filter(
    (g) => g.vars.length > 0,
  );

  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v || undefined)}>
      <SelectTrigger size="sm" className={cn("w-52", className)}>
        <SelectValue>
          {() => {
            const v = value ? byName.get(value) : undefined;
            return v ? localize(v.label, locale) || v.name : placeholder ?? t("cm.resultView.pickVariable");
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {groups.length === 0 ? (
          <SelectItem value="" disabled>{t("cm.resultView.noVars")}</SelectItem>
        ) : (
          groups.map((g) => (
            <SelectGroup key={g.kind}>
              <SelectLabel>{t(g.key)}</SelectLabel>
              {g.vars.map((v) => (
                <SelectItem key={v.name} value={v.name}>
                  {localize(v.label, locale) || v.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

// ── Multi-select dropdown + reorderable picked chips ────────────
// `value` is the ordered list of picked variable names; [] means "all" (default
// order). Picking adds to the end; dragging the chips reorders. onReorder fires
// when the user manually arranges, so the consumer can force sort = "as defined".
export function VariableMultiSelect({
  variables,
  value,
  onChange,
  onReorder,
  className,
}: BaseProps & { value: string[]; onChange: (names: string[]) => void; onReorder?: () => void }) {
  const { t, locale } = useLocale();
  const groups = KIND_GROUPS.map((g) => ({ ...g, vars: variables.filter((v) => v.kind === g.kind) })).filter(
    (g) => g.vars.length > 0,
  );
  const allNames = variables.map((v) => v.name);
  const byName = new Map(variables.map((v) => [v.name, v]));
  // Materialize the effective picked list (explicit names, or all in catalog order).
  const picked = value.length ? value : allNames;
  const isSelected = (name: string) => picked.includes(name);
  const toggle = (name: string) => {
    const next = picked.includes(name) ? picked.filter((n) => n !== name) : [...picked, name];
    onChange(next.length === allNames.length && next.every((n, i) => n === allNames[i]) ? [] : next);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = picked.indexOf(String(active.id));
    const to = picked.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onChange(arrayMove(picked, from, to));
    onReorder?.();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              className={cn(
                "flex h-8 shrink-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap outline-none focus-visible:border-ring",
                className ?? "w-40",
              )}
            />
          }
        >
          <span className="truncate">
            {value.length === 0 ? t("cm.resultView.allVariables") : `${value.length} ${t("cm.resultView.selected")}`}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 w-56 overflow-auto">
          {groups.length === 0 ? (
            <DropdownMenuItem disabled>{t("cm.resultView.noVars")}</DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem closeOnClick={false} onClick={() => onChange([])}>
                <span className="text-[0.78rem] font-medium">{t("cm.resultView.selectAll")}</span>
              </DropdownMenuItem>
              {groups.map((g) => (
                <DropdownMenuGroup key={g.kind}>
                  <DropdownMenuLabel className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                    {t(g.key)}
                  </DropdownMenuLabel>
                  {g.vars.map((v) => (
                    <DropdownMenuCheckboxItem
                      key={v.name}
                      checked={isSelected(v.name)}
                      closeOnClick={false}
                      onCheckedChange={() => toggle(v.name)}
                    >
                      {localize(v.label, locale) || v.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Picked chips — drag to reorder (sets the variable order). */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={picked} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap items-center gap-1">
            {picked.map((name) => (
              <VarChip
                key={name}
                id={name}
                label={localize(byName.get(name)?.label ?? { en: name, ru: "", kk: "" }, locale) || name}
                onRemove={() => toggle(name)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function VarChip({ id, label, onRemove }: { id: string; label: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <span
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded-md border bg-foreground px-1.5 py-0.5 text-[0.7rem] text-background",
        isDragging && "opacity-60 shadow",
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing" aria-label="Drag to reorder">
        <GripVertical className="h-3 w-3 opacity-70" />
      </button>
      {label}
      <button onClick={onRemove} className="opacity-70 hover:opacity-100" aria-label="Remove">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
