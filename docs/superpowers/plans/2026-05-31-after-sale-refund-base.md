# After Sale Refund Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mock after-sale and refund workflow with logs, admin review, user pages, and documentation.

**Architecture:** A new `refund` cloud function owns after-sale and refund business rules. Orders keep service lifecycle in `status` while after-sale and refund state live in separate fields. The mini program gets thin user/admin pages that call `refund.service.js`; real WeChat refund is isolated behind an adapter and remains disabled until merchant configuration is provided.

**Tech Stack:** WeChat Mini Program, WeChat Cloud Functions, Node.js built-in test runner.

---

### Task 1: Stage 14 Regression Tests

**Files:**
- Create: `tests/phase14.after-sale-refund.test.js`

- [x] Write tests for user after-sale creation, admin review, mock refund, idempotency, logs, messages, page wiring, and secret scanning.
- [x] Run `npm test` and confirm failures are caused by missing stage 14 implementation.

### Task 2: Refund Cloud Function

**Files:**
- Create: `cloudfunctions/refund/index.js`
- Create: `cloudfunctions/refund/handler.js`
- Create: `cloudfunctions/refund/after-sale-repository.js`
- Create: `cloudfunctions/refund/order-repository.js`
- Create: `cloudfunctions/refund/refund-repository.js`
- Create: `cloudfunctions/refund/message-repository.js`
- Create: `cloudfunctions/refund/user-repository.js`
- Create: `cloudfunctions/refund/refund-adapter.js`
- Create: `cloudfunctions/refund/package.json`

- [x] Implement `createAfterSale`, list/detail actions, `adminReviewAfterSale`, `mockRefund`, and `getRefundLogs`.
- [x] Keep refund adapter defaulted to mock mode.
- [x] Write all after-sale and refund operations to logs.

### Task 3: Mini Program Pages

**Files:**
- Create: `miniprogram/services/refund.service.js`
- Create: `miniprogram/pages/after-sale/apply/*`
- Create: `miniprogram/pages/after-sale/detail/*`
- Create: `miniprogram/pages/admin/after-sale-list/*`
- Create: `miniprogram/pages/admin/after-sale-detail/*`
- Modify: `miniprogram/pages/order-detail/order-detail.*`
- Modify: `miniprogram/app.json`

- [x] Add user after-sale entry and status display.
- [x] Add user apply/detail pages.
- [x] Add admin list/detail pages with approve/reject actions.

### Task 4: Constants, Docs, Verification

**Files:**
- Modify: `miniprogram/config/status.js`
- Modify: `miniprogram/config/constants.js`
- Modify: `cloudfunctions/order/handler.js`
- Modify: `README.md`
- Modify: `docs/dev-records/index.md`
- Modify: `docs/release-package-checklist.md`
- Create: `docs/dev-records/14_after-sale-refund-base.md`

- [x] Add after-sale/refund constants and default order fields.
- [x] Update docs for `after_sales`, `refund_logs`, and `refund` cloud function.
- [x] Run `npm test`.
- [x] Commit only stage 14 files.
