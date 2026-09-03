import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPerson, getPersonEvents, getPersonTeams } from '@/lib/catalogue';

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 300;
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const person = await getPerson(slug); return { title: person?.name || 'Player' }; }

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params; const person = await getPerson(slug); if (!person) notFound();
  const country = Array.isArray(person.countries) ? person.countries[0] : person.countries;
  const [teams, events] = await Promise.all([getPersonTeams(person.id), getPersonEvents(person.id)]);
  return <div className="page-wrap"><section className="page-hero"><p className="eyebrow">PLAYER PROFILE</p><h1>{person.name}</h1><p>{person.person_type} · {country?.name ?? 'Nationality not listed'}</p></section>
    <section className="profile-grid"><div className="profile-card"><span>ROLE</span><strong>{person.person_type}</strong></div><div className="profile-card"><span>NATIONALITY</span><strong>{country?.name ?? '—'}</strong></div><div className="profile-card"><span>BORN</span><strong>{person.birth_date ? new Date(person.birth_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</strong></div></section>
    <section className="detail-section"><div className="section-heading"><span>01</span><h2>TEAMS.</h2></div><div className="index-grid">{teams.slice(0, 30).map((row: any) => <Link className="index-card" href={`/teams/${row.teams_v2?.slug}`} key={`${row.teams_v2?.id}-${row.season_id}`}><span>{row.seasons?.name ?? 'Season'} · {row.role}</span><b>{row.teams_v2?.name}</b><small>{row.position ?? 'Squad member'}{row.shirt_number ? ` · #${row.shirt_number}` : ''}</small></Link>)}{!teams.length && <div className="empty-state">Team memberships will appear as the player catalogue grows.</div>}</div></section>
    <section className="detail-section"><div className="section-heading"><span>02</span><h2>MATCHES.</h2></div><div className="data-list">{events.map((event) => <Link className="data-row" href={`/matches/${event.id}`} key={event.id}><span>{event.starts_at ? new Date(event.starts_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : 'TBD'}</span><b>{event.home_team?.name ?? 'Home'} <strong>{event.home_score ?? '—'}–{event.away_score ?? '—'}</strong> {event.away_team?.name ?? 'Away'}</b><small>{event.status ?? 'Scheduled'}</small></Link>)}</div></section>
  </div>;
}
