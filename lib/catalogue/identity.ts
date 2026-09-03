export const PROVIDERS = {
  FOOTBALL_DATA: 'football-data.org',
} as const;

export type CatalogueEntity = 'sport' | 'country' | 'competition' | 'season' | 'organization' | 'team' | 'person' | 'venue' | 'event';

export function canonicalId(entity: CatalogueEntity, provider: string, providerId: string | number) {
  const safeProvider = provider.replace(/[^a-z0-9]/gi, '');
  return `${entity}_${safeProvider}_${providerId}`;
}

export function canonicalSlug(value: string, providerId?: string | number) {
  const suffix = providerId === undefined ? '' : `-${providerId}`;
  return `${value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90)}${suffix}`;
}

export const EVENT_STATUSES = {
  SCHEDULED: 'SCHEDULED',
  TIMED: 'TIMED',
  IN_PLAY: 'IN_PLAY',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED',
  POSTPONED: 'POSTPONED',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
} as const;

export function canonicalEventStatus(status: string | null | undefined) {
  const normalized = status?.trim().toUpperCase();
  return normalized && normalized in EVENT_STATUSES ? normalized : null;
}
