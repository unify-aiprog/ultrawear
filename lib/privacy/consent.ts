export type ConsentPurpose = 'analytics' | 'personalization' | 'advertising';
export type ConsentState = 'unknown' | 'granted' | 'denied';
export interface ConsentRecord { purpose: ConsentPurpose; state: ConsentState; recordedAt: string; source: 'user' | 'system'; }
export function canTrack(purpose: ConsentPurpose, records: ConsentRecord[]): boolean {
  const latest = [...records].filter((item) => item.purpose === purpose).sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))[0];
  return latest?.state === 'granted';
}
export function coarseLocation(location?: { country?: string; region?: string; precise?: boolean }) {
  if (!location) return null;
  return location.precise ? { country: location.country ?? null, region: location.region ?? null } : { country: location.country ?? null, region: null };
}
export function consentedCoarseLocation(records: ConsentRecord[], location?: { country?: string; region?: string; precise?: boolean }) {
  return canTrack('personalization', records) ? coarseLocation(location) : null;
}
