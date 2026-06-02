# Phase 20 Deposit Qualification Design

## Goal

Build a mock-only onboarding layer for merchant and service-provider qualification, insurance information, deposit handling, risk review, and administrator review. The feature must not connect to real identity, license, OCR, insurance, payment, refund, split-settlement, withdrawal, or external risk systems.

## Recommended Architecture

Create an independent `cloudfunctions/qualification` cloud function. Its `handler.js` only dispatches actions; business logic lives in focused service files for qualification, deposit, risk, onboarding, validation, constants, and repositories. Existing merchant code remains mostly unchanged, with only a small `canMerchantOperate` gate in `merchant.createMerchantService`.

## Backend Units

- `qualification.constants.js`: all phase 20 statuses, risk tags, event names, and mock copy.
- `qualification.validator.js`: payload normalization, agreement check, and sensitive-field masking.
- `qualification.service.js`: draft, submit, resubmit, and admin review state transitions.
- `deposit.service.js`: mock deposit status, mock payment, refund application, admin freeze, and refund review.
- `risk.service.js`: admin risk-level and risk-tag writes plus merchant-safe risk summary.
- `onboarding.service.js`: simple deterministic onboarding-status calculation and operation permission check.
- `repositories.js`: cloud database adapters for new phase 20 collections.

## Frontend Units

Add `miniprogram/services/qualification.service.js` and six basic pages:

- `pages/merchant/qualification/qualification`
- `pages/merchant/deposit/deposit`
- `pages/merchant/risk-status/risk-status`
- `pages/admin/qualification-review/qualification-review`
- `pages/admin/deposit-review/deposit-review`
- `pages/admin/risk-control/risk-control`

Pages are basic workflow surfaces. They must show mock warnings and avoid asking for real sensitive credentials.

## Data Contracts

Add collections and JSON schema files:

- `merchant_qualifications`
- `merchant_deposits`
- `merchant_risk_records`
- `merchant_onboarding_logs`

All new actions, states, permissions, list endpoints, indexes, README notes, and phase records must be synchronized with the existing contract documents.

## Testing

Use Node's built-in `node --test`. Add phase 20 tests for qualification, deposit, risk, onboarding, and contract synchronization. Tests must verify mock boundaries: no real WeChat payment parameters, no raw sensitive identifier persistence, and no direct merchant self-approval or risk modification.
