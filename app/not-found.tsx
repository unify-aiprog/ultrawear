import Link from 'next/link';

export default function NotFound() {
  return <section className="page-shell empty-state"><p className="eyebrow">404 · Not found</p><h1>That page has left the pitch.</h1><p>We could not find the sports page, team, competition or story you requested.</p><div className="button-row"><Link className="button button-dark" href="/">Back home</Link><Link className="button button-outline" href="/sports">Explore sports</Link></div></section>;
}
