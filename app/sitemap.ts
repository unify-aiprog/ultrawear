import type { MetadataRoute } from 'next';
import { getCatalogueCompetitions, getCatalogueTeams } from '@/lib/catalogue';
import { articles } from '@/lib/editorial';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const staticRoutes = ['', '/sports', '/teams', '/fixtures', '/live', '/news', '/about', '/contact', '/privacy', '/terms'];
  const [competitions, teams] = await Promise.all([getCatalogueCompetitions(), getCatalogueTeams()]);
  return [
    ...staticRoutes.map((path) => ({ url: `${base}${path}`, changeFrequency: path === '/live' ? 'hourly' as const : 'weekly' as const })),
    ...competitions.map((c) => ({ url: `${base}/competitions/${c.slug}`, changeFrequency: 'daily' as const })),
    ...teams.map((t) => ({ url: `${base}/teams/${t.slug}`, changeFrequency: 'daily' as const })),
    ...articles.map((article) => ({ url: `${base}/news/${article.slug}`, changeFrequency: 'monthly' as const })),
  ];
}
