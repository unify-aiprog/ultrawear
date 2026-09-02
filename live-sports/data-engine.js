/**
 * UltraWear Sports Data Engine orchestration primitives.
 *
 * Chooses the best available source for a capability and preserves the source
 * boundary so providers can be added or removed without changing the website.
 */

import { defaultSourceCatalog } from './source-catalog.js';
import { createObservation, reconcileObservations } from './knowledge-ledger.js';

export function createDataEngine({ catalog = defaultSourceCatalog, adapters = [] } = {}) {
  const adapterMap = new Map(adapters.map((adapter) => [adapter.id, adapter]));

  return Object.freeze({
    sources({ sport = null, capability = null } = {}) {
      return catalog.list({ sport, capability });
    },

    async collect({ sport, capability, payloads = [], observedAt = new Date().toISOString() }) {
      const candidates = catalog.list({ sport, capability });
      const observations = [];
      const results = [];

      for (const item of candidates) {
        const adapter = adapterMap.get(item.id);
        const payload = payloads.find((entry) => entry?.sourceId === item.id)?.payload;
        if (!adapter || payload == null) continue;

        const normalized = adapter.normalize(payload, { observedAt });
        results.push({ sourceId: item.id, event: normalized });
        observations.push(createObservation({
          entityId: normalized.id,
          entityType: 'event',
          field: 'event',
          value: normalized,
          sourceId: item.id,
          observedAt,
          confidence: item.type === 'commercial' ? 0.9 : 0.7,
        }));
      }

      return {
        results,
        reconciled: reconcileObservations(observations),
        sourcesConsidered: candidates.map((item) => item.id),
      };
    },
  });
}
