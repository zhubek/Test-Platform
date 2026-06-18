"use client";

// Org-admin API client — its own session token (login + activation code, no
// password) and an OrgApi implementation bound to it, so the shared Licenses/
// Settings tabs run as the org admin rather than the dev super-admin.

import type { LicenseAction, OrgAdmin, OrgApi, OrgAttempt, OrgDetail, OrgLicense } from "./backend";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "tp-orgadmin-token";

export const getOrgToken = () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
export const setOrgToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

async function run(path: string, init: RequestInit) {
  const token = getOrgToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (res.status === 401) {
    setOrgToken(null);
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  return res;
}

async function orgFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await run(path, init);
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
}

async function orgFetchRaw<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await run(path, init);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function orgLogin(login: string, code: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/org-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, code }),
  });
  if (!res.ok) throw new Error("Invalid login or activation code");
  const json = await res.json();
  const token = json?.data?.accessToken ?? json?.accessToken;
  if (!token) throw new Error("No token returned");
  setOrgToken(token);
}

export interface MyOrg {
  data: OrgDetail;
  capabilities: Record<string, boolean | string[]>;
}

export const fetchMyOrg = () => orgFetchRaw<MyOrg>("/me/organization");

// ── OrgApi (org-admin token) — same shapes as @/lib/backend's default ─────────

export const orgApi: OrgApi = {
  fetchOrgLicenses: (orgId) => orgFetch<OrgLicense[]>(`/organizations/${orgId}/licenses`),
  generateLicenses: (orgId, input) =>
    orgFetchRaw<{ data: OrgLicense[]; codes: string[] }>(`/organizations/${orgId}/licenses/generate`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  licenseAction: (id, action: LicenseAction) =>
    orgFetch<OrgLicense>(`/licenses/${id}/${action}`, { method: "POST" }),
  resetLicenseCode: (id) => orgFetch<{ code: string }>(`/licenses/${id}/reset-code`, { method: "POST" }),
  deleteLicense: (id) => orgFetch(`/licenses/${id}`, { method: "DELETE" }),
  fetchOrgAttempts: (orgId) => orgFetch<OrgAttempt[]>(`/organizations/${orgId}/attempts`),
  // Settings actions — the backend refuses these for an org admin (403); they
  // are only reachable when a super/project admin is the caller.
  updateOrganization: (id, patch) => orgFetch<OrgDetail>(`/organizations/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  fetchOrgAdmin: (orgId) => orgFetch<OrgAdmin | null>(`/organizations/${orgId}/admin`),
  setOrgAdmin: (orgId, input) => orgFetch<OrgAdmin>(`/organizations/${orgId}/admin`, { method: "PATCH", body: JSON.stringify(input) }),
  resetOrgCode: (id) => orgFetch<{ code: string }>(`/organizations/${id}/reset-code`, { method: "POST" }),
  deleteOrganization: (id) => orgFetch(`/organizations/${id}`, { method: "DELETE" }),
};
