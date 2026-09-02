/** Source registry and deterministic event ingestion boundary. */

import { normalizeSourceEvent } from './adapter.js';
import { updateEvent } from './events.js';
import { createAlertCandidates } from './retention.js';

export function createSourceRegistry({ follows = [] } = {}) {
  const adapters = new Map();
  const events = new Map();
  let activeFollows = [...follows];

  return Object.freeze({
    register(adapter) {
      if (!adapter?.id) throw new TypeError('Adapter is required');
      if (adapters.has(adapter.id)) throw new Error(`Source already registered: ${adapter.id}`);
      adapters.set(adapter.id, adapter);
      return adapter;
    },
    getSource(id) {
      return adapters.get(id) ?? null;
    },
    setFollows(nextFollows = []) {
      activeFollows = [...nextFollows];
      return [...activeFollows];
    },
    listFollows() {
      return [...activeFollows];
    },
    ingest(sourceId, payload, context = {}) {
      const adapter = adapters.get(sourceId);
      if (!adapter) throw new Error(`Unknown source: ${sourceId}`);
      const incoming = normalizeSourceEvent(adapter, payload, context);
      const existing = events.get(incoming.id);
      const event = existing ? updateEvent(existing, incoming) : incoming;
      events.set(event.id, event);
      const changed = !existing || JSON.stringify(existing) !== JSON.stringify(event);
      const alertCandidates = changed
        ? createAlertCandidates({
            previous: existing,
            current: event,
            follows: activeFollows,
            createdAt: context.createdAt,
          })
        : [];
      return { event, created: !existing, changed, alertCandidates };
    },
    getEvent(id) {
      return events.get(id) ?? null;
    },
    listEvents() {
      return [...events.values()];
    },
  });
}
