/**
 * Deterministic reconciliation for event moments.
 *
 * A provider moment is an observation, not a verified fact. Moments are matched
 * by canonical event + occurrence identity, then their fields are reconciled so
 * sources can corroborate or conflict without duplicating the timeline.
 */

import { MOMENT_TYPES } from './events.js';
import { createObservation, reconcileObservations } from './knowledge-ledger.js';

const MOMENT_FIELDS = Object.freeze([
  'type',
  'occurredAt',
  'minute',
  'title',
  'description',
  'actor',
  'team',
  'related',
  'animation',
]);

function valueKey(value) {
  return value == null ? '' : JSON.stringify(value);
}

function identityPart(value) {
  return encodeURIComponent(valueKey(value));
}

export function canonicalMomentIdentity(eventId, moment) {
  if (!eventId || !moment?.type || !moment?.occurredAt) return null;
  return [
    'moment',
    eventId,
    identityPart(moment.type),
    identityPart(moment.occurredAt),
    identityPart(moment.actor?.id ?? moment.actor?.name ?? ''),
    identityPart(moment.team?.id ?? moment.team?.name ?? ''),
    identityPart(moment.minute ?? ''),
  ].join(':');
}

function canonicalFieldValue(item) {
  return item?.verification === 'conflicted' ? null : item?.value ?? null;
}

function buildMoment({ canonicalId, reconciled }) {
  const get = (field, fallback = null) => canonicalFieldValue(reconciled.find((item) => item.field === field)) ?? fallback;
  const type = get('type');
  const occurredAt = get('occurredAt');
  if (!type || !MOMENT_TYPES.includes(type) || !occurredAt) return null;

  const moment = {
    id: canonicalId,
    type,
    occurredAt,
    minute: get('minute'),
    title: get('title'),
    description: get('description'),
    actor: get('actor'),
    team: get('team'),
    related: get('related', []),
    animation: get('animation'),
    verified: reconciled.some((item) => item.verification === 'verified' || item.verification === 'corroborated'),
    source: {
      id: 'canonical-moment-reconciliation',
      type: 'reconciled',
      sources: [...new Set(reconciled.flatMap((item) => item.sources ?? []))],
    },
  };

  return moment;
}

async function reconcileOne({ eventId, moment, sourceId, observedAt, sourceConfidence, observationStore }) {
  const canonicalId = canonicalMomentIdentity(eventId, moment);
  if (!canonicalId) return null;
  const confidence = Math.min(1, Math.max(0, Number(sourceConfidence({ sourceId, moment })) || 0));

  for (const field of MOMENT_FIELDS) {
    if (moment[field] == null) continue;
    const observation = createObservation({
      entityId: canonicalId,
      entityType: 'moment',
      field,
      value: moment[field],
      sourceId,
      observedAt,
      confidence,
    });
    await observationStore.putObservation(observation);
  }

  const reconciled = [];
  for (const field of MOMENT_FIELDS) {
    const observations = await observationStore.listObservations(canonicalId, field, 'moment');
    if (observations.length) reconciled.push(reconcileObservations(observations)[0]);
  }

  return {
    moment: buildMoment({ canonicalId, reconciled }),
    canonicalId,
    reconciled,
    verified: reconciled.some((item) => item.verification === 'verified' || item.verification === 'corroborated'),
    conflicted: reconciled.some((item) => item.verification === 'conflicted'),
  };
}

export function createMomentReconciler({ observationStore, sourceConfidence = () => 0.7 }) {
  if (!observationStore || typeof observationStore.putObservation !== 'function' || typeof observationStore.listObservations !== 'function') {
    throw new TypeError('Observation store is required');
  }

  return Object.freeze({
    async reconcile({ eventId, incomingMoments = [], existingMoments = [], sourceId, observedAt }) {
      if (!eventId || !sourceId || !observedAt) throw new TypeError('Event, source and observedAt are required');
      const results = [];
      for (const moment of Array.isArray(incomingMoments) ? incomingMoments : []) {
        const result = await reconcileOne({ eventId, moment, sourceId, observedAt, sourceConfidence, observationStore });
        if (result) results.push(result);
      }

      const byId = new Map();
      for (const moment of Array.isArray(existingMoments) ? existingMoments : []) {
        const id = canonicalMomentIdentity(eventId, moment) ?? moment.id;
        if (id) byId.set(id, { ...moment, id });
      }
      for (const result of results) {
        if (result.moment) byId.set(result.canonicalId, result.moment);
      }

      const moments = [...byId.values()].sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)));
      return Object.freeze({
        moments,
        results,
        verified: results.some((result) => result.verified),
        conflicted: results.some((result) => result.conflicted),
      });
    },
  });
}
