# Service Area Dispatch V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add text-based service area management, worker availability, dispatch filtering, admin assignment, unassignment/reflow, and dispatch logs without changing the existing MVP payment mode.

**Architecture:** Add independent `area` and `dispatch` cloud functions, extend existing `address`, `order`, and `worker` functions with structured area fields and dispatch logging, and add thin mini program service/page wiring. The order lifecycle remains unchanged; dispatch actions only move orders between `pending_accept` and `accepted`.

**Tech Stack:** WeChat Mini Program, WeChat Cloud Functions, Node.js built-in test runner.

---

### Task 1: Regression Tests

**Files:**
- Create: `tests/phase15.service-area-dispatch.test.js`

- [x] Add failing tests for area management, structured address snapshots, worker online status, hall filtering, admin assignment, unassignment, logs, page wiring, and docs.
- [x] Run `npm test` and confirm failures are caused by missing phase 15 implementation.

### Task 2: Constants And Area Cloud Function

**Files:**
- Modify: `miniprogram/config/constants.js`
- Modify: `miniprogram/config/status.js`
- Create: `cloudfunctions/area/index.js`
- Create: `cloudfunctions/area/handler.js`
- Create: `cloudfunctions/area/area-repository.js`
- Create: `cloudfunctions/area/user-repository.js`
- Create: `cloudfunctions/area/package.json`
- Create: `miniprogram/services/area.service.js`

- [x] Add `AREA`, `DISPATCH`, `SERVICE_AREAS`, and `DISPATCH_LOGS` constants.
- [x] Add `SERVICE_AREA_STATUS`, `WORKER_ONLINE_STATUS`, and `DISPATCH_ACTION` constants.
- [x] Implement area list and admin create/update/enable/disable actions.
- [x] Add mini program area service wrapper.

### Task 3: Structured Address And Worker Area Fields

**Files:**
- Modify: `cloudfunctions/address/handler.js`
- Modify: `cloudfunctions/address/index.js`
- Create: `cloudfunctions/address/area-read-repository.js`
- Modify: `cloudfunctions/order/handler.js`
- Modify: `cloudfunctions/worker/handler.js`
- Modify: `miniprogram/services/worker.service.js`
- Modify: `miniprogram/pages/address-edit/*`
- Modify: `miniprogram/pages/worker/apply/*`
- Modify: `miniprogram/pages/worker/profile/*`

- [x] Validate enabled service areas for new/updated addresses when `service_area_id` is provided.
- [x] Save `district`, `street`, `service_area_id`, and `full_address` on addresses and order snapshots.
- [x] Save worker `service_area_ids`, `service_communities`, and `online_status`.
- [x] Add worker actions for service area and online status updates.

### Task 4: Dispatch Cloud Function And Order Logging

**Files:**
- Create: `cloudfunctions/dispatch/index.js`
- Create: `cloudfunctions/dispatch/handler.js`
- Create: `cloudfunctions/dispatch/dispatch-repository.js`
- Create: `cloudfunctions/dispatch/order-repository.js`
- Create: `cloudfunctions/dispatch/worker-repository.js`
- Create: `cloudfunctions/dispatch/message-repository.js`
- Create: `cloudfunctions/dispatch/admin-log-repository.js`
- Create: `cloudfunctions/dispatch/user-repository.js`
- Create: `cloudfunctions/dispatch/package.json`
- Create: `miniprogram/services/dispatch.service.js`
- Modify: `cloudfunctions/order/index.js`
- Modify: `cloudfunctions/order/handler.js`
- Create: `cloudfunctions/order/dispatch-repository.js`

- [x] Implement assignable worker filtering.
- [x] Implement `adminAssignOrder`.
- [x] Implement `adminUnassignOrder`.
- [x] Implement `getDispatchLogs`.
- [x] Write dispatch logs for worker active accept.

### Task 5: Mini Program Admin And Worker Pages

**Files:**
- Modify: `miniprogram/app.json`
- Create: `miniprogram/pages/admin/area-list/*`
- Create: `miniprogram/pages/admin/area-edit/*`
- Create: `miniprogram/pages/admin/assign-worker/*`
- Create: `miniprogram/pages/admin/dispatch-logs/*`
- Modify: `miniprogram/pages/admin/dashboard/*`
- Modify: `miniprogram/pages/admin/order-detail/*`
- Modify: `miniprogram/pages/worker/order-hall/*`
- Modify: `miniprogram/pages/worker-detail/*`
- Modify: `tests/phase1.scaffold.test.js`

- [x] Add admin area and dispatch routes.
- [x] Add area management pages.
- [x] Add assign worker and dispatch logs pages.
- [x] Add admin order detail actions.
- [x] Show worker online status and structured areas.

### Task 6: Docs, Verification, Commit

**Files:**
- Create: `docs/dev-records/15_service-area-dispatch-v1.md`
- Modify: `docs/dev-records/index.md`
- Modify: `README.md`
- Modify: `docs/release-package-checklist.md`
- Modify: `docs/wechat-mvp-verification.md`

- [x] Update documentation for `service_areas`, `dispatch_logs`, `area`, and `dispatch`.
- [x] Run `npm test`.
- [x] Commit only phase 15 files.
