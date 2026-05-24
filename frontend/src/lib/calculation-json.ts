import type { CatalogMapping, Variable } from "@/app/(admin)/admin/_components/mock-data";

// A single, read-only snapshot of a test's calculation configuration.
// Bundles catalog mappings + all authored variables (custom, characteristic,
// single-choice, multiple-choice) with their full contents. Derived data-catalog
// (profession) variables are EXCLUDED — they are produced from the mappings.

export interface CalculationJson {
  mappings: CatalogMapping[];
  variables: {
    custom: Variable[];
    characteristics: Variable[];
    singleChoice: Variable[];
    multipleChoice: Variable[];
  };
}

export function buildCalculationJson(
  mappings: CatalogMapping[],
  variables: Variable[],
): CalculationJson {
  return {
    mappings,
    variables: {
      custom: variables.filter((v) => v.kind === "custom"),
      characteristics: variables.filter((v) => v.kind === "characteristic"),
      singleChoice: variables.filter((v) => v.kind === "singlechoice"),
      multipleChoice: variables.filter((v) => v.kind === "multiplechoice"),
    },
  };
}
