export type LicenseState = "unredeemed" | "redeemed" | "expired";
export type TestProgress = "assigned" | "completed";

export interface LicenseTest {
  testId: number;
  status: TestProgress;
}

export interface OrgLicense {
  id: string;
  code: string;
  login: string; // admin-set login username
  name: string; // student name, filled at redemption
  state: LicenseState;
  tests: LicenseTest[]; // per-test progress (all published tests, for now)
}

// All published tests — every license can access all of them for now.
export const availableTests: { id: number; name: string }[] = [
  { id: 1, name: "Holland Career Test" },
  { id: 2, name: "Big Five Personality" },
  { id: 3, name: "Emotional Intelligence" },
];

let n = 0;
const id = () => `lic-${++n}`;

// Magic-link token for a license. In production this would be a stored random
// secret; here we derive a stable token from the code so it's repeatable.
export function licenseToken(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, "").toLowerCase() + "k7";
}

export function magicUrl(code: string): string {
  const base =
    typeof window !== "undefined" ? window.location.origin : "https://testplatform.kz";
  return `${base}/t/${licenseToken(code)}`;
}

const T = (testId: number, status: TestProgress): LicenseTest => ({ testId, status });

// ── Results (for the drawer) ─────────────────────────────────────────────

export interface ScoreEntry {
  label: string;
  value: number; // 0–100
}

export interface AttemptResult {
  date: string;
  summary: string;
  scores: ScoreEntry[];
}

// licenseId → testId → attempts (most recent first)
export const licenseResults: Record<string, Record<number, AttemptResult[]>> = {
  "lic-1": {
    1: [
      {
        date: "Feb 4, 2026",
        summary:
          "Aibek shows a strong Investigative–Artistic profile — analytical and curious, with a creative streak. Well-suited to research, design, and problem-solving roles.",
        scores: [
          { label: "Investigative", value: 87 },
          { label: "Artistic", value: 78 },
          { label: "Social", value: 64 },
          { label: "Enterprising", value: 45 },
          { label: "Realistic", value: 38 },
          { label: "Conventional", value: 31 },
        ],
      },
      {
        date: "Nov 12, 2025",
        summary:
          "Initial assessment showed emerging Investigative tendencies with balanced secondary traits.",
        scores: [
          { label: "Investigative", value: 72 },
          { label: "Social", value: 66 },
          { label: "Artistic", value: 61 },
          { label: "Enterprising", value: 48 },
          { label: "Realistic", value: 40 },
          { label: "Conventional", value: 35 },
        ],
      },
    ],
    2: [
      {
        date: "Feb 6, 2026",
        summary:
          "Very high Openness and Conscientiousness — intellectually curious and self-disciplined.",
        scores: [
          { label: "Openness", value: 88 },
          { label: "Conscientiousness", value: 81 },
          { label: "Agreeableness", value: 70 },
          { label: "Extraversion", value: 58 },
        ],
      },
    ],
  },
  "lic-2": {
    1: [
      {
        date: "Feb 2, 2026",
        summary:
          "Dana presents a Social–Artistic profile, drawn to helping others and creative expression.",
        scores: [
          { label: "Social", value: 84 },
          { label: "Artistic", value: 76 },
          { label: "Investigative", value: 60 },
          { label: "Enterprising", value: 52 },
          { label: "Conventional", value: 34 },
          { label: "Realistic", value: 28 },
        ],
      },
    ],
  },
  "lic-5": {
    1: [
      {
        date: "Jan 29, 2026",
        summary:
          "Madina shows a balanced Social–Conventional profile, suited to structured, people-facing roles.",
        scores: [
          { label: "Social", value: 80 },
          { label: "Conventional", value: 72 },
          { label: "Investigative", value: 64 },
          { label: "Enterprising", value: 55 },
          { label: "Realistic", value: 40 },
          { label: "Artistic", value: 33 },
        ],
      },
    ],
    3: [
      {
        date: "Feb 1, 2026",
        summary:
          "Strong self-awareness and steady self-regulation under pressure.",
        scores: [
          { label: "Self-awareness", value: 82 },
          { label: "Self-regulation", value: 74 },
        ],
      },
    ],
  },
  "lic-7": {
    1: [
      {
        date: "Feb 8, 2026",
        summary:
          "Alikhan shows a clear Enterprising–Social profile — natural at leadership, persuasion, and team settings.",
        scores: [
          { label: "Enterprising", value: 89 },
          { label: "Social", value: 79 },
          { label: "Artistic", value: 66 },
          { label: "Investigative", value: 44 },
          { label: "Conventional", value: 36 },
          { label: "Realistic", value: 30 },
        ],
      },
    ],
    2: [
      {
        date: "Feb 9, 2026",
        summary: "High Extraversion and Agreeableness; low emotional volatility.",
        scores: [
          { label: "Extraversion", value: 90 },
          { label: "Agreeableness", value: 83 },
          { label: "Openness", value: 64 },
          { label: "Conscientiousness", value: 60 },
        ],
      },
    ],
    3: [
      {
        date: "Feb 10, 2026",
        summary: "Well-developed emotional intelligence across both dimensions.",
        scores: [
          { label: "Self-awareness", value: 85 },
          { label: "Self-regulation", value: 80 },
        ],
      },
    ],
  },
};

// All licenses can access all published tests; statuses vary per student.
const allTests = (s1: TestProgress, s2: TestProgress, s3: TestProgress): LicenseTest[] => [
  T(1, s1),
  T(2, s2),
  T(3, s3),
];

export const orgLicenses: OrgLicense[] = [
  { id: id(), code: "PW-7K2M-X9", login: "aibek.n", name: "Aibek Nurlanov", state: "redeemed", tests: allTests("completed", "completed", "assigned") },
  { id: id(), code: "PW-3F8N-Q2", login: "dana.s", name: "Dana Serikova", state: "redeemed", tests: allTests("completed", "assigned", "assigned") },
  { id: id(), code: "PW-1D5R-T7", login: "yerlan.a", name: "Yerlan Akhmetov", state: "redeemed", tests: allTests("completed", "assigned", "assigned") },
  { id: id(), code: "PW-9P4L-M3", login: "", name: "", state: "unredeemed", tests: allTests("assigned", "assigned", "assigned") },
  { id: id(), code: "PW-6T1V-K8", login: "madina.b", name: "Madina Bekova", state: "redeemed", tests: allTests("completed", "assigned", "completed") },
  { id: id(), code: "PW-2H7W-R5", login: "", name: "", state: "unredeemed", tests: allTests("assigned", "assigned", "assigned") },
  { id: id(), code: "PW-8C3Y-N1", login: "alikhan.t", name: "Alikhan Tulegenov", state: "redeemed", tests: allTests("completed", "completed", "completed") },
  { id: id(), code: "PW-5B9Z-J4", login: "aru.z", name: "Aru Zhumabek", state: "redeemed", tests: allTests("assigned", "completed", "assigned") },
  { id: id(), code: "PW-4G6X-P2", login: "", name: "", state: "unredeemed", tests: allTests("assigned", "assigned", "assigned") },
  { id: id(), code: "PW-0M8Q-W7", login: "timur.i", name: "Timur Iskakov", state: "expired", tests: allTests("completed", "assigned", "assigned") },
  { id: id(), code: "PW-7N2D-L9", login: "saule.a", name: "Saule Amirova", state: "redeemed", tests: allTests("completed", "completed", "assigned") },
  { id: id(), code: "PW-3R5F-T6", login: "", name: "", state: "unredeemed", tests: allTests("assigned", "assigned", "assigned") },
];
