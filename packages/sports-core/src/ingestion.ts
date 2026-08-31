export type IngestionRunStatus = 'started' | 'completed' | 'partial' | 'failed';

export type IngestionResult = {
  runId: string;
  provider: string;
  status: IngestionRunStatus;
  startedAt: string;
  completedAt?: string;
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ externalId?: string; message: string }>;
};

export type NormalizedEntity = {
  entityType: 'sport' | 'competition' | 'season' | 'team' | 'player' | 'venue' | 'match' | 'match_event' | 'standing';
  externalId: string;
  provider: string;
  data: Record<string, unknown>;
  sourceRetrievedAt: string;
};

export type IngestionPolicy = {
  maxRetries: number;
  retryBackoffMs: number;
  staleAfterMs: number;
};

export const DEFAULT_INGESTION_POLICY: IngestionPolicy = {
  maxRetries: 3,
  retryBackoffMs: 1000,
  staleAfterMs: 5 * 60 * 1000,
};

export interface IngestionStore {
  upsert(entity: NormalizedEntity): Promise<'created' | 'updated' | 'skipped'>;
}

export interface DomainEventPublisher {
  publish(event: {
    id: string;
    type: string;
    occurredAt: string;
    entityId: string;
    sport: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

/**
 * The ingestion engine is intentionally provider-agnostic. Concrete adapters
 * fetch and normalize external data; this engine persists it and publishes
 * canonical events for live UI, newsroom, notifications, SEO and analytics.
 */
export async function ingestEntities(
  entities: NormalizedEntity[],
  store: IngestionStore,
  publish: DomainEventPublisher,
): Promise<Pick<IngestionResult, 'fetched' | 'created' | 'updated' | 'skipped' | 'failed' | 'errors'>> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: IngestionResult['errors'] = [];

  for (const entity of entities) {
    try {
      const outcome = await store.upsert(entity);
      if (outcome === 'created') created += 1;
      else if (outcome === 'updated') updated += 1;
      else skipped += 1;

      await publish({
        id: `${entity.provider}:${entity.entityType}:${entity.externalId}:${entity.sourceRetrievedAt}`,
        type: entity.entityType === 'match' ? 'MATCH_UPDATED' : `${entity.entityType.toUpperCase()}_UPDATED`,
        occurredAt: entity.sourceRetrievedAt,
        entityId: entity.externalId,
        sport: String(entity.data.sport ?? 'unknown'),
        payload: entity.data,
      });
    } catch (error) {
      failed += 1;
      errors.push({
        externalId: entity.externalId,
        message: error instanceof Error ? error.message : 'Unknown ingestion error',
      });
    }
  }

  return { fetched: entities.length, created, updated, skipped, failed, errors };
}
