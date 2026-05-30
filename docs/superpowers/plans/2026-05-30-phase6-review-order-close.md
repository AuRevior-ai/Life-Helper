# Phase 6 Review and Order Closing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the MVP user-to-worker order lifecycle by adding service start, service finish, user review, order completion, and worker income summary.

**Architecture:** Keep order status transitions inside the `order` cloud function and review creation inside the `review` cloud function. The review cloud function updates the order to `completed` after validating that the current user owns a `pending_review` order, while worker income summary reads completed orders assigned to the current worker.

**Tech Stack:** WeChat native mini program, WeChat Cloud Functions, CommonJS modules, Node built-in test runner.

---

## File Structure

- Create `tests/phase6.review-order-close.test.js`: phase six behavior tests for `startService`, `finishService`, `createReview`, income summary, and page wiring.
- Create `cloudfunctions/review/handler.js`: review creation and review reads.
- Create `cloudfunctions/review/review-repository.js`: `reviews` collection access.
- Create `cloudfunctions/review/order-repository.js`: order read/update access for review completion.
- Modify `cloudfunctions/review/index.js`: inject repositories and current openid.
- Modify `cloudfunctions/order/handler.js`: add `startService`, `finishService`, and `getWorkerIncomeStats`.
- Modify `cloudfunctions/order/order-repository.js`: add completed worker order query if needed by income summary.
- Modify `miniprogram/services/order.service.js`: expose `getWorkerIncomeStats`.
- Modify `miniprogram/pages/worker/order-detail/*`: add start and finish service actions.
- Modify `miniprogram/pages/review/*`: add rating/content form and submit review.
- Modify `miniprogram/pages/order-detail/*`: add review entrance when order is `pending_review`.
- Modify `miniprogram/pages/worker/income/*`: show completed order count and total amount.
- Modify `README.md`, `docs/dev-records/index.md`, and create `docs/dev-records/06_phase-review-order-close.md`.

---

### Task 1: Failing Tests

**Files:**
- Create: `tests/phase6.review-order-close.test.js`

- [ ] **Step 1: Write failing tests**

Create tests for:

- `order.startService` moves own worker order from `accepted` to `serving`.
- `order.finishService` moves own worker order from `serving` to `pending_review`.
- `review.createReview` creates a rating/content review for the order owner and moves the order to `completed`.
- duplicate review is rejected.
- `order.getWorkerIncomeStats` sums completed orders for the current worker.
- worker detail, user detail, review page, and income page reference the expected services.

- [ ] **Step 2: Run tests to verify red**

Run:

```bash
npm test
```

Expected result:

```text
tests fail because cloudfunctions/review/handler.js is missing and order status actions are not implemented
```

---

### Task 2: Order Status and Income Actions

**Files:**
- Modify: `cloudfunctions/order/handler.js`
- Modify: `cloudfunctions/order/order-repository.js`
- Modify: `miniprogram/services/order.service.js`
- Test: `tests/phase6.review-order-close.test.js`

- [ ] **Step 1: Add order actions**

Implement:

- `startService`: requires approved worker, assigned order, `accepted` status; updates to `serving`.
- `finishService`: requires approved worker, assigned order, `serving` status; updates to `pending_review`.
- `getWorkerIncomeStats`: requires approved worker; sums current worker completed orders.

- [ ] **Step 2: Run tests**

Run:

```bash
npm test
```

Expected result:

```text
order status and income tests pass; review tests may still fail until Task 3
```

---

### Task 3: Review Cloud Function

**Files:**
- Create: `cloudfunctions/review/handler.js`
- Create: `cloudfunctions/review/review-repository.js`
- Create: `cloudfunctions/review/order-repository.js`
- Modify: `cloudfunctions/review/index.js`
- Test: `tests/phase6.review-order-close.test.js`

- [ ] **Step 1: Implement review creation**

Implement:

- `createReview`: validates `orderId`, rating 1-5, order owner, `pending_review`, and no duplicate review; creates review and updates order to `completed`.
- `getOrderReview`: returns review for one order.
- `getWorkerReviews`: returns reviews for a worker.

- [ ] **Step 2: Run tests**

Run:

```bash
npm test
```

Expected result:

```text
cloud-function tests pass; page wiring tests may still fail until Task 4
```

---

### Task 4: Mini Program Pages

**Files:**
- Modify: `miniprogram/pages/worker/order-detail/order-detail.js`
- Modify: `miniprogram/pages/worker/order-detail/order-detail.wxml`
- Modify: `miniprogram/pages/worker/order-detail/order-detail.wxss`
- Modify: `miniprogram/pages/review/review.js`
- Modify: `miniprogram/pages/review/review.wxml`
- Modify: `miniprogram/pages/review/review.json`
- Modify: `miniprogram/pages/review/review.wxss`
- Modify: `miniprogram/pages/order-detail/order-detail.js`
- Modify: `miniprogram/pages/order-detail/order-detail.wxml`
- Modify: `miniprogram/pages/worker/income/income.js`
- Modify: `miniprogram/pages/worker/income/income.wxml`
- Modify: `miniprogram/pages/worker/income/income.json`
- Modify: `miniprogram/pages/worker/income/income.wxss`
- Test: `tests/phase6.review-order-close.test.js`

- [ ] **Step 1: Implement page wiring**

Pages should call:

- `orderService.startService`
- `orderService.finishService`
- `reviewService.createReview`
- `orderService.getWorkerIncomeStats`

- [ ] **Step 2: Run all tests**

Run:

```bash
npm test
```

Expected result:

```text
tests pass
```

---

### Task 5: Records, Verification, Commit

**Files:**
- Create: `docs/dev-records/06_phase-review-order-close.md`
- Modify: `docs/dev-records/index.md`
- Modify: `README.md`

- [ ] **Step 1: Update records**

Record:

- phase six goal and completion
- `reviews` collection shape
- status transitions
- cloud function actions
- known risks
- test result
- phase seven confirmation questions

- [ ] **Step 2: Run final verification**

Run:

```bash
npm test
Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
git diff --check
```

Expected result:

```text
tests pass; node --check emits no syntax errors; git diff --check reports no whitespace errors
```

- [ ] **Step 3: Commit**

Run:

```bash
git add .
git commit -m "feat: add review and order closing phase"
```

Expected result:

```text
one new commit on master
```

---

## Self-Review

- The plan covers the four confirmed phase six decisions.
- It keeps real payment, withdrawal, platform commission, and refund logic out of scope.
- It leaves admin order management for phase seven.
