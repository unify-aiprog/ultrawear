import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { AdSlot } from '@/components/ad-slot';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
const ga4MeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: { default: 'UltraWear FC — For Community', template: '%s — UltraWear FC' },
  description: 'UltraWear FC — a sports and lifestyle platform built around the game, the culture and the people.',
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  keywords: ['sports', 'football', 'football culture', 'sports catalogue', 'UltraWear FC', 'For Community'],
  applicationName: 'UltraWear FC',
  creator: 'UltraWear FC',
  publisher: 'UltraWear FC',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'UltraWear FC',
    title: 'UltraWear FC — For Community',
    description: 'Sports, culture and the people behind the game.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary',
    title: 'UltraWear FC — For Community',
    description: 'Sports, culture and the people behind the game.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader /><AdSlot /><main id="main-content">{children}</main><footer className="site-footer"><div className="brand"><span>ULTRAWEAR</span><b>FC</b></div><p>FC = FOR COMMUNITY.</p><nav aria-label="Footer"><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/shop">Shop</a></nav><small>© 2026 UltraWear FC. Built for the culture.</small></footer>{ga4MeasurementId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`} strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){window.dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${ga4MeasurementId}', { anonymize_ip: true });`}</Script></> : null}</body></html>;
}
