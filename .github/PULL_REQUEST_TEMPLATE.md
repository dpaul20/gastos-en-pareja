## Summary

<!-- What changed and why -->

## SDD Traceability

<!-- Engram topic keys for sdd/<change>/* — or note "size:exception" with a one-line reason -->

- Proposal: `sdd/<change>/proposal`
- Spec: `sdd/<change>/spec`
- Design: `sdd/<change>/design`
- Tasks: `sdd/<change>/tasks`
- Verify report: `sdd/<change>/verify-report`

## QA Gate

- [ ] `sdd-verify` ran — see [qa-qacito-gate](.claude/skills/qa-qacito-gate/SKILL.md)
- [ ] New/changed specs (if any) committed under `e2e/`
- [ ] CI checks green: lint, unit, e2e, a11y
- [ ] UX sign-off on visual/a11y changes (if applicable)

## Release / Deploy

<!-- Only relevant if this PR triggers a release-please release -->

- [ ] If this PR adds Supabase migrations, confirm they're included in `supabase/migrations/` and will apply cleanly on release
