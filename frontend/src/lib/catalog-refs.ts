"use client";

// Catalog references for block props: instead of pasting data into a block, a
// prop can point INTO a data catalog — `{ $catalog: "univerPrograms", ids: [...] }`
// — and the renderer receives the resolved, template-shaped entities. Backed by
// the dc_ backend; `$catalog` is the dc group NAME, ids are dc item ids.
// Resolution follows the relations stored in item `params` (program →
// universities → cities), so referencing a program brings its universities.

import { useEffect, useMemo, useState } from "react";
import { localize, type Localized } from "@/lib/localized";
import {
  getGroups,
  itemValuesRecord,
  loadGroupItems,
  loadGroups,
  useDcGroups,
  type DcItem,
} from "./dc-catalogs";

type Locale = string;

export interface CatalogRef {
  $catalog: string;
  ids: (string | number)[];
}

export function isCatalogRef(v: unknown): v is CatalogRef {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as CatalogRef).$catalog === "string" &&
    Array.isArray((v as CatalogRef).ids)
  );
}

/** Catalog choices for ref props — every dc group. */
export function useCatalogRefOptions(): { value: string; label: string }[] {
  const groups = useDcGroups();
  return useMemo(
    () => groups.map((g) => ({ value: g.name, label: g.info?.label ?? g.name })),
    [groups],
  );
}

export function catalogRefLabel(name: string): string {
  const g = getGroups().find((x) => x.name === name);
  return g?.info?.label ?? name;
}

/** Id + display name pairs for the reference picker control. */
export async function fetchCatalogEntityOptions(
  catalog: string,
): Promise<{ id: string; name: Localized }[]> {
  await loadGroups();
  return (await loadGroupItems(catalog)).map((r) => ({ id: r.id, name: r.title }));
}

// ── Template shaping ─────────────────────────────────────────────────────────
// Entities become flat, template-friendly objects (localized fields resolved to
// plain strings) matching what the catalog view blocks expect.

const UNT_YEARS = [2021, 2022, 2023, 2024, 2025];

/* eslint-disable @typescript-eslint/no-explicit-any */

const loc = (v: unknown, locale: Locale): string =>
  v && typeof v === "object" ? localize(v as Localized, locale) : ((v as string) ?? "");

async function cityNameById(locale: Locale): Promise<(id: unknown) => string> {
  const cities = await loadGroupItems("cities");
  const byId = new Map(cities.map((c) => [c.id, c.title]));
  return (id) => {
    const t = typeof id === "string" ? byId.get(id) : undefined;
    return t ? localize(t, locale) : "";
  };
}

function shapeUniversity(
  uni: DcItem,
  cityName: (id: unknown) => string,
  locale: Locale,
  grant?: boolean,
) {
  const p: any = uni.params ?? {};
  return {
    id: uni.id,
    name: localize(uni.title, locale),
    city: cityName(p.cityId),
    type: p.type === "private" ? "private" : "public",
    ...(grant !== undefined ? { grant } : {}),
    address: loc(p.address, locale),
    email: p.email ?? "",
    phone: p.phone ?? "",
    website: p.website ?? "",
  };
}

function shapeCollege(col: DcItem, cityName: (id: unknown) => string, locale: Locale, duration?: unknown) {
  const p: any = col.params ?? {};
  return {
    id: col.id,
    name: localize(col.title, locale),
    city: cityName(p.cityId),
    type: p.type ?? "",
    ...(duration !== undefined ? { duration: loc(duration, locale) } : {}),
    address: loc(p.address, locale),
    email: p.email ?? "",
    phone: p.phone ?? "",
    website: p.website ?? "",
  };
}

export async function resolveCatalogRef(ref: CatalogRef, locale: Locale): Promise<unknown[]> {
  const items = await loadGroupItems(ref.$catalog);
  const byId = new Map(items.map((r) => [r.id, r]));
  const picked = ref.ids
    .map((id) => (typeof id === "string" ? byId.get(id) : undefined))
    .filter((r): r is DcItem => !!r);

  switch (ref.$catalog) {
    case "cities":
      return picked.map((c) => ({ id: c.id, name: localize(c.title, locale) }));

    case "universities": {
      const cityName = await cityNameById(locale);
      return picked.map((u) => shapeUniversity(u, cityName, locale));
    }

    case "colleges": {
      const cityName = await cityNameById(locale);
      return picked.map((c) => shapeCollege(c, cityName, locale));
    }

    // Program → its universities (with the per-link grant flag) → cities.
    case "univerPrograms": {
      const [unis, cityName] = await Promise.all([loadGroupItems("universities"), cityNameById(locale)]);
      const uniById = new Map(unis.map((u) => [u.id, u]));
      return picked.map((prog) => {
        const p: any = prog.params ?? {};
        return {
          id: prog.id,
          title: localize(prog.title, locale),
          code: p.code ?? "",
          subjects: loc(p.subjects, locale),
          untPoints: p.points ?? {},
          unt: (p.points?.general ?? []).map((points: number, i: number) => ({
            year: UNT_YEARS[i] ?? 2021 + i,
            points,
          })),
          universities: ((p.universities ?? []) as { id: string; grant: boolean }[])
            .map((link) => {
              const uni = uniById.get(link.id);
              return uni ? shapeUniversity(uni, cityName, locale, link.grant) : null;
            })
            .filter(Boolean),
        };
      });
    }

    // Program → its colleges (with per-link duration) → cities.
    case "collegePrograms": {
      const [cols, cityName] = await Promise.all([loadGroupItems("colleges"), cityNameById(locale)]);
      const colById = new Map(cols.map((c) => [c.id, c]));
      return picked.map((prog) => {
        const p: any = prog.params ?? {};
        return {
          id: prog.id,
          title: localize(prog.title, locale),
          code: p.code ?? "",
          colleges: ((p.colleges ?? []) as { id: string; duration?: unknown }[])
            .map((link) => {
              const col = colById.get(link.id);
              return col ? shapeCollege(col, cityName, locale, link.duration) : null;
            })
            .filter(Boolean),
        };
      });
    }

    case "professions":
      return picked.map((pr) => ({
        id: pr.id,
        name: localize(pr.title, locale),
        code: ((pr.params as any)?.code as string) ?? "",
        desc: pr.description ? localize(pr.description, locale) : "",
      }));

    // Custom groups: generic shape — title/description + extra values by name.
    default:
      return picked.map((r) => ({
        id: r.id,
        name: localize(r.title, locale),
        description: r.description ? localize(r.description, locale) : "",
        ...Object.fromEntries(
          Object.entries(itemValuesRecord(r)).map(([k, v]) => [k, localize(v, locale)]),
        ),
      }));
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// A prop value that's a Localized map (every key a language code, every value a
// string) is a translated text leaf — collapse it to the active language.
function isLocalizedMap(o: unknown): o is Localized {
  if (!o || typeof o !== "object" || Array.isArray(o)) return false;
  const keys = Object.keys(o);
  return (
    keys.length > 0 &&
    keys.every(
      (k) =>
        /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(k) &&
        typeof (o as Record<string, unknown>)[k] === "string",
    )
  );
}

// Recursively collapse every Localized-map leaf to a plain string — so text
// inside arrays/objects (e.g. a json prop's records) is localized too, while the
// surrounding structure is left intact ("translate leaves, not the tree").
function localizeDeep(v: unknown, locale: Locale): unknown {
  if (isLocalizedMap(v)) return localize(v, locale);
  if (Array.isArray(v)) return v.map((x) => localizeDeep(x, locale));
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = localizeDeep(x, locale);
    return out;
  }
  return v;
}

/** Localize every prop value, recursing into nested arrays/objects. */
function localizeProps(props: Record<string, unknown>, locale: Locale): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) out[k] = localizeDeep(v, locale);
  return out;
}

/** Resolve every ref-valued prop; non-ref values pass through untouched. */
export async function resolveRefProps(
  props: Record<string, unknown>,
  locale: Locale,
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  await Promise.all(
    Object.entries(props).map(async ([k, v]) => {
      out[k] = isCatalogRef(v) ? await resolveCatalogRef(v, locale) : v;
    }),
  );
  return out;
}

/**
 * Hook: props with catalog refs swapped for resolved entity data. While a
 * resolution is in flight, ref props render as empty lists (never as the raw
 * `{ $catalog }` marker objects).
 */
export function useResolvedProps(
  props: Record<string, unknown>,
  locale: Locale,
): Record<string, unknown> {
  const key = JSON.stringify(props);
  const hasRefs = useMemo(() => Object.values(props).some(isCatalogRef), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  // Localizing text leaves is synchronous; only refs need an async fetch.
  const localized = useMemo(() => localizeProps(props, locale), [key, locale]); // eslint-disable-line react-hooks/exhaustive-deps
  const [resolved, setResolved] = useState<{ key: string; props: Record<string, unknown> } | null>(null);

  useEffect(() => {
    if (!hasRefs) return;
    let alive = true;
    resolveRefProps(props, locale).then((r) => {
      if (alive) setResolved({ key, props: localizeProps(r, locale) });
    });
    return () => {
      alive = false;
    };
  }, [key, locale, hasRefs]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasRefs) return localized;
  if (resolved && resolved.key === key) return resolved.props;
  // Stale or pending: blank out refs so templates see lists, not markers.
  return Object.fromEntries(
    Object.entries(localized).map(([k, v]) => [k, isCatalogRef(props[k]) ? [] : v]),
  );
}
