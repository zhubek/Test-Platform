"use client";

// "Parameters" tab of an open catalog group. Three sections:
//  · Visibility — is the group public, and if so which page is its card view
//  · Extra variables — typed slots (first five = table columns); when public,
//    each can be flagged as a filter
//  · Characteristics — attach characteristic groups; every item then gets a
//    numeric variable per characteristic on its General tab.
// All persist to the dc backend.

import { useEffect, useState } from "react";
import { setExtraSlots, useExtraSlotDefs, type ExtraSlot } from "@/lib/catalog-extras";
import {
  attachedCharacteristicGroups,
  getAllCharacteristicGroups,
  groupByName,
  loadAllCharacteristicGroups,
  loadGroups,
  saveGroupCharacteristics,
  saveGroupSettings,
  useDcGroups,
  type DcCharacteristicGroup,
  type DcGroup,
} from "@/lib/dc-catalogs";
import { localize } from "@/lib/localized";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExtraSlotsEditor } from "./extra-slots-editor";

export function CatalogParameters({ catalog }: { catalog: string }) {
  useDcGroups(); // subscribe so isPublic changes propagate to the sections below
  const group = groupByName(catalog);
  const isPublic = group?.isPublic ?? false;

  return (
    <div className="max-w-xl space-y-10">
      <VisibilitySection group={group} />
      <ExtraVariablesSection catalog={catalog} isPublic={isPublic} />
      <CharacteristicsSection catalog={catalog} />
    </div>
  );
}

// ── Visibility ───────────────────────────────────────────────────────────────
function VisibilitySection({ group }: { group?: DcGroup }) {
  const { locale, t } = useLocale();
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  const isPublic = group?.isPublic ?? false;
  const cardPageId = group?.cardPageId ?? null;
  const pages = group?.pages ?? [];

  const flash = () => {
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const persist = async (patch: { isPublic?: boolean; cardPageId?: string | null }) => {
    if (!group) return;
    setSaving(true);
    try {
      await saveGroupSettings(group.id, patch);
      flash();
    } catch (e) {
      console.error("Failed to save visibility:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t("admin.catCfg.visibility")}</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          {t("admin.catCfg.visibilityHint")}
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={isPublic}
          disabled={!group || saving}
          onChange={(e) =>
            persist(
              // Turning public off also clears the card page (it's only meaningful when public).
              e.target.checked ? { isPublic: true } : { isPublic: false, cardPageId: null },
            )
          }
          className="h-4 w-4 accent-teal-600"
        />
        <span className="text-sm font-medium text-gray-900">{t("admin.catCfg.publicCatalog")}</span>
      </label>

      {isPublic && (
        <div className="mt-4">
          <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-gray-400">
            {t("admin.catCfg.cardViewPage")}
          </label>
          {pages.length === 0 ? (
            <p className="text-xs text-gray-300">
              {t("admin.catCfg.noPagesForCard")}
            </p>
          ) : (
            <select
              value={cardPageId ?? ""}
              disabled={saving}
              onChange={(e) => persist({ cardPageId: e.target.value || null })}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">{t("admin.catCfg.selectAPage")}</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {localize(p.pageName, locale) || t("admin.catCfg.untitledPage")}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {savedNote && <span className="mt-3 block text-xs text-teal-600">{t("admin.common.saved")}</span>}
    </div>
  );
}

// ── Extra variables ──────────────────────────────────────────────────────────
function ExtraVariablesSection({ catalog, isPublic }: { catalog: string; isPublic: boolean }) {
  const { t } = useLocale();
  const saved = useExtraSlotDefs(catalog);
  const [draft, setDraft] = useState<ExtraSlot[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  const effective = draft ?? saved;
  const dirty =
    draft !== null &&
    (draft.length !== saved.length ||
      draft.some(
        (s, i) =>
          s.varName !== saved[i]?.varName ||
          s.type !== saved[i]?.type ||
          s.filterable !== saved[i]?.filterable,
      ));

  const save = async () => {
    if (draft === null) return;
    setSaving(true);
    try {
      await setExtraSlots(catalog, draft);
      setDraft(null);
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 2000);
    } catch (e) {
      console.error("Failed to save parameters:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-8">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t("admin.catCfg.extraVariables")}</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          {t("admin.catCfg.extraVariablesHint")}
          {isPublic && " " + t("admin.catCfg.extraVariablesFilterHint")}
        </p>
      </div>

      <ExtraSlotsEditor value={effective} onChange={setDraft} showFilterable={isPublic} />

      <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          {saving ? t("admin.common.saving") : t("admin.catCfg.saveParameters")}
        </Button>
        {savedNote && <span className="text-xs text-teal-600">{t("admin.common.saved")}</span>}
        {dirty && !savedNote && <span className="text-xs text-gray-400">{t("admin.catCfg.unsavedChanges")}</span>}
      </div>
    </div>
  );
}

// ── Characteristics ──────────────────────────────────────────────────────────
function CharacteristicsSection({ catalog }: { catalog: string }) {
  const { t } = useLocale();
  useDcGroups(); // keep attachments in sync
  const [all, setAll] = useState<DcCharacteristicGroup[]>(getAllCharacteristicGroups());
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    loadAllCharacteristicGroups()
      .then(setAll)
      .catch((e) => console.error("Failed to load characteristic groups:", e));
  }, []);

  const attachedIds = new Set(attachedCharacteristicGroups(catalog).map((g) => g.id));
  const effective = draft ?? attachedIds;
  const dirty =
    draft !== null &&
    (draft.size !== attachedIds.size || [...draft].some((id) => !attachedIds.has(id)));

  const toggle = (id: string) => {
    const next = new Set(effective);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDraft(next);
  };

  const save = async () => {
    if (draft === null) return;
    setSaving(true);
    try {
      const g = groupByName(catalog) ?? (await loadGroups()).find((x) => x.name === catalog);
      if (g) await saveGroupCharacteristics(g.id, [...draft]);
      setDraft(null);
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 2000);
    } catch (e) {
      console.error("Failed to save characteristics:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-8">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t("admin.catCfg.characteristics")}</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          {t("admin.catCfg.characteristicsHint")}
        </p>
      </div>

      {all.length === 0 ? (
        <p className="text-xs text-gray-300">{t("admin.catCfg.noCharacteristicGroups")}</p>
      ) : (
        <div className="space-y-1.5">
          {all.map((cg) => {
            const checked = effective.has(cg.id);
            return (
              <label
                key={cg.id}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
                  checked ? "border-teal-300 bg-teal-50/40" : "border-gray-200 hover:bg-gray-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(cg.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-teal-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: cg.color ?? "#6b7280" }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {cg.name}
                    </span>
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {cg.characteristics.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-medium text-gray-500"
                      >
                        {c.name}
                      </span>
                    ))}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          {saving ? t("admin.common.saving") : t("admin.catCfg.saveCharacteristics")}
        </Button>
        {savedNote && <span className="text-xs text-teal-600">{t("admin.common.saved")}</span>}
        {dirty && !savedNote && <span className="text-xs text-gray-400">{t("admin.catCfg.unsavedChanges")}</span>}
      </div>
    </div>
  );
}
