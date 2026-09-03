import Link from 'next/link';
import { getCatalogueCompetitions, getSports } from '@/lib/catalogue';

export const revalidate = 300;

export default async function SportsPage() {
  const [sports, competitions] = await Promise.all([getSports(), getCatalogueCompetitions()]);
  return <div className="page-wrap"><section className="page-hero"><p className="eyebrow">ULTRAWEAR FC · FOR COMMUNITY</p><h1>Sports<br /><em>world.</em></h1><p>Football launches first. The sports graph is provider-neutral so UltraWear can expand across the world of sport without rebuilding its core.</p></section><section className="detail-section"><div className="section-heading"><span>01</span><h2>SPORTS.</h2></div><div className="index-grid">{sports.map((sport) => <Link className="index-card" href="/sports" key={sport.id}><span>SPORT</span><b>{sport.name}</b><small>{sport.description ?? 'Explore this sport.'}</small></Link>)}</div></section><section className="detail-section"><div className="section-heading"><span>02</span><h2>COMPETITIONS.</h2></div><div className="index-grid">{competitions.slice(0, 120).map((competition) => <Link className="index-card" href={`/competitions/${competition.slug}`} key={competition.id}><span>{competition.competition_type} · {competition.gender}</span><b>{competition.name}</b><small>{competition.level ?? 'Global competition'}</small></Link>)}</div>{!competitions.length && <div className="empty-state">Competition data is being connected. Run the sports sync to populate this index.</div>}</section></div>;
}
