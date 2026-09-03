import Link from 'next/link';
import { getTeams } from '@/lib/data';

export const revalidate = 300;

export default async function TeamsPage() {
  const teams = await getTeams();
  return (
    <section className="section">
      <p className="eyebrow">TEAM DIRECTORY</p>
      <h1 className="page-title">FIND YOUR<br /><em>TEAM.</em></h1>
      <p className="lede dark">Senior sides, women’s teams, youth teams, reserves, national teams and clubs live in one connected catalogue.</p>
      <div className="catalogue-actions"><Link className="button button-dark" href="/catalogue">Back to catalogue</Link></div>
      <div className="index-grid">
        {teams.map((team) => (
          <Link className="index-card" href={`/teams/${team.slug}`} key={team.id}>
            <span>{team.age_group.toUpperCase()} · {team.gender.toUpperCase()}</span>
            <b>{team.name}</b>
            <small>{team.country || 'Worldwide'} · {team.team_type}</small>
          </Link>
        ))}
      </div>
      {teams.length === 0 && <div className="empty-state">Teams will appear here as the global catalogue is ingested.</div>}
    </section>
  );
}
