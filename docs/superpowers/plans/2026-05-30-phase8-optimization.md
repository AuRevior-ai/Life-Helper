# Phase 8 Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the MVP by polishing verification readiness, removing misleading admin placeholders, and documenting the exact WeChat Mini Program validation path.

**Architecture:** Keep business behavior unchanged. Add a dedicated verification runbook under `docs/`, add a phase-eight regression test that locks the runbook and final UI/doc expectations, and update admin placeholder pages to explicit MVP deferred-scope pages.

**Tech Stack:** WeChat native Mini Program, WeChat cloud functions, Node.js built-in test runner, Markdown documentation.

---

### Task 1: Phase 8 Regression Test

**Files:**
- Create: `tests/phase8.optimization.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/phase8.optimization.test.js` with assertions that:

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

test('wechat MVP verification runbook lists every required collection and cloud function', () => {
  const runbook = read('docs/wechat-mvp-verification.md')

  ;[
    'users',
    'service_categories',
    'services',
    'addresses',
    'orders',
    'workers',
    'reviews'
  ].forEach((collection) => {
    assert.match(runbook, new RegExp(`\\\`${collection}\\\``))
  })

  ;[
    'login',
    'user',
    'service',
    'address',
    'order',
    'worker',
    'review',
    'admin'
  ].forEach((cloudFunction) => {
    assert.match(runbook, new RegExp(`cloudfunctions/${cloudFunction}`))
  })

  assert.match(runbook, /touristappid/)
  assert.match(runbook, /role` 字段改为 `admin`/)
  assert.match(runbook, /同步种子服务/)
  assert.match(runbook, /用户下单到评价闭环/)
  assert.match(runbook, /管理员验证/)
})

test('README links final verification runbook and marks all eight phases complete', () => {
  const readme = read('README.md')

  assert.match(readme, /阶段八：优化、验证准备与文档收口/)
  assert.match(readme, /docs\\/wechat-mvp-verification.md/)
  assert.match(readme, /第一版 MVP 已完成/)
})

test('admin deferred edit pages explain MVP scope instead of showing empty placeholders', () => {
  const categoryEditWxml = read('miniprogram/pages/admin/category-edit/category-edit.wxml')
  const serviceEditWxml = read('miniprogram/pages/admin/service-edit/service-edit.wxml')
  const categoryEditJs = read('miniprogram/pages/admin/category-edit/category-edit.js')
  const serviceEditJs = read('miniprogram/pages/admin/service-edit/service-edit.js')

  assert.doesNotMatch(categoryEditWxml, /暂无数据/)
  assert.doesNotMatch(serviceEditWxml, /暂无数据/)
  assert.match(categoryEditWxml, /MVP 阶段暂不开放分类编辑/)
  assert.match(serviceEditWxml, /MVP 阶段暂不开放服务编辑/)
  assert.match(categoryEditJs, /goBack/)
  assert.match(serviceEditJs, /goServiceList/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

Expected: FAIL because `docs/wechat-mvp-verification.md` does not exist and edit pages still show `暂无数据`.

### Task 2: Verification Runbook and README

**Files:**
- Create: `docs/wechat-mvp-verification.md`
- Modify: `README.md`

- [ ] **Step 1: Add the verification runbook**

Create a concise checklist covering:

- project setup and AppID replacement from `touristappid`
- required collections: `users`, `service_categories`, `services`, `addresses`, `orders`, `workers`, `reviews`
- required cloud functions: `login`, `user`, `service`, `address`, `order`, `worker`, `review`, `admin`
- admin initialization by changing `users.role` to `admin`
- seed sync through service management
- user order-to-review loop
- worker loop
- admin verification

- [ ] **Step 2: Update README**

Add phase eight to completed phases, state that the first MVP is complete, and link `docs/wechat-mvp-verification.md`.

- [ ] **Step 3: Run test**

Run: `npm test`

Expected: README/runbook assertions pass, edit-page assertions still fail.

### Task 3: Admin Deferred Edit Pages

**Files:**
- Modify: `miniprogram/pages/admin/category-edit/category-edit.js`
- Modify: `miniprogram/pages/admin/category-edit/category-edit.wxml`
- Modify: `miniprogram/pages/admin/category-edit/category-edit.wxss`
- Modify: `miniprogram/pages/admin/service-edit/service-edit.js`
- Modify: `miniprogram/pages/admin/service-edit/service-edit.wxml`
- Modify: `miniprogram/pages/admin/service-edit/service-edit.wxss`

- [ ] **Step 1: Replace placeholder pages**

Change both pages from `暂无数据` to explicit deferred MVP scope messages and provide navigation buttons back to list pages.

- [ ] **Step 2: Run test**

Run: `npm test`

Expected: all tests pass.

### Task 4: Phase Records and Commit

**Files:**
- Create: `docs/dev-records/08_phase-optimization.md`
- Modify: `docs/dev-records/index.md`

- [ ] **Step 1: Write phase-eight record**

Document completed work, verification commands, remaining real-device items, and the final MVP conclusion.

- [ ] **Step 2: Update index**

Mark phase eight completed and set current progress to first MVP completed.

- [ ] **Step 3: Final verification**

Run:

```bash
npm test
node --check tests/phase8.optimization.test.js
git diff --check
```

Expected: tests and syntax pass, no whitespace errors.

- [ ] **Step 4: Commit**

Commit only phase-eight files and leave unrelated `icon.png` untouched:

```bash
git add README.md docs/wechat-mvp-verification.md docs/dev-records/index.md docs/dev-records/08_phase-optimization.md docs/superpowers/plans/2026-05-30-phase8-optimization.md tests/phase8.optimization.test.js miniprogram/pages/admin/category-edit/category-edit.js miniprogram/pages/admin/category-edit/category-edit.wxml miniprogram/pages/admin/category-edit/category-edit.wxss miniprogram/pages/admin/service-edit/service-edit.js miniprogram/pages/admin/service-edit/service-edit.wxml miniprogram/pages/admin/service-edit/service-edit.wxss
git commit -m "chore: finish MVP verification phase"
```

---

## Self-Review

- Spec coverage: covers final documentation, verification readiness, misleading placeholder cleanup, phase report, and commit.
- Placeholder scan: no TBD/TODO placeholders remain in this plan.
- Type consistency: all file paths and test names match repository conventions.
