import { type Localized, l } from "@/lib/localized";

// Output variables = a fixed, per-catalog-type set of single-text fields that
// each catalog item fills in. These are the texts pickable when choosing what
// to show in dashboards. Stored on the item's params under `output`, keyed by
// the field id: params.output[fieldId] = Localized.

export type CatalogType =
  | "professions"
  | "univerPrograms"
  | "collegePrograms"
  | "universities"
  | "colleges"
  | "cities"
  | "characteristics";

export interface OutputFieldDef {
  id: string;
  label: Localized;
}

// Fixed shared set per catalog type. Add/adjust field ids here to evolve the
// schema; every item of that type exposes exactly these output variables.
export const CATALOG_OUTPUT_FIELDS: Record<CatalogType, OutputFieldDef[]> = {
  professions: [
    { id: "salary", label: l("Average salary", "Средняя зарплата", "Орташа жалақы") },
    { id: "demand", label: l("Market demand", "Спрос на рынке", "Нарықтағы сұраныс") },
    { id: "outlook", label: l("Career outlook", "Карьерные перспективы", "Мансаптық болашақ") },
    { id: "summary", label: l("Short summary", "Краткое описание", "Қысқаша сипаттама") },
  ],
  univerPrograms: [
    { id: "minScore", label: l("Min UNT score", "Мин. балл ЕНТ", "Мин. ҰБТ балы") },
    { id: "tuition", label: l("Tuition", "Стоимость обучения", "Оқу ақысы") },
    { id: "summary", label: l("Short summary", "Краткое описание", "Қысқаша сипаттама") },
  ],
  collegePrograms: [
    { id: "duration", label: l("Duration", "Длительность", "Ұзақтығы") },
    { id: "tuition", label: l("Tuition", "Стоимость обучения", "Оқу ақысы") },
    { id: "summary", label: l("Short summary", "Краткое описание", "Қысқаша сипаттама") },
  ],
  universities: [
    { id: "ranking", label: l("Ranking", "Рейтинг", "Рейтинг") },
    { id: "tuition", label: l("Tuition", "Стоимость обучения", "Оқу ақысы") },
    { id: "summary", label: l("Short summary", "Краткое описание", "Қысқаша сипаттама") },
  ],
  colleges: [
    { id: "ranking", label: l("Ranking", "Рейтинг", "Рейтинг") },
    { id: "tuition", label: l("Tuition", "Стоимость обучения", "Оқу ақысы") },
    { id: "summary", label: l("Short summary", "Краткое описание", "Қысқаша сипаттама") },
  ],
  cities: [
    { id: "population", label: l("Population", "Население", "Халық саны") },
    { id: "summary", label: l("Short summary", "Краткое описание", "Қысқаша сипаттама") },
  ],
  characteristics: [
    { id: "summary", label: l("Short summary", "Краткое описание", "Қысқаша сипаттама") },
    { id: "highNote", label: l("High-score note", "Высокий балл", "Жоғары балл") },
    { id: "lowNote", label: l("Low-score note", "Низкий балл", "Төмен балл") },
  ],
};

export function outputFields(type: CatalogType): OutputFieldDef[] {
  return CATALOG_OUTPUT_FIELDS[type] ?? [];
}
