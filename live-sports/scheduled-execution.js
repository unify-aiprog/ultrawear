/** Provider-neutral platform trigger boundary for durable ingestion. */

export function createScheduledExecution({ worker } = {}) {
  if (!worker || typeof worker.runScheduled !== 'function') {
    throw new TypeError('worker with runScheduled is required');
  }

  return Object.freeze({
    async run(at = Date.now()) {
      if (typeof worker.hydrate === 'function') await worker.hydrate();
      const results = await worker.runScheduled(at);
      const revalidation = typeof worker.drainRevalidation === 'function'
        ? await worker.drainRevalidation()
        : { results: [], errors: [], pending: 0 };
      return {
        ok: true,
        at: new Date(at).toISOString(),
        results: Array.isArray(results) ? results : [],
        revalidation,
      };
    },
  });
}

export async function runScheduledExecution({ worker, at = Date.now() } = {}) {
  return createScheduledExecution({ worker }).run(at);
}
