import { z } from 'zod';

export const sportsEventSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['scheduled', 'live', 'finished', 'postponed', 'cancelled', 'unknown']),
  home: z.object({ id: z.string().min(1), name: z.string().min(1) }),
  away: z.object({ id: z.string().min(1), name: z.string().min(1) }),
  startTime: z.string().datetime({ offset: true }).nullable(),
  score: z.object({ home: z.number().int().nonnegative(), away: z.number().int().nonnegative() }).nullable(),
  source: z.object({ provider: z.string().min(1), url: z.string().url().nullable() }),
  fetchedAt: z.string().datetime({ offset: true }),
});

export type SportsEvent = z.infer<typeof sportsEventSchema>;

export function validateSportsEvent(input: unknown): SportsEvent | null {
  const result = sportsEventSchema.safeParse(input);
  return result.success ? result.data : null;
}
