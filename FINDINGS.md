# Field notes from onboarding the TestRelic Playwright SDK

I instrumented a small Playwright suite with `@testrelic/playwright-analytics` the way
a brand-new design partner would, and kept notes on what worked and where I'd get
stuck. The headline finding is a hard one, so it's first.

---

## 🔴 Blocker: the reporter hangs at `onBegin`, before any test runs

**Environment**
- OS: Windows 11 (10.0.26200)
- Node: 22.x · npm: 10.x
- `@playwright/test`: 1.60.0
- `@testrelic/playwright-analytics`: **2.7.0** (also reproduced on `2.7.0-next.58`)

**Symptom**

With the TestRelic reporter active, the run prints:

```
Running 6 tests using 1 worker
[testrelic] Report mode: embedded (6 tests)
```

…and then hangs indefinitely. **Zero tests execute, zero artifacts are written, no
upload happens.** I let it sit >4 minutes; the Node processes stay alive but no test
ever starts. The same suite runs in ~35s the moment the reporter is bypassed.

**Minimal repro**

```bash
npm i -D @playwright/test@1.60 @testrelic/playwright-analytics@2.7.0
# playwright.config.ts with reporter: [['list'], ['@testrelic/playwright-analytics/reporter', { cloud: { apiKey: process.env.TESTRELIC_API_KEY } }]]
npx playwright test          # hangs at "Report mode: ... (N tests)"
npx playwright test --reporter=list   # runs fine in ~35s
```

**What I ruled out** (each row is an actual run):

| Variable | Result |
|---|---|
| Reporter bypassed (`--reporter=list`) | ✅ runs, 5 pass / 1 fail in 35s |
| Reporter active, cloud key set | ❌ hangs at onBegin |
| Reporter active, **cloud key removed** | ❌ still hangs (so it's not the upload) |
| `reportMode: 'streaming'` vs `'embedded'` | ❌ both hang |
| `upload: batch` / `realtime` + `TESTRELIC_CLOUD_TIMEOUT` | ❌ ignored, still hangs |
| Stable `2.7.0` vs prerelease `2.7.0-next.58` | ❌ both hang |

**Best hypothesis.** The reporter's `onBegin` starts a local `127.0.0.1` server
(found a `f.listen(c, "127.0.0.1", …)` with an `EADDRINUSE` retry loop in
`dist/reporter-entry.cjs`) and appears to `await` something that never resolves on
this Windows setup, so the run never proceeds. Because it reproduces with the cloud
key removed, it is **not** a cloud/network issue — it's reporter init.

**Why this matters for a design partner.** This is a *first-touch* failure: a new user
follows the docs exactly, runs `npx playwright test`, and the process just hangs with a
cheerful-looking log line. There's no error, no timeout, no hint. Most people would
assume their own tests are broken and quietly churn. A one-line `onBegin` watchdog
("no test started in N seconds — TestRelic reporter may be stuck, run with
`--reporter=list` to isolate") would turn a silent churn into a recoverable moment.

**Suggested next step.** Confirm whether this is Windows-specific. This repo's CI runs
the same suite on Linux (`ubuntu-latest`) — if the reporter works there, the bug is
platform-scoped to the local 127.0.0.1 server on Windows, which narrows the fix a lot.

---

## 🟡 Smaller notes

1. **Reporter entry path.** The docs' "Option B" shows `['@testrelic/playwright-analytics', …]`
   (bare path). The package's `exports` map `.` to the library index and `./reporter`
   to the actual reporter entry. Using the bare path as a Playwright reporter is
   ambiguous; `'@testrelic/playwright-analytics/reporter'` is the unambiguous one. Worth
   making the docs consistent.

2. **Silent no-op without a key.** With no `TESTRELIC_API_KEY`, local reports are still
   written and cloud upload is silently skipped (documented, but easy to miss). A green
   run with no dashboard data is a confusing state for a first-time partner — one
   stdout notice ("no API key found, skipping cloud upload") would help.

3. **`upload: "both"` is the scaffolded default but is also the slowest/most fragile
   path** (realtime streaming + batch). For a partner's very first run, defaulting to
   `batch` and upgrading to `both` once it works would be a gentler on-ramp.

---

## ✅ What the suite itself proves (verified against live saucedemo)

The tests are real and were each verified by repeated live runs:

| Test | Type | Verified behaviour |
|---|---|---|
| `standard user lands on inventory` | stable | passes |
| `adds a backpack to the cart` | stable | passes |
| `cart badge reflects two items` | stable | passes (was a fake 250ms "race" — proved it passed 8/8, so I made it honest) |
| `completes a full checkout end to end` | stable | passes |
| `login … (BROKEN SELECTOR)` | deterministic fail | fails every attempt on `#user-name-v2` |
| `home page loads within performance budget` | **genuinely flaky** | see below |

**On the flaky test — no fakery.** I first tried the obvious flaky archetypes and
*disproved* them: the 250ms cart "race" passed 8/8 (the badge updates synchronously),
and `performance_glitch_user`'s latency is absorbed deterministically by Playwright's
auto-waiting `click()` (measured: the ~5.1s delay lands *inside* the click, never in
the assertion). So I built flakiness from a real, measured source instead: I sampled
the home page's real `networkidle` load time in-context (≈1135–1203ms, median ~1154ms)
and set the performance budget at that median. The result is a true coin-flip driven by
real network jitter — **4 pass / 8 fail across 12 runs**, and it lands in Playwright's
FLAKY bucket (fails an attempt, passes on retry) exactly as a real flaky test would.
The budget is environment-dependent; re-tune via the measurement noted in `perf.spec.ts`.
