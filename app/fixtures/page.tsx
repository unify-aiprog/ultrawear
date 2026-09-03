import { AdSlot } from '@/components/ad-slot';
export const metadata = { title: 'Fixtures & Results' };
export default function FixturesPage() { return <section className="section"><p className="eyebrow">FOOTBALL DATA</p><h1 className="page-title">FIXTURES<br /><em>& RESULTS.</em></h1><p className="lede dark">Worldwide competition data will populate this reusable page from the shared data layer.</p><AdSlot minHeight={250}/><div className="empty-state">Fixture ingestion is the next vertical slice. No demo scores are presented as real.</div></section>; }
