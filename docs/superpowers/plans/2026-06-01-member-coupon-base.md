# Member Coupon Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stage 17 membership and coupon basics with backend-only amount calculation and coupon lifecycle protection.

**Architecture:** Implement a new `promotion` cloud function and integrate it into `order` only at creation, mock payment, and unpaid cancellation boundaries. Frontend pages call `promotion.service.js` and display backend snapshots.

**Tech Stack:** WeChat Mini Program, cloud functions, Node.js `node:test`, existing repository pattern.

---

### Task 1: Red Tests

**Files:**
- Create: `tests/phase17.member-coupon.test.js`

- [ ] Add tests for member plans, mock membership, coupon templates, receiving coupons, backend order calculation, lock/use/release, finance amount basis, frontend wiring, and docs.
- [ ] Run `node --test tests/phase17.member-coupon.test.js`; expected failure because `cloudfunctions/promotion/handler.js` does not exist.

### Task 2: Promotion Cloud Function

**Files:**
- Create: `cloudfunctions/promotion/handler.js`
- Create: `cloudfunctions/promotion/index.js`
- Create: `cloudfunctions/promotion/repositories.js`
- Create: `cloudfunctions/promotion/promotion-calculator.js`
- Create: `cloudfunctions/promotion/package.json`

- [ ] Implement membership, coupon template, user coupon, calculation, lock, use, and release actions.
- [ ] Run phase 17 tests and verify promotion core tests pass.

### Task 3: Order Integration

**Files:**
- Modify: `cloudfunctions/order/handler.js`
- Modify: `cloudfunctions/order/index.js`

- [ ] Add promotion calculation to `createOrder`.
- [ ] Save promotion snapshots and compatible `price`/`pay_amount`.
- [ ] Lock coupon after order creation.
- [ ] Use coupon after mock payment.
- [ ] Release locked coupon when unpaid order is canceled.
- [ ] Run phase 4, phase 13, phase 16, and phase 17 tests.

### Task 4: Frontend Wiring

**Files:**
- Create: `miniprogram/services/promotion.service.js`
- Create: `miniprogram/pages/member/center/*`
- Create: `miniprogram/pages/coupon/list/*`
- Create: `miniprogram/pages/coupon/receive/*`
- Create: `miniprogram/pages/admin/member-plan-list/*`
- Create: `miniprogram/pages/admin/coupon-template-list/*`
- Create: `miniprogram/pages/admin/coupon-template-edit/*`
- Modify: `miniprogram/config/constants.js`
- Modify: `miniprogram/config/status.js`
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/pages/profile/profile.*`
- Modify: `miniprogram/pages/order-submit/order-submit.*`
- Modify: `miniprogram/pages/order-detail/order-detail.*`
- Modify: `miniprogram/pages/admin/dashboard/dashboard.*`

- [ ] Wire service and routes.
- [ ] Add member/coupon entries and basic pages.
- [ ] Add order amount snapshot display.
- [ ] Run phase 17 wiring tests.

### Task 5: Documentation And Regression

**Files:**
- Create: `docs/dev-records/17_member-coupon-base.md`
- Modify: `README.md`
- Modify: `docs/dev-records/index.md`

- [ ] Document collections, actions, amount rules, refund policy, test result, and real payment boundary.
- [ ] Run `npm test`.
- [ ] Record exact test result.

