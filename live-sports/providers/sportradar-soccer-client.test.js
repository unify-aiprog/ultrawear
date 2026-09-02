import assert from 'node:assert/strict';
import test from 'node:test';
import { createSportradarSoccerClient } from './sportradar-soccer-client.js';

test('builds authenticated daily and live Sportradar requests', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, async json() { return { ok: true }; } };
  };
  const client = createSportradarSoccerClient({ SPORTRADAR_API_KEY: 'test-key' }, fetchImpl);
  await client.dailySummaries('2026-09-02');
  await client.liveSummaries();

  assert.equal(calls[0].url, 'https://api.sportradar.com/soccer/trial/v4/en/schedules/2026-09-02/summaries.json');
  assert.equal(calls[1].url, 'https://api.sportradar.com/soccer/trial/v4/en/schedules/live/summaries.json');
  assert.equal(calls[0].options.headers['x-api-key'], 'test-key');
});

test('builds competitor summaries requests', async () => {
  let url = '';
  const client = createSportradarSoccerClient({ SPORTRADAR_API_KEY: 'test-key', SPORTRADAR_ACCESS_LEVEL: 'production' }, async (requestUrl) => {
    url = requestUrl;
    return { ok: true, async json() { return {}; } };
  });
  await client.competitorSummaries('sr:competitor:17');
  assert.equal(url, 'https://api.sportradar.com/soccer/production/v4/en/competitors/sr%3Acompetitor%3A17/summaries.json');
});
