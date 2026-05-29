/**
 * Sauce Labs demo users. All use the same password.
 *  - standard_user            : normal, deterministic behaviour
 *  - performance_glitch_user  : the site injects real, variable latency for this
 *                               user. We use it to produce GENUINE flakiness,
 *                               not a fake sleep().
 *  - problem_user             : broken images / mislabeled elements (kept here
 *                               for future expansion of the suite)
 */
export const USERS = {
  standard: 'standard_user',
  glitch: 'performance_glitch_user',
  problem: 'problem_user',
} as const;

export const PASSWORD = 'secret_sauce';

import type { Page } from '@testrelic/playwright-analytics/fixture';

/** Logs a user in from the home page using the *current* (correct) selectors. */
export async function login(page: Page, username: string, password = PASSWORD) {
  await page.goto('/');
  await page.locator('#user-name').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('#login-button').click();
}
