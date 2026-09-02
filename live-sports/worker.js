/**
 * Server-side ingestion entrypoint.
 *
 * This module intentionally accepts the provider fetch function as a dependency so
 * deployment code can supply credentials through environment bindings/secrets without
 * putting credentials or provider HTTP calls into the browser bundle.
 */

import { createSourceRegistry } from './registry.js';
import { createIngestionRunner } from './ingestion.js';
import { createKvEventStore } from './event-store.js';
import { createEventIndexStore } from './event-index.js';
import { createEventIndexSync } from './index-sync.js';

export function createLiveSportsWorker({ env, fetchSource, adapter, follows = [] }) {
  if (!env?.EVENT_STORE) throw new TypeError('EVENT_STORE binding is required');
  if (!env?.EVENT_INDEX) throw new TypeError('EVENT_INDEX binding is required');
  if (!adapter) throw new TypeError('Source adapter is required');

  const registry = createSourceRegistry({ follows });
  registry.register(adapter);
  const eventStore = createKvEventStore(env.EVENT_STORE);
  const indexSync = createEventIndexSync(createEventIndexStore(env.EVENT_INDEX));
  const ingest = createIngestionRunner({ registry, fetchSource, eventStore });

  return Object.freeze({
    async ingest(sourceId, context = {}) {
      const result = await ingest(sourceId, context);
      await indexSync.sync(result);
      return result;
    },
  });
}
