# Phase 7 Admin Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add MVP admin management for dashboard stats, order management, user management, and cloud-database-backed service management.

**Architecture:** Admin-only reads and mutations live in the `admin` cloud function. Service catalog migration and service maintenance live in the `service` cloud function so public service browsing and admin service management share one source of truth with seed-data fallback.

**Tech Stack:** WeChat native mini program, WeChat Cloud Functions, CommonJS modules, Node built-in test runner.

---

## File Structure

- Create `tests/phase7.admin.test.js`: admin dashboard/order/user/service behavior and page wiring tests.
- Create `cloudfunctions/admin/handler.js`: admin dashboard, orders, users, stats, and admin status updates.
- Create `cloudfunctions/admin/repositories.js`: users/orders/workers/categories/services collection access.
- Modify `cloudfunctions/admin/index.js`: inject repositories and current openid.
- Modify `cloudfunctions/service/handler.js`: add repository-backed reads, seed migration, category/service admin actions.
- Create `cloudfunctions/service/repositories.js`: service category and service collection access.
- Modify `cloudfunctions/service/index.js`: inject repositories and user repository.
- Modify `miniprogram/services/admin.service.js`: expose admin order/user actions.
- Modify `miniprogram/services/service.service.js`: expose `seedServiceData`.
- Modify `miniprogram/pages/admin/dashboard/*`: management statistics and entry links.
- Modify `miniprogram/pages/admin/order-list/*`: admin order list.
- Modify `miniprogram/pages/admin/order-detail/*`: admin order detail and manual status change.
- Modify `miniprogram/pages/admin/user-list/*`: user list and disable action.
- Modify `miniprogram/pages/admin/service-list/*`: service list, seed migration, status toggle.
- Modify `miniprogram/pages/admin/category-list/*`: category list from service catalog.
- Modify `README.md`, `docs/dev-records/index.md`, and create `docs/dev-records/07_phase-admin.md`.

---

### Task 1: Failing Tests

**Files:**
- Create: `tests/phase7.admin.test.js`

- [ ] **Step 1: Write failing tests**

Create tests for:

- `admin.getDashboard` returns user count, order count, pending worker count, and completed order amount.
- non-admin users cannot call admin APIs.
- `admin.getAllUsers` returns users and `admin.disableUser` disables a user.
- `admin.getAllOrders` returns orders and `admin.adminUpdateOrderStatus` manually updates status.
- `service.seedServiceData` migrates seed categories/services into repositories.
- service reads prefer repository data when available.
- admin pages reference the expected service methods.

- [ ] **Step 2: Run tests to verify red**

Run:

```bash
npm test
```

Expected result:

```text
tests fail because admin handler is missing and service seed migration is not implemented
```

---

### Task 2: Admin Cloud Function

**Files:**
- Create: `cloudfunctions/admin/handler.js`
- Create: `cloudfunctions/admin/repositories.js`
- Modify: `cloudfunctions/admin/index.js`
- Modify: `miniprogram/services/admin.service.js`
- Test: `tests/phase7.admin.test.js`

- [ ] **Step 1: Implement admin APIs**

Implement:

- `getDashboard`
- `getAllUsers`
- `disableUser`
- `getAllOrders`
- `getOrderDetail`
- `adminUpdateOrderStatus`
- `getOrderStats`
- `getServiceStats`

- [ ] **Step 2: Run tests**

Run:

```bash
npm test
```

Expected result:

```text
admin cloud function tests pass; service migration and page tests may still fail
```

---

### Task 3: Service Database Migration

**Files:**
- Modify: `cloudfunctions/service/handler.js`
- Create: `cloudfunctions/service/repositories.js`
- Modify: `cloudfunctions/service/index.js`
- Modify: `miniprogram/services/service.service.js`
- Test: `tests/phase7.admin.test.js`

- [ ] **Step 1: Implement repository-backed service catalog**

Implement:

- `seedServiceData`
- repository-backed `getCategoryList`
- repository-backed `getServiceList`
- repository-backed `getServiceDetail`
- `updateServiceStatus`
- minimal `createCategory`, `updateCategory`, `deleteCategory`, `createService`, `updateService`, `deleteService`

- [ ] **Step 2: Run tests**

Run:

```bash
npm test
```

Expected result:

```text
cloud-function tests pass; page wiring tests may still fail
```

---

### Task 4: Admin Pages

**Files:**
- Modify: `miniprogram/pages/admin/dashboard/*`
- Modify: `miniprogram/pages/admin/order-list/*`
- Modify: `miniprogram/pages/admin/order-detail/*`
- Modify: `miniprogram/pages/admin/user-list/*`
- Modify: `miniprogram/pages/admin/service-list/*`
- Modify: `miniprogram/pages/admin/category-list/*`
- Test: `tests/phase7.admin.test.js`

- [ ] **Step 1: Implement page wiring**

Pages should call:

- `adminService.getDashboard`
- `adminService.getAllOrders`
- `adminService.getOrderDetail`
- `adminService.adminUpdateOrderStatus`
- `adminService.getAllUsers`
- `adminService.disableUser`
- `serviceService.seedServiceData`
- `serviceService.getServiceList`
- `serviceService.updateServiceStatus`
- `serviceService.getCategoryList`

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
- Create: `docs/dev-records/07_phase-admin.md`
- Modify: `docs/dev-records/index.md`
- Modify: `README.md`

- [ ] **Step 1: Update records**

Record:

- phase seven goal and completion
- service database migration
- admin APIs
- known risks
- test result
- phase eight confirmation questions

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
git commit -m "feat: add admin management phase"
```

Expected result:

```text
one new commit on master
```

---

## Self-Review

- The plan covers dashboard stats, manual order status updates, user disable, and service seed migration.
- It does not add refunds, real finance, or complex user profiling.
- It leaves final UI polish and real-device verification for phase eight and the user's post-phase validation pass.
