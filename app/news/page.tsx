import Link from 'next/link';
import { articles } from '@/lib/editorial';

export const metadata = { title: 'News & Culture' };
export const revalidate = 3600;

const articleImage = (slug: string) => slug === 'the-game-is-bigger-than-the-score' ? '/assets/news-community.svg' : slug === 'built-by-fans-made-for-everyone' ? '/assets/news-matchday.svg' : '/assets/news-sport-world.svg';

export default function NewsPage() {
  return <div className="page-wrap">
    <section className="page-hero"><p className="eyebrow">THE FEED · SPORT & CULTURE</p><h1>Sport.<br /><em>unfiltered.</em></h1><p>Original stories about sport, culture, people and the communities that make the game matter.</p></section>
    <section className="detail-section"><div className="section-heading"><span>01</span><h2>EDITORIAL.</h2></div><div className="index-grid">{articles.map((article, index) => <Link className="index-card" href={`/news/${article.slug}`} key={article.slug}><div aria-hidden="true" style={{ height: 190, marginBottom: 18, backgroundImage: `url(${articleImage(article.slug)})`, backgroundPosition: 'center', backgroundSize: 'cover', border: '1px solid var(--line)' }} /><span>{article.category} · {article.date}</span><b>{article.title}</b><small>{article.dek}</small></Link>)}</div></section>
  </div>;
}
