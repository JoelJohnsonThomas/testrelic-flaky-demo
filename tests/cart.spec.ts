import { test, expect } from '@testrelic/playwright-analytics/fixture';
import { USERS, login } from './_helpers';

test.describe('Cart', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.standard);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  // ── ARCHETYPE 1: stable pass ────────────────────────────────────────────
  test('adds a backpack to the cart', async ({ page }) => {
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  });

  // ── STABLE: two items in the cart ───────────────────────────────────────
  // Originally written as a 250ms "race condition", but measurement showed the
  // saucedemo cart badge updates synchronously — it passed 8/8 at 250ms, so the
  // race was theoretical, not real. Kept as an honest stable test rather than a
  // fake-flaky one. (Genuine flakiness lives in perf.spec.ts, driven by real
  // network-load variance.)
  test('cart badge reflects two items', async ({ page }) => {
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
  });
});
