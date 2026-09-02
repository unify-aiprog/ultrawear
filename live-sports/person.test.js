import { addPersonRole, createPerson } from './person.js';

test('person supports multiple career roles', () => {
  const person = createPerson({
    id: 'person-1',
    name: 'Test Person',
    roles: ['player'],
    sportIds: ['football'],
  });

  const manager = addPersonRole(person, 'manager');
  expect(manager.roles).toEqual(['player', 'manager']);
  expect(manager.id).toBe('person-1');
});

test('person normalizes duplicate roles and sport ids', () => {
  const person = createPerson({
    id: 'person-2',
    name: 'Multi Sport',
    roles: ['player', 'player', 'athlete'],
    sportIds: ['football', 'tennis', 'football'],
  });

  expect(person.roles).toEqual(['player', 'athlete']);
  expect(person.sportIds).toEqual(['football', 'tennis']);
});

test('person rejects unsupported roles', () => {
  expect(() => createPerson({ id: 'person-3', name: 'Unknown', roles: ['referee'] })).toThrow();
});
