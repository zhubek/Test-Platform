"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { Breadcrumb } from "../../../_components/breadcrumb";
import { EditorLayout } from "../../_components/editor-layout";
import {
  fetchUniversity,
  updateUniversity,
  deleteUniversity,
  fetchCities,
  type UniversityRow,
  type UniversityParams,
  type CityRow,
  type Localized,
} from "@/lib/methodic-api";
import { LocalizedInput } from "../../_components/localized-input";
import { Mail, Phone, Globe } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

const emptyLocalized: Localized = { en: "", ru: "", kz: "" };

export default function UniversityEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numId = Number(id);
  const { locale, t } = useLocale();

  const [uni, setUni] = useState<UniversityRow | null>(null);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const uniRef = useRef(uni);
  uniRef.current = uni;

  useEffect(() => {
    Promise.all([fetchUniversity(numId), fetchCities()])
      .then(([u, c]) => {
        setUni(u);
        setCities(c);
      })
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [numId]);

  const save = useCallback(
    async (patch: Record<string, any>) => {
      setSaving(true);
      try {
        const updated = await updateUniversity(numId, patch);
        setUni(updated);
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setSaving(false);
      }
    },
    [numId],
  );

  const saveName = useCallback(() => {
    if (uniRef.current) save({ name: uniRef.current.name });
  }, [save]);

  const saveParams = useCallback(() => {
    if (uniRef.current) save({ params: uniRef.current.params ?? {} });
  }, [save]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this university?")) return;
    await deleteUniversity(numId);
    window.location.href = "/admin/catalogs#universities";
  }, [numId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (!uni) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-400">
        University not found
      </div>
    );
  }

  const p = uni.params ?? {};
  const name = uni.name[locale] || uni.name.en || "";
  const address: Localized =
    p.address && typeof p.address === "object"
      ? { en: (p.address as any).en || "", ru: (p.address as any).ru || "", kz: (p.address as any).kz || "" }
      : { en: typeof p.address === "string" ? p.address : "", ru: "", kz: "" };

  function updateParam(key: keyof UniversityParams, val: any) {
    if (!uni) return;
    const newParams = { ...uni.params, [key]: val || undefined };
    setUni({ ...uni, params: newParams });
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: t("cm.methodic.heading"), href: "/admin/catalogs" },
          {
            label: t("cm.methodic.tabs.universities"),
            href: "/admin/catalogs#universities",
          },
          { label: name || "—" },
        ]}
      />

      <EditorLayout
        editor={
          <div className="space-y-3">
            <Field label={t("cm.methodic.col.name")}>
              <div onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) saveName(); }}>
                <LocalizedInput
                  value={uni.name}
                  onChange={(val) => setUni({ ...uni, name: val })}
                  className={inputClass}
                />
              </div>
            </Field>
            <Field label={t("cm.methodic.col.city")}>
              <select
                value={uni.cityId ?? ""}
                onChange={(e) => {
                  const cityId = e.target.value ? Number(e.target.value) : null;
                  const city = cities.find((c) => c.id === cityId) ?? null;
                  setUni({ ...uni, cityId, city });
                  save({ cityId });
                }}
                className={inputClass}
              >
                <option value="">— {t("cm.methodic.col.city")} —</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[locale] || c.name.en}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("cm.methodic.col.type")}>
              <select
                value={uni.type ?? "public"}
                onChange={(e) => {
                  const newType = e.target.value;
                  setUni({ ...uni, type: newType });
                  save({ type: newType });
                }}
                className={inputClass}
              >
                <option value="public">{t("cm.methodic.type.public")}</option>
                <option value="private">{t("cm.methodic.type.private")}</option>
              </select>
            </Field>

            <Divider />

            <Field label={t("cm.methodic.field.address")}>
              <div onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) saveParams(); }}>
                <LocalizedInput
                  value={address}
                  onChange={(val) => updateParam("address", val)}
                  className={inputClass}
                />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("cm.methodic.field.email")}>
                <input
                  type="text"
                  value={p.email ?? ""}
                  onChange={(e) => updateParam("email", e.target.value)}
                  onBlur={saveParams}
                  className={inputClass}
                />
              </Field>
              <Field label={t("cm.methodic.field.phone")}>
                <input
                  type="text"
                  value={p.phone ?? ""}
                  onChange={(e) => updateParam("phone", e.target.value)}
                  onBlur={saveParams}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label={t("cm.methodic.field.website")}>
              <input
                type="text"
                value={p.website ?? ""}
                onChange={(e) => updateParam("website", e.target.value)}
                onBlur={saveParams}
                className={inputClass}
              />
            </Field>

            <Divider />

            <div className="grid grid-cols-3 gap-3">
              <Field label={t("cm.methodic.field.instagram")}>
                <input
                  type="text"
                  value={p.instagram ?? ""}
                  onChange={(e) => updateParam("instagram", e.target.value)}
                  onBlur={saveParams}
                  className={inputClass}
                />
              </Field>
              <Field label={t("cm.methodic.field.facebook")}>
                <input
                  type="text"
                  value={p.facebook ?? ""}
                  onChange={(e) => updateParam("facebook", e.target.value)}
                  onBlur={saveParams}
                  className={inputClass}
                />
              </Field>
              <Field label={t("cm.methodic.field.youtube")}>
                <input
                  type="text"
                  value={p.youtube ?? ""}
                  onChange={(e) => updateParam("youtube", e.target.value)}
                  onBlur={saveParams}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label={t("cm.methodic.field.photo")}>
              <input
                type="text"
                value={p.photo ?? ""}
                onChange={(e) => updateParam("photo", e.target.value)}
                onBlur={saveParams}
                className={inputClass + " max-w-xs"}
              />
            </Field>

            <Divider />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400">
                {saving ? "Saving..." : ""}
              </span>
              <button
                onClick={handleDelete}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Delete university
              </button>
            </div>
          </div>
        }
        preview={<UniversityPreview uni={uni} locale={locale} t={t} />}
      />
    </>
  );
}

function UniversityPreview({
  uni,
  locale,
  t,
}: {
  uni: UniversityRow;
  locale: string;
  t: (key: string) => string;
}) {
  const loc = locale as "en" | "ru" | "kz";
  const name = uni.name[loc] || uni.name.en || "";
  const p = uni.params ?? {};
  const cityName = uni.city?.name[loc] || uni.city?.name.en || "";
  const address =
    p.address && typeof p.address === "object"
      ? (p.address as any)[loc] || (p.address as any).en || ""
      : typeof p.address === "string"
        ? p.address
        : "";

  return (
    <div className="max-w-sm">
      <div className="w-full h-[100px] bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center rounded-t-2xl overflow-hidden">
        {p.photo && (p.photo.startsWith("http") || p.photo.startsWith("/")) ? (
          <img src={p.photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[2.2rem]">{p.photo || "\u{1F3EB}"}</span>
        )}
      </div>

      <div className="bg-white rounded-b-2xl border border-t-0 border-black/[0.04] p-5">
        <div className="text-[0.95rem] font-bold text-gray-900 mb-0.5">{name || "—"}</div>
        <div className="text-xs text-gray-400 mb-0.5">{cityName}</div>

        <div className="flex gap-2 mt-2 mb-3">
          {uni.type && (
            <span
              className={
                "text-xs font-semibold px-2 py-0.5 rounded-md uppercase " +
                (uni.type === "public" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800")
              }
            >
              {t(`cm.methodic.type.${uni.type}`)}
            </span>
          )}
        </div>

        {address && (
          <div className="text-xs text-gray-500 leading-snug mb-3">{address}</div>
        )}

        {(p.email || p.phone || p.website) && (
          <div className="mb-3">
            <div className="text-[0.6875rem] font-bold text-gray-400 uppercase tracking-wider mb-2">Contacts</div>
            <div className="flex flex-col gap-1.5">
              {p.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-blue-600 truncate">{p.email}</span>
                </div>
              )}
              {p.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {p.phone}
                </div>
              )}
              {p.website && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-blue-600 truncate">{p.website.replace("https://", "")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(p.instagram || p.facebook || p.youtube) && (
          <div>
            <div className="text-[0.6875rem] font-bold text-gray-400 uppercase tracking-wider mb-2">Social</div>
            <div className="flex gap-2">
              {p.instagram && (
                <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noopener noreferrer" title="Instagram" className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-colors hover:bg-gray-100">
                  <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#E4405F" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}
              {p.facebook && (
                <a href={`https://facebook.com/${p.facebook}`} target="_blank" rel="noopener noreferrer" title="Facebook" className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-colors hover:bg-gray-100">
                  <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {p.youtube && (
                <a href={`https://youtube.com/@${p.youtube}`} target="_blank" rel="noopener noreferrer" title="YouTube" className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-colors hover:bg-gray-100">
                  <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-gray-100 my-1" />;
}
