"use client";

// Block editor — loads one block, hands it to the authoring surface, and
// persists edits back to the backend.

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchBlock, fetchBlocks, updateBlock, type Block } from "@/lib/backend";
import { blocksToResolver } from "@/lib/view-renderer";
import { BlockEditor, type BlockEditorSave } from "../_components/block-editor";
import { Button } from "@/components/ui/button";

// Two surfaces: Test blocks vs. the shared Views library (dashboard/result/catalog).
const surfaceLabel = (type: Block["type"]) => (type === "TEST" ? "Test" : "View");

export default function BlockEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [block, setBlock] = useState<Block | null>(null);
  const [library, setLibrary] = useState<Block[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // The preview resolves nested <block name="…"> embeds against the library.
  const resolveBlock = useMemo(() => blocksToResolver(library), [library]);

  useEffect(() => {
    fetchBlock(id)
      .then(setBlock)
      .catch((e) => setError(String(e)));
    fetchBlocks()
      .then(setLibrary)
      .catch((e) => console.error("Failed to load block library:", e));
  }, [id]);

  const onSave = async (patch: BlockEditorSave) => {
    setSaving(true);
    setSavedAt(null);
    try {
      const updated = await updateBlock(id, patch);
      setBlock(updated);
      setSavedAt("Saved");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/blocks")} className="mt-3">
          Back to blocks
        </Button>
      </div>
    );
  }

  if (!block) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading block…</div>;
  }

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push("/admin/blocks")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {surfaceLabel(block.type)}
            </span>
            {savedAt && <span className="text-xs text-teal-600">{savedAt}</span>}
          </div>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight">Edit block</h1>
        </div>
      </div>

      <BlockEditor block={block} onSave={onSave} saving={saving} resolveBlock={resolveBlock} />
    </>
  );
}
