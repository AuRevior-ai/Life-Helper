# Phase 21 LBS Map Service Area V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mock-safe map point fields, shared LBS matching, radius/admin-area service range configuration, LBS-aware filtering, and phase 21 documentation.

**Architecture:** Shared backend/frontend LBS utilities own all distance and area matching. Existing address, order, area, worker, dispatch, and merchant cloud functions are extended narrowly without rewriting their core flows.

**Tech Stack:** WeChat Mini Program JavaScript, Node CommonJS, `wx-server-sdk`, Node built-in test runner.

---

### Task 1: Red Tests

**Files:**
- Create: `tests/phase21.lbs-map-service-area-v2.test.js`

- [ ] Write tests for distance calculation, radius/admin-area matching, address LBS persistence, order address snapshots, service-area location fields, worker service range fields, LBS order hall filtering, admin provider candidates, store distance sorting, and required docs.
- [ ] Run `node --test tests/phase21.lbs-map-service-area-v2.test.js`.
- [ ] Confirm failure because LBS utilities, fields, actions, routes, and docs do not exist yet.

### Task 2: Shared LBS Utilities

**Files:**
- Create: `cloudfunctions/_shared/lbs-utils.js`
- Create: `miniprogram/utils/lbs.js`

- [ ] Implement `calculateDistanceMeters`, `calculateDistanceKm`, `isWithinRadius`, `matchAdminArea`, `matchProviderServiceRange`, and `sortProvidersByDistance`.
- [ ] Run phase 21 tests and confirm utility-focused assertions pass.

### Task 3: Backend Field Extensions

**Files:**
- Modify: `cloudfunctions/address/handler.js`
- Modify: `cloudfunctions/order/handler.js`
- Modify: `cloudfunctions/area/handler.js`
- Modify: `cloudfunctions/worker/handler.js`
- Modify: `cloudfunctions/dispatch/handler.js`
- Modify: `cloudfunctions/dispatch/index.js`
- Modify: `cloudfunctions/merchant/handler.js`
- Modify: `cloudfunctions/merchant/repositories.js`

- [ ] Add LBS fields to address and service-area normalization.
- [ ] Save order address snapshots.
- [ ] Use shared LBS matching in order hall and dispatch.
- [ ] Add provider candidates and store distance sorting.
- [ ] Run phase 21 tests.

### Task 4: Frontend Routes And Docs

**Files:**
- Create: `miniprogram/pages/map/pick-location/*`
- Create: `miniprogram/pages/provider/service-range/*`
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/config/status.js`
- Modify: `miniprogram/services/area.service.js`
- Modify: `miniprogram/services/worker.service.js`
- Create: `docs/map-lbs-setup.md`
- Create: `docs/dev-records/21_lbs-map-service-area-v2.md`
- Modify: `README.md`
- Modify: `docs/dev-records/index.md`
- Modify: `docs/release-package-checklist.md`
- Modify: `tests/phase1.scaffold.test.js`

- [ ] Register new pages and action service names.
- [ ] Add map setup and real-device verification guidance.
- [ ] Run `node --test tests/phase21.lbs-map-service-area-v2.test.js`.
- [ ] Run `npm test`.
