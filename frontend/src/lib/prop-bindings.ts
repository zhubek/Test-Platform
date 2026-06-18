// Data bindings for block props in catalog group PAGE TEMPLATES. Instead of a
// literal value, a template prop can hold `{ $bind: "path.into.item" }` — the
// value comes from the rendered item's scope (see catalog-items.ts). Ref-typed
// props bound to an id (or id list) are wrapped back into the catalog the
// block author declared, so `{ $bind: "education.specializations" }` becomes
// `{ $catalog: "univer-programs", ids: [...] }` at render time.

import { resolvePath } from "./view-expr";
import { isCatalogRef } from "./catalog-refs";

export interface PropBinding {
  $bind: string;
}

export function isPropBinding(v: unknown): v is PropBinding {
  return !!v && typeof v === "object" && typeof (v as PropBinding).$bind === "string";
}

interface PropDefLike {
  name: string;
  type: string;
  value: unknown;
}

/** Replace every bound prop with the value at its path in the item scope. */
export function substituteBindings(
  props: Record<string, unknown>,
  scope: Record<string, unknown>,
  defs: PropDefLike[],
): Record<string, unknown> {
  const defByName = new Map(defs.map((d) => [d.name, d]));
  return Object.fromEntries(
    Object.entries(props).map(([name, v]) => {
      if (!isPropBinding(v)) return [name, v];
      const raw = resolvePath(v.$bind.trim(), scope);
      const def = defByName.get(name);
      if (def?.type === "ref") {
        const declared = isCatalogRef(def.value) ? def.value.$catalog : "universities";
        const ids = Array.isArray(raw)
          ? raw.filter((n): n is number => typeof n === "number")
          : typeof raw === "number"
            ? [raw]
            : [];
        return [name, { $catalog: declared, ids }];
      }
      return [name, raw ?? ""];
    }),
  );
}
