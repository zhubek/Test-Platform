"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { useContentLocale } from "../../../_components/edit-language";
import { EditorLayout } from "../../../_components/editor-layout";
import {
  fetchCharacteristicTypes,
  fetchProfessionCharacteristics,
  createProfessionCharacteristic,
  updateProfessionCharacteristic,
  deleteProfessionCharacteristic,
  type CharacteristicTypeRow,
  type CharacteristicRow,
  type ProfessionCharacteristicRow,
} from "@/lib/methodic-api";

interface Props {
  professionId: number;
}

export function CharacteristicsEditor({ professionId }: Props) {
  const { t } = useLocale();
  const loc = useContentLocale();

  const [charTypes, setCharTypes] = useState<CharacteristicTypeRow[]>([]);
  const [profChars, setProfChars] = useState<ProfessionCharacteristicRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCharacteristicTypes(),
      fetchProfessionCharacteristics(professionId),
    ])
      .then(([types, pcs]) => {
        setCharTypes(types);
        setProfChars(pcs);
      })
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [professionId]);

  // Group profChars by characteristicTypeId
  const grouped = useMemo(() => {
    const map = new Map<number, ProfessionCharacteristicRow[]>();
    for (const pc of profChars) {
      const arr = map.get(pc.characteristicTypeId) ?? [];
      arr.push(pc);
      map.set(pc.characteristicTypeId, arr);
    }
    return map;
  }, [profChars]);

  // Which type IDs are active (have at least one record)
  const activeTypeIds = useMemo(() => new Set(grouped.keys()), [grouped]);

  // Types not yet added
  const availableTypes = useMemo(
    () => charTypes.filter((ct) => !activeTypeIds.has(ct.id)),
    [charTypes, activeTypeIds],
  );

  // Add a characteristic type: create records for all its characteristics with level=0
  async function addType(ct: CharacteristicTypeRow) {
    try {
      const created = await Promise.all(
        ct.characteristics.map((c) =>
          createProfessionCharacteristic({
            professionId,
            characteristicTypeId: ct.id,
            characteristicId: c.id,
            level: 0,
          }),
        ),
      );
      setProfChars((prev) => [...prev, ...created]);
    } catch (err) {
      console.error("Failed to add type:", err);
    }
  }

  // Remove all records for a characteristic type
  async function removeType(typeId: number) {
    const toDelete = profChars.filter((pc) => pc.characteristicTypeId === typeId);
    try {
      await Promise.all(toDelete.map((pc) => deleteProfessionCharacteristic(pc.id)));
      setProfChars((prev) => prev.filter((pc) => pc.characteristicTypeId !== typeId));
    } catch (err) {
      console.error("Failed to remove type:", err);
    }
  }

  // Update a single record's level
  const updateLevel = useCallback(
    async (pcId: number, level: number) => {
      try {
        const updated = await updateProfessionCharacteristic(pcId, { level });
        setProfChars((prev) =>
          prev.map((pc) => (pc.id === pcId ? updated : pc)),
        );
      } catch (err) {
        console.error("Failed to update level:", err);
      }
    },
    [],
  );

  if (loading) {
    return <div className="text-center py-10 text-sm text-gray-400">Loading...</div>;
  }

  // Build ordered sections from charTypes that are active
  const activeSections = charTypes.filter((ct) => activeTypeIds.has(ct.id));

  return (
    <EditorLayout
      editor={
        <>
          {activeSections.map((ct) => {
            const records = grouped.get(ct.id) ?? [];
            return (
              <TypeSection
                key={ct.id}
                charType={ct}
                records={records}
                loc={loc}
                t={t}
                onUpdateLevel={updateLevel}
                onRemove={() => removeType(ct.id)}
              />
            );
          })}

          {/* Add type picker */}
          {availableTypes.length > 0 && (
            <div className="mt-4">
              <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">
                {t("cm.characteristics.addType")}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => addType(ct)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
                  >
                    + {ct.name[loc] || ct.name.en}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      }
      preview={
        <div className="space-y-5">
          {activeSections.map((ct) => {
            const records = grouped.get(ct.id) ?? [];
            return (
              <div key={ct.id}>
                <div
                  className="text-[0.68rem] font-bold uppercase tracking-wider mb-2"
                  style={{ color: ct.color ?? "#6b7280" }}
                >
                  {ct.name[loc] || ct.name.en}
                </div>
                <div className="space-y-1.5">
                  {records.map((pc) => {
                    const charName =
                      pc.characteristic?.name?.[loc] ||
                      pc.characteristic?.name?.en ||
                      `#${pc.characteristicId}`;
                    const barColor =
                      pc.level >= 70
                        ? "bg-emerald-500"
                        : pc.level >= 40
                          ? "bg-amber-400"
                          : "bg-red-400";
                    return (
                      <div key={pc.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-[120px] truncate shrink-0">
                          {charName}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${pc.level}%` }}
                          />
                        </div>
                        <span className="text-[0.65rem] text-gray-400 w-8 text-right">
                          {pc.level}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {activeSections.length === 0 && (
            <div className="text-xs text-gray-300 text-center py-8">
              {t("cm.characteristics.empty")}
            </div>
          )}
        </div>
      }
    />
  );
}

function TypeSection({
  charType,
  records,
  loc,
  t,
  onUpdateLevel,
  onRemove,
}: {
  charType: CharacteristicTypeRow;
  records: ProfessionCharacteristicRow[];
  loc: string;
  t: (key: string) => string;
  onUpdateLevel: (pcId: number, level: number) => void;
  onRemove: () => void;
}) {
  // Debounce level updates
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  function handleLevelChange(pcId: number, level: number) {
    // Clear previous timer for this record
    const prev = timers.current.get(pcId);
    if (prev) clearTimeout(prev);
    // Debounce the API call
    const timer = setTimeout(() => {
      onUpdateLevel(pcId, level);
      timers.current.delete(pcId);
    }, 500);
    timers.current.set(pcId, timer);
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: charType.color ?? "#6b7280" }}
          />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            {charType.name[loc] || charType.name.en}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
        >
          {t("common.remove")}
        </button>
      </div>

      <div className="space-y-1.5">
        {records.map((pc) => {
          const charName =
            pc.characteristic?.name?.[loc] ||
            pc.characteristic?.name?.en ||
            `#${pc.characteristicId}`;
          return (
            <CharLevelRow
              key={pc.id}
              label={charName}
              level={pc.level}
              onChange={(level) => handleLevelChange(pc.id, level)}
            />
          );
        })}
      </div>
    </div>
  );
}

function CharLevelRow({
  label,
  level: initialLevel,
  onChange,
}: {
  label: string;
  level: number;
  onChange: (level: number) => void;
}) {
  const [level, setLevel] = useState(initialLevel);

  function handleChange(val: number) {
    const clamped = Math.max(0, Math.min(100, val));
    setLevel(clamped);
    onChange(clamped);
  }

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2">
      <span className="text-xs text-gray-700 w-[130px] truncate shrink-0">
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={level}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-teal-500"
      />
      <input
        type="number"
        min={0}
        max={100}
        value={level}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-12 text-xs text-center text-gray-700 rounded border border-gray-200 px-1 py-0.5 outline-none focus:border-teal-400"
      />
    </div>
  );
}
