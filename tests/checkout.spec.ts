import { test, expect } from '@testrelic/playwright-analytics/fixture';
import { USERS, login } from './_helpers';

test.describe('Checkout', () => {
  // ── STABLE: full end-to-end checkout (real passing coverage) ─────────────
  // A complete, deterministic purchase flow. This is the green baseline that
  // gives the dashboard pass-rate contrast against the failing/flaky archetypes.
  test('completes a full checkout end to end', async ({ page }) => {
    await login(page, USERS.standard);
    await expect(page).toHaveURL(/inventory\.html/);

    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('.shopping_cart_link').click();
    await page.locator('[data-test="checkout"]').click();

    await page.locator('#first-name').fill('Joel');
    await page.locator('#last-name').fill('Thomas');
    await page.locator('#postal-code').fill('10001');
    await page.locator('#continue').click();

    await page.locator('#finish').click();
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
  });
});
