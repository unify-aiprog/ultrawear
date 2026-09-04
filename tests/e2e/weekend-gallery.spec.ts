import { expect, test } from '@playwright/test';

test.describe('weekend interactive gallery', () => {
  test('renders the gallery and supports keyboard/hover interaction', async ({ page }) => {
    await page.goto('/');
    const gallery = page.locator('.weekend-gallery');
    await expect(gallery).toBeVisible();

    const cards = gallery.locator('.weekend-gallery__card');
    if (await cards.count()) {
      await cards.first().focus();
      await expect(cards.first()).toHaveClass(/is-active/);
      await cards.first().hover();
      await expect(cards.first()).toHaveClass(/is-active/);
    } else {
      await expect(gallery.getByText('GAME DAY')).toBeVisible();
    }
  });
});
