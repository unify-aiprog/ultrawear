import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTeam, getTeams } from '@/lib/data';

export const revalidate = 300;

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await getTeam(slug);
  if (!team) notFound();
  const relatedTeams = team.organization_id ? await getTeams({ organizationId: team.organization_id }) : [];

  return (
    <section className="section">
      <p className="eyebrow">TEAM PROFILE</p>
      <h1 className="page-title">{team.name.toUpperCase()}</h1>
      <p className="lede dark">{team.country || 'Worldwide'} · {team.age_group} · {team.gender} · {team.team_type}</p>

      <div className="profile-grid">
        <div className="profile-card"><span>SPORT</span><strong>{team.sport || 'Football'}</strong></div>
        <div className="profile-card"><span>LEVEL</span><strong>{team.age_group}</strong></div>
        <div className="profile-card"><span>GENDER</span><strong>{team.gender}</strong></div>
        <div className="profile-card"><span>TYPE</span><strong>{team.team_type}</strong></div>
      </div>

      {relatedTeams.length > 1 && (
        <div className="catalogue-section">
          <div className="section-heading"><span>01</span><h2>CONNECTED TEAMS</h2></div>
          <div className="index-grid">
            {relatedTeams.filter((item) => item.id !== team.id).map((item) => (
              <Link className="index-card" href={`/teams/${item.slug}`} key={item.id}>
                <span>{item.age_group.toUpperCase()} · {item.gender.toUpperCase()}</span>
                <b>{item.name}</b>
                <small>{item.team_type}</small>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="catalogue-actions"><Link className="button button-dark" href="/teams">All teams</Link><Link className="button button-outline" href="/catalogue">Global catalogue</Link></div>
    </section>
  );
}
