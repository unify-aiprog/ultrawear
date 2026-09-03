'use client';

import Link from 'next/link';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="page-shell empty-state"><p className="eyebrow">Something went wrong</p><h1>The match has been paused.</h1><p>UltraWear could not load this page right now. Try again, or return to the sports hub.</p><div className="button-row"><button className="button button-dark" onClick={() => reset()}>Try again</button><Link className="button button-outline" href="/sports">Back to sports</Link></div></section>;
}
