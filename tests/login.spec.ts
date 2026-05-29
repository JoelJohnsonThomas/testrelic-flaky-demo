import { test, expect } from '@testrelic/playwright-analytics/fixture';
import { USERS, PASSWORD, login } from './_helpers';

test.describe('Authentication', () => {
  // ── ARCHETYPE 1: stable pass ────────────────────────────────────────────
  // A clean green test so the dashboard shows pass-rate contrast, not just red.
  test('standard user lands on the inventory page', async ({ page }) => {
    await login(page, USERS.standard);
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
    await expect(page.locator('.inventory_item')).toHaveCount(6);
  });

  // ── ARCHETYPE 2: broken selector (deterministic failure) ────────────────
  // Simulates a selector that broke after a front-end refactor: the username
  // field used to be #user-name, and this test still points at the old
  // post-refactor id #user-name-v2 that no longer exists. This is the exact
  // "broken selector" pattern TestRelic is built to remember across runs.
  test('login form accepts credentials (BROKEN SELECTOR — expected fail)', async ({ page }) => {
    await page.goto('/');
    // ⛔ Intentionally wrong: this locator will never resolve.
    await page.locator('#user-name-v2').fill(USERS.standard, { timeout: 4000 });
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#login-button').click();
    await expect(page).toHaveURL(/inventory\.html/);
  });
});
