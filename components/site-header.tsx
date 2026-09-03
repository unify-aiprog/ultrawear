'use client';

import Link from 'next/link';
import { useState } from 'react';

const links = [['Sports', '/sports'], ['Catalogue', '/catalogue'], ['Teams', '/teams'], ['Fixtures', '/fixtures'], ['News', '/news'], ['About', '/about']];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <Link className="brand" href="/" aria-label="UltraWear FC home"><span>ULTRAWEAR</span><b>FC</b></Link>
    <nav className="desktop-nav" aria-label="Main navigation">
      {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      <Link href="/shop">Shop</Link>
    </nav>
    <button className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(v => !v)}>{open ? 'Close' : 'Menu'}</button>
    {open && <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">
      {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
      <Link href="/shop" onClick={() => setOpen(false)}>Shop</Link>
    </nav>}
  </header>;
}
