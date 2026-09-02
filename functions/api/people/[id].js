function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function jsonError(message, status) {
  return Response.json({ error: message }, { status });
}

function normalizeHistory(history, limit) {
  return history
    .filter((item) => item && item.eventId)
    .sort((a, b) => String(b.startsAt || '').localeCompare(String(a.startsAt || '')))
    .slice(0, limit);
}

export async function onRequestGet({ params, env }) {
  const personId = clean(params?.id);
  if (!personId) return jsonError('Person id is required', 400);
  if (!env?.PERSON_STORE) return jsonError('Person store is not configured', 503);

  const raw = await env.PERSON_STORE.get(personId);
  if (!raw) return jsonError('Person not found', 404);

  let person;
  try {
    person = JSON.parse(raw);
  } catch {
    return jsonError('Stored person data is invalid', 500);
  }

  const requestedLimit = Number.parseInt(params?.limit, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 20) : 10;

  let performances = Array.isArray(person.performances) ? person.performances : [];
  if (!performances.length && env.PLAYER_HISTORY?.get) {
    const historyKey = `player:${personId}:events`;
    const historyRaw = await env.PLAYER_HISTORY.get(historyKey);
    if (historyRaw) {
      try {
        performances = JSON.parse(historyRaw);
      } catch {
        performances = [];
      }
    }
  }

  const recentPerformances = normalizeHistory(performances, limit);
  const responsePerson = {
    ...person,
    recentPerformances,
  };

  return Response.json(
    { person: responsePerson },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
