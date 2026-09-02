import { projectEvent } from './graph-projector.js';

function graphStub() {
  return {
    entities: [],
    edges: [],
    async putEntity(entity) { this.entities.push(entity); },
    async putEdge(edge) { this.edges.push(edge); },
  };
}

test('projects event teams, competition, sport and player performances', async () => {
  const graph = graphStub();
  const result = await projectEvent(graph, {
    id: 'ars-che-2026-09-02',
    sport: 'football',
    competition: { id: 'premier-league', name: 'Premier League' },
    home: { id: 'arsenal', name: 'Arsenal' },
    away: { id: 'chelsea', name: 'Chelsea' },
    startsAt: '2026-09-02T18:00:00Z',
    performances: [{ personId: 'saka', name: 'Bukayo Saka', stats: { goals: 1 } }],
    updatedAt: '2026-09-02T19:15:00Z',
  }, { sourceId: 'football-data', observedAt: '2026-09-02T19:15:00Z' });

  expect(result.entitiesProjected).toBe(6);
  expect(graph.entities.map((item) => item.key)).toEqual(expect.arrayContaining([
    'event:ars-che-2026-09-02',
    'sport:football',
    'competition:premier-league',
    'team:arsenal',
    'team:chelsea',
    'player:saka',
  ]));
  expect(graph.edges.map((item) => item.relation)).toEqual(expect.arrayContaining([
    'in_sport', 'in_competition', 'features_team', 'performed_in',
  ]));
});
