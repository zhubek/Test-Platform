"use client";

// ViewRenderer + catalog-reference resolution: props that are catalog refs
// ({ $catalog, ids }) are fetched and shaped before rendering, localized to
// the user's current language. Use this wherever blocks render with authored
// prop values (page previews, library thumbnails, the block editor).

import { useLocale } from "@/lib/locale-context";
import { useResolvedProps } from "@/lib/catalog-refs";
import { ViewRenderer, type BlockResolver } from "@/lib/view-renderer";

export function ResolvedViewRenderer({
  template,
  props,
  resolveBlock,
}: {
  template: string;
  props: Record<string, unknown>;
  resolveBlock?: BlockResolver;
}) {
  const { locale } = useLocale();
  const resolved = useResolvedProps(props, locale);
  return <ViewRenderer template={template} props={resolved} resolveBlock={resolveBlock} />;
}
