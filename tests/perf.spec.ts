import { test, expect } from '@testrelic/playwright-analytics/fixture';

test.describe('Performance budget', () => {
  // ── GENUINELY FLAKY: real-variance performance budget ────────────────────
  // This is the honest flaky archetype. We measured the real time for the
  // saucedemo home page to reach `networkidle` over 15 samples on this network:
  //   min=1076  median=1115  max=1180 ms  (spread ~104ms)
  // The budget below is set right at that empirical median, so roughly half the
  // runs come in under it (PASS) and half over it (FAIL) — driven purely by real
  // network/asset jitter, NOT a faked Math.random(). With retries: 2, this lands
  // in Playwright's FLAKY bucket (fails an attempt, passes another), which is
  // exactly the "same code, different outcome" signal TestRelic remembers across
  // runs and an AI agent can't see from any single run.
  //
  // NOTE: the median drifts with network conditions. On a very different
  // connection, re-run `node measure.mjs` and update PAGE_LOAD_BUDGET_MS.
  const PAGE_LOAD_BUDGET_MS = 1154;

  test('home page loads within performance budget (FLAKY by real network jitter)', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const elapsed = Date.now() - start;
    expect(elapsed, `home page took ${elapsed}ms (budget ${PAGE_LOAD_BUDGET_MS}ms)`).toBeLessThanOrEqual(
      PAGE_LOAD_BUDGET_MS,
    );
  });
});
