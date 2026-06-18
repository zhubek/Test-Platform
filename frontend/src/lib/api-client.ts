// Thin transport layer to the NestJS backend.
//
// NOTE (dev shim): the frontend has no login screen yet, so this client
// auto-logs-in with NEXT_PUBLIC_DEV_LOGIN/PASSWORD to obtain a JWT and caches
// it in localStorage. Replace `ensureToken`/`login` with a real auth flow when
// a login page exists — the rest of the client stays the same.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const DEV_LOGIN = process.env.NEXT_PUBLIC_DEV_LOGIN ?? "superadmin";
const DEV_PASSWORD = process.env.NEXT_PUBLIC_DEV_PASSWORD ?? "changeme123";
const TOKEN_KEY = "tp-token";

let token: string | null = null;

function getToken(): string | null {
  if (token) return token;
  if (typeof window !== "undefined") token = localStorage.getItem(TOKEN_KEY);
  return token;
}

function setToken(value: string | null): void {
  token = value;
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

async function login(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: DEV_LOGIN, password: DEV_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Auth failed (${res.status})`);
  const json = await res.json();
  const accessToken: string | undefined = json?.data?.accessToken ?? json?.accessToken;
  if (!accessToken) throw new Error("No accessToken in login response");
  setToken(accessToken);
  return accessToken;
}

async function ensureToken(): Promise<string> {
  return getToken() ?? (await login());
}

/**
 * Fetch JSON from the backend with a bearer token, auto-refreshing the token
 * once on 401. Unwraps the `{ data }` envelope the backend returns.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const run = (t: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
        Authorization: `Bearer ${t}`,
      },
    });

  let res = await run(await ensureToken());
  if (res.status === 401) {
    setToken(null);
    res = await run(await login());
  }
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  }
  if (res.status === 204) return undefined as T;

  const json = await res.json();
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
}

/**
 * Like apiFetch but returns the raw streaming Response (no body read) — for
 * Server-Sent Events / token streaming. Adds the bearer token and refreshes it
 * once on 401. The caller reads `res.body`.
 */
export async function apiFetchStream(path: string, init: RequestInit = {}): Promise<Response> {
  const run = (t: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
        Authorization: `Bearer ${t}`,
      },
    });

  let res = await run(await ensureToken());
  if (res.status === 401) {
    setToken(null);
    res = await run(await login());
  }
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  }
  return res;
}

/**
 * Like apiFetch but WITHOUT envelope unwrapping — for endpoints whose payload
 * legitimately contains a `data` key next to siblings (e.g. `{ data, code }`
 * from license/org provisioning).
 */
export async function apiFetchRaw<T>(path: string, init: RequestInit = {}): Promise<T> {
  const run = (t: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
        Authorization: `Bearer ${t}`,
      },
    });

  let res = await run(await ensureToken());
  if (res.status === 401) {
    setToken(null);
    res = await run(await login());
  }
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
