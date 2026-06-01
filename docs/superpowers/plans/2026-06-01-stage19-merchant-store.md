# Stage 19 Merchant Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the stage 19 merchant/store foundation while preserving existing worker order flows.

**Architecture:** Add a focused `merchant` cloud function for merchant profile, services, store pages, merchant order operations, and admin merchant management. Extend `order` and `finance` only where needed for provider compatibility. Keep old worker flow intact and use `service_providers` as a new index, not as a rewrite.

**Tech Stack:** WeChat Mini Program, wx cloud functions, Node.js CommonJS, node:test.

---

### Task 1: Tests First

**Files:**
- Create: `tests/phase19.merchant-store-service-provider.test.js`

- [ ] Write failing tests for merchant apply, admin audit, service provider sync, merchant services, store detail, merchant order creation, merchant order operation, finance compatibility, page wiring, and docs wiring.
- [ ] Run `node --test tests/phase19.merchant-store-service-provider.test.js` and confirm it fails before implementation.

### Task 2: Merchant Cloud Function

**Files:**
- Create: `cloudfunctions/merchant/handler.js`
- Create: `cloudfunctions/merchant/index.js`
- Create: `cloudfunctions/merchant/repositories.js`
- Create: `cloudfunctions/merchant/package.json`

- [ ] Implement merchant constants, validation helpers, admin checks, and action routing.
- [ ] Implement merchant apply, audit status, profile update, admin approve/reject/enable/disable.
- [ ] Implement service provider upsert.
- [ ] Implement merchant services create/update/enable/disable.
- [ ] Implement store list/detail/services.
- [ ] Implement merchant order list/detail/accept/start/finish.
- [ ] Write merchant action logs for required actions.

### Task 3: Order Provider Compatibility

**Files:**
- Modify: `cloudfunctions/order/handler.js`
- Modify: `cloudfunctions/order/index.js`

- [ ] Add optional `merchantServiceId` path in `createOrder`.
- [ ] Save `provider_type`, `provider_id`, `merchant_id`, `provider_snapshot`, and `merchant_service_snapshot`.
- [ ] Prevent worker acceptance and worker assigned actions for merchant orders.
- [ ] Let order detail be visible to the order user, assigned worker, or merchant owner.
- [ ] Inject merchant repositories into the order cloud function.

### Task 4: Finance Merchant Compatibility

**Files:**
- Modify: `cloudfunctions/finance/handler.js`

- [ ] Let `generateOrderFinance` accept orders whose provider is `merchant`.
- [ ] Add `provider_type`, `provider_id`, and `merchant_id` to logs and earnings.
- [ ] Keep `worker_earnings` naming unchanged for compatibility.

### Task 5: Frontend Wiring

**Files:**
- Modify: `miniprogram/config/constants.js`
- Modify: `miniprogram/config/status.js`
- Create: `miniprogram/services/merchant.service.js`
- Modify: `miniprogram/app.json`
- Create merchant and admin merchant page folders.
- Modify: `miniprogram/pages/order-submit/order-submit.js`
- Modify: `miniprogram/pages/order-detail/order-detail.wxml`

- [ ] Add constants, services, routes, and basic pages.
- [ ] Support `merchantServiceId` in order submission.
- [ ] Show merchant snapshot in order detail.

### Task 6: Docs and Verification

**Files:**
- Create: `docs/dev-records/19-merchant-store-service-provider.md`
- Modify: `docs/dev-records/index.md`
- Modify: `README.md`

- [ ] Update stage status, completed capabilities, known limitations, collections, cloud functions, and test count.
- [ ] Run `npm test`.
- [ ] Fix regressions.
- [ ] Commit only stage 19 files.

