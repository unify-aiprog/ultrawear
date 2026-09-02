import assert from 'node:assert/strict';
import { isHighValueMoment, momentClass, normalizeMoment } from './moments.js';

const goal = normalizeMoment({ type: 'goal', sport: 'Football', team: 'ARS', verified: true });
assert.equal(goal.label, 'GOAL');
assert.equal(goal.intensity, 'high');
assert.equal(isHighValueMoment(goal), true);
assert.equal(momentClass(goal), 'moment-goal');

const ace = normalizeMoment({ type: 'ace', sport: 'Tennis', verified: false });
assert.equal(ace.label, 'ACE');
assert.equal(isHighValueMoment(ace), false);

const overtake = normalizeMoment({ type: 'overtake', sport: 'Formula 1', verified: true });
assert.equal(overtake.label, 'OVERTAKE');
assert.equal(momentClass(overtake), 'moment-overtake');

assert.equal(normalizeMoment({ type: 'made_up_event' }), null);
assert.equal(momentClass(null), '');

console.log('live-sports moments tests passed');
