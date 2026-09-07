export type SportsInterest = 'football' | 'basketball' | 'athletics' | 'tennis' | 'motorsport' | 'womens-sport' | 'emerging-sport';

export type SportsIdentity = {
  id: string;
  handle: string;
  displayName: string;
  interests: SportsInterest[];
  followedTeams: string[];
  followedAthletes: string[];
  followedCommunities: string[];
  xp: number;
  level: number;
  badges: string[];
  createdAt: string;
};

const KEY = 'uw-sports-identity';

export function createSportsIdentity(): SportsIdentity {
  const seed = Math.random().toString(36).slice(2, 9);
  return {
    id: `fan_${seed}`,
    handle: `fan_${seed}`,
    displayName: 'New Fan',
    interests: ['football'],
    followedTeams: [],
    followedAthletes: [],
    followedCommunities: [],
    xp: 0,
    level: 1,
    badges: ['FIRST SIGNAL'],
    createdAt: new Date().toISOString(),
  };
}

export function loadSportsIdentity(): SportsIdentity {
  if (typeof window === 'undefined') return createSportsIdentity();
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as SportsIdentity;
  } catch {}
  const identity = createSportsIdentity();
  window.localStorage.setItem(KEY, JSON.stringify(identity));
  return identity;
}

export function saveSportsIdentity(identity: SportsIdentity) {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(identity));
}

export function toggleInterest(identity: SportsIdentity, interest: SportsInterest): SportsIdentity {
  const interests = identity.interests.includes(interest)
    ? identity.interests.filter((item) => item !== interest)
    : [...identity.interests, interest];
  return { ...identity, interests: interests.length ? interests : ['football'] };
}

export function follow(identity: SportsIdentity, collection: 'followedTeams' | 'followedAthletes' | 'followedCommunities', value: string): SportsIdentity {
  const current = identity[collection];
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  return { ...identity, [collection]: next };
}
