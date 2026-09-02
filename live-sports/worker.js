/**
 * Server-side ingestion entrypoint.
 *
 * Provider credentials/network access are supplied by the deployment environment.
 * The browser never talks to a sports-data provider directly.
 */

import { createSourceRegistry } from './registry.js';
import { createIngestionRunner } from './ingestion.js';
import { createKvEventStore } from './event-store.js';
import { createEventIndexStore } from './event-index.js';
import { createEventIndexSync } from './index-sync.js';
import { createTeamHistoryStore } from './team-history.js';

export function createLiveSportsWorker({ env, fetchSource, adapter, follows = [] }) {
  if (!env?.EVENT_STORE) throw new TypeError('EVENT_STORE binding is required');
  if (!env?.EVENT_INDEX) throw new TypeError('EVENT_INDEX binding is required');
  if (!env?.TEAM_HISTORY) throw new TypeError('TEAM_HISTORY binding is required');
  if (!adapter) throw new TypeError('Source adapter is required');

  const registry = createSourceRegistry({ follows });
  registry.register(adapter);
  const eventStore = createKvEventStore(env.EVENT_STORE);
  const indexSync = createEventIndexSync(createEventIndexStore(env.EVENT_INDEX));
  const teamHistory = createTeamHistoryStore(env.TEAM_HISTORY);
  const ingestSource = createIngestionRunner({ registry, fetchSource, eventStore });

  return Object.freeze({
    async ingest(sourceId, context = {}) {
      const result = await ingestSource(sourceId, context);
      if (result.ok && result.event && result.changed) {
        await indexSync.sync(result);
        await teamHistory.put(result.event);
      }
      return result;
    },
  });
}
