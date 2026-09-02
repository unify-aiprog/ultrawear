import { createEntityGraphStore, createGraphEdge, createGraphEntity } from './entity-graph.js';

function createMemoryKv() {
  const data = new Map();
  return {
    async put(key, value) { data.set(key, value); },
    async get(key, type) {
      const value = data.get(key);
      return value == null ? null : type === 'json' ? JSON.parse(value) : value;
    },
    async list({ prefix }) {
      return { keys: [...data.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })) };
    },
  };
}

test('creates and retrieves graph entities and relationships', async () => {
  const graph = createEntityGraphStore(createMemoryKv());
  const arsenal = createGraphEntity({ type: 'team', id: 'arsenal', label: 'Arsenal' });
  const saka = createGraphEntity({ type: 'player', id: 'saka', label: 'Bukayo Saka' });
  await graph.putEntity(arsenal);
  await graph.putEntity(saka);

  await graph.putEdge(createGraphEdge({
    from: saka.key,
    to: arsenal.key,
    relation: 'plays_for',
    observedAt: '2026-09-02T10:00:00Z',
    sourceId: 'test',
  }));

  expect(await graph.getEntity('player', 'saka')).toEqual(saka);
  expect(await graph.listEdgesFrom(saka.key)).toHaveLength(1);
});

test('rejects invalid graph types', () => {
  expect(() => createGraphEntity({ type: 'stadium', id: 'x' })).toThrow('Invalid graph entity');
});
