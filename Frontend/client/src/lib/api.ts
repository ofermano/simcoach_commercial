// In dev, default to local FastAPI backend if VITE_API_URL is not set
const raw = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8000" : "");
const API_BASE_URL = String(raw).replace(/\/$/, "");

const AUTH_TOKEN_KEY = "flow_access_token";
const ADMIN_TOKEN_KEY = "flow_admin_token";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function getStoredToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
}

export function setStoredToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(AUTH_TOKEN_KEY);
}

/** Super admin token (separate from user token). */
export function getStoredAdminToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
}

export function setStoredAdminToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearStoredAdminToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/** Build Authorization header for API requests. Backend uses Bearer JWT. */
function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Admin API: uses super admin token. Use for /api/admin/* routes. */
function adminAuthHeaders(): Record<string, string> {
  const token = getStoredAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function adminApiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = apiUrl(path);
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...adminAuthHeaders(),
      ...options.headers,
    },
  });
}

export async function adminApiPost(path: string, data?: unknown): Promise<Response> {
  return adminApiFetch(path, {
    method: "POST",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function adminApiGet(path: string): Promise<Response> {
  return adminApiFetch(path, { method: "GET" });
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = apiUrl(path);
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...authHeaders(),
      ...options.headers,
    },
  });
}

export async function apiPost(
  path: string,
  data?: unknown
): Promise<Response> {
  return apiFetch(path, {
    method: "POST",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiGet(path: string): Promise<Response> {
  return apiFetch(path, { method: "GET" });
}
