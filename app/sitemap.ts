import type { MetadataRoute } from 'next';
import { getCompetitions } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const staticRoutes = ['', '/sports', '/fixtures', '/news', '/about', '/contact', '/privacy', '/terms', '/shop'];
  const competitions = await getCompetitions();
  return [
    ...staticRoutes.map(path => ({ url: `${base}${path}`, changeFrequency: 'weekly' as const })),
    ...competitions.map(c => ({ url: `${base}/competitions/${c.slug}`, changeFrequency: 'daily' as const })),
  ];
}
