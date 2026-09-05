import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  '/', '/sports', '/live', '/weekend', '/news', '/community', '/shop', '/teams',
  '/fixtures', '/catalogue', '/matches', '/about', '/contact', '/experience',
];

for (const route of routes) {
  test(`accessibility: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${route}: ${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
  });
}
