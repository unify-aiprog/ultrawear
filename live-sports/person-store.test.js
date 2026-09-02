import { createPersonStore } from './person-store.js';

function memoryStore() {
  const values = new Map();
  return {
    async get(key) { return values.get(key) ?? null; },
    async put(key, value) { values.set(key, value); },
  };
}

test('person store persists and normalizes multi-role people', async () => {
  const backing = memoryStore();
  const store = createPersonStore(backing);

  await store.put({
    id: 'person-1',
    name: 'Example Person',
    roles: ['player', 'manager', 'player'],
    sportIds: ['football'],
  });

  await expect(store.get('person-1')).resolves.toMatchObject({
    id: 'person-1',
    type: 'person',
    roles: ['player', 'manager'],
    sportIds: ['football'],
  });
});

test('person store returns null for unknown people', async () => {
  const store = createPersonStore(memoryStore());
  await expect(store.get('missing')).resolves.toBeNull();
});
