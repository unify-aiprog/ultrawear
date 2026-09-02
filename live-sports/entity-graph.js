/**
 * Provider-neutral sports knowledge graph primitives.
 *
 * The graph stores relationships between canonical sports entities. It does
 * not depend on any particular upstream provider and is intentionally small
 * enough to run on KV-backed infrastructure.
 */

const TYPES = new Set([
  'person', 'player', 'manager', 'team', 'sport', 'competition', 'season',
  'event', 'performance', 'moment', 'venue', 'award', 'content',
]);

function key(type, id) {
  if (!TYPES.has(type) || !id) throw new TypeError('Invalid graph entity');
  return `${type}:${id}`;
}

export function createGraphEntity({ type, id, label = null, attributes = {} }) {
  return {
    key: key(type, id),
    type,
    id,
    label,
    attributes: { ...attributes },
  };
}

export function createGraphEdge({ from, to, relation, observedAt, sourceId = null, confidence = 1 }) {
  if (!from || !to || !relation || !observedAt) throw new TypeError('Invalid graph edge');
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new TypeError('Confidence must be between 0 and 1');
  }
  return { from, to, relation, observedAt, sourceId, confidence };
}

export function createEntityGraphStore(namespace) {
  if (!namespace || typeof namespace.get !== 'function' || typeof namespace.put !== 'function') {
    throw new TypeError('KV namespace is required');
  }

  return Object.freeze({
    async putEntity(entity) {
      if (!entity?.key) throw new TypeError('Graph entity is required');
      await namespace.put(`entity:${entity.key}`, JSON.stringify(entity));
      return entity;
    },

    async getEntity(type, id) {
      const raw = await namespace.get(`entity:${key(type, id)}`, 'json');
      return raw ?? null;
    },

    async putEdge(edge) {
      if (!edge?.from || !edge?.to) throw new TypeError('Graph edge is required');
      const edgeKey = `${edge.from}:${edge.relation}:${edge.to}`;
      await namespace.put(`edge:${edgeKey}`, JSON.stringify(edge));
      return edge;
    },

    async listEdgesFrom(from) {
      const list = await namespace.list({ prefix: `edge:${from}:` });
      const values = await Promise.all((list.keys ?? []).map((item) => namespace.get(item.name, 'json')));
      return values.filter(Boolean);
    },
  });
}
