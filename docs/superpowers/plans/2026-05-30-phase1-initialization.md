# Phase 1 Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-phase WeChat Mini Program scaffold for the community service MVP.

**Architecture:** Create a WeChat native miniprogram with clear `config`, `utils`, `services`, `components`, and role-based `pages` boundaries. Cloud functions are created as deployable folders with consistent action-based entry points, while actual business logic remains for later phases.

**Tech Stack:** WeChat Mini Program, JavaScript CommonJS modules, WXSS, WXML, WeChat Cloud Functions, Node.js built-in test runner.

---

### Task 1: Add Scaffold Verification Tests

**Files:**
- Create: `package.json`
- Create: `tests/phase1.scaffold.test.js`

- [ ] **Step 1: Add the test runner script**

```json
{
  "name": "local-community-service-mvp",
  "version": "0.1.0",
  "private": true,
  "description": "同城社区便民综合服务平台微信小程序 MVP",
  "scripts": {
    "test": "node --test tests/*.test.js"
  }
}
```

- [ ] **Step 2: Add scaffold tests**

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const expectedPages = [
  'pages/index/index',
  'pages/service-list/service-list',
  'pages/service-detail/service-detail',
  'pages/order-submit/order-submit',
  'pages/order-list/order-list',
  'pages/order-detail/order-detail',
  'pages/review/review',
  'pages/address-list/address-list',
  'pages/address-edit/address-edit',
  'pages/profile/profile',
  'pages/worker/apply/apply',
  'pages/worker/audit-status/audit-status',
  'pages/worker/order-hall/order-hall',
  'pages/worker/order-list/order-list',
  'pages/worker/order-detail/order-detail',
  'pages/worker/income/income',
  'pages/worker/profile/profile',
  'pages/admin/dashboard/dashboard',
  'pages/admin/category-list/category-list',
  'pages/admin/category-edit/category-edit',
  'pages/admin/service-list/service-list',
  'pages/admin/service-edit/service-edit',
  'pages/admin/worker-audit/worker-audit',
  'pages/admin/order-list/order-list',
  'pages/admin/order-detail/order-detail',
  'pages/admin/user-list/user-list'
]

function absolute(relativePath) {
  return path.join(rootDir, relativePath)
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), 'utf8'))
}

test('app.json declares expected routes and tabBar', () => {
  const appConfig = readJson('miniprogram/app.json')
  assert.deepEqual(appConfig.pages, expectedPages)
  assert.deepEqual(
    appConfig.tabBar.list.map((item) => item.pagePath),
    ['pages/index/index', 'pages/order-list/order-list', 'pages/profile/profile']
  )
})

test('every declared page has js, json, wxml, and wxss files', () => {
  const appConfig = readJson('miniprogram/app.json')
  for (const page of appConfig.pages) {
    for (const ext of ['js', 'json', 'wxml', 'wxss']) {
      assert.equal(fs.existsSync(absolute(`miniprogram/${page}.${ext}`)), true)
    }
  }
})

test('core constants define stable order, pay, and role enums', () => {
  const { ORDER_STATUS, PAY_STATUS } = require('../miniprogram/config/status')
  const { USER_ROLE } = require('../miniprogram/config/roles')

  assert.equal(ORDER_STATUS.PENDING_PAY, 'pending_pay')
  assert.equal(ORDER_STATUS.PENDING_ACCEPT, 'pending_accept')
  assert.equal(ORDER_STATUS.ACCEPTED, 'accepted')
  assert.equal(ORDER_STATUS.SERVING, 'serving')
  assert.equal(ORDER_STATUS.PENDING_REVIEW, 'pending_review')
  assert.equal(ORDER_STATUS.COMPLETED, 'completed')
  assert.equal(ORDER_STATUS.CANCELED, 'canceled')
  assert.equal(PAY_STATUS.UNPAID, 'unpaid')
  assert.equal(PAY_STATUS.PAID, 'paid')
  assert.equal(USER_ROLE.USER, 'user')
  assert.equal(USER_ROLE.WORKER, 'worker')
  assert.equal(USER_ROLE.ADMIN, 'admin')
})

test('format helpers keep money and addresses consistent', () => {
  const { formatPrice, buildFullAddress } = require('../miniprogram/utils/format')

  assert.equal(formatPrice(9900), '¥99.00')
  assert.equal(formatPrice(0), '¥0.00')
  assert.equal(
    buildFullAddress({
      city: '杭州',
      community: '未来小区',
      detail_address: '1 幢 101'
    }),
    '杭州 未来小区 1 幢 101'
  )
})

test('cloud function folders expose index.js and package.json', () => {
  for (const name of ['login', 'user', 'service', 'address', 'order', 'worker', 'review', 'admin']) {
    assert.equal(fs.existsSync(absolute(`cloudfunctions/${name}/index.js`)), true)
    assert.equal(fs.existsSync(absolute(`cloudfunctions/${name}/package.json`)), true)
  }
})
```

- [ ] **Step 3: Run tests and verify RED**

Run: `npm test`

Expected: tests fail because `miniprogram/app.json`, config modules, helpers, and cloud function folders do not exist yet.

### Task 2: Create First-Phase Scaffold

**Files:**
- Create: `.gitignore`
- Create: `project.config.json`
- Create: `README.md`
- Create: `miniprogram/app.js`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/config/*.js`
- Create: `miniprogram/utils/*.js`
- Create: `miniprogram/services/*.js`
- Create: `miniprogram/components/*/*`
- Create: all page skeleton files declared in `miniprogram/app.json`
- Create: `cloudfunctions/*/index.js`
- Create: `cloudfunctions/*/package.json`

- [ ] **Step 1: Create the files listed above**

The implementation must keep pages as thin skeletons, export stable constants, format money in cents as yuan, and expose all cloud function folders.

- [ ] **Step 2: Run tests and verify GREEN**

Run: `npm test`

Expected: all scaffold tests pass.

- [ ] **Step 3: Check Git status**

Run: `git status --short`

Expected: only intentional first-phase files are shown as added or modified.
