import type { ResultPage } from "@/app/(admin)/admin/_components/mock-data";

// A read-only snapshot of a test's Result View configuration: the pages and
// their blocks (components) with full contents — exactly the saved shape.
export interface ResultJson {
  pages: ResultPage[];
}

export function buildResultJson(pages: ResultPage[]): ResultJson {
  return { pages };
}
