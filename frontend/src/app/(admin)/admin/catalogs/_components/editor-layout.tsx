"use client";

import { useLocale } from "@/lib/locale-context";

interface Props {
  editor: React.ReactNode;
  preview: React.ReactNode;
}

export function EditorLayout({ editor, preview }: Props) {
  const { t } = useLocale();

  return (
    <div
      className="relative mx-auto"
      style={{
        /* Break out of parent max-w-[1100px] but stay centered with own max-width */
        width: "calc(100vw - 280px)",
        maxWidth: "1400px",
        marginLeft: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <div className="grid gap-8" style={{ gridTemplateColumns: "minmax(320px, 1fr) minmax(320px, 1fr)" }}>
        {/* Left: Editor */}
        <div className="min-w-0">
          <div className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider mb-3 sticky top-16 bg-[#fafafa] py-2 z-10">
            {t("cm.methodic.profession.editor")}
          </div>
          <div className="space-y-4">{editor}</div>
          <div className="mt-6 pb-8">
            <button className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors">
              {t("common.save")}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="min-w-0 max-w-[900px]">
          <div className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider mb-3 sticky top-16 bg-[#fafafa] py-2 z-10">
            {t("cm.methodic.profession.preview")}
          </div>
          <div className="bg-gray-50/80 rounded-2xl border border-gray-100 p-6 overflow-hidden">
            {preview}
          </div>
        </div>
      </div>
    </div>
  );
}
