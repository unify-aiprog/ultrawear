/** Non-gambling community interaction contracts for live events. */

export const INTERACTION_TYPES = Object.freeze(['reaction', 'question', 'poll', 'prediction']);

export function createInteraction({ id, eventId, type, prompt, options = [], createdBy, createdAt = new Date().toISOString() }) {
  if (!id || !eventId || !INTERACTION_TYPES.includes(type) || !prompt || !createdBy) throw new TypeError('Invalid community interaction');
  if ((type === 'poll' || type === 'prediction') && options.length < 2) throw new TypeError('Polls and predictions require options');
  return Object.freeze({ id, eventId, type, prompt, options: [...options], createdBy, createdAt });
}

export function recordResponse(interaction, { userId, option = null, value = null, createdAt = new Date().toISOString() }) {
  if (!interaction || !userId) throw new TypeError('Interaction and user are required');
  return Object.freeze({ interactionId: interaction.id, userId, option, value, createdAt });
}
