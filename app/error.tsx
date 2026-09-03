'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <section className="page-shell empty-state"><p className="eyebrow">Something went wrong</p><h1>The match has been paused.</h1><p>UltraWear could not load this page right now. Try again, or head back to the catalogue.</p><div className="button-row"><button className="button button-dark" onClick={() => reset()}>Try again</button><Link className="button button-outline" href="/catalogue">Browse catalogue</Link></div></section>;
}
