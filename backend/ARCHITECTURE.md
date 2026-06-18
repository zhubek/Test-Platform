# Backend Architecture Instructions (NestJS + Prisma)

These are the conventions for this backend. Follow them for every module. The goal is a
codebase where access rules, state lifecycles, and processes are each findable in one
predictable place, so the architecture stays legible without reading every line.

---

## Core principles (apply these everywhere)

1. **Organize by feature, not by technical type.** Everything about one entity lives in
   that entity's folder (`posts/`). Do NOT create top-level `controllers/`, `services/`,
   `guards/` folders that group by type. The only exception is genuinely cross-cutting
   code, which goes in `common/`.

2. **Separate mechanism from configuration.** Generic algorithms/engines are written ONCE
   in `common/` and never duplicated. Each module supplies only its specifics
   (its rules, its relationship logic, its loader).

3. **Declarative rules live in their own files; imperative logic lives in services.**
   The access policy and transition map are declarative documents. The processes that
   execute (transactions, side-effects) live in the service.

4. **Identity always comes from the verified JWT, never from a request parameter or body.**

5. **Entity data for authorization is always loaded fresh from the DB**, never trusted from
   client-supplied fields.

6. **Avoid the word "guard" for anything that is not a NestJS Guard.** Transition
   conditions are called `condition`, not `guard`.

---

## Folder structure

```
src/
  main.ts                  # global ValidationPipe, global interceptors/filters registered here
  app.module.ts            # wires modules + global providers

  common/                  # CROSS-CUTTING — written once, used by all modules
    access/
      types.ts             # AccessRule, Relationship, Condition (generic types)
      resolver.ts          # evaluatePolicy() + buildCapabilities() (the generic engine)
      create-access.ts     # createAccess() factory (produces can/capabilitiesFor per entity)
      access.guard.ts      # the ONE generic authorization guard
      registry.ts          # entity-name -> { load, can } lookup
    guards/
      jwt-auth.guard.ts    # authentication (sets req.user from token)
    interceptors/
      logging.interceptor.ts
      transform.interceptor.ts
    filters/
      http-exception.filter.ts
    decorators/
      require-access.decorator.ts   # @RequireAccess(entity, action)

  prisma/
    prisma.service.ts

  <feature>/               # ONE folder per entity, e.g. posts/, invoices/
    <feature>.controller.ts    # handlers (route methods) — thin, delegate to service
    <feature>.service.ts       # processes: transactions, state-change pipelines, side-effects
    <feature>.module.ts        # wiring
    <feature>.policy.ts        # ACCESS RULES — the editable control document
    <feature>.access.ts        # relationshipTo + createAccess() call (per-entity specifics)
    <feature>.transitions.ts   # legal state moves + entity-data conditions (ONLY if it has a lifecycle)
    <feature>.types.ts         # entity/user types (mostly derived from Prisma)
    dto/
      create-<feature>.dto.ts  # input shape + class-validator decorators
      update-<feature>.dto.ts
```

---

## What goes in each file (per feature module)

### `<feature>.policy.ts` — THE control document (edited often)
- A declarative array of access rules. Each rule: `action`, `allowedStates`, `allow`
  (relationship -> roles), optional `conditions` (functions reading entity fields),
  optional `reason`.
- `allow` is keyed by relationship: `owner` / `team` / `org` / `none`.
- Multiple rules per action are allowed; access is granted if ANY rule fully matches (OR).
- Also export the list of all actions for this entity (e.g. `POST_ACTIONS`).
- Conditions here read ENTITY fields but represent PERMISSION qualifiers (e.g.
  "editable only within 24h"). Keep them pure (no I/O).
- This file contains NO algorithm — only declarations.

### `<feature>.access.ts` — per-entity specifics (write-once)
- `relationshipTo(entity, user)`: computes `owner`/`team`/`org`/`none` from THIS entity's
  fields. This is the one genuinely entity-specific piece of logic.
- Calls the generic `createAccess()` factory, passing: the policy, the actions list,
  `relationshipTo`, the loader (`prisma.<entity>.findUnique`), and the entity name.
- Exports `can` and `capabilitiesFor` (produced by the factory) and the `PostCapabilities`
  type (`ReturnType<typeof capabilitiesFor>`).
- Do NOT reimplement the evaluation algorithm here — it lives in `common/`.

### `<feature>.transitions.ts` — lifecycle (ONLY if the entity has ordered states)
- A `Record<Status, Transition[]>` map: from each state, which states are reachable.
- Each transition may have an optional `condition: (entity) => boolean` and a `failReason`
  for entity-DATA preconditions (e.g. "can't publish unless `prepared`").
- These conditions are about ENTITY READINESS, independent of the user (failure -> 422,
  not 403). User-dependent rules go in the policy instead.
- Export `canTransition(from, to, entity)` returning `{ ok: boolean; reason?: string }`.
- This file has NO database access and NO side-effects — pure rules only.
- SKIP this file entirely if the entity's statuses have no ordering rules.

### `<feature>.service.ts` — processes (where state-change logic lives)
- Business logic and transactions. The state-change pipeline (`changeStatus`) lives here:
  1. check `canTransition(...)` -> throw 400/422 with reason if it fails
  2. (authorization already handled by the guard via `@RequireAccess`)
  3. run the DB transaction (`prisma.$transaction`) for anything that must be atomic
  4. AFTER commit, emit events for side-effects (email, etc.) — never inside the transaction
- Side-effects go through an event emitter (NestJS `EventEmitter`), not inline, so the
  service doesn't accumulate every downstream concern.

### `<feature>.controller.ts` — handlers
- Thin route methods that delegate to the service.
- Tag each route with `@RequireAccess('<entity>', '<action>')`.
- Apply guards: `@UseGuards(JwtAuthGuard, AccessGuard)`.
- The guard loads the entity and stashes it on the request; handlers reuse it
  (e.g. `req.loadedEntity`) instead of re-fetching.
- GET endpoints return `{ data, capabilities }` where capabilities come from
  `capabilitiesFor(entity, user)`.

### `dto/*.dto.ts` — input shapes
- Plain classes with `class-validator` decorators (`@IsString()`, etc.).
- Validation runs automatically via the GLOBAL `ValidationPipe` (registered in `main.ts`).
- For per-field input transformation, use `@Transform()` from `class-transformer` ON the
  DTO field — do NOT write custom pipes for this.

---

## Common (write once, never per-entity)

### `common/access/resolver.ts`
- `evaluatePolicy(policy, action, entity, user, relationshipFn, now?)`: pure function,
  returns boolean. The single decision algorithm for all entities.
- `buildCapabilities(policy, actions, entity, user, relationshipFn)`: runs evaluatePolicy
  across all actions, returns `{ ...flags, availableActions }`.

### `common/access/create-access.ts`
- `createAccess(config)` factory: takes `{ policy, actions, relationshipTo, load, name }`,
  returns `{ can, capabilitiesFor }`, and registers `{ load, can }` in the registry under
  `name`. This removes per-entity boilerplate.

### `common/access/access.guard.ts` — the ONE authorization guard
- Reads `{ entity, action }` from the `@RequireAccess` metadata.
- Gets `user` from `req.user` (set by JwtAuthGuard).
- Looks up the entity's `{ load, can }` from the registry by name.
- Loads the entity, stashes it on `req.loadedEntity`, calls `can(action, entity, user)`.
- Throws `ForbiddenException` (403) if denied. Throws `NotFoundException` if entity missing.

### `common/access/registry.ts`
- A name -> `{ load, can }` lookup. Each module registers itself via `createAccess`.
- (Acceptable to swap for NestJS dependency-injection later; the registry is the simple
  readable version.)

### Global registrations (in code, not folders)
- `main.ts`: `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))`.
- `app.module.ts`: global logging + transform interceptors, global exception filter.

---

## Logging

Three logging concerns, three mechanisms — each goes in its natural place. All logging is
cross-cutting, so it lives in `common/`, written once, applied globally. Do NOT add logging
code into individual handlers/services.

```
common/
  logging/
    logging.interceptor.ts     # request duration (every request)
    all-exceptions.filter.ts   # every error
  prisma/                       # (or alongside prisma.service.ts)
    prisma.service.ts          # query timing via Prisma log events
```

### 1) Log every error → global exception filter
A `@Catch()` filter catches ALL thrown errors app-wide. This is the single place every
error is logged, so nothing slips through unlogged. 5xx as error (with stack), 4xx as warn.
Register globally via `APP_FILTER` (app.module.ts) or `app.useGlobalFilters()` (main.ts).

### 2) Log time spent per request → interceptor
An interceptor wraps the whole handler: start a timer before, read it after. Register
globally via `APP_INTERCEPTOR` or `app.useGlobalInterceptors()`.

### 3) Log database query time → Prisma log events
Query timing is a Prisma-layer concern, NOT an interceptor. Enable Prisma's `query`/`error`
log events and log each query's duration at `debug` level (so it can be filtered in prod).
Consider logging only SLOW queries in production (e.g. `if (e.duration > 100)`).

### Logging conventions
- Use NestJS's built-in `Logger` for consistency. A structured logger (pino) can be swapped
  in later — keep call sites the same so the swap is localized.
- Errors: ALL via the exception filter (one place, nothing unlogged). 5xx with stack, 4xx warn.
- Never log secrets, tokens, passwords, or full request bodies with personal data. Prisma
  query params can contain sensitive values — redact or keep query logging non-production.
- Request timing → interceptor. Query timing → Prisma events. Errors → filter. Never mix
  these into handlers/services.

---

## Authorization model (how the pieces relate)

Three SEPARATE questions, three homes, three error codes — never merge them:

| Question | Where | Failure |
|---|---|---|
| Is this user authenticated? | JwtAuthGuard | 401 |
| May THIS USER do this action? (role/state/ownership/org) | policy via `can()` | 403 |
| Is this state move structurally legal + is the entity DATA ready? | `transitions.ts` | 400 / 422 |

- The policy (`can`) and the frontend capabilities (`capabilitiesFor`) call the SAME
  underlying engine, so they can never disagree.
- `capabilitiesFor` is for UI rendering only. The guard's `can()` is the real enforcement.
  Both must exist; the guard is what actually protects the endpoint.

---

## Testing (required, since the implementation won't be read line-by-line)

- For each entity's policy, generate EXHAUSTIVE tests over (role × state × relationship ×
  conditions), asserting `can()` matches the policy — INCLUDING denial cases.
- Explicitly test that disallowed actions are refused at the API (403), not merely hidden in UI.
- Test the service's state-change pipeline by asserting OUTCOMES (status changed, atomic
  fields set, events emitted), not by reading the implementation.
- Tests for `can()` must be pure (no DB) — feed loaded objects, assert the boolean.

---

## Adding a new entity (the repeatable recipe)

1. Create `<feature>/` folder.
2. Write `<feature>.policy.ts` (the rules) and `<feature>.types.ts`.
3. Write `<feature>.access.ts`: a `relationshipTo` + a `createAccess()` call.
4. If the entity has ordered states, write `<feature>.transitions.ts`.
5. Write `<feature>.service.ts` (logic/transactions) and `<feature>.controller.ts`
   (handlers tagged with `@RequireAccess`).
6. Write DTOs in `dto/`.
7. Write the exhaustive policy tests.
8. `common/` is NEVER modified when adding an entity.

---

## Hard rules (do not violate)

- Never take `userId`/identity from a parameter or body — only from the verified token.
- Never trust client-supplied entity fields for authorization — load from the DB.
- Never reimplement the evaluation algorithm per entity — use the common engine/factory.
- Never merge the policy file into the access engine — it stays a standalone editable doc.
- Never put user-dependent rules in transitions, or entity-readiness rules in the policy.
- Never name a non-NestJS-Guard thing "guard" (use "condition").
- Never run side-effects inside the DB transaction — emit events after commit.
- Never log errors inside handlers/services — let the global exception filter log them.
- Never log secrets, tokens, passwords, or sensitive request/query data.
