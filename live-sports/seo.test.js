import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMeta, eventJsonLd, personJsonLd } from './seo.js';

test('buildMeta creates deterministic page metadata', () => {
  assert.deepEqual(buildMeta({ title: 'Match', description: 'A match' }), {
    title: 'Match', description: 'A match', canonicalUrl: null, imageUrl: null, type: 'website',
  });
});

test('eventJsonLd exposes canonical sports event fields', () => {
  const data = eventJsonLd({ id: 'e1', startsAt: '2026-09-02T18:00:00Z', sport: 'Football', status: 'scheduled', home: { name: 'Home' }, away: { name: 'Away' } }, { url: '/event/e1' });
  assert.equal(data['@type'], 'SportsEvent');
  assert.equal(data.name, 'Home vs Away');
  assert.equal(data.url, '/event/e1');
});

test('personJsonLd preserves person identity fields', () => {
  const data = personJsonLd({ id: 'p1', name: 'Alex Example', roles: ['player', 'manager'], nationality: 'Nigeria' }, { url: '/person/p1' });
  assert.equal(data['@type'], 'Person');
  assert.equal(data.name, 'Alex Example');
  assert.equal(data.jobTitle, 'player, manager');
});
