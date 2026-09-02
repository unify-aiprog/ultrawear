/** Deterministic audit records for canonical fact transitions. */

export const FACT_AUDIT_ACTIONS = Object.freeze(['accepted', 'changed', 'conflicted', 'corrected', 'reverified']);

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export function factAuditAction({ before = null, after, previousValue = undefined } = {}) {
  if (!after?.verification) throw new TypeError('after reconciliation is required');
  if (!before) return 'accepted';
  if (after.verification === 'conflicted') return 'conflicted';
  if (before.verification === 'conflicted' && after.verification !== 'conflicted') return 'corrected';
  if (before.verification !== after.verification && after.verification === 'corroborated') return 'reverified';
  if (previousValue !== undefined && stable(previousValue) !== stable(after.value)) return 'changed';
  return null;
}

export function createFactAuditRecord({ entityId, entityType, field, sourceId, observedAt, before = null, after, previousValue = undefined, reason = null } = {}) {
  if (!entityId || !entityType || !field || !sourceId || !observedAt) throw new TypeError('Audit identity is required');
  if (!after?.verification) throw new TypeError('after reconciliation is required');
  const action = factAuditAction({ before, after, previousValue });
  if (!action) return null;
  return {
    id: `fact-audit:${entityType}:${entityId}:${field}:${observedAt}:${sourceId}`,
    entityId, entityType, field, action, sourceId, observedAt,
    previousValue: previousValue === undefined ? null : previousValue,
    value: after.value,
    previousVerification: before?.verification ?? null,
    verification: after.verification,
    sources: after.sources ?? [], reason,
  };
}
