/**
 * Projects canonical event data into the UltraWear knowledge graph.
 *
 * This is deliberately deterministic: the same event can be replayed after
 * re-ingestion without creating duplicate relationships.
 */

import { createGraphEdge, createGraphEntity } from './entity-graph.js';

function idOf(entity) {
  return entity?.id ?? entity?.entityId ?? entity?.teamId ?? entity?.personId ?? null;
}

export async function projectEvent(graph, event, { sourceId = null, observedAt = event?.updatedAt ?? new Date().toISOString() } = {}) {
  if (!graph || !event?.id) throw new TypeError('Graph and event are required');

  const entities = [
    createGraphEntity({ type: 'event', id: event.id, label: `${event.home?.name ?? 'Home'} vs ${event.away?.name ?? 'Away'}` }),
    createGraphEntity({ type: 'sport', id: event.sport, label: event.sport }),
    createGraphEntity({ type: 'competition', id: event.competition?.id ?? event.competition, label: event.competition?.name ?? event.competition }),
  ];

  for (const team of [event.home, event.away]) {
    const id = idOf(team);
    if (id) entities.push(createGraphEntity({ type: 'team', id, label: team.name ?? id }));
  }

  for (const performance of event.performances ?? []) {
    const personId = idOf(performance);
    if (!personId) continue;
    entities.push(createGraphEntity({ type: 'player', id: personId, label: performance.name ?? personId }));
    await graph.putEdge(createGraphEdge({
      from: `player:${personId}`,
      to: `event:${event.id}`,
      relation: 'performed_in',
      observedAt,
      sourceId,
      confidence: 1,
    }));
  }

  for (const entity of entities) await graph.putEntity(entity);

  const eventKey = `event:${event.id}`;
  await graph.putEdge(createGraphEdge({ from: eventKey, to: `sport:${event.sport}`, relation: 'in_sport', observedAt, sourceId }));
  await graph.putEdge(createGraphEdge({
    from: eventKey,
    to: `competition:${event.competition?.id ?? event.competition}`,
    relation: 'in_competition',
    observedAt,
    sourceId,
  }));

  for (const team of [event.home, event.away]) {
    const id = idOf(team);
    if (!id) continue;
    await graph.putEdge(createGraphEdge({ from: eventKey, to: `team:${id}`, relation: 'features_team', observedAt, sourceId }));
  }

  return { eventId: event.id, entitiesProjected: entities.length };
}
