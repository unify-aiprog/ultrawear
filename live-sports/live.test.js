import assert from 'node:assert/strict';
import { createSportEvent, updateEvent } from './events.js';
import { createInteraction, recordResponse } from './community.js';
import { createFollow, createAlertCandidate } from './follow.js';
import { rankLocationLayers } from './location.js';

const event = createSportEvent({ id: 'e1', sport: 'football', competition: 'League', home: { id: 'h', name: 'Home' }, away: { id: 'a', name: 'Away' }, startsAt: '2026-09-01T19:00:00Z' });
assert.equal(event.status, 'scheduled');
assert.equal(updateEvent(event, { status: 'live', score: { home: 1, away: 0 } }).score.home, 1);

const interaction = createInteraction({ id: 'p1', eventId: 'e1', type: 'poll', prompt: 'Who will win?', options: ['Home', 'Away'], createdBy: 'fan' });
assert.equal(recordResponse(interaction, { userId: 'u1', option: 'Home' }).option, 'Home');

const follow = createFollow({ userId: 'u1', type: 'team', targetId: 'h' });
assert.equal(createAlertCandidate({ follow, eventId: 'e1', reason: 'match_started' }).priority, 'normal');

const ranked = rankLocationLayers([
  { id: 'global', relevance: 10, location: { layer: 'global' } },
  { id: 'ng', relevance: 10, location: { layer: 'country', country: 'NG' } },
], { country: 'NG' });
assert.equal(ranked[0].id, 'ng');

console.log('live sports contracts: ok');
