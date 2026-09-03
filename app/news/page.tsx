import Link from 'next/link';
import { articles } from '@/lib/editorial';

export const metadata = { title: 'News & Culture' };
export const revalidate = 3600;

export default function NewsPage() { return <div className="page-wrap"><section className="page-hero"><p className="eyebrow">THE FEED · SPORT & CULTURE</p><h1>Sport.<br /><em>unfiltered.</em></h1><p>Original stories about sport, culture, people and the communities that make the game matter.</p></section><section className="detail-section"><div className="section-heading"><span>01</span><h2>EDITORIAL.</h2></div><div className="index-grid">{articles.map((article) => <Link className="index-card" href={`/news/${article.slug}`} key={article.slug}><span>{article.category} · {article.date}</span><b>{article.title}</b><small>{article.dek}</small></Link>)}</div></section></div>; }
