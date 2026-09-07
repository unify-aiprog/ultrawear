export type CommunityPost = {
  id: string;
  author: string;
  community: string;
  body: string;
  createdAt: string;
  reactions: number;
};

const KEY = 'uw-community-posts';

export const seedPosts: CommunityPost[] = [
  { id: 'seed-1', author: 'UltraWear', community: 'GLOBAL', body: 'Welcome to the live world. Bring a prediction, a perspective, or a sport someone else should discover.', createdAt: new Date().toISOString(), reactions: 42 },
  { id: 'seed-2', author: 'Matchday', community: 'FOOTBALL', body: 'What makes a match memorable after the final whistle? Tell the community.', createdAt: new Date().toISOString(), reactions: 18 },
  { id: 'seed-3', author: 'Court Vision', community: 'BASKETBALL', body: 'The best sports communities are built around participation, not just opinions. Who is watching tonight?', createdAt: new Date().toISOString(), reactions: 11 },
];

export function loadPosts(): CommunityPost[] {
  if (typeof window === 'undefined') return seedPosts;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as CommunityPost[];
  } catch {}
  window.localStorage.setItem(KEY, JSON.stringify(seedPosts));
  return seedPosts;
}

export function savePosts(posts: CommunityPost[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(posts));
}
