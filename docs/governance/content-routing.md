# Content grounding and model routing — V1

Date: 2026-09-12. Parent: legacy free-text Threads generation (fixed gpt-4.1-mini).
Reason: V1 requires computed facts, explicit sources/assumptions and auditable model choice.
Impact: published text becomes a reproducible synthetic cash-flow example; creative scope is limited to a reviewed introduction. No personal financial records enter API generation.

## Content contract

`buildPublicFacts()` calculates the website's `defaultInputs` with `calculatePlan`. The public source is `/diagnosis`, using **恢復 30 歲預設範例**. The output identifies synthetic data and reports monthly income, fixed expenses and their difference. Annual bonus and other annual income are disclosed but not averaged into monthly income. The text explicitly excludes investment-return calculations and does not imply that the cash-flow difference is wholly investable. All body numbers, assumptions, source and links are rendered by code.

The model sees only reviewed introduction keys/text, never request-supplied financial data, past posts, or local inputs. Its entire response must be one known key. Additional claims, prototype-property keys, empty output and transport/API errors fall back to the deterministic introduction. Invalid output is never published. The fallback still uses the calculated facts. A 15-second timeout bounds generation. Generated text and metadata are returned in preview, and metadata is stored with successful published records. Token counts are nullable if unavailable; API errors and secrets are not recorded in this metadata.

`buildFactDraft(inputs)` is a pure local function for the browser's manual-copy UI. It identifies its source as local inputs and its result as a static cash-flow calculation, not the monthly scenario projection. It does not fetch, save or publish anything. Users review their draft before copying it.

Version identifiers: `grounded-draft-v1`, `diagnosis-defaults-2026-09-12`, `finance-static-v1`, `risk-complexity-v1`. Any change to defaults or underlying methodology requires a corresponding version update. Published records include the complete public input copy and the selected computed facts for reproducibility.

## Routing contract

`routeModel(task, config)` validates low/medium/high complexity, risk and uncertainty. Simple, low-risk, low-uncertainty selection defaults to existing `gpt-4.1-mini`. The current API invokes only this simple selection task. Optional environment variables are `FINOPS_STABLE_MODEL`, `FINOPS_STRONG_MODEL`, and `FINOPS_HIGH_END_MODEL`.

Medium dimensions or high complexity select the explicitly configured stronger model. High risk or uncertainty selects an explicitly configured high-end model and always requires human review. Missing stronger/high-end configuration returns `model: null` and `requiresReview: true`; no guessed model or automatic escalation occurs. These routes describe future task gating; no new high-risk automated execution was introduced. Routing dimensions, reason, model and version are retained with API generation metadata.

## Legacy publication boundary

Existing previously authorized cron, authentication, action names, preview fields, token refresh and publishing behavior remain in their legacy flow, outside V1's local planning/content-copy workflow. This release neither adds a schedule nor authorizes a new one. Automated financial execution remains absent. Topic/variant/format parameters remain accepted for API compatibility and tracking; they no longer cause arbitrary factual narratives. A/B variation is restricted to vetted introductions.

Verification uses Node tests with an injected mock transport. No external generation, token-refresh or publishing calls are needed for these tests.
