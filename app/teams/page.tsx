import Link from 'next/link';
import { getCatalogueTeams, getCountries } from '@/lib/catalogue';

export const revalidate = 300;

type Props = { searchParams: Promise<{ country?: string; age?: string }> };

export default async function TeamsPage({ searchParams }: Props) {
  const params = await searchParams;
  const [teams, countries] = await Promise.all([getCatalogueTeams({ countryId: params.country, ageGroup: params.age }), getCountries()]);
  return <section className="section"><p className="eyebrow">GLOBAL TEAM INDEX</p><h1 className="page-title">EVERY<br /><em>TEAM.</em></h1><p className="lede dark">Clubs, national teams, reserves and youth sides in one connected catalogue.</p><div className="filter-bar"><Link className={!params.country && !params.age ? 'filter-active' : ''} href="/teams">All</Link>{countries.slice(0, 18).map((country) => <Link className={params.country === country.id ? 'filter-active' : ''} href={`/teams?country=${country.id}`} key={country.id}>{country.name}</Link>)}<Link className={params.age === 'youth' ? 'filter-active' : ''} href="/teams?age=youth">Youth</Link></div><div className="catalogue-actions"><Link className="button button-dark" href="/catalogue">Back to catalogue</Link></div><p className="result-count">Showing {Math.min(teams.length, 300)} of {teams.length} teams</p><div className="index-grid">{teams.slice(0, 300).map((team) => <Link className="index-card" href={`/teams/${team.slug}`} key={team.id}><span>{team.team_type} · {team.gender} · {team.age_group}</span><b>{team.name}</b><small>{team.level ?? 'Worldwide football'}</small></Link>)}</div>{teams.length === 0 && <div className="empty-state">No teams match the selected filter.</div>}</section>;
}
