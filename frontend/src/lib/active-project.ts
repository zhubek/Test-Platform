"use client";

// Ambient "active project" scope for project-scoped library data (blocks and
// catalog groups). It is set by ProjectProvider (admin only) whenever the
// project picked in the menu changes; the block/group fetchers read it to filter
// their list calls and to tag newly-created rows. The public site has no
// ProjectProvider, so the scope stays undefined there and reads are unscoped
// (all projects) — which keeps /explore working across projects.

let activeProjectId: string | undefined;
const listeners = new Set<() => void>();

export function getActiveProjectId(): string | undefined {
  return activeProjectId;
}

export function setActiveProjectScope(id: string | undefined): void {
  const norm = id || undefined;
  if (norm === activeProjectId) return;
  activeProjectId = norm;
  listeners.forEach((l) => l());
}

/** Subscribe to scope changes (caches use this to invalidate + refetch). */
export function onActiveProjectChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
