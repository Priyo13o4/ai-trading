# Razorpay Profile-Only Script Loading Plan (Dev Branch)

## Scope
- Branch target: dev-branch
- Objective: Load Razorpay web SDK only when Profile checkout flow needs it
- Non-goal: Legacy compatibility paths
- Constraint: No fallback behavior for deprecated/global integration

## Phase 0: Baseline and Guardrails
- Confirm all Razorpay usage points are mapped in frontend code.
- Confirm profile checkout entry points from pricing and locked-feature gates.
- Capture baseline network profile for non-profile routes and profile route.
- Define measurable success metrics:
  - No Razorpay script request on Home, Pricing, News, Signal, Strategy before checkout intent.
  - Single Razorpay script load when checkout is initiated on Profile.

## Phase 1: Loader Foundation
- Add a dedicated Razorpay loader utility:
  - Singleton promise gate
  - Duplicate script tag guard
  - Deterministic timeout and hard failure state
  - Retry support by clearing failed loader state
- Keep all browser global checks runtime-safe.
- Add strict typing for Razorpay global access at loader boundary.

## Phase 2: Profile Flow Integration
- Update Profile checkout flow to await loader before any SDK usage.
- Route all checkout entry calls through one orchestrator path.
- Add in-progress/open guards to prevent re-entrant opens.
- Ensure query-param driven checkout on Profile waits for loader readiness.
- Keep UX deterministic with explicit states:
  - loading-sdk
  - ready
  - failed

## Phase 3: Remove Global Script and Harden Security
- Remove global Razorpay script tag from index.html.
- Keep Razorpay CSP allowlists required for Profile checkout execution.
- Validate CSP in dev for script, frame, and connect behavior during checkout.
- Ensure no Razorpay script executes outside profile checkout context.

## Phase 4: Verification Matrix
- Functional checks:
  - Profile manual checkout open
  - Profile query-param auto-open
  - Repeat checkout attempts in same session
- Route checks:
  - Home/Pricing/News/Signal/Strategy produce zero Razorpay script loads pre-intent
- Stability checks:
  - Slow network checkout initiation
  - Rapid double-click checkout protection
  - Ad-blocker environment behavior is explicitly surfaced to the user
- Observability checks:
  - Log checkout-init lifecycle events and loader outcomes
  - Confirm zero new console errors from CSP or runtime undefined globals

## Phase 5: Dev Branch Exit Criteria
- Razorpay script is absent from all non-profile route loads.
- Razorpay script loads exactly once per session when profile checkout is initiated.
- No window.Razorpay access paths remain outside approved checkout module boundaries.
- Query-param checkout behavior is deterministic and non-flaky.
- Team sign-off from frontend and QA on dev-branch validation run.

## Implementation Order (Atomic Commits)
1. Add loader utility and tests.
2. Wire Profile flow and query-param sequencing.
3. Remove global script include.
4. Validate matrix and fix any phase-blocking defects.
