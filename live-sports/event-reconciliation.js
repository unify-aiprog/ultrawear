/**
 * Persistent, deterministic reconciliation of provider events.
 *
 * Source IDs are not canonical IDs. Events are matched by stable team/kickoff
 * identity and every field keeps its source observations and conflict state.
 */

import { createObservation, reconcileObservations } from './knowledge-ledger.js';
import { canonicalEventIdentity, findBestEventMatch } from './event-matching.js';

const RECONCILED_FIELDS = Object.freeze([
  'sport',
  'competition',
  'startsAt',
  'status',
  'score',
  'venue',
]);

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function eventWithField(event, field, value) {
  if (value == null) return event;
  if (field === 'score' && value && typeof value === 'object') return { ...event, score: { ...value } };
  if (field === 'competition' && value && typeof value === 'object') return { ...event, competition: value };
  if (field === 'venue' && value && typeof value === 'object') return { ...event, venue: value };
  return { ...event, [field]: value };
}

export function chooseCanonicalEvent({ existing = null, incoming, reconciledFields }) {
  let canonical = existing ? { ...existing } : { ...incoming };
  for (const item of reconciledFields) {
    if (item.value != null && item.verification !== 'conflicted') {
      canonical = eventWithField(canonical, item.field, item.value);
    }
  }

  // Preserve richer provider-neutral event data from an incoming observation
  // without allowing a conflicted core field to silently overwrite history.
  for (const field of ['home', 'away', 'moment', 'moments', 'stats', 'performances', 'updatedAt']) {
    if (incoming[field] != null && (canonical[field] == null || !sameValue(canonical[field], incoming[field]))) {
      canonical[field] = Array.isArray(incoming[field]) ? [...incoming[field]] : incoming[field];
    }
  }
  return canonical;
}

export function createEventReconciler({ eventStore, observationStore, sourceConfidence = () => 0.7 }) {
  if (!eventStore || typeof eventStore.getEvent !== 'function' || typeof eventStore.putEvent !== 'function' || typeof eventStore.listEvents !== 'function') {
    throw new TypeError('Event store with getEvent, putEvent and listEvents is required');
  }
  if (!observationStore || typeof observationStore.putObservation !== 'function' || typeof observationStore.listObservations !== 'function') {
    throw new TypeError('Observation store is required');
  }

  return Object.freeze({
    async reconcile({ sourceId, event: incoming, observedAt, sourceType = 'open' }) {
      if (!sourceId || !incoming?.id || !observedAt) throw new TypeError('Source, event and observedAt are required');

      const direct = await eventStore.getEvent(incoming.id);
      const match = direct ? { event: direct, score: 1 } : findBestEventMatch(incoming, await eventStore.listEvents());
      const existing = match?.event ?? null;
      const canonicalId = existing?.id ?? canonicalEventIdentity(incoming) ?? `event:${sourceId}:${incoming.id}`;
      const confidence = Math.min(1, Math.max(0, Number(sourceConfidence({ sourceId, sourceType, event: incoming })) || 0));

      const observations = [];
      for (const field of RECONCILED_FIELDS) {
        const value = incoming[field];
        if (value == null) continue;
        const observation = createObservation({
          entityId: canonicalId,
          entityType: 'event',
          field,
          value,
          sourceId,
          observedAt,
          confidence,
        });
        await observationStore.putObservation(observation);
        observations.push(observation);
      }

      const reconciledFields = [];
      for (const field of RECONCILED_FIELDS) {
        const fieldObservations = await observationStore.listObservations(canonicalId, field);
        if (fieldObservations.length) {
          reconciledFields.push(reconcileObservations(fieldObservations)[0]);
        }
      }

      const canonical = chooseCanonicalEvent({ existing, incoming: { ...incoming, id: canonicalId }, reconciledFields });
      canonical.source = canonical.source ?? { id: sourceId, type: sourceType };
      canonical.updatedAt = observedAt;
      await eventStore.putEvent(canonical);

      return {
        event: canonical,
        canonicalId,
        matched: Boolean(existing),
        matchScore: match?.score ?? 0,
        observations,
        reconciledFields,
        verified: reconciledFields.some((item) => item.verification === 'corroborated' || item.verification === 'verified'),
        conflicted: reconciledFields.some((item) => item.verification === 'conflicted'),
      };
    },
  });
}
