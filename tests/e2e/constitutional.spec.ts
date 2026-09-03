import { test, expect } from '@playwright/test';

const primaryRoutes = ['/', '/sports', '/news', '/about', '/contact', '/privacy', '/terms'];

test('home exposes the constitutional experience baseline', async ({ page }) => {
  const started = Date.now();
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByText('Skip to content')).toBeVisible();
  await expect(page.locator('a[href="/privacy"]')).toBeVisible();
  await expect(page.locator('a[href="/terms"]')).toBeVisible();
  await expect(page.locator('body')).toBeVisible();
  expect(Date.now() - started).toBeLessThan(10_000);
});

test('skip link moves keyboard focus to main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByText('Skip to content');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('primary routes resolve without a broken navigation destination', async ({ page }) => {
  for (const route of primaryRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} should resolve`).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  }
});

test('mobile layout does not introduce horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
