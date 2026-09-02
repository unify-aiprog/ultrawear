/** Source registry and deterministic event ingestion boundary. */

import { normalizeSourceEvent } from './adapter.js';
import { updateEvent } from './events.js';

export function createSourceRegistry() {
  const adapters = new Map();
  const events = new Map();

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
    ingest(sourceId, payload, context = {}) {
      const adapter = adapters.get(sourceId);
      if (!adapter) throw new Error(`Unknown source: ${sourceId}`);
      const incoming = normalizeSourceEvent(adapter, payload, context);
      const existing = events.get(incoming.id);
      const event = existing ? updateEvent(existing, incoming) : incoming;
      events.set(event.id, event);
      return { event, created: !existing, changed: !existing || JSON.stringify(existing) !== JSON.stringify(event) };
    },
    getEvent(id) {
      return events.get(id) ?? null;
    },
    listEvents() {
      return [...events.values()];
    },
  });
}
