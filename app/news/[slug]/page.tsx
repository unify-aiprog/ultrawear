import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articles, getArticle } from '@/lib/editorial';

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 3600;
export function generateStaticParams() { return articles.map((article) => ({ slug: article.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const article = getArticle(slug); return { title: article?.title || 'Article', description: article?.dek }; }
export default async function ArticlePage({ params }: Props) { const { slug } = await params; const article = getArticle(slug); if (!article) notFound(); const jsonLd = { '@context':'https://schema.org', '@type':'Article', headline:article.title, description:article.dek, datePublished:article.date, publisher:{ '@type':'Organization', name:'UltraWear FC' } }; return <article className="article-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><header className="article-header"><p className="eyebrow">{article.category} · {article.date}</p><h1>{article.title}</h1><p>{article.dek}</p></header><div className="article-body">{article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><footer className="article-footer"><Link className="button button-dark" href="/news">More stories</Link><Link className="text-link" href="/sports">Explore the sports world →</Link></footer></article>; }
