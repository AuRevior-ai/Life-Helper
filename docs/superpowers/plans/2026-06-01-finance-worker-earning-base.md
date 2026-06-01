# Finance Worker Earning Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the stage 16 finance ledger and worker earning foundation without changing the existing MVP order flow.

**Architecture:** Add `cloudfunctions/finance` as the finance domain, call it from review/refund boundaries, and update worker/admin pages to read finance data. Keep all money values in cents and use fixed config for commission and freeze days.

**Tech Stack:** WeChat Mini Program, cloud functions, Node.js `node:test`, existing repository pattern.

---

### Task 1: Finance Core Tests

**Files:**
- Create: `tests/phase16.finance-worker-earning.test.js`

- [ ] Write failing tests for finance generation, idempotency, worker permissions, admin reads, refund reversal, and wiring.
- [ ] Run `node --test tests/phase16.finance-worker-earning.test.js` and verify the tests fail because `cloudfunctions/finance/handler` does not exist yet.

### Task 2: Finance Cloud Function

**Files:**
- Create: `cloudfunctions/finance/handler.js`
- Create: `cloudfunctions/finance/index.js`
- Create: `cloudfunctions/finance/package.json`
- Create: `cloudfunctions/finance/finance-config.js`
- Create: `cloudfunctions/finance/repositories.js`

- [ ] Implement config constants, calculation helpers, permission helpers, finance generation, reversal, worker reads, admin reads, and mock settlement unlock.
- [ ] Run the phase 16 test and verify finance core tests pass.

### Task 3: Review And Refund Integration

**Files:**
- Modify: `cloudfunctions/review/handler.js`
- Modify: `cloudfunctions/review/index.js`
- Modify: `cloudfunctions/refund/handler.js`
- Modify: `cloudfunctions/refund/index.js`

- [ ] Add retryable finance generation after successful review/order completion.
- [ ] Add retryable finance reversal after successful mock refund.
- [ ] Run phase 14 and phase 16 tests.

### Task 4: Frontend Worker/Admin Wiring

**Files:**
- Create: `miniprogram/services/finance.service.js`
- Modify: `miniprogram/config/constants.js`
- Modify: `miniprogram/config/status.js`
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/pages/worker/income/*`
- Modify: `miniprogram/pages/admin/dashboard/*`
- Create: `miniprogram/pages/admin/finance-log-list/*`
- Create: `miniprogram/pages/admin/worker-earning-list/*`
- Create: `miniprogram/pages/admin/order-finance-detail/*`

- [ ] Wire finance cloud function service.
- [ ] Update worker income to use finance data.
- [ ] Add simple admin read-only finance pages.
- [ ] Run phase 16 wiring tests.

### Task 5: Documentation And Full Regression

**Files:**
- Create: `docs/dev-records/16_finance-worker-earning-base.md`
- Modify: `docs/dev-records/index.md`
- Modify: `README.md`

- [ ] Document scope, files, collections, tests, real payment boundary, and trial-test steps.
- [ ] Run `npm test`.
- [ ] Record exact test result in the stage 16 report.

