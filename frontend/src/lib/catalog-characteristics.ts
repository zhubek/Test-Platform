// Mock catalog characteristic structure.
// A catalog (e.g. Professions) has characteristic GROUPS (Interests, Skills),
// and each group has a set of characteristic KEYS. Importing a group into a
// test's variables bulk-adds those keys as variables.

export interface CharacteristicKey {
  key: string; // machine name used as the variable name
  label: string; // human label (admin reference)
}

export interface CharacteristicGroupDef {
  id: string;
  name: string;
  keys: CharacteristicKey[];
}

export interface CatalogDef {
  id: string;
  name: string;
  groups: CharacteristicGroupDef[];
}

export const CATALOGS: CatalogDef[] = [
  {
    id: "professions",
    name: "Professions",
    groups: [
      {
        id: "interests",
        name: "Interests (RIASEC)",
        keys: [
          { key: "realistic", label: "Realistic" },
          { key: "investigative", label: "Investigative" },
          { key: "artistic", label: "Artistic" },
          { key: "social", label: "Social" },
          { key: "enterprising", label: "Enterprising" },
          { key: "conventional", label: "Conventional" },
        ],
      },
      {
        id: "skills",
        name: "Skills",
        keys: [
          { key: "communication", label: "Communication" },
          { key: "analytical", label: "Analytical" },
          { key: "technical", label: "Technical" },
          { key: "leadership", label: "Leadership" },
          { key: "creativity", label: "Creativity" },
        ],
      },
    ],
  },
];
