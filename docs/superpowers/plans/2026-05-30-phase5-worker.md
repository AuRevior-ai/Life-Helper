# Phase 5 Worker Onboarding and Order Accepting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build worker onboarding, admin audit, order hall, and worker order acceptance for the MVP.

**Architecture:** Keep user-facing pages on the mini program side and all data access inside cloud functions. Use the `worker` cloud function for worker profile/audit/order hall reads, and extend the `order` cloud function for worker order ownership actions such as accepting and listing assigned orders.

**Tech Stack:** WeChat native mini program, WeChat Cloud Functions, CommonJS modules, Node built-in test runner.

---

## File Structure

- Create `tests/phase5.worker.test.js`: phase five behavior tests for worker application, admin audit, order hall, order acceptance, and page wiring.
- Create `cloudfunctions/worker/handler.js`: worker application, audit status, admin approval/rejection, and order hall logic.
- Create `cloudfunctions/worker/worker-repository.js`: `workers` collection access.
- Create `cloudfunctions/worker/user-repository.js`: minimal `users` collection access for admin checks and role updates.
- Create `cloudfunctions/worker/order-read-repository.js`: read pending orders for the order hall.
- Modify `cloudfunctions/worker/index.js`: inject repositories and current openid.
- Modify `cloudfunctions/order/handler.js`: add `acceptOrder`, `getWorkerOrderList`, and worker-readable order detail.
- Modify `cloudfunctions/order/order-repository.js`: add `findByWorkerId`.
- Modify `miniprogram/pages/worker/apply/*`: worker application form.
- Modify `miniprogram/pages/worker/audit-status/*`: worker audit status page.
- Modify `miniprogram/pages/admin/worker-audit/*`: admin approval/rejection page.
- Modify `miniprogram/pages/worker/order-hall/*`: pending order hall and accept action.
- Modify `miniprogram/pages/worker/order-list/*`: assigned worker orders.
- Modify `miniprogram/pages/worker/order-detail/*`: assigned order detail.
- Modify `README.md`, `docs/dev-records/index.md`, and create `docs/dev-records/05_phase-worker.md`.

---

### Task 1: Failing Tests

**Files:**
- Create: `tests/phase5.worker.test.js`

- [ ] **Step 1: Write failing tests**

Create tests that call the desired APIs:

```javascript
const { handleWorker } = require('../cloudfunctions/worker/handler')
const { handleOrder } = require('../cloudfunctions/order/handler')
```

Expected behaviors:

- `worker.applyWorker` creates a pending worker profile with `name`, `phone`, `service_category`, `service_area`, and `intro`.
- `worker.getAuditStatus` returns the current user's audit status.
- Admin `worker.approveWorker` updates the worker to `approved` and updates the related `users.role` to `worker`.
- Admin `worker.rejectWorker` updates the worker to `rejected` with a reason.
- Approved workers can read the order hall, and the order hall only contains `pending_accept` orders.
- Approved workers can call `order.acceptOrder` to move a `pending_accept` order to `accepted` and set `worker_id`.
- Approved workers can read their own worker order list and assigned order detail.
- Worker/admin pages reference the expected service methods.

- [ ] **Step 2: Run tests to verify red**

Run:

```bash
npm test
```

Expected result:

```text
tests fail because cloudfunctions/worker/handler.js is missing and phase five pages are still placeholders
```

---

### Task 2: Worker Cloud Function

**Files:**
- Create: `cloudfunctions/worker/handler.js`
- Create: `cloudfunctions/worker/worker-repository.js`
- Create: `cloudfunctions/worker/user-repository.js`
- Create: `cloudfunctions/worker/order-read-repository.js`
- Modify: `cloudfunctions/worker/index.js`
- Test: `tests/phase5.worker.test.js`

- [ ] **Step 1: Implement worker application and audit logic**

Use these statuses:

```javascript
const WORKER_AUDIT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}
```

Implement these actions:

- `applyWorker`
- `getWorkerInfo`
- `getAuditStatus`
- `getWorkerApplyList`
- `approveWorker`
- `rejectWorker`
- `getOrderHallList`

- [ ] **Step 2: Run phase five tests**

Run:

```bash
npm test
```

Expected result:

```text
worker application and admin audit tests pass; order acceptance tests may still fail until Task 3
```

---

### Task 3: Order Worker Actions

**Files:**
- Modify: `cloudfunctions/order/handler.js`
- Modify: `cloudfunctions/order/order-repository.js`
- Test: `tests/phase5.worker.test.js`

- [ ] **Step 1: Add worker order actions**

Implement:

- `acceptOrder`
- `getWorkerOrderList`

Update detail authorization so `getOrderDetail` allows either `order.user_id` or assigned `order.worker_id`.

- [ ] **Step 2: Run all tests**

Run:

```bash
npm test
```

Expected result:

```text
phase one through phase five cloud-function tests pass; page wiring tests may still fail until Task 4
```

---

### Task 4: Mini Program Pages

**Files:**
- Modify: `miniprogram/pages/worker/apply/apply.js`
- Modify: `miniprogram/pages/worker/apply/apply.wxml`
- Modify: `miniprogram/pages/worker/apply/apply.json`
- Modify: `miniprogram/pages/worker/apply/apply.wxss`
- Modify: `miniprogram/pages/worker/audit-status/audit-status.js`
- Modify: `miniprogram/pages/worker/audit-status/audit-status.wxml`
- Modify: `miniprogram/pages/worker/audit-status/audit-status.json`
- Modify: `miniprogram/pages/worker/audit-status/audit-status.wxss`
- Modify: `miniprogram/pages/admin/worker-audit/worker-audit.js`
- Modify: `miniprogram/pages/admin/worker-audit/worker-audit.wxml`
- Modify: `miniprogram/pages/admin/worker-audit/worker-audit.json`
- Modify: `miniprogram/pages/admin/worker-audit/worker-audit.wxss`
- Modify: `miniprogram/pages/worker/order-hall/order-hall.js`
- Modify: `miniprogram/pages/worker/order-hall/order-hall.wxml`
- Modify: `miniprogram/pages/worker/order-hall/order-hall.json`
- Modify: `miniprogram/pages/worker/order-hall/order-hall.wxss`
- Modify: `miniprogram/pages/worker/order-list/order-list.js`
- Modify: `miniprogram/pages/worker/order-list/order-list.wxml`
- Modify: `miniprogram/pages/worker/order-list/order-list.json`
- Modify: `miniprogram/pages/worker/order-list/order-list.wxss`
- Modify: `miniprogram/pages/worker/order-detail/order-detail.js`
- Modify: `miniprogram/pages/worker/order-detail/order-detail.wxml`
- Modify: `miniprogram/pages/worker/order-detail/order-detail.json`
- Modify: `miniprogram/pages/worker/order-detail/order-detail.wxss`
- Test: `tests/phase5.worker.test.js`

- [ ] **Step 1: Implement page wiring**

Pages should call:

- `workerService.applyWorker`
- `workerService.getAuditStatus`
- `workerService.getWorkerApplyList`
- `workerService.approveWorker`
- `workerService.rejectWorker`
- `workerService.getOrderHallList`
- `orderService.acceptOrder`
- `orderService.getWorkerOrderList`
- `orderService.getOrderDetail`

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
- Create: `docs/dev-records/05_phase-worker.md`
- Modify: `docs/dev-records/index.md`
- Modify: `README.md`

- [ ] **Step 1: Update records**

Record:

- phase five goal and completion
- created and modified files
- `workers` collection shape
- cloud function actions
- known risks
- test result
- phase six confirmation questions

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
git commit -m "feat: add worker onboarding and accepting phase"
```

Expected result:

```text
one new commit on master
```

---

## Self-Review

- The plan covers the four confirmed phase five decisions: simple worker fields, no qualification image upload, approve/reject audit, and `pending_accept` order hall with `accepted` transition.
- The implementation keeps direct database access inside cloud functions.
- The plan keeps service start, service finish, review, income, and admin order management out of phase five.
