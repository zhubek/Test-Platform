"use client";

import { useState, useRef } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, GripVertical, GitBranch } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
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
import { Switch } from "@/components/ui/switch";
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
  onSectionReorder: (from: number, to: number) => void;
  onQuestionMove: (fromSi: number, fromQi: number, toSi: number, toQi: number) => void;
  onOpenQuestion: (si: number, qi: number) => void;
  activePage: number;
  onActivePageChange: (si: number) => void;
}

// dnd id helpers — sections, questions, and section drop-zones share one
// DndContext, so each kind gets a distinct id prefix.
const SID = (id: string) => `s:${id}`;
const QID = (id: string) => `q:${id}`;
const DROP = (id: string) => `drop:${id}`;

export function BlocksList({
  sections,
  onSectionUpdate,
  onSectionDelete,
  onSectionAdd,
  onQuestionAdd,
  onQuestionUpdate,
  onQuestionDelete,
  onQuestionReorder,
  onSectionReorder,
  onQuestionMove,
  onOpenQuestion,
  activePage,
  onActivePageChange,
}: Props) {
  const { t, locale } = useLocale();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [logicPage, setLogicPage] = useState<number | null>(null);
  const [activeDrag, setActiveDrag] = useState<{ kind: "section" | "question"; label: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Locate a question by its dnd id across all sections.
  const findQuestion = (qid: string) => {
    for (let si = 0; si < sections.length; si++) {
      const qi = sections[si].questions.findIndex((q) => QID(q.id) === qid);
      if (qi !== -1) return { si, qi };
    }
    return null;
  };
  const sectionIndexById = (sid: string) => sections.findIndex((s) => SID(s.id) === sid);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const isQuestionId = (id: string) => id.startsWith("q:");
  const isSectionId = (id: string) => id.startsWith("s:");
  const isDropId = (id: string) => id.startsWith("drop:");

  // Restrict collisions to the dragged item's own kind. Sections use
  // closestCenter (reliable for a vertical list); questions use pointerWithin
  // (needed so cross-section drop-zones register under the cursor).
  const collisionDetection: CollisionDetection = (args) => {
    const activeId = String(args.active.id);
    if (isSectionId(activeId)) {
      const secOnly = args.droppableContainers.filter((c) => isSectionId(String(c.id)));
      return closestCenter({ ...args, droppableContainers: secOnly });
    }
    const qOnly = args.droppableContainers.filter((c) => isQuestionId(String(c.id)) || isDropId(String(c.id)));
    const hits = pointerWithin({ ...args, droppableContainers: qOnly });
    return hits.length ? hits : closestCenter({ ...args, droppableContainers: qOnly });
  };

  // Auto-expand a collapsed section when a question is dragged over it.
  const expandTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (isSectionId(id)) {
      const s = sections[sectionIndexById(id)];
      setActiveDrag({ kind: "section", label: localize(s?.title ?? { en: "", ru: "", kk: "" }, locale) || "Page" });
    } else {
      const loc2 = findQuestion(id);
      const q = loc2 && sections[loc2.si].questions[loc2.qi];
      setActiveDrag({ kind: "question", label: (q && localize(q.text, locale)) || "Untitled question" });
    }
  };

  // Cross-section live move: while dragging a question over another section,
  // relocate it so the lists visibly update. Auto-expand collapsed targets.
  const handleDragOver = (e: DragOverEvent) => {
    const activeId = String(e.active.id);
    if (!isQuestionId(activeId) || !e.over) return;
    const overId = String(e.over.id);

    const src = findQuestion(activeId);
    if (!src) return;

    // Determine the destination section + index from what we're over.
    let toSi: number;
    let toQi: number;
    if (isDropId(overId)) {
      const secId = overId.slice("drop:".length);
      toSi = sections.findIndex((s) => s.id === secId);
      if (toSi === -1) return;
      // collapsed → auto-expand after a short hover, drop at end
      if (collapsed.has(secId)) {
        if (!expandTimers.current[secId]) {
          expandTimers.current[secId] = setTimeout(() => {
            setCollapsed((prev) => {
              const n = new Set(prev);
              n.delete(secId);
              return n;
            });
            delete expandTimers.current[secId];
          }, 400);
        }
        return;
      }
      toQi = sections[toSi].questions.length;
    } else {
      const dst = findQuestion(overId);
      if (!dst) return;
      toSi = dst.si;
      toQi = dst.qi;
    }
    if (toSi === src.si) return; // same-section sorting handled on drag end
    onQuestionMove(src.si, src.qi, toSi, toQi);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    Object.values(expandTimers.current).forEach(clearTimeout);
    expandTimers.current = {};
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    if (isSectionId(activeId)) {
      const from = sectionIndexById(activeId);
      const to = sectionIndexById(overId);
      if (from !== -1 && to !== -1) onSectionReorder(from, to);
      return;
    }

    // Question: finalize ordering within its (possibly new) section.
    const src = findQuestion(activeId);
    if (!src) return;
    if (isQuestionId(overId)) {
      const dst = findQuestion(overId);
      if (dst && dst.si === src.si && dst.qi !== src.qi) {
        onQuestionReorder(src.si, src.qi, dst.qi);
      }
    }
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDrag(null)}
      >
        <SortableContext items={sections.map((s) => SID(s.id))} strategy={verticalListSortingStrategy}>
          {sections.map((section, si) => (
            <SortableSection
              key={section.id}
              section={section}
              si={si}
              isActive={si === activePage}
              isCollapsed={collapsed.has(section.id)}
              isEditingTitle={editingTitle === si}
              locale={locale}
              tr={t}
              questionTypes={QUESTION_TYPES}
              onToggle={() => toggle(section.id)}
              onStartEditTitle={() => setEditingTitle(editingTitle === si ? null : si)}
              onSectionUpdate={(p) => onSectionUpdate(si, p)}
              onSectionDelete={() => onSectionDelete(si)}
              onOpenLogic={() => setLogicPage(si)}
              onActivate={() => onActivePageChange(si)}
              onQuestionAdd={() => onQuestionAdd(si)}
              onQuestionUpdate={(qi, p) => onQuestionUpdate(si, qi, p)}
              onQuestionDelete={(qi) => onQuestionDelete(si, qi)}
              onOpenQuestion={(qi) => onOpenQuestion(si, qi)}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeDrag && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-sm shadow-lg",
                activeDrag.kind === "section" && "font-semibold",
              )}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{activeDrag.label}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
            <DialogTitle>Page settings</DialogTitle>
            <DialogDescription>
              {logicPage !== null &&
                `Settings for "${loc(sections[logicPage].title, locale) || `Page ${logicPage + 1}`}".`}
            </DialogDescription>
          </DialogHeader>
          {logicPage !== null && (
            <div className="space-y-4">
              {/* Randomize question order — maps to SurveyJS questionOrder: "random" */}
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[0.78rem] font-medium text-foreground">
                    Randomize question order
                  </p>
                  <p className="text-[0.66rem] text-muted-foreground">
                    Shuffle this page&apos;s questions for each respondent.
                  </p>
                </div>
                <Switch
                  checked={!!sections[logicPage].randomizeQuestions}
                  onCheckedChange={(checked) =>
                    onSectionUpdate(logicPage, { randomizeQuestions: checked })
                  }
                />
              </div>

              {/* Page visibility */}
              <div className="space-y-1.5">
                <label className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Visible if
                </label>
                <Input
                  value={sections[logicPage].visibleIf ?? ""}
                  onChange={(e) =>
                    onSectionUpdate(logicPage, { visibleIf: e.target.value || undefined })
                  }
                  placeholder="{q1} = 'yes'"
                  className="font-mono"
                />
                <p className="text-[0.7rem] text-muted-foreground">
                  Show this page only when the condition is true. Leave empty to always show — e.g.{" "}
                  <code className="font-mono">{"{age} >= 18"}</code>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sortable section card ───────────────────────────────────────
function SortableSection({
  section,
  si,
  isActive,
  isCollapsed,
  isEditingTitle,
  locale,
  tr,
  questionTypes,
  onToggle,
  onStartEditTitle,
  onSectionUpdate,
  onSectionDelete,
  onOpenLogic,
  onActivate,
  onQuestionAdd,
  onQuestionUpdate,
  onQuestionDelete,
  onOpenQuestion,
}: {
  section: Section;
  si: number;
  isActive: boolean;
  isCollapsed: boolean;
  isEditingTitle: boolean;
  locale: string;
  tr: (key: string) => string;
  questionTypes: { value: QuestionType; key: string }[];
  onToggle: () => void;
  onStartEditTitle: () => void;
  onSectionUpdate: (p: Partial<Section>) => void;
  onSectionDelete: () => void;
  onOpenLogic: () => void;
  onActivate: () => void;
  onQuestionAdd: () => void;
  onQuestionUpdate: (qi: number, p: Partial<{ type: QuestionType }>) => void;
  onQuestionDelete: (qi: number) => void;
  onOpenQuestion: (qi: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: SID(section.id),
  });
  // The whole section's question area is a droppable target (so empty / just-
  // expanded sections can receive a dragged question). Distinct id from the
  // section's own sortable id.
  const { setNodeRef: setDropRef } = useDroppable({ id: DROP(section.id) });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border",
        isActive ? "border-primary/40" : "border-border",
        isDragging && "opacity-50",
      )}
    >
      {/* Page header */}
      <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          title="Drag to reorder section"
          aria-label="Drag to reorder section"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {isEditingTitle ? (
          <LocalizedInput
            value={section.title}
            onChange={(v) => onSectionUpdate({ title: v })}
            placeholder="Page title"
            className="flex-1"
          />
        ) : (
          <button onClick={onActivate} className="flex-1 text-left text-sm font-semibold">
            <span className="text-muted-foreground">{si + 1}. </span>
            {localize(section.title, locale) || `Page ${si + 1}`}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({section.questions.length})
            </span>
          </button>
        )}
        <Button variant="ghost" size="icon-xs" onClick={onStartEditTitle} title="Rename page">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onOpenLogic}
          className={cn((section.visibleIf?.trim() || section.randomizeQuestions) && "text-primary")}
          title="Page settings (logic & randomization)"
        >
          <GitBranch className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onSectionDelete}
          className="text-muted-foreground hover:text-red-500"
          title="Delete page"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Questions */}
      {!isCollapsed && (
        <div ref={setDropRef} className="space-y-1.5 p-2.5">
          <SortableContext
            items={section.questions.map((q) => QID(q.id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="min-h-[8px] space-y-1.5">
              {section.questions.map((q, qi) => (
                <SortableQuestionRow
                  key={q.id}
                  id={QID(q.id)}
                  label={
                    localize(q.text, locale) || (
                      <span className="italic text-muted-foreground">Untitled question</span>
                    )
                  }
                  type={q.type}
                  questionTypes={questionTypes}
                  tr={tr}
                  onOpen={() => onOpenQuestion(qi)}
                  onTypeChange={(v) => onQuestionUpdate(qi, { type: v })}
                  onDelete={() => onQuestionDelete(qi)}
                />
              ))}
              {section.questions.length === 0 && (
                <p className="py-2 text-center text-[0.72rem] text-muted-foreground">
                  Drop a question here or add one.
                </p>
              )}
            </div>
          </SortableContext>
          <Button
            variant="ghost"
            size="sm"
            onClick={onQuestionAdd}
            className="text-muted-foreground hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Add question
          </Button>
        </div>
      )}
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
        isDragging && "z-10 border-primary/60 opacity-50",
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
