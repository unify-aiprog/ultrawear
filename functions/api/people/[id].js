export async function onRequestGet({ params, env }) {
  const personId = typeof params?.id === 'string' ? params.id.trim() : '';
  if (!personId) {
    return Response.json({ error: 'Person id is required' }, { status: 400 });
  }

  if (!env?.PERSON_STORE) {
    return Response.json({ error: 'Person store is not configured' }, { status: 503 });
  }

  const raw = await env.PERSON_STORE.get(personId);
  if (!raw) {
    return Response.json({ error: 'Person not found' }, { status: 404 });
  }

  let person;
  try {
    person = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'Stored person data is invalid' }, { status: 500 });
  }

  return Response.json(
    { person },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
