/** Provider-neutral platform trigger boundary for durable ingestion. */

export function createScheduledExecution({ worker } = {}) {
  if (!worker || typeof worker.runScheduled !== 'function') {
    throw new TypeError('worker with runScheduled is required');
  }

  return Object.freeze({
    async run(at = Date.now()) {
      const results = await worker.runScheduled(at);
      return {
        ok: true,
        at: new Date(at).toISOString(),
        results: Array.isArray(results) ? results : [],
      };
    },
  });
}

export async function runScheduledExecution({ worker, at = Date.now() } = {}) {
  return createScheduledExecution({ worker }).run(at);
}
