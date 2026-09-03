export type ConsentPurpose = 'analytics' | 'personalization' | 'advertising';
export type ConsentState = 'unknown' | 'granted' | 'denied';

export interface ConsentRecord {
  purpose: ConsentPurpose;
  state: ConsentState;
  recordedAt: string;
  source: 'user' | 'system';
}

export function canTrack(purpose: ConsentPurpose, records: ConsentRecord[]): boolean {
  const latest = [...records].filter((item) => item.purpose === purpose).sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))[0];
  return latest?.state === 'granted';
}

export function coarseLocation(location?: { country?: string; region?: string; precise?: boolean }) {
  if (!location) return null;
  if (location.precise) return { country: location.country ?? null, region: location.region ?? null };
  return { country: location.country ?? null, region: null };
}
