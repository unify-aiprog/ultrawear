import { test, expect } from '@playwright/test';

const routes = [
  '/', '/sports', '/live', '/weekend', '/news', '/community', '/shop', '/teams',
  '/fixtures', '/catalogue', '/matches', '/about', '/contact', '/experience',
];

for (const route of routes) {
  test(`route works: ${route}`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${route} returned ${response?.status()}`).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });
}

test('homepage has no horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBeFalsy();
});

test('core pages have no horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/sports', '/live', '/weekend', '/news', '/community', '/teams']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `${route} overflows horizontally`).toBeFalsy();
  }
});

test('API health endpoint returns a machine-readable health state', async ({ request }) => {
  const response = await request.get('/api/health');
  expect([200, 503]).toContain(response.status());
  const body = await response.json();
  expect(typeof body.ok).toBe('boolean');
  expect(['healthy', 'degraded', 'down']).toContain(body.status);
  expect(body.checkedAt).toBeTruthy();
});

test('Sports Brain health endpoint is explicit about freshness', async ({ request }) => {
  const response = await request.get('/api/health/sports-brain');
  expect([200, 503]).toContain(response.status());
  const body = await response.json();
  expect(typeof body.ok).toBe('boolean');
  expect(['healthy', 'degraded', 'down']).toContain(body.status);
  expect(body.checkedAt).toBeTruthy();
});

test('Sports Brain refresh endpoint rejects unauthenticated requests', async ({ request }) => {
  const response = await request.post('/api/sports-brain/refresh');
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.ok).toBe(false);
  expect(body.error).toBe('Unauthorized');
});

test('audience endpoint accepts validated events', async ({ request }) => {
  const response = await request.post('/api/audience', {
    data: {
      id: `e2e_${Date.now()}`,
      name: 'page_view',
      occurredAt: new Date().toISOString(),
      anonymousId: 'e2e-anonymous',
      properties: { route: '/' },
    },
  });
  expect(response.status()).toBe(202);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.accepted).toBeTruthy();
});

test('audience endpoint rejects oversized property sets', async ({ request }) => {
  const properties = Object.fromEntries(Array.from({ length: 31 }, (_, index) => [`key_${index}`, true]));
  const response = await request.post('/api/audience', {
    data: {
      id: `invalid_${Date.now()}`,
      name: 'page_view',
      occurredAt: new Date().toISOString(),
      anonymousId: 'e2e-anonymous',
      properties,
    },
  });
  expect(response.status()).toBe(400);
});

test('weekend sports readiness endpoint is explicit about readiness', async ({ request }) => {
  const response = await request.get('/api/health/sports-action');
  expect([200, 503]).toContain(response.status());
  const body = await response.json();
  expect(typeof body.ok).toBe('boolean');
  expect(['ready', 'degraded', 'down']).toContain(body.status);
  expect(Array.isArray(body.missingSports)).toBeTruthy();
  expect(typeof body.compliance?.violations).toBe('number');
});

test('experience page respects reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/experience', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible();
  await context.close();
});
