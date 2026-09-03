import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/supabase';

type WeekendEvent = {
  id: string;
  starts_at: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  competitions_v2: { name: string; slug: string; sport_id: string } | null;
  home_team: { name: string; slug: string } | null;
  away_team: { name: string; slug: string } | null;
};

export function weekendBounds() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysToSaturday = (6 - day + 7) % 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToSaturday));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 2);
  return { start, end };
}

export async function getWeekendActionEvents(sportId?: string): Promise<WeekendEvent[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { start, end } = weekendBounds();
  let query = supabase
    .from('events_v2')
    .select('id,starts_at,status,home_score,away_score,competitions_v2!inner(name,slug,sport_id),home_team:teams_v2!events_v2_home_team_id_fkey(name,slug),away_team:teams_v2!events_v2_away_team_id_fkey(name,slug)')
    .gte('starts_at', start.toISOString())
    .lt('starts_at', end.toISOString())
    .order('starts_at')
    .limit(80);
  if (sportId) query = query.eq('competitions_v2.sport_id', sportId);
  const { data } = await query;
  return (data ?? []) as unknown as WeekendEvent[];
}

export function WeekendAction({ events, title = 'NEXT ACTION.' }: { events: WeekendEvent[]; title?: string }) {
  return (
    <section className="detail-section" aria-labelledby="weekend-action-heading">
      <div className="section-heading"><span>WEEKEND</span><h2 id="weekend-action-heading">{title}</h2></div>
      <p className="lede dark">Get ready for the weekend. Follow the events in the catalogue now, then move into the Match Centre when the action starts.</p>
      {events.length ? <div className="data-list">{events.slice(0, 8).map((event) => <Link className="data-row" href={`/matches/${event.id}`} key={event.id}><span>{event.starts_at ? new Date(event.starts_at).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' }) : 'TBD'}</span><b>{event.home_team?.name ?? 'Event'} <strong>{event.home_score ?? '—'}–{event.away_score ?? '—'}</strong> {event.away_team?.name ?? ''}</b><small>{event.competitions_v2?.name ?? 'Sport'} · {event.status ?? 'Scheduled'}</small></Link>)}</div> : <div className="empty-state"><strong>Weekend action is being connected.</strong><span>We only promote events once they are present in the live catalogue.</span></div>}
      <div className="catalogue-actions"><Link className="button button-dark" href="/fixtures">See all fixtures</Link><Link className="button button-outline" href="/live">Live action</Link></div>
    </section>
  );
}
