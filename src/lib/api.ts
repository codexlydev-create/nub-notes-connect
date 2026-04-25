const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const TOKEN_KEY = "ns_token";

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t: string | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

type Body = Record<string, any> | FormData | undefined;

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: Body; auth?: boolean; signal?: AbortSignal } = {}
): Promise<T> {
  const { method = "GET", body, auth = false, signal } = opts;
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: payload, signal });
  } catch (e: any) {
    throw new ApiError(
      "Could not reach the backend server. Make sure it is running at " + BASE,
      0
    );
  }
  const text = await res.text();
  let json: any = null;
  if (text) { try { json = JSON.parse(text); } catch {} }
  if (!res.ok) {
    const msg = (json && (json.error || json.message)) || res.statusText || "Request failed";
    throw new ApiError(msg, res.status);
  }
  return (json ?? {}) as T;
}

export const API_BASE = BASE;
/** Stream URL for a note's PDF, served by the backend. */
export function noteFileUrl(noteId: string) {
  return `${BASE}/api/notes/${noteId}/file`;
}