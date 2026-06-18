"use client";

// Holder-facing API client. Unlike the admin api-client (which auto-logs-in as a
// dev super-admin), the end-user side requires an explicit holder login or
// license activation; the token is kept under its own key so the two sessions
// never collide. All reads are envelope-unwrapped ({ data }).

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "tp-holder-token";

const CTX_KEY = "tp-holder-ctx";

export const getHolderToken = () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
export const setHolderToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CTX_KEY); // signing out clears the chosen project too
  }
};

/** The project/license the holder picked to act under (persisted across reloads). */
export interface HolderContext {
  licenseId: string;
  projectId: string;
  projectName: string;
  orgName?: string;
}
export const getHolderContext = (): HolderContext | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CTX_KEY);
  try {
    return raw ? (JSON.parse(raw) as HolderContext) : null;
  } catch {
    return null;
  }
};
export const setHolderContext = (ctx: HolderContext | null) => {
  if (typeof window === "undefined") return;
  if (ctx) localStorage.setItem(CTX_KEY, JSON.stringify(ctx));
  else localStorage.removeItem(CTX_KEY);
};

async function holderFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getHolderToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (res.status === 401) {
    setHolderToken(null);
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function holderLogin(identifier: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) throw new Error("Invalid login or password");
  const json = await res.json();
  const token = json?.data?.accessToken ?? json?.accessToken;
  if (!token) throw new Error("No token returned");
  setHolderToken(token);
}

/** Self-serve sign-up: email + login + password. Starts with no licenses. */
export async function holderRegister(
  email: string,
  login: string,
  password: string,
  name?: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, login, password, name }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(/already in use/i.test(msg) ? "That login or email is already in use." : "Could not register");
  }
  const json = await res.json();
  const token = json?.data?.accessToken ?? json?.accessToken;
  if (!token) throw new Error("No token returned");
  setHolderToken(token);
}

export interface HolderMe {
  id: string;
  login: string;
  email: string | null;
  name: string | null;
  status: string;
  roles: { role: { name: string } }[];
}
export const fetchMe = () => holderFetch<HolderMe>("/auth/me");

// ── Licenses (0 / 1 / many home routing) ──────────────────────────────────────

export interface HolderLicense {
  id: string;
  state: string;
  project: { id: string; name: string };
  organization: { id: string; name: string } | null;
}

export const fetchMyLicenses = () => holderFetch<HolderLicense[]>("/me/licenses");

/** Claim a license code; attaches it (ACTIVE) to the signed-in account. */
export const redeemLicense = (code: string) =>
  holderFetch<HolderLicense>("/me/licenses/redeem", { method: "POST", body: JSON.stringify({ code }) });

/** Pick a held license to act under — swaps in a project-scoped token. */
export async function selectLicense(license: HolderLicense): Promise<void> {
  const { accessToken } = await holderFetch<{ accessToken: string }>("/auth/select-license", {
    method: "POST",
    body: JSON.stringify({ licenseId: license.id }),
  });
  setHolderToken(accessToken);
  setHolderContext({
    licenseId: license.id,
    projectId: license.project.id,
    projectName: license.project.name,
    orgName: license.organization?.name,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────

// How a test presents its results in the home drawer: which variables to show
// as score bars (label + description), a summary template, and the professions
// to recommend keyed by the top score's label.
export interface ResultConfig {
  scores?: { variable: string; label: string; description?: string }[];
  summary?: string;
  professions?: Record<string, string[]>;
}

export interface HolderTest {
  id: string;
  name: Record<string, string>;
  category: Record<string, string>;
  state: string;
  info: Record<string, unknown>;
  advancedParams: {
    vars?: { name: string; initial: string }[];
    calc?: { name: string; expr: string }[];
    result?: ResultConfig;
  };
  attempt: { id: string; state: string } | null;
  _count?: { blocks: number };
}

export const fetchMyTests = () => holderFetch<HolderTest[]>("/me/tests");
export const fetchTest = (id: string) => holderFetch<HolderTest>(`/tests/${id}`);

export interface TestBlockInstance {
  id: string;
  blockId: string;
  surface: string;
  order: number;
  props: Record<string, unknown>;
  advancedParams: { onAnswer?: { target: string; expr: string }[]; visibleIf?: string; randomize?: boolean };
  block: { id: string; name: string; type: string } | null;
}

export const fetchTestBlocks = (id: string, surface: "QUESTION" | "RESULT" | "DASHBOARD") =>
  holderFetch<TestBlockInstance[]>(`/tests/${id}/blocks?surface=${surface}`);

// The block library (html + declared props) — resolved against instance.blockId.
export interface LibraryBlock {
  id: string;
  name: string;
  type: string;
  html: string;
  props: { name: string; type: string; value: unknown }[];
}
export const fetchBlockLibrary = () => holderFetch<LibraryBlock[]>("/blocks");

// ── Attempts ────────────────────────────────────────────────────────────────

export interface Attempt {
  id: string;
  testId: string;
  state: string;
  progress: Record<string, unknown>;
  startTime?: string | null;
  endTime?: string | null;
  updatedTime?: string;
  variables?: { variable: string; value: number }[];
}

export const startAttempt = (testId: string) =>
  holderFetch<Attempt>(`/tests/${testId}/attempts`, { method: "POST" });

export const fetchAttempt = (id: string) => holderFetch<Attempt>(`/license-tests/${id}`);

export const submitAttempt = (id: string, body: { variables: Record<string, number>; progress: Record<string, unknown> }) =>
  holderFetch<Attempt>(`/license-tests/${id}/submit`, { method: "POST", body: JSON.stringify(body) });
