import { MOCK_ENABLED, mockRequest } from "@/lib/mock";

export type Role = "admin" | "guard";

const TOKEN_KEY = "guard_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("guard_user");
  return raw ? (JSON.parse(raw).role as Role) : null;
}

export function setAuth(token: string, user: { role: Role; full_name: string }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("guard_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("guard_user");
}

export async function api(path: string, options: RequestInit = {}) {
  if (MOCK_ENABLED) {
    await new Promise((r) => setTimeout(r, 150)); // simulate latency
    return mockRequest(path, options);
  }
  const token = getToken();
  const isForm = options.body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    body: isForm ? options.body : options.body ? (options.body as string) : undefined,
  });
  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error((data as { detail?: string })?.detail || JSON.stringify(data) || res.statusText);
  return data;
}

export function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-MY", { dateStyle: "short", timeStyle: "short" });
}
