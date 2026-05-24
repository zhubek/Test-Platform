import { type Localized, l } from "@/lib/localized";

// Mock catalog characteristic structure.
// A catalog (e.g. Professions) has characteristic GROUPS (Interests, Skills),
// each group has a set of characteristic KEYS (the matching dimensions), and a
// set of ITEMS (e.g. professions) — each item has a numeric code, localized
// labels, and a characteristic vector keyed by the group's keys.
//
// A test "maps" against a (catalog, group) using a distance method to find the
// top-N nearest items to the respondent's computed characteristic values.

export interface CharacteristicKey {
  key: string; // machine name used as the variable name / vector dimension
  label: Localized; // human label
}

export interface CatalogItem {
  code: number; // stable numeric code stored in result rows
  name: Localized;
  description?: Localized;
  // characteristic vector: { [characteristicKey]: value } over the group's keys
  vector: Record<string, number>;
}

export interface CharacteristicGroupDef {
  id: string;
  name: Localized;
  keys: CharacteristicKey[];
  items: CatalogItem[]; // catalog items positioned in this group's space
}

export interface CatalogDef {
  id: string;
  name: Localized;
  groups: CharacteristicGroupDef[];
}

// Distance methods available for catalog matching.
export type DistanceMethod = "euclidean" | "manhattan" | "cosine" | "chebyshev";

export const DISTANCE_METHODS: { id: DistanceMethod; label: Localized }[] = [
  { id: "euclidean", label: l("Euclidean", "Евклидово", "Евклидтік") },
  { id: "manhattan", label: l("Manhattan", "Манхэттенское", "Манхэттендік") },
  { id: "cosine", label: l("Cosine", "Косинусное", "Косинустық") },
  { id: "chebyshev", label: l("Chebyshev", "Чебышёва", "Чебышёв") },
];

export const CATALOGS: CatalogDef[] = [
  {
    id: "professions",
    name: l("Professions", "Профессии", "Мамандықтар"),
    groups: [
      {
        id: "interests",
        name: l("Interests (RIASEC)", "Интересы (RIASEC)", "Қызығушылықтар (RIASEC)"),
        keys: [
          { key: "realistic", label: l("Realistic", "Реалистичный", "Реалистік") },
          { key: "investigative", label: l("Investigative", "Исследовательский", "Зерттеушілік") },
          { key: "artistic", label: l("Artistic", "Артистичный", "Көркемдік") },
          { key: "social", label: l("Social", "Социальный", "Әлеуметтік") },
          { key: "enterprising", label: l("Enterprising", "Предприимчивый", "Кәсіпкерлік") },
          { key: "conventional", label: l("Conventional", "Традиционный", "Дәстүрлі") },
        ],
        items: [
          { code: 101, name: l("Software Engineer", "Инженер-программист", "Бағдарламашы инженер"),
            vector: { realistic: 6, investigative: 9, artistic: 4, social: 3, enterprising: 4, conventional: 6 } },
          { code: 102, name: l("Doctor", "Врач", "Дәрігер"),
            vector: { realistic: 5, investigative: 9, artistic: 2, social: 8, enterprising: 4, conventional: 5 } },
          { code: 103, name: l("Teacher", "Учитель", "Мұғалім"),
            vector: { realistic: 3, investigative: 5, artistic: 5, social: 9, enterprising: 5, conventional: 5 } },
          { code: 104, name: l("Graphic Designer", "Графический дизайнер", "Графикалық дизайнер"),
            vector: { realistic: 4, investigative: 4, artistic: 9, social: 4, enterprising: 5, conventional: 3 } },
          { code: 105, name: l("Entrepreneur", "Предприниматель", "Кәсіпкер"),
            vector: { realistic: 4, investigative: 5, artistic: 5, social: 6, enterprising: 9, conventional: 4 } },
          { code: 106, name: l("Accountant", "Бухгалтер", "Бухгалтер"),
            vector: { realistic: 3, investigative: 6, artistic: 2, social: 3, enterprising: 4, conventional: 9 } },
        ],
      },
      {
        id: "skills",
        name: l("Skills", "Навыки", "Дағдылар"),
        keys: [
          { key: "communication", label: l("Communication", "Коммуникация", "Қарым-қатынас") },
          { key: "analytical", label: l("Analytical", "Аналитика", "Аналитика") },
          { key: "technical", label: l("Technical", "Технические", "Техникалық") },
          { key: "leadership", label: l("Leadership", "Лидерство", "Көшбасшылық") },
          { key: "creativity", label: l("Creativity", "Креативность", "Креативтілік") },
        ],
        items: [
          { code: 101, name: l("Software Engineer", "Инженер-программист", "Бағдарламашы инженер"),
            vector: { communication: 5, analytical: 9, technical: 9, leadership: 4, creativity: 6 } },
          { code: 102, name: l("Doctor", "Врач", "Дәрігер"),
            vector: { communication: 8, analytical: 8, technical: 6, leadership: 6, creativity: 4 } },
          { code: 103, name: l("Teacher", "Учитель", "Мұғалім"),
            vector: { communication: 9, analytical: 5, technical: 3, leadership: 6, creativity: 6 } },
          { code: 104, name: l("Graphic Designer", "Графический дизайнер", "Графикалық дизайнер"),
            vector: { communication: 5, analytical: 4, technical: 5, leadership: 3, creativity: 9 } },
          { code: 105, name: l("Entrepreneur", "Предприниматель", "Кәсіпкер"),
            vector: { communication: 8, analytical: 6, technical: 4, leadership: 9, creativity: 7 } },
          { code: 106, name: l("Accountant", "Бухгалтер", "Бухгалтер"),
            vector: { communication: 4, analytical: 9, technical: 6, leadership: 3, creativity: 2 } },
        ],
      },
    ],
  },
];

export function findCatalog(catalogId: string): CatalogDef | undefined {
  return CATALOGS.find((c) => c.id === catalogId);
}

export function findGroup(catalogId: string, groupId: string): CharacteristicGroupDef | undefined {
  return findCatalog(catalogId)?.groups.find((g) => g.id === groupId);
}
