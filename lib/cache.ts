type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const base = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const cacheConfigured = Boolean(base && token);

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!base || !token) return null;
  try {
    const response = await fetch(`${base}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) return null;
    const body = await response.json() as { result?: string | null };
    return body.result ? JSON.parse(body.result) as T : null;
  } catch { return null; }
}

export async function cacheSet(key: string, value: JsonValue, ttlSeconds: number): Promise<boolean> {
  if (!base || !token) return false;
  try {
    const encoded = encodeURIComponent(JSON.stringify(value));
    const response = await fetch(`${base}/set/${encodeURIComponent(key)}/${encoded}/EX/${ttlSeconds}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    return response.ok;
  } catch { return false; }
}
