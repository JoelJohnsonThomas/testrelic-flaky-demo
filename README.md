# TestRelic Playwright SDK — onboarding trial + field notes

A small, real Playwright suite I built to onboard the `@testrelic/playwright-analytics`
SDK the way one of TestRelic's first design partners would on day one: real flows
against a live site, a deliberately broken selector, and a **genuinely** flaky test —
then try to push it all to the TestRelic cloud and triage from there.

I did this because that loop — get a partner's suite connected, sit with the messy
output, turn what I learn into notes a product team can act on — *is* the Forward
Deployed Engineer job. The honest result is in **[FINDINGS.md](FINDINGS.md)**, and it's
more interesting than a happy-path screenshot: I hit a hard, reproducible blocker in
the reporter itself, and characterized it.

> **Status of the cloud dashboard:** ⚠️ Not reachable from a local Windows run. The
> TestRelic reporter hangs at `onBegin` before any test executes (full repro + the
> variables I eliminated are in [FINDINGS.md](FINDINGS.md)). The **tests themselves are
> verified** against live saucedemo — they just can't be uploaded from Windows with the
> current reporter. CI (Linux) attempts the upload to test whether the bug is
> Windows-specific.

Site under test: [saucedemo.com](https://www.saucedemo.com) — Sauce Labs' public demo
store (login, cart, checkout, plus a `performance_glitch_user`).

---

## What's in the suite (all verified by repeated live runs)

| Test | Type | Verified behaviour |
|---|---|---|
| `standard user lands on inventory` | stable | ✅ passes |
| `adds a backpack to the cart` | stable | ✅ passes |
| `cart badge reflects two items` | stable | ✅ passes |
| `completes a full checkout end to end` | stable | ✅ passes |
| `login … (BROKEN SELECTOR)` | deterministic fail | ❌ fails every attempt (`#user-name-v2`) |
| `home page loads within performance budget` | **genuinely flaky** | 🟡 4 pass / 8 fail across 12 runs |

**The flaky test contains no fakery.** I disproved the obvious flaky archetypes first
(the cart "race" passed 8/8; `performance_glitch_user` latency is swallowed
deterministically by Playwright's auto-waiting `click()`), then built flakiness from a
real measured source: the home page's `networkidle` load time, with the budget set at
the empirical median so real network jitter decides each run. Details and the
re-tuning recipe are in [`tests/perf.spec.ts`](tests/perf.spec.ts) and
[FINDINGS.md](FINDINGS.md).

`retries: 2` is set in `playwright.config.ts` so a fail-then-pass surfaces as **flaky**
rather than **failed** — the distinction TestRelic exists to remember.

---

## Run it

```bash
npm install
npx playwright install chromium

# Validate the suite (always works — reporter bypassed):
npx playwright test --reporter=list

# Try the TestRelic reporter + cloud upload (currently hangs on Windows — see FINDINGS):
cp .env.example .env        # add your TESTRELIC_API_KEY
npx playwright test
```

`.env` holds your key and is gitignored — it is never committed. The committed
`.testrelic/testrelic-config.json` resolves the key from `$TESTRELIC_API_KEY` at
runtime, so there are no secrets in the repo.

---

## CI

`.github/workflows/playwright.yml` runs the suite on `ubuntu-latest`. It:
1. runs the suite with the `list` reporter (always completes — validates the tests), then
2. runs a **non-blocking, time-boxed** step with the TestRelic reporter active, to test
   whether the `onBegin` hang is Windows-specific. If Linux is unaffected, this step is
   where real dashboard data would actually upload.

To enable the upload attempt, add `TESTRELIC_API_KEY` as an Actions secret
(Settings → Secrets and variables → Actions).

---

## Repo layout

```
testrelic-flaky-demo/
├── FINDINGS.md              # ← the real deliverable: the reporter bug + field notes
├── playwright.config.ts     # reporter wired to TestRelic (reportMode: embedded)
├── .env.example             # TESTRELIC_API_KEY
├── .testrelic/              # cloud config (key resolved from env, no secret committed)
├── .github/workflows/       # CI: validate suite + probe reporter on Linux
├── tests/
│   ├── _helpers.ts          # users + login helper
│   ├── login.spec.ts        # stable pass + broken selector
│   ├── cart.spec.ts         # two stable cart tests
│   ├── checkout.spec.ts     # stable full-checkout E2E
│   └── perf.spec.ts         # the genuinely flaky test (real network-jitter budget)
└── README.md
```

Built by Joel Johnson Thomas · github.com/JoelJohnsonThomas
