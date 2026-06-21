"use client";

// Result drawer for the admin/org-admin Results tab — renders the test's
// DESIGNED RESULT blocks (the same ones the holder sees) against a student's
// real attempt variables. Everything comes from the attempt payload (blocks are
// included by /organizations/:id/attempts), so it needs no extra fetch and works
// for both the super-admin and org-admin sessions.

import { useEffect } from "react";
import { X } from "lucide-react";
import type { OrgAttempt } from "@/lib/backend";
import { resultScopeFromStored } from "@/lib/test-runtime";
import { resolveInstanceProps } from "@/lib/question-instances";
import { ViewRenderer } from "@/lib/view-renderer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OrgResultDrawer({ attempt, onClose }: { attempt: OrgAttempt | null; onClose: () => void }) {
  const open = attempt !== null;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const blocks = attempt?.test.blocks ?? [];
  const scope = attempt
    ? resultScopeFromStored(attempt.variables, attempt.test.advancedParams?.calc ?? [], {
        user: { name: attempt.license.holder?.name ?? attempt.license.holder?.login ?? "" },
      })
    : {};
  const when = attempt?.endTime ?? attempt?.updatedTime ?? null;
  const date = when ? new Date(when).toLocaleString() : "";
  const student = attempt?.license.holder?.name ?? attempt?.license.holder?.login ?? "";

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-black/25 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-[101] flex w-[460px] max-w-[92vw] flex-col bg-card shadow-xl shadow-black/10 transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h3 className="text-[0.95rem] font-semibold text-foreground">{attempt?.test.name?.en ?? "Results"}</h3>
            <p className="mt-0.5 text-[0.72rem] text-muted-foreground">
              {student}
              {date ? ` · ${date}` : ""}
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 px-6 py-5">
          {blocks.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              This test has no result page configured.
            </p>
          ) : (
            <div className="space-y-5">
              {blocks.map((inst) => {
                const block = inst.block;
                if (!block) return null;
                const types = new Map(block.props.map((p) => [p.name, p.type as never]));
                const resolved = resolveInstanceProps({ id: inst.id, props: inst.props }, types, scope);
                return <ViewRenderer key={inst.id} template={block.html} props={resolved} />;
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
