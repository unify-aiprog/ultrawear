import { z } from 'zod';
import type { SportsEvent } from './types';

export const sportsEventSchema = z.object({
  id: z.string().min(1), sport: z.enum(['football', 'basketball', 'tennis', 'running', 'other']),
  competition: z.string().min(1), home: z.string().min(1), away: z.string().min(1),
  homeScore: z.number().int().nullable(), awayScore: z.number().int().nullable(), minute: z.number().int().nonnegative().optional(),
  eventType: z.enum(['match_started', 'score_change', 'match_ended', 'milestone', 'fixture', 'story']),
  status: z.enum(['scheduled', 'live', 'finished']), occurredAt: z.string(), source: z.object({ name: z.string(), url: z.string().url().optional() }),
  verification: z.enum(['verified', 'unverified', 'unknown']), importance: z.number().min(0).max(100), tags: z.array(z.string())
});

export function validateEvent(input: unknown): SportsEvent { return sportsEventSchema.parse(input); }
export function scoreEvent(event: SportsEvent): number {
  let score = event.importance;
  if (event.status === 'live') score += 10;
  if (event.eventType === 'score_change') score += 10;
  if (event.verification !== 'verified') score -= 30;
  return Math.max(0, Math.min(100, score));
}
