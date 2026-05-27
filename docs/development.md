# Development

## Running the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000  (Turbopack)
```

Scripts (`frontend/package.json`):

| Script | Does |
|--------|------|
| `npm run dev` | Next dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |

There is **no backend to run** for the current app — all data is in-memory (see [data-layer.md](./data-layer.md)). The repo-root `README.md` documents the intended NestJS + Postgres + Prisma backend for when it's wired in.

## Type-check

```bash
cd frontend
npx tsc --noEmit
```

This is the fastest correctness gate; run it before committing. It catches the kinds of issues the mock-data refactors are prone to (shape mismatches between editor params and display params).

## Conventions

- **Component placement:** page-specific components go in `src/app/<route>/_components/` (the `_` keeps them out of routing); shared components in `src/components/`; UI primitives in `src/components/ui/`.
- **Localized content** uses `Localized` + `localize()`/`l()`; **UI chrome** uses `t("key")`. See [i18n.md](./i18n.md).
- **Inside Catalogs**, import the local teal-styled `localized-input`/`localized-textarea`, not the top-level shadcn ones.
- **Numbers, not text, for scores.** Answer choice values are numeric; human-readable text is reconstructed at result time via variable value translations.
- **Editor-shaped vs display-shaped params.** When seeding catalog/profession data, match the shape the *editor* expects, not the public display blob (see the Education-editor gotcha in [catalogs.md](./catalogs.md)).

## Known dev-environment gotchas (Turbopack on WSL2)

These bit us during development and are worth knowing:

1. **Slow first compile per route.** Turbopack cold-compiles each route on first visit; some dynamic routes (e.g. `/admin/catalogs/professions/[id]`) can take **30–60s** the first time, which looks like a hang. It is not — once compiled, the route serves in well under a second. Subsequent visits and other profession IDs reuse the compiled route.

2. **Out-of-memory kills.** On a memory-constrained machine (e.g. 8 GB WSL2), running **two Next dev servers at once** (this project + another) can exceed RAM; the Linux OOM killer then silently kills a `next-server` process — the dev server just dies with no error in its log, and any in-flight request hangs. Symptoms: requests return connection-refused (`HTTP 000`), or a `ChunkLoadError` / stale-HMR WebSocket errors in the browser after a near-OOM recompile.
   - **Mitigations:** close other heavy dev servers; give Node more heap (`NODE_OPTIONS="--max-old-space-size=4096" npm run dev`); or raise the WSL2 memory cap via a `.wslconfig` file and restart WSL.

3. **Stale chunks after recompile.** If the dev server recompiles (or restarts) while a browser tab is open, that tab may request a chunk hash that no longer exists → `ChunkLoadError`. A hard refresh (Ctrl+Shift+R) fixes it.

If the app seems "stuck," first check the dev server is actually alive (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`) before assuming a code bug.

## Verifying UI changes

Because the app is a stateful authoring tool, type-checking and unit logic don't prove a feature *works*. Exercise it in a browser: open the relevant constructor, drive the golden path and an edge case, and watch the browser console for runtime errors (e.g. the "Objects are not valid as a React child" class of bug that a shape mismatch produces).
