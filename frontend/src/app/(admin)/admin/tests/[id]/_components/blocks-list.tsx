"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, GripVertical, GitBranch } from "lucide-react";
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import { LocalizedInput } from "@/components/localized-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { localize as loc } from "@/lib/localized";
import type { Section, QuestionType } from "../../../_components/mock-data";

const QUESTION_TYPES: { value: QuestionType; key: string }[] = [
  { value: "single", key: "cm.question.type.single" },
  { value: "multiple", key: "cm.question.type.multiple" },
  { value: "dropdown", key: "cm.question.type.dropdown" },
  { value: "likert", key: "cm.question.type.likert" },
  { value: "rating", key: "cm.question.type.rating" },
  { value: "boolean", key: "cm.question.type.boolean" },
  { value: "imagepicker", key: "cm.question.type.imagepicker" },
];

interface Props {
  sections: Section[];
  onSectionUpdate: (si: number, partial: Partial<Section>) => void;
  onSectionDelete: (si: number) => void;
  onSectionAdd: () => void;
  onQuestionAdd: (si: number) => void;
  onQuestionUpdate: (si: number, qi: number, partial: Partial<{ type: QuestionType }>) => void;
  onQuestionDelete: (si: number, qi: number) => void;
  onQuestionReorder: (si: number, from: number, to: number) => void;
  onOpenQuestion: (si: number, qi: number) => void;
  activePage: number;
  onActivePageChange: (si: number) => void;
}

export function BlocksList({
  sections,
  onSectionUpdate,
  onSectionDelete,
  onSectionAdd,
  onQuestionAdd,
  onQuestionUpdate,
  onQuestionDelete,
  onQuestionReorder,
  onOpenQuestion,
  activePage,
  onActivePageChange,
}: Props) {
  const { t, locale } = useLocale();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [logicPage, setLogicPage] = useState<number | null>(null);
  // Drag-to-reorder questions within a section (dnd-kit). 8px activation
  // distance so clicks on the grip don't start a drag accidentally.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const toggle = (si: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(si) ? next.delete(si) : next.add(si);
      return next;
    });

  return (
    <div className="space-y-3">
      {sections.map((section, si) => {
        const isCollapsed = collapsed.has(si);
        return (
          <div
            key={section.id}
            className={cn(
              "rounded-lg border",
              si === activePage ? "border-primary/40" : "border-border",
            )}
          >
            {/* Page header */}
            <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
              <button onClick={() => toggle(si)} className="text-muted-foreground hover:text-foreground">
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {editingTitle === si ? (
                <LocalizedInput
                  value={section.title}
                  onChange={(v) => onSectionUpdate(si, { title: v })}
                  placeholder="Page title"
                  className="flex-1"
                />
              ) : (
                <button
                  onClick={() => onActivePageChange(si)}
                  className="flex-1 text-left text-sm font-semibold"
                >
                  <span className="text-muted-foreground">{si + 1}. </span>
                  {localize(section.title, locale) || `Page ${si + 1}`}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    ({section.questions.length})
                  </span>
                </button>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditingTitle(editingTitle === si ? null : si)}
                title="Rename page"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setLogicPage(si)}
                className={cn(section.visibleIf?.trim() && "text-primary")}
                title="Page logic (visible if)"
              >
                <GitBranch className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onSectionDelete(si)}
                className="text-muted-foreground hover:text-red-500"
                title="Delete page"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Questions */}
            {!isCollapsed && (
              <div className="space-y-1.5 p-2.5">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e: DragEndEvent) => {
                    const { active, over } = e;
                    if (!over || active.id === over.id) return;
                    const from = section.questions.findIndex((q) => q.id === active.id);
                    const to = section.questions.findIndex((q) => q.id === over.id);
                    if (from !== -1 && to !== -1) onQuestionReorder(si, from, to);
                  }}
                >
                  <SortableContext
                    items={section.questions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {section.questions.map((q, qi) => (
                        <SortableQuestionRow
                          key={q.id}
                          id={q.id}
                          label={
                            localize(q.text, locale) || (
                              <span className="italic text-muted-foreground">Untitled question</span>
                            )
                          }
                          type={q.type}
                          questionTypes={QUESTION_TYPES}
                          tr={t}
                          onOpen={() => onOpenQuestion(si, qi)}
                          onTypeChange={(v) => onQuestionUpdate(si, qi, { type: v })}
                          onDelete={() => onQuestionDelete(si, qi)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuestionAdd(si)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" /> Add question
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <Button
        variant="outline"
        onClick={onSectionAdd}
        className="h-auto w-full rounded-xl border-2 border-dashed py-3 text-muted-foreground hover:border-teal-300 hover:text-primary"
      >
        <Plus className="h-4 w-4" /> {t("cm.questions.addSection")}
      </Button>

      {/* Page logic dialog */}
      <Dialog open={logicPage !== null} onOpenChange={(o) => !o && setLogicPage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Page logic</DialogTitle>
            <DialogDescription>
              {logicPage !== null &&
                `Show "${loc(sections[logicPage].title, locale) || `Page ${logicPage + 1}`}" only when this condition is true. Leave empty to always show.`}
            </DialogDescription>
          </DialogHeader>
          {logicPage !== null && (
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Visible if
              </label>
              <Input
                autoFocus
                value={sections[logicPage].visibleIf ?? ""}
                onChange={(e) =>
                  onSectionUpdate(logicPage, { visibleIf: e.target.value || undefined })
                }
                placeholder="{q1} = 'yes'"
                className="font-mono"
              />
              <p className="text-[0.7rem] text-muted-foreground">
                e.g. <code className="font-mono">{"{age} >= 18"}</code> or{" "}
                <code className="font-mono">{"{q1} contains 'a'"}</code>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sortable question row (dnd-kit) ─────────────────────────────
function SortableQuestionRow({
  id,
  label,
  type,
  questionTypes,
  tr,
  onOpen,
  onTypeChange,
  onDelete,
}: {
  id: string;
  label: React.ReactNode;
  type: QuestionType;
  questionTypes: { value: QuestionType; key: string }[];
  tr: (key: string) => string;
  onOpen: () => void;
  onTypeChange: (type: QuestionType) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-md border bg-background px-2 py-1.5",
        isDragging && "z-10 border-primary/60 shadow-lg",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button onClick={onOpen} className="flex-1 truncate text-left text-sm hover:text-primary">
        {label}
      </button>
      <Select value={type} onValueChange={(v) => onTypeChange((v as QuestionType) ?? "single")}>
        <SelectTrigger size="sm" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {questionTypes.map((qt) => (
            <SelectItem key={qt.value} value={qt.value}>
              {tr(qt.key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={onOpen}>
        Edit
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onDelete}
        className="text-muted-foreground opacity-0 hover:text-red-500 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
