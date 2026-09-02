/** Provider-neutral read model for canonical fact verification history. */

export function createVerificationHistory({ auditStore } = {}) {
  if (!auditStore || typeof auditStore.listAudits !== 'function') {
    throw new TypeError('Audit store with listAudits is required');
  }

  return Object.freeze({
    async forEvent(eventId, { field = null, limit = 100 } = {}) {
      if (!eventId) throw new TypeError('eventId is required');
      const boundedLimit = Math.min(500, Math.max(1, Number(limit) || 100));
      const records = await auditStore.listAudits({ entityId: eventId, field });
      return records
        .sort((a, b) => a.observedAt.localeCompare(b.observedAt) || a.id.localeCompare(b.id))
        .slice(-boundedLimit)
        .map(({ id, entityId, entityType, field: recordField, action, sourceId, observedAt, previousValue, value, previousVerification, verification, sources, reason }) => ({
          id,
          entityId,
          entityType,
          field: recordField,
          action,
          sourceId,
          observedAt,
          previousValue,
          value,
          previousVerification,
          verification,
          sources,
          reason,
        }));
    },
  });
}
