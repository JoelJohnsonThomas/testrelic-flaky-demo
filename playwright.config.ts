import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config wired to the TestRelic cloud reporter.
 *
 * Reporter options and env-var names follow the TestRelic docs exactly:
 *   https://docs.testrelic.ai/getting-started/cloud-quickstart
 *   https://docs.testrelic.ai/packages/playwright-analytics
 *
 * Set TESTRELIC_API_KEY and TESTRELIC_REPO_ID in a .env file (see .env.example).
 * Playwright >= 1.49 loads .env automatically when you run `npx playwright test`.
 */
export default defineConfig({
  testDir: './tests',
  // Site under test: Sauce Labs' public demo store (login + cart + checkout).
  use: {
    baseURL: 'https://www.saucedemo.com',
    // Capture video + trace so the TestRelic Session Workspace has something to inspect.
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Retries are deliberate: a test that fails then passes on retry is reported
  // as FLAKY rather than FAILED. That distinction is exactly what TestRelic
  // is built to surface, so we want the flaky archetypes to land in that bucket.
  retries: 2,

  // Keep the run serial and single-worker so the failure timeline reads cleanly
  // in the dashboard for a first demo. Bump workers later for real suites.
  workers: 1,
  fullyParallel: false,

  reporter: [
    ['list'],
    [
      // Reporter entry point per the TestRelic docs. The bare package path
      // resolves to the library index (not a Playwright reporter), so this
      // MUST be the "/reporter" subpath or the run hangs/fails to load.
      '@testrelic/playwright-analytics/reporter',
      {
        // "embedded" keeps the report in memory and writes it at the end.
        // The default "streaming" mode spins up a local 127.0.0.1 server +
        // streaming writer at onBegin, which hangs the run before any test
        // executes on this setup. embedded is fine for a small suite.
        reportMode: 'embedded',
        cloud: {
          // Key comes from .env (gitignored) — never hardcode it into a file
          // that gets pushed to a public repo.
          apiKey: process.env.TESTRELIC_API_KEY,
          // Batch (upload once at the end) + a hard timeout so a slow/blocked
          // upload can never hang the whole run — realtime mode stalled here.
          upload: 'batch',
          uploadArtifacts: true,
          timeout: 30000,
        },
      },
    ],
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
