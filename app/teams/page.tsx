import Link from 'next/link';
import { getCatalogueTeams } from '@/lib/catalogue';

export const revalidate = 300;

export default async function TeamsPage() {
  const teams = await getCatalogueTeams();
  return <section className="section"><p className="eyebrow">GLOBAL TEAM INDEX</p><h1 className="page-title">EVERY<br /><em>TEAM.</em></h1><p className="lede dark">Clubs, national teams, reserves and youth sides in one connected catalogue.</p><div className="catalogue-actions"><Link className="button button-dark" href="/catalogue">Back to catalogue</Link></div><div className="index-grid">{teams.slice(0, 300).map((team) => <Link className="index-card" href={`/teams/${team.slug}`} key={team.id}><span>{team.team_type} · {team.gender} · {team.age_group}</span><b>{team.name}</b><small>{team.level ?? 'Worldwide football'}</small></Link>)}</div>{teams.length === 0 && <div className="empty-state">Teams will appear here as the global catalogue is ingested.</div>}</section>;
}
