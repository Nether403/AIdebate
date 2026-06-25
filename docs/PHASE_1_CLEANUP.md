# Phase 1 Cleanup Log

Last updated: 2026-05-11

## Summary

Product-era surfaces that conflicted with the revival roadmap were archived rather than deleted. The active app is now narrower and focused on research workflows: creating/running debates, inspecting artifacts, and exporting benchmark data.

## Archived Areas

The following were moved under `archive/product-era/`:

- Consumer dashboard pages.
- Leaderboard pages and API routes.
- Statistics pages and API routes.
- Betting/test-betting pages.
- Prediction-market API routes.
- Public share/featured debate endpoints.
- Public anonymized export API route (`/api/export/anonymized`) archived on 2026-05-11 as part of the revival cleanup follow-up.
- Prediction, leaderboard, statistics, and share UI components.
- Product-era prediction, rating, abuse-detection, fingerprint, and cost-monitoring libraries.
- Product-era admin cost and suspicious-session routes.

Ad-hoc and product-era development scripts were moved under `scripts/archive/` on 2026-05-11. These include one-off seed repair scripts, manual test harnesses, and the deploy-preflight script. They are retained for reference only and are excluded from `npm run typecheck`.

## Active Tree Changes

- Active navigation was already narrowed to research-oriented routes before this cleanup.
- Stale dynamic imports for archived leaderboard components were removed from `lib/performance/lazy-components.tsx`.
- Active debate creation no longer depends on archived product-era cost-monitoring code.
- `.gitignore` was updated so `archive/product-era/**` is trackable while older broad archive folders remain ignored.

## Restore Policy

Archived code is retained only for reference. Do not restore prediction markets, DebatePoints, Superforecaster badges, betting dashboards, public social-sharing mechanics, or consumer-growth surfaces unless `docs/REVIVAL_ROADMAP.md` is explicitly changed.
