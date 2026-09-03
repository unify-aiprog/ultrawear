import Link from 'next/link';
import { getCompetitions } from '@/lib/data';

export const revalidate = 300;

export default async function SportsPage() {
  const competitions = await getCompetitions();
  return <section className="section"><p className="eyebrow">ULTRAWEAR FC</p><h1 className="page-title">SPORTS<br /><em>WORLD.</em></h1><p className="lede dark">Football launches first. The data model is sport-agnostic so UltraWear can expand without rebuilding the platform.</p><div className="index-grid">{competitions.map(c => <Link className="index-card" href={`/competitions/${c.slug}`} key={c.id}><span>{c.sport.toUpperCase()}</span><b>{c.name}</b><small>{c.country || 'Worldwide'}</small></Link>)}</div>{competitions.length === 0 && <div className="empty-state">Competition data is being connected. Check back soon.</div>}</section>;
}
