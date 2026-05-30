# Phase 3 Service Browse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement service category, service list, and service detail browsing for the MVP.

**Architecture:** The `service` cloud function exposes read-only MVP browsing actions backed by built-in seed data. User-facing pages call the existing `service.service.js` layer and render categories, services, and details without direct database access.

**Tech Stack:** WeChat Mini Program, JavaScript CommonJS, WXML, WXSS, WeChat Cloud Functions, Node.js built-in test runner.

---

### Task 1: Add Service Browse Tests

**Files:**
- Create: `tests/phase3.service-browse.test.js`

- [x] Test fixed MVP categories: 家政保洁、维修服务、宠物服务.
- [x] Test service list filtering by category and on-shelf status.
- [x] Test service detail lookup by service ID.
- [x] Test user pages call service APIs and expose expected navigation hooks.
- [x] Run `npm test` and verify tests fail before implementation.

### Task 2: Implement Service Cloud Function

**Files:**
- Create: `cloudfunctions/service/seed-data.js`
- Create: `cloudfunctions/service/handler.js`
- Modify: `cloudfunctions/service/index.js`

- [ ] Add three service categories.
- [ ] Add seed services under each category with price in fen, duration, intro, flow steps, and on/off status.
- [ ] Implement `getCategoryList`, `getServiceList`, and `getServiceDetail`.
- [ ] Return unified success/error responses.

### Task 3: Implement User Browsing Pages

**Files:**
- Modify: `miniprogram/pages/index/index.js`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.wxss`
- Modify: `miniprogram/pages/service-list/service-list.js`
- Modify: `miniprogram/pages/service-list/service-list.json`
- Modify: `miniprogram/pages/service-list/service-list.wxml`
- Modify: `miniprogram/pages/service-list/service-list.wxss`
- Modify: `miniprogram/pages/service-detail/service-detail.js`
- Modify: `miniprogram/pages/service-detail/service-detail.wxml`
- Modify: `miniprogram/pages/service-detail/service-detail.wxss`

- [ ] Home page loads categories and recommended services.
- [ ] Service list filters by category ID and supports pull-down refresh.
- [ ] Service detail displays name, price, duration, category, description, flow steps, and appointment button placeholder.
- [ ] Add empty/loading/error states.

### Task 4: Update Records And Commit

**Files:**
- Create: `docs/dev-records/03_phase-service-browse.md`
- Modify: `docs/dev-records/index.md`
- Modify: `README.md`

- [ ] Record phase 3 completed work, seed data, cloud function changes, tests, risks, and next phase plan.
- [ ] Update P0 service category/list/detail checkboxes.
- [ ] Run `npm test`.
- [ ] Commit all phase 3 changes.
