import type { SportsInterest } from '@/lib/identity/sports-identity';

export type DiscoveryItem = { id: string; sport: SportsInterest; title: string; reason: string; tags: string[] };

const CATALOG: DiscoveryItem[] = [
  { id: 'women-football', sport: 'womens-sport', title: 'Women’s football', reason: 'A fast-growing side of the game worth adding to your world.', tags: ['football', 'community'] },
  { id: 'track-field', sport: 'athletics', title: 'Athletics', reason: 'Follow the athletes between the headlines and discover the season.', tags: ['global', 'athletes'] },
  { id: 'court-culture', sport: 'basketball', title: 'Basketball culture', reason: 'More than a score: players, style and community.', tags: ['culture', 'live'] },
  { id: 'tennis-world', sport: 'tennis', title: 'Tennis world', reason: 'Rivalries, surfaces and a global calendar in one lane.', tags: ['rivalries', 'global'] },
  { id: 'motorsport-grid', sport: 'motorsport', title: 'Motorsport grid', reason: 'Speed, strategy and a season that never stands still.', tags: ['strategy', 'live'] },
  { id: 'new-sports', sport: 'emerging-sport', title: 'The next sport', reason: 'Meet communities building the future of sport.', tags: ['discovery', 'future'] },
];

export function recommendDiscovery(interests: SportsInterest[], limit = 3): DiscoveryItem[] {
  const preferred = CATALOG.filter((item) => !interests.includes(item.sport));
  const familiar = CATALOG.filter((item) => interests.includes(item.sport));
  return [...preferred, ...familiar].slice(0, limit);
}
