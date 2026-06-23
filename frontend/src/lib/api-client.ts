// Thin transport layer to the NestJS backend for the staff /admin area.
// Auth is a real sign-in (login + password) — no auto-login. The JWT is cached
// in localStorage; on a 401 the token is cleared so the admin gate re-prompts.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "tp-token";

let token: string | null = null;

export function getToken(): string | null {
  if (token) return token;
  if (typeof window !== "undefined") token = localStorage.getItem(TOKEN_KEY);
  return token;
}

export function setToken(value: string | null): void {
  token = value;
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Sign in with login + password; stores the JWT. Throws on bad credentials. */
export async function signIn(identifier: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) throw new Error("Invalid login or password");
  const json = await res.json();
  const accessToken: string | undefined = json?.data?.accessToken ?? json?.accessToken;
  if (!accessToken) throw new Error("No accessToken in login response");
  setToken(accessToken);
}

export function signOut(): void {
  setToken(null);
}

// Shared request: attach the bearer token; clear it (so the gate re-prompts) on 401.
async function request(path: string, init: RequestInit): Promise<Response> {
  const t = getToken();
  if (!t) throw new Error("Not signed in");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      Authorization: `Bearer ${t}`,
    },
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  }
  return res;
}

/** Fetch JSON, unwrapping the backend's `{ data }` envelope. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await request(path, init);
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
}

/** The raw streaming Response (no body read) — for SSE / token streaming. */
export async function apiFetchStream(path: string, init: RequestInit = {}): Promise<Response> {
  return request(path, init);
}

/** Like apiFetch but WITHOUT envelope unwrapping — for `{ data, code }` payloads. */
export async function apiFetchRaw<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await request(path, init);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
