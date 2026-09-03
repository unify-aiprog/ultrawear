'use client';

import { useEffect } from 'react';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep a lightweight fallback here; an external error provider can hook in later.
    console.error('UltraWear global error');
  }, []);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#111111', color: '#F4F0E6', fontFamily: 'Arial, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px', textAlign: 'center' }}>
          <section>
            <p style={{ letterSpacing: '0.12em', fontSize: '12px' }}>ULTRAWEAR FC · FOR COMMUNITY</p>
            <h1 style={{ fontSize: 'clamp(40px, 8vw, 88px)', lineHeight: 0.9, margin: '18px 0' }}>THE MATCH<br />IS PAUSED.</h1>
            <p>We hit a system error. Your core UltraWear experience can recover from here.</p>
            <button onClick={() => reset()} style={{ marginTop: '18px', padding: '12px 18px', cursor: 'pointer' }}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
