export async function onRequestGet({ env }) {
  const configured = typeof env?.SPORTRADAR_API_KEY === 'string' && env.SPORTRADAR_API_KEY.trim().length > 0;
  return Response.json({
    provider: 'Sportradar',
    sport: 'Soccer',
    configured,
    accessLevel: env?.SPORTRADAR_ACCESS_LEVEL || 'trial',
    language: env?.SPORTRADAR_LANGUAGE || 'en',
    feeds: {
      dailySummaries: '/api/sports/soccer/daily',
      liveSummaries: '/api/sports/soccer/live',
      competitorSummaries: '/api/teams/{competitorId}/sportradar-summary',
    },
    nextAction: configured ? 'Feed credentials are configured; call the live endpoint to verify data.' : 'Configure SPORTRADAR_API_KEY in the server environment.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
