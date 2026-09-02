/**
 * Server-side ingestion entrypoint.
 *
 * Provider credentials/network access are supplied by the deployment environment.
 * The browser never talks to a sports-data provider directly.
 */

import { createSourceRegistry } from './registry.js';
import { createIngestionRunner } from './ingestion.js';
import { createKvEventStore } from './event-store.js';
import { createKvObservationStore } from './observation-store.js';
import { createEventReconciler } from './event-reconciliation.js';
import { createMomentReconciler } from './moment-reconciliation.js';
import { createEventIndexStore } from './event-index.js';
import { createEventIndexSync } from './index-sync.js';
import { createTeamHistoryStore } from './team-history.js';
import { createPlayerHistoryStore } from './player-history.js';
import { createIngestionHealth } from './ingestion-health.js';
import { createCanonicalPropagation } from './propagation.js';
import { createRevalidationQueue } from './revalidation.js';

export function createLiveSportsWorker({ env, fetchSource, adapter, follows = [], sourceType = 'open', sourceConfidence = () => 0.7, healthPolicy } = {}) {
  if (!env?.EVENT_STORE) throw new TypeError('EVENT_STORE binding is required');
  if (!env?.OBSERVATION_STORE) throw new TypeError('OBSERVATION_STORE binding is required');
  if (!env?.EVENT_INDEX) throw new TypeError('EVENT_INDEX binding is required');
  if (!env?.TEAM_HISTORY) throw new TypeError('TEAM_HISTORY binding is required');
  if (!env?.PLAYER_HISTORY) throw new TypeError('PLAYER_HISTORY binding is required');
  if (!adapter) throw new TypeError('Source adapter is required');

  const registry = createSourceRegistry({ follows });
  registry.register(adapter);
  const eventStore = createKvEventStore(env.EVENT_STORE);
  const observationStore = createKvObservationStore(env.OBSERVATION_STORE);
  const reconciler = createEventReconciler({ eventStore, observationStore, sourceConfidence });
  const momentReconciler = createMomentReconciler({ observationStore, sourceConfidence: ({ sourceId }) => sourceConfidence({ sourceId, sourceType }) });
  const indexSync = createEventIndexSync(createEventIndexStore(env.EVENT_INDEX));
  const teamHistory = createTeamHistoryStore(env.TEAM_HISTORY);
  const playerHistory = createPlayerHistoryStore(env.PLAYER_HISTORY);
  const health = createIngestionHealth({ policy: healthPolicy });
  const propagation = createCanonicalPropagation({ eventStore, indexSync, teamHistory, playerHistory });
  let worker;
  const ingest = async (sourceId, context = {}) => {
    const startedAt = Date.now();
    const result = await ingestSource(sourceId, context);
    const healthState = health.record({ ...result, latencyMs: Date.now() - startedAt });
    if (!result.ok || !result.event) return { ...result, health: healthState };

    const reconciliation = await reconciler.reconcile({ sourceId, event: result.event, observedAt: result.observedAt, sourceType });
    const incomingMoments = Array.isArray(result.event.moments) ? result.event.moments : result.event.moment ? [result.event.moment] : [];
    const momentReconciliation = await momentReconciler.reconcile({ eventId: reconciliation.canonicalId, incomingMoments, existingMoments: reconciliation.event.moments ?? [], sourceId, observedAt: result.observedAt });
    const canonicalEvent = { ...reconciliation.event, moments: momentReconciliation.moments, moment: momentReconciliation.moments.at(-1) ?? null };
    const canonicalResult = { ...result, ...reconciliation, event: canonicalEvent, momentReconciliation, health: healthState, changed: true };
    await propagation.publish(canonicalEvent, canonicalResult);
    if (canonicalResult.conflicted || momentReconciliation.conflicted) worker.revalidate(sourceId, { eventStatus: canonicalEvent.status, reason: 'conflict' });
    return canonicalResult;
  };
  const ingestSource = createIngestionRunner({ registry, fetchSource, eventStore: null });
  const revalidation = createRevalidationQueue({ ingest });
  worker = { ingest, revalidate: revalidation.enqueue, drainRevalidation: revalidation.drain, health: health.list, getHealth: health.get };
  return Object.freeze(worker);
}
