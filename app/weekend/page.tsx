import Link from 'next/link';
import type { Metadata } from 'next';
import { getStoredProgramme, isProgrammeStale } from '@/lib/sports/engine';
import type { ProgrammeEvent, SportsProgramme } from '@/lib/sports/programme';

export const metadata: Metadata = { title: 'Weekend Sport Experience | UltraWear FC', description: 'A customer-facing view of the UltraWear weekend sports programme and audience experience, before analytics are connected.' };

const emptyProgramme: SportsProgramme = {
  generatedAt: new Date(0).toISOString(), sport: 'all', lead: null, now: [], next: [], tonight: [], tomorrow: [], thisWeekend: [], recent: [],
  sourceHealth: { healthy: 0, degraded: 0, down: 0, notConfigured: 0 },
  editorial: { kicker: 'WEEKEND PROGRAMME', headline: 'Sport, programmed for people.', body: 'The customer experience is ready to be demonstrated. Verified event data will populate the programme as sources come online.' },
};

export default async function WeekendPage() {
  const stored = await getStoredProgramme();
  const programme = stored?.programme ?? emptyProgramme;
  const stale = stored ? isProgrammeStale(stored.updatedAt) : false;
  const live = programme.now, tonight = programme.tonight, tomorrow = programme.tomorrow, weekend = programme.thisWeekend;
  const programmed = live.length + tonight.length + tomorrow.length + weekend.length;

  return <div className="page-wrap">
    <section className="page-hero"><p className="eyebrow">WEEKEND CUSTOMER EXPERIENCE · {stale ? 'TRUSTED STATE STALE' : 'LIVE PROGRAMME'}</p><h1>This weekend.<br /><em>Stay close.</em></h1><p>{programme.editorial.body}</p>{stored && <output className="live-refresh-note">{stale ? 'LAST TRUSTED PROGRAMME IS STALE — no unverified event facts are substituted.' : `LAST VERIFIED · ${formatUpdatedAt(stored.updatedAt)}`}</output>}</section>
    <section className="detail-section"><div className="section-heading"><span>01</span><h2>THE CUSTOMER PROMISE.</h2></div><div className="index-grid">
      <ExperienceCard label="NOW" title="Know what matters now." body="The live programme leads with verified sport that is happening, rather than making the customer hunt for it." />
      <ExperienceCard label="NEXT" title="Know what is coming." body="The next important event is surfaced early, with a clear countdown and editorial priority." />
      <ExperienceCard label="STORY" title="Know why it matters." body="Programming turns raw fixtures into a sports-channel experience: the big one, the moment, the weekend." />
      <ExperienceCard label="TRUST" title="Know what is verified." body="Freshness and trusted-state messaging stay visible when data sources are unavailable or stale." />
    </div></section>
    <section className="detail-section"><div className="section-heading"><span>02</span><h2>WEEKEND PROGRAMME.</h2></div><div className="live-list"><ProgrammeBlock title="LIVE NOW" events={live} /><ProgrammeBlock title="TONIGHT" events={tonight} /><ProgrammeBlock title="TOMORROW" events={tomorrow} /><ProgrammeBlock title="THIS WEEKEND" events={weekend} /></div>{!programmed && <div className="empty-state"><strong>PROGRAMME READY.</strong><span>No verified weekend events are currently persisted. The page remains usable as the customer-facing experience layer and will populate automatically after a trusted refresh.</span></div>}</section>
    <section className="detail-section"><div className="section-heading"><span>03</span><h2>WHAT WE CAN REPORT TODAY.</h2></div><div className="index-grid">
      <ExperienceCard label="PROGRAMME" title={`${programmed} programmed event${programmed === 1 ? '' : 's'}`} body="This is product telemetry, not audience analytics: it describes what UltraWear is presenting, not how many people watched it." />
      <ExperienceCard label="SOURCES" title={`${programme.sourceHealth.healthy} healthy · ${programme.sourceHealth.degraded} degraded · ${programme.sourceHealth.down} down`} body="Source health makes the reliability of the customer experience visible without inventing performance numbers." />
      <ExperienceCard label="ANALYTICS" title="Not connected yet." body="Audience visits, engagement, clicks, dwell time and conversion remain intentionally unreported until analytics is instrumented and verified." />
      <ExperienceCard label="NEXT" title="Measure the journey, not vanity." body="When analytics is added, the priority is the customer journey: discovery, event interest, return visits, community participation and commerce intent." />
    </div></section>
    <section className="detail-section"><div className="section-heading"><span>04</span><h2>SHOW THE EXPERIENCE.</h2></div><div className="empty-state"><strong>THIS IS THE DEMO SURFACE FOR STAKEHOLDERS.</strong><span>Use the live programme to demonstrate how UltraWear behaves around a sports weekend today, before audience analytics is switched on.</span><div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}><Link className="button" href="/live">OPEN LIVE PROGRAMME</Link><Link className="button" href="/sports">EXPLORE SPORTS</Link></div></div></section>
  </div>;
}

function ExperienceCard({ label, title, body }: { label: string; title: string; body: string }) { return <article className="index-card"><span>{label}</span><b>{title}</b><small>{body}</small></article>; }
function ProgrammeBlock({ title, events }: { title: string; events: ProgrammeEvent[] }) {
  if (!events.length) return null;
  return <section className="detail-section"><div className="section-heading"><span>{title}</span><h3>{events.length} event{events.length === 1 ? '' : 's'}</h3></div><div className="live-list">{events.slice(0, 8).map((event) => <article className="live-card" key={event.id}><div className="live-card__meta"><span className="live-badge">{event.priority}</span><span>{event.sport}</span><span>{event.competition}</span></div><div className="live-card__teams"><div><span>{event.home?.name ?? event.competition}</span><strong>{event.homeScore == null ? '—' : event.homeScore}</strong></div><div><span>{event.away?.name ?? event.stage ?? event.status}</span><strong>{event.awayScore == null ? '—' : event.awayScore}</strong></div></div></article>)}</div></section>;
}
function formatUpdatedAt(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'UNKNOWN' : date.toLocaleString(); }
