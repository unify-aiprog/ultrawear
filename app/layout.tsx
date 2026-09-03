import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { AdSlot } from '@/components/ad-slot';

export const metadata: Metadata = {
  title: { default: 'UltraWear FC — For Community', template: '%s — UltraWear FC' },
  description: 'UltraWear FC — a sports and lifestyle platform built around the game, the culture and the people.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'),
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader /><AdSlot /><main id="main-content">{children}</main><footer className="site-footer"><div className="brand"><span>ULTRAWEAR</span><b>FC</b></div><p>FC = FOR COMMUNITY.</p><nav aria-label="Footer"><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/shop">Shop</a></nav><small>© 2026 UltraWear FC. Built for the culture.</small></footer></body></html>;
}
