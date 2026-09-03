import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/supabase';

type WeekendEvent = {
  id: string;
  starts_at: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  competitions_v2: { name: string; slug: string } | null;
  home_team: { name: string; slug: string } | null;
  away_team: { name: string; slug: string } | null;
};

const SPORTS = ['football', 'basketball', 'tennis', 'running'];

function weekendBounds() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysToSaturday = (6 - day + 7) % 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToSaturday));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 2);
  return { start, end };
}

export async function getWeekendActionEvents(): Promise<WeekendEvent[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { start, end } = weekendBounds();
  const { data } = await supabase
    .from('events_v2')
    .select('id,starts_at,status,home_score,away_score,competitions_v2!inner(name,slug,sport_id),home_team:teams_v2!events_v2_home_team_id_fkey(name,slug),away_team:teams_v2!events_v2_away_team_id_fkey(name,slug)')
    .gte('starts_at', start.toISOString())
    .lt('starts_at', end.toISOString())
    .order('starts_at')
    .limit(80);
  return (data ?? []) as unknown as WeekendEvent[];
}

export function WeekendAction({ events, sport }: { events: WeekendEvent[]; sport?: string }) {
  const visible = sport ? events.filter((event) => event.competitions_v2?.name?.toLowerCase().includes(sport.toLowerCase())) : events;
  return (
    <section className="detail-section" aria-labelledby="weekend-action-heading">
      <div className="section-heading"><span>WEEKEND</span><h2 id="weekend-action-heading">NEXT ACTION.</h2></div>
      <p className="lede dark">Get ready for the weekend. Follow the fixtures and events that are actually in the catalogue, then move into the Match Centre when the action starts.</p>
      {visible.length ? <div className="data-list">{visible.slice(0, 8).map((event) => <Link className="data-row" href={`/matches/${event.id}`} key={event.id}><span>{event.starts_at ? new Date(event.starts_at).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' }) : 'TBD'}</span><b>{event.home_team?.name ?? 'Event'} <strong>{event.home_score ?? '—'}–{event.away_score ?? '—'}</strong> {event.away_team?.name ?? ''}</b><small>{event.competitions_v2?.name ?? 'Sport'} · {event.status ?? 'Scheduled'}</small></Link>)}</div> : <div className="empty-state"><strong>Weekend action is being connected.</strong><span>We only promote events once they are present in the live catalogue.</span></div>}
      <div className="catalogue-actions"><Link className="button button-dark" href="/fixtures">See all fixtures</Link><Link className="button button-outline" href="/live">Live action</Link></div>
    </section>
  );
}

export const weekendSports = SPORTS;
