/**
 * Server-only Sportradar Soccer v4 client.
 * Credentials are read from the deployment environment and never exposed to browsers.
 */

const BASE_URL = 'https://api.sportradar.com';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function config(env = {}) {
  const apiKey = clean(env.SPORTRADAR_API_KEY);
  if (!apiKey) throw new Error('SPORTRADAR_API_KEY is not configured');
  return {
    apiKey,
    accessLevel: clean(env.SPORTRADAR_ACCESS_LEVEL) || 'trial',
    language: clean(env.SPORTRADAR_LANGUAGE) || 'en',
  };
}

async function request(path, env, fetchImpl = fetch) {
  const settings = config(env);
  const response = await fetchImpl(`${BASE_URL}${path}`, {
    headers: { accept: 'application/json', 'x-api-key': settings.apiKey },
  });
  if (!response.ok) {
    throw new Error(`Sportradar request failed: HTTP ${response.status}`);
  }
  return response.json();
}

export function createSportradarSoccerClient(env, fetchImpl = fetch) {
  const settings = config(env);
  const prefix = `/soccer/${settings.accessLevel}/v4/${settings.language}`;
  return Object.freeze({
    dailySummaries(date) {
      const value = clean(date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError('A YYYY-MM-DD date is required');
      return request(`${prefix}/schedules/${value}/summaries.json`, env, fetchImpl);
    },
    liveSummaries() {
      return request(`${prefix}/schedules/live/summaries.json`, env, fetchImpl);
    },
    competitorSummaries(competitorId) {
      const value = clean(competitorId);
      if (!value) throw new TypeError('A competitor id is required');
      return request(`${prefix}/competitors/${encodeURIComponent(value)}/summaries.json`, env, fetchImpl);
    },
  });
}
