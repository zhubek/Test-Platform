"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { fetchTests, createTest, type TestRow } from "@/lib/api";

export default function TestsPage() {
  const { t, locale } = useLocale();
  const loc = locale as "en" | "ru" | "kz";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tests, setTests] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests()
      .then(setTests)
      .catch((err) => console.error("Failed to load tests:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = tests;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const name = t.name[loc] || t.name.en || "";
        const desc = t.desc?.[loc] || t.desc?.en || "";
        return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      });
    }
    if (statusFilter) list = list.filter((t) => t.state === statusFilter);
    return list;
  }, [tests, search, statusFilter, loc]);

  async function handleAdd() {
    try {
      const created = await createTest({
        name: { en: "", ru: "", kz: "" },
        state: "draft",
      });
      window.location.href = `/admin/tests/${created.id}`;
    } catch (err) {
      console.error("Failed to create test:", err);
    }
  }

  return (
    <>
      <div className="animate-fade-in flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {t("cm.tests.heading")}
        </h1>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[0.82rem] font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("cm.tests.create")}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("cm.filters.searchTests")}
          className="flex-1 max-w-md rounded-lg border border-gray-200 pl-3 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
        >
          <option value="">{t("cm.methodic.filter.allPopularity")}</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Test cards */}
      {loading ? (
        <div className="text-center py-10 text-sm text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((test, i) => (
            <a
              key={test.id}
              href={`/admin/tests/${test.id}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all group animate-stagger-fade-up"
              style={{ "--stagger-index": i } as React.CSSProperties}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: (test.color ?? "#6b7280") + "14" }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: test.color ?? "#6b7280" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[0.92rem] font-semibold text-gray-900 group-hover:text-teal-700 transition-colors truncate">
                    {test.name[loc] || test.name.en || "—"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={
                        "text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full uppercase " +
                        (test.state === "published"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500")
                      }
                    >
                      {test.state}
                    </span>
                    {test.category && (
                      <span className="text-[0.65rem] text-gray-400">
                        {test.category}
                      </span>
                    )}
                    {test.duration && (
                      <span className="text-[0.65rem] text-gray-400">
                        {test.duration} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {test.desc && (test.desc[loc] || test.desc.en) && (
                <p className="text-[0.78rem] text-gray-500 line-clamp-2">
                  {test.desc[loc] || test.desc.en}
                </p>
              )}
            </a>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-sm text-gray-400">
              {t("cm.filters.noResults")}
            </div>
          )}
        </div>
      )}
    </>
  );
}
