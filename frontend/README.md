# Test-Platform — Frontend

Next.js 16 (App Router, Turbopack) app for authoring tests, result views, and dashboards, plus a public student site and an admin Catalogs hub. Runs frontend-only on in-memory mock data.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`. Type-check with `npx tsc --noEmit`.

## Documentation

Full developer docs are in [`../docs/`](../docs/README.md). Quick links:

- [Architecture](../docs/architecture.md)
- [Data layer](../docs/data-layer.md)
- [i18n](../docs/i18n.md)
- [Test constructor](../docs/test-constructor.md)
- [Result & dashboard](../docs/result-and-dashboard.md)
- [Catalogs](../docs/catalogs.md)
- [Components](../docs/components.md)
- [Development & gotchas](../docs/development.md)

## Project structure

```
src/
├── app/
│   ├── (admin)/        Content-author UI: tests, catalogs, dashboards, access
│   ├── (orgadmin)/     Organization-staff UI
│   └── (public)/       Student site: take tests, results, profession explorer
├── components/         Shared components + ui/ (Base UI primitives)
└── lib/                Mock data layer, i18n, catalog logic, helpers
```

> **Note:** this is a forked Next.js project — its conventions and APIs may differ from stock create-next-app. See `AGENTS.md`.
