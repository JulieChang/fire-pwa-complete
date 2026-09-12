# V1 website update review

Date: 2026-09-12. Application release 1.2.0. Baseline: V1 2026-09-11.
Base repository: JulieChang/fire-pwa-complete, main commit 00b8b50.
Working branch: feat/v1-operating-system.

## What changes

- `/`: daily dashboard with exactly net worth, cash runway, monthly suggested investment and same-month FIRE deviation. Missing baseline/snapshot is labelled, never invented.
- `/diagnosis`: existing detailed calculator, existing saved-input key and static calculation retained; correct zero/negative cash wording and links.
- `/planning`: manual inputs, retirement/career/self-employment examples, monthly loan expiry and bonus timing, inflation-adjusted retirement spending, withdrawal-rate target, shock and return sensitivity, portfolio proportion check, immutable named revisions and monthly actuals.
- Local backup/import validation with explicit replacement, corrupted-storage recovery and explicit archive/reset. No AI writeback or personal financial data transmission.
- Social text derived from computed public sample with source and assumptions. The model can select only reviewed introductory text. Model, usage and source versions are recorded. Existing legacy cron remains outside V1 and unchanged.
- Methodology and baseline/method change history documented; no runtime dependency added. jsdom is a development-only DOM test dependency.

## Model boundaries

Static diagnosis and monthly projections intentionally differ. Monthly planning protects the emergency reserve and next annual travel budget before investing; loan releases and actual bonus receipts can increase contributions. Retirement lifestyle target excludes loans; loans remain in monthly cash flow. Total returns include dividends. Portfolio proportion checker is a separate manual comparison, not an asset-class return model and is not saved with a scenario. Nominal deterministic projections do not model taxes, stochastic sequences, pensions or long-term care. Unfunded expenses are separately visible.

## Verification and review

- Existing finance/auth tests retained; monthly engine, import/revision validation, grounded content, routing and DOM workflow tests added.
- DOM integration covers four cards, calculation/save, dirty-input guard, baseline/snapshot, backup recovery, archive cancellation and confirmed reset. DOM tests do not validate pixel layout or actual mobile browsers.
- Review findings fixed: recovery import previously blocked by storage errors; storage caps previously had no archive/reset; fractional age horizon could round before retirement. Also added detection of competing tab writes.
- Final result: 31/31 tests passed, client and SSR builds passed, all 17 rendered routes verified.
- Final commands: `npm run build` (runs all tests, client and SSR build, 17-route verify), `git diff --check`.

## Release status

Code is committed locally. Production is unchanged. Git push was rejected by automatic approval review, which requires explicit authorization of destination repository and branch. No alternate write mechanism was used.

The remote browser cannot reach the local preview (`ERR_BLOCKED_BY_CLIENT`); responsive CSS exists and DOM workflows pass, but visual desktop/iPad/mobile acceptance remains pending. After authorized push, use the deployment preview to verify before merging to main. No social publishing, live token refresh or financial execution was performed during testing.

## Proposed pull request

Title: Implement V1 daily dashboard and versioned FIRE scenario planning
Base: main
Head: feat/v1-operating-system
Draft: yes, pending preview/visual verification

The previous homepage combined all analysis in a long diagnosis form and lacked a time-based retirement trajectory. This release separates daily status from the full diagnosis and adds a deterministic, versioned planning workflow. Grounded content and model-routing records bring the content pipeline closer to the baseline. Existing public articles and legacy publishing schedule are preserved.
