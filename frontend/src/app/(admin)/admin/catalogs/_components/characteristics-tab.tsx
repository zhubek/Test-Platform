"use client";

// The Characteristics tab — lists characteristic groups (RIASEC, Skills, …)
// from the dc backend. Names are plain single-language strings.

import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  createCharacteristicGroup,
  loadAllCharacteristicGroups,
  type DcCharacteristicGroup,
} from "@/lib/dc-catalogs";

export function CharacteristicsTab() {
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<DcCharacteristicGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllCharacteristicGroups(true)
      .then(setGroups)
      .catch((err) => console.error("Failed to load characteristic groups:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return groups;
    const q = search.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description ?? "").toLowerCase().includes(q) ||
        g.characteristics.some((c) => c.name.toLowerCase().includes(q)),
    );
  }, [search, groups]);

  async function handleAdd() {
    try {
      const created = await createCharacteristicGroup();
      window.location.href = `/admin/catalogs/characteristics/${created.id}`;
    } catch (err) {
      console.error("Failed to create:", err);
    }
  }

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search characteristics…"
          className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Add group
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((cg) => (
            <a
              key={cg.id}
              href={`/admin/catalogs/characteristics/${cg.id}`}
              className="group block rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-teal-200 hover:shadow-md"
            >
              <div className="mb-3 flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: (cg.color ?? "#6b7280") + "14" }}
                >
                  <div className="h-3 w-3 rounded-full" style={{ background: cg.color ?? "#6b7280" }} />
                </div>
                <div>
                  <h3 className="text-[0.92rem] font-semibold text-gray-900 transition-colors group-hover:text-teal-700">
                    {cg.name || <span className="italic text-gray-400">Untitled group</span>}
                  </h3>
                  <p className="mt-0.5 text-[0.72rem] text-gray-400">
                    {cg.characteristics.length} characteristics
                  </p>
                </div>
              </div>

              {cg.description && (
                <p className="mb-3 line-clamp-2 text-[0.78rem] text-gray-500">{cg.description}</p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {cg.characteristics.map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full bg-gray-50 px-2 py-0.5 text-[0.65rem] font-medium text-gray-500"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </a>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-gray-400">No results.</div>
          )}
        </div>
      )}
    </>
  );
}
