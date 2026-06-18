"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { useContentLocale } from "../../../_components/edit-language";
import { EditorLayout } from "../../../_components/editor-layout";
import { LocalizedInput } from "../../../_components/localized-input";
import type { ContentData, VideoData } from "@/app/professions/_components/mock-data";
import { localize } from "@/lib/localized";
import type { Localized } from "@/lib/localized";
import { l } from "@/lib/localized";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

const emptyData: ContentData = { videos: [] };

interface Props {
  data: ContentData | null;
}

export function ContentEditor({ data: initial }: Props) {
  const { t } = useLocale();
  const loc = useContentLocale();

  const [videos, setVideos] = useState<VideoData[]>(
    (initial ?? emptyData).videos.map((v) => ({
      ...v,
      title: { ...v.title },
      description: { ...v.description },
    }))
  );

  function addVideo() {
    setVideos((prev) => [
      ...prev,
      {
        id: `vid-${Date.now()}`,
        title: l("", "", ""),
        description: l("", "", ""),
        image: "",
        youtubeUrl: "",
      },
    ]);
  }

  function updateVideo(index: number, patch: Partial<VideoData>) {
    setVideos((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v))
    );
  }

  function removeVideo(index: number) {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <EditorLayout
      editor={
        <>
          {videos.map((video, vi) => (
            <div
              key={video.id}
              className="mb-4 bg-white rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  #{vi + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeVideo(vi)}
                  className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">
                    {t("cm.methodic.profession.content.title")}
                  </label>
                  <LocalizedInput
                    value={video.title}
                    onChange={(val) => updateVideo(vi, { title: val })}
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">
                    {t("cm.methodic.profession.content.description")}
                  </label>
                  <LocalizedInput
                    value={video.description}
                    onChange={(val) => updateVideo(vi, { description: val })}
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">
                    {t("cm.methodic.profession.content.image")}
                  </label>
                  <input
                    type="text"
                    value={video.image}
                    onChange={(e) => updateVideo(vi, { image: e.target.value })}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-medium text-gray-500 mb-1">
                    {t("cm.methodic.profession.content.youtubeUrl")}
                  </label>
                  <input
                    type="text"
                    value={video.youtubeUrl}
                    onChange={(e) => updateVideo(vi, { youtubeUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addVideo}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            + {t("cm.methodic.profession.content.addVideo")}
          </button>
        </>
      }
      preview={<VideoListPreview videos={videos} locale={loc} />}
    />
  );
}

function getYoutubeId(url: string): string | null {
  const m =
    url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/) ;
  return m ? m[1] : null;
}

function VideoListPreview({
  videos,
  locale,
}: {
  videos: VideoData[];
  locale: string;
}) {
  if (videos.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic text-center py-8">
        No videos added yet
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {videos.map((video) => {
        const ytId = getYoutubeId(video.youtubeUrl);

        return (
          <div
            key={video.id}
            className="rounded-xl border border-black/[0.04] overflow-hidden bg-white"
          >
            {ytId ? (
              <div className="w-full aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={localize(video.title, locale) || "Video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="w-full h-[140px] bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-red-300">
                  <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
            )}

            <div className="p-4">
              <div className="text-[0.9rem] font-semibold text-gray-900 mb-1">
                {localize(video.title, locale) || "—"}
              </div>
              {localize(video.description, locale) && (
                <div className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {localize(video.description, locale)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
