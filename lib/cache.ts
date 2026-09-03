type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const base = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const cacheConfigured = Boolean(base && token);

async function request(path: string, init?: RequestInit) {
  return fetch(`${base}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    cache: 'no-store',
    signal: AbortSignal.timeout(1500),
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!base || !token) return null;
  try {
    const response = await request(`/get/${encodeURIComponent(key)}`);
    if (!response.ok) return null;
    const body = await response.json() as { result?: string | null };
    return body.result ? JSON.parse(body.result) as T : null;
  } catch { return null; }
}

export async function cacheSet(key: string, value: JsonValue, ttlSeconds: number): Promise<boolean> {
  if (!base || !token) return false;
  try {
    const encoded = encodeURIComponent(JSON.stringify(value));
    const response = await request(`/set/${encodeURIComponent(key)}/${encoded}/EX/${ttlSeconds}`, { method: 'POST' });
    return response.ok;
  } catch { return false; }
}
