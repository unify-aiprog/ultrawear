export type FreshnessState = 'fresh' | 'stale' | 'unknown';

export function getFreshness(
  retrievedAt: string | null | undefined,
  staleAfterMs: number,
  now = Date.now(),
): FreshnessState {
  if (!retrievedAt) return 'unknown';
  const timestamp = Date.parse(retrievedAt);
  if (Number.isNaN(timestamp)) return 'unknown';
  return now - timestamp <= staleAfterMs ? 'fresh' : 'stale';
}
