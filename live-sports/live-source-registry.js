/** Provider-neutral registry for server-side live sport sources. */

export function createLiveSourceRegistry({ sources = [] } = {}) {
  const entries = new Map();

  const register = (source) => {
    if (!source?.id || typeof source.fetch !== 'function' || typeof source.normalize !== 'function') {
      throw new TypeError('Live source requires id, fetch and normalize functions');
    }
    if (entries.has(source.id)) throw new Error(`Live source already registered: ${source.id}`);
    entries.set(source.id, Object.freeze({ ...source }));
    return source;
  };

  sources.forEach(register);

  return Object.freeze({
    register,
    get(id) { return entries.get(id) ?? null; },
    list() { return [...entries.values()]; },
    async fetchAll(context = {}) {
      const settled = await Promise.allSettled([...entries.values()].map(async (source) => {
        const payload = await source.fetch(context);
        const events = Array.isArray(payload) ? payload : [];
        return {
          sourceId: source.id,
          sport: source.sport ?? null,
          events: events.map((item) => source.normalize(item, context)).filter(Boolean),
        };
      }));

      return settled.map((result, index) => {
        const source = [...entries.values()][index];
        if (result.status === 'fulfilled') return result.value;
        return {
          sourceId: source.id,
          sport: source.sport ?? null,
          events: [],
          ok: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      });
    },
  });
}
