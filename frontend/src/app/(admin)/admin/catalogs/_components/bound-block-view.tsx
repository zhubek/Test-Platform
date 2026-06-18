"use client";

// Renders one template block instance against an item's binding scope:
// merge defaults + template props → substitute { $bind } values from the
// scope → resolve catalog refs → ViewRenderer.

import { blockSampleProps, type Block } from "@/lib/backend";
import { type BlockResolver } from "@/lib/view-renderer";
import { ResolvedViewRenderer } from "@/lib/resolved-view";
import { substituteBindings } from "@/lib/prop-bindings";

export function blockDefaults(block: Block): Record<string, unknown> {
  return blockSampleProps(block);
}

export function BoundBlockView({
  block,
  instanceProps,
  overrides,
  scope,
  resolveBlock,
}: {
  block: Block;
  instanceProps: Record<string, unknown>;
  /** Per-item prop overrides — literal values that win over the template. */
  overrides?: Record<string, unknown>;
  scope: Record<string, unknown> | null;
  resolveBlock?: BlockResolver;
}) {
  const merged = { ...blockDefaults(block), ...instanceProps, ...(overrides ?? {}) };
  const props = substituteBindings(merged, scope ?? {}, block.props);
  return <ResolvedViewRenderer template={block.html} props={props} resolveBlock={resolveBlock} />;
}
