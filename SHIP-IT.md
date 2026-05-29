# What's done and what's next

## Done (verified locally against live saucedemo)
- Suite built + verified: 4 stable passes, 1 deterministic broken-selector failure,
  1 **genuinely flaky** test (real network-jitter budget, 4 pass / 8 fail across 12 runs).
- Reporter config corrected (`/reporter` entry, `reportMode: embedded`, key from env).
- API key kept in `.env` (gitignored) — no secret in the repo.
- Reporter `onBegin` hang fully diagnosed → **[FINDINGS.md](FINDINGS.md)**.

## Next
1. **Enable the CI upload probe.** In this repo: Settings → Secrets and variables →
   Actions → add `TESTRELIC_API_KEY`. Push (or re-run the workflow) and watch the
   "Probe TestRelic reporter on Linux" step. If it completes and uploads, the
   `onBegin` hang is Windows-specific — and you now have real dashboard data.
2. **Reach out to TestRelic** leading with FINDINGS.md (see the email draft). The bug
   report is the strongest opener: it shows you can embed, diagnose, and communicate.

## Honest guardrail
Do **not** claim you used the dashboard, Ask AI, or the MCP loop — none of that
happened, because no run data ever reached the cloud from the local Windows run. If CI
(step 1) succeeds, then you'll have truthfully seen dashboard data and can say so.
