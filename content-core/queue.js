export function enqueueOpportunities(existing = [], opportunities = []) {
  const byId = new Map(existing.map((item) => [item.id, item]));
  for (const opportunity of opportunities) {
    if (!byId.has(opportunity.id)) byId.set(opportunity.id, opportunity);
  }
  return [...byId.values()].sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt));
}

export function nextEditorialWork(queue = []) {
  return queue.find((item) => item.status === 'open') || null;
}

export function closeOpportunity(queue, id, status = 'accepted') {
  return queue.map((item) => (item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item));
}
