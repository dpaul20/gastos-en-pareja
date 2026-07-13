---
name: qa-qacito-gate
description: QA Automation Senior playbook for sdd-verify — scopes, fills coverage gaps, and runs Qacito against changed code, then commits the resulting specs so existing CI (GitHub Checks) becomes the persisted evidence. Trigger whenever sdd-verify runs, or when asked to QA-test the current state of the app.
user-invocable: false
---

# QA Qacito Gate

Load this skill during `sdd-verify` (or any ad-hoc "QA test the site" request). It defines how the QA Automation Senior role validates a change and where the evidence lives.

## Evidence model — read this first

Evidence is the **existing GitHub Checks**, not a new dashboard or a hand-written PR comment.

- `.github/workflows/ci.yml` already runs `lint`, `unit`, `e2e`, `a11y` as native checks on every PR and uploads `playwright-report` as a CI artifact on failure (`actions/upload-artifact`).
- Qacito's `generate_report` writes local `.md`/`.html` files to an `outputDir` — it does **not** return a hosted dashboard URL. Treat it as a local artifact, same category as `playwright-report`.
- Qacito's job is to make sure the **right specs exist and pass** before CI runs them — not to duplicate CI's pass/fail in a separate report or comment.

## Steps

1. **Scope the change**
   - `get_changed_files(projectPath, base: "master")` — what changed
   - `get_impacted_specs(projectRoot, changedFiles, specsDir: "e2e")` — which existing Playwright specs already cover it

2. **Fill coverage gaps**
   - If impacted routes/components have no covering spec, run `analyze_project(projectRoot)` once to generate a test plan + Playwright specs under `qacito_tests/`
   - Adapt generated specs into `e2e/`, following this project's existing fixtures/conventions (see `e2e/happy-path.spec.ts`, `e2e/pages/*.page.ts`) — CI only runs `e2e/`, not `qacito_tests/`

3. **Run locally for fast feedback**
   - `run_tests` (or `start_test_run` + `get_run_status` for parallel specs) on the impacted/new specs
   - `check_accessibility` on changed routes
   - `dual_evaluate` for visual diffs when UI changed — if the change implements a Claude Design handoff, compare against that bundle's `preview/` references
   - `generate_report(runId, outputDir: "playwright-report/qacito")` for a local summary used in the verify report

4. **Commit specs — let CI be the record**
   - If new/updated specs pass locally, commit them to `e2e/`. CI's `e2e`/`a11y` jobs then run them on the PR and produce the team-visible, authoritative pass/fail (GitHub Checks)
   - Do not mark `sdd-verify` as PASS if specs were generated but not committed — an uncommitted spec produces no evidence

5. **Report**
   - `sdd/{change}/verify-report` (engram) includes: which specs were added/changed, the local Qacito run summary, and a pointer to "see CI checks on the PR for the authoritative result"
   - `gh pr comment` is for a short narrative only (e.g. "Added 3 specs covering X; see CI checks for results") — never a hand-built pass/fail table that duplicates the CI check
