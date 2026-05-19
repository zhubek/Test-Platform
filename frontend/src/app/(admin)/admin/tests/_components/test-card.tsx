"use client";

import { Archive, Copy, ArchiveRestore } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { localize } from "@/lib/localized";
import type { ContentTest } from "../../_components/mock-data";

type TestListItem = Pick<ContentTest, "id" | "name" | "description" | "color" | "status" | "createdAt" | "updatedAt" | "duration"> & { questionCount: number; archived?: boolean };

interface Props {
  test: TestListItem;
  onArchive?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function TestCard({ test, onArchive, onDuplicate }: Props) {
  const { t, locale } = useLocale();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all group">
      <a href={`/admin/tests/${test.id}`} className="block">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: test.color + "14" }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: test.color }}
              />
            </div>
            <div>
              <h3 className="text-[0.92rem] font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                {localize(test.name, locale)}
              </h3>
              <p className="text-[0.72rem] text-gray-400 mt-0.5">
                {t("common.updated")} {test.updatedAt}
              </p>
            </div>
          </div>
          <span
            className={
              "text-[0.65rem] font-semibold px-2 py-0.5 rounded-full " +
              (test.archived
                ? "bg-gray-100 text-gray-500"
                : test.status === "published"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700")
            }
          >
            {test.archived
              ? t("cm.tests.showArchived")
              : test.status === "published"
                ? t("cm.status.published")
                : t("cm.status.draft")}
          </span>
        </div>

        <p className="text-[0.78rem] text-gray-500 line-clamp-2 mb-3">
          {localize(test.description, locale)}
        </p>
      </a>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[0.72rem] text-gray-400">
          <span>{test.duration} {t("cm.general.durationUnit")}</span>
          <span className="w-1 h-1 rounded-full bg-gray-200" />
          <span>{test.questionCount} {t("common.questions")}</span>
          <span className="w-1 h-1 rounded-full bg-gray-200" />
          <span>{t("common.created")} {test.createdAt}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicate?.(test.id)}
            title={t("cm.tests.duplicate")}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onArchive?.(test.id)}
            title={test.archived ? t("cm.tests.unarchive") : t("cm.tests.archive")}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {test.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
