const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

const pages = [
  ["order detail", "pages/admin/order-detail/order-detail"],
  ["worker audit", "pages/admin/worker-audit/worker-audit"],
  ["after sale list", "pages/admin/after-sale-list/after-sale-list"],
  ["after sale detail", "pages/admin/after-sale-detail/after-sale-detail"],
  ["review list", "pages/admin/review-list/review-list"],
  ["review detail", "pages/admin/review-detail/review-detail"],
  ["review appeal list", "pages/admin/review-appeal-list/review-appeal-list"],
  ["review appeal detail", "pages/admin/review-appeal-detail/review-appeal-detail"],
];

const serviceExpectations = [
  ["pages/admin/order-detail/order-detail", [/adminService\.getOrderDetail/, /adminService\.adminUpdateOrderStatus/, /dispatchService\.adminUnassignOrder/]],
  ["pages/admin/worker-audit/worker-audit", [/workerService\.getWorkerApplyList/, /workerService\.approveWorker/, /workerService\.rejectWorker/]],
  ["pages/admin/after-sale-list/after-sale-list", [/refundService\.adminGetAfterSaleList/]],
  ["pages/admin/after-sale-detail/after-sale-detail", [/refundService\.getAfterSaleDetail/, /refundService\.adminReviewAfterSale/]],
  ["pages/admin/review-list/review-list", [/reviewService\.adminGetReviewList/]],
  ["pages/admin/review-detail/review-detail", [/reviewService\.adminGetReviewDetail/, /reviewService\.adminHideReview/, /reviewService\.adminRestoreReview/]],
  ["pages/admin/review-appeal-list/review-appeal-list", [/reviewService\.adminGetReviewAppealList/]],
  ["pages/admin/review-appeal-detail/review-appeal-detail", [/reviewService\.adminGetReviewAppealDetail/, /reviewService\.adminReviewAppeal/]],
];

test("phase 24B-1 record exists and all protected admin secondary pages are registered", () => {
  assert.equal(exists("docs/dev-records/24b-admin-secondary-ui.md"), true);

  const app = JSON.parse(read("miniprogram/app.json"));
  for (const [, route] of pages) {
    assert.ok(app.pages.includes(route), `${route} should be registered`);
    assert.equal(exists(`miniprogram/${route}.js`), true, `${route}.js exists`);
    assert.equal(exists(`miniprogram/${route}.wxml`), true, `${route}.wxml exists`);
    assert.equal(exists(`miniprogram/${route}.wxss`), true, `${route}.wxss exists`);
  }
});

test("phase 24B-1 pages use admin theme and shared secondary page structure", () => {
  for (const [name, route] of pages) {
    const wxml = read(`miniprogram/${route}.wxml`);
    const wxss = read(`miniprogram/${route}.wxss`);

    assert.match(wxss, /@import\s+["']\.\.\/\.\.\/\.\.\/styles\/admin-theme\.wxss["']/, `${name} should import admin theme`);
    for (const className of [
      "admin-page",
      "admin-header",
      "admin-section-card",
      "admin-status-card",
      "admin-action-card",
    ]) {
      assert.match(wxml, new RegExp(className), `${name} should include ${className}`);
    }
    assert.doesNotMatch(wxml, /page-shell|class="panel"|class='panel'/, `${name} should not use legacy shell`);
  }
});

test("phase 24B-1 list pages include filters, loading, error, empty, and list cards", () => {
  const listPages = [
    ["worker audit", "pages/admin/worker-audit/worker-audit"],
    ["after sale list", "pages/admin/after-sale-list/after-sale-list"],
    ["review list", "pages/admin/review-list/review-list"],
    ["review appeal list", "pages/admin/review-appeal-list/review-appeal-list"],
  ];

  for (const [name, route] of listPages) {
    const js = read(`miniprogram/${route}.js`);
    const wxml = read(`miniprogram/${route}.wxml`);

    assert.match(wxml, /admin-filter-card/, `${name} should include filter card`);
    assert.match(wxml, /admin-list-card/, `${name} should include list card`);
    assert.match(wxml, /loading-view/, `${name} should include loading state`);
    assert.match(wxml, /empty-state/, `${name} should include empty state`);
    assert.match(wxml, /errorText/, `${name} should include error state`);
    assert.match(js, /errorText/, `${name} should manage errorText`);
  }
});

test("phase 24B-1 detail pages group information and keep bottom/admin actions", () => {
  const detailPages = [
    ["order detail", "pages/admin/order-detail/order-detail"],
    ["after sale detail", "pages/admin/after-sale-detail/after-sale-detail"],
    ["review detail", "pages/admin/review-detail/review-detail"],
    ["review appeal detail", "pages/admin/review-appeal-detail/review-appeal-detail"],
  ];

  for (const [name, route] of detailPages) {
    const js = read(`miniprogram/${route}.js`);
    const wxml = read(`miniprogram/${route}.wxml`);

    for (const text of ["基础信息", "状态信息", "管理操作"]) {
      assert.match(wxml, new RegExp(text), `${name} should include ${text}`);
    }
    assert.match(wxml, /loading-view/, `${name} should include loading state`);
    assert.match(wxml, /empty-state/, `${name} should include empty state`);
    assert.match(wxml, /errorText/, `${name} should include error state`);
    assert.match(js, /errorText/, `${name} should manage errorText`);
    assert.match(js, /loading/, `${name} should manage loading`);
    assert.match(js, /submitting/, `${name} should manage submitting`);
  }
});

test("phase 24B-1 pages preserve service calls and do not call cloud functions directly", () => {
  for (const [route, patterns] of serviceExpectations) {
    const js = read(`miniprogram/${route}.js`);
    for (const pattern of patterns) {
      assert.match(js, pattern, `${route} should keep ${pattern}`);
    }
    assert.doesNotMatch(js, /wx\.cloud\.callFunction/, `${route} should use service layer`);
  }
});

test("phase 24B-1 pages avoid misleading real capability wording", () => {
  const forbidden =
    /真实支付已接入|真实退款已完成|自动风控已上线|真实认证已接入|真实到账|微信提现已开通|OCR 已上线|AI 派单已上线|前端已完成订单|前端直接退款成功|前端结算收益/;

  for (const [, route] of pages) {
    const content = `${read(`miniprogram/${route}.js`)}\n${read(
      `miniprogram/${route}.wxml`,
    )}\n${read(`miniprogram/${route}.wxss`)}`;
    assert.doesNotMatch(content, forbidden, `${route} has forbidden wording`);
  }
});

test("phase 24B-1 documents unchanged business logic and mock boundaries", () => {
  const record = read("docs/dev-records/24b-admin-secondary-ui.md");
  const phase = read("docs/PHASE_CURRENT.md");
  const status = read("docs/PROJECT_STATUS.md");

  for (const text of [
    "阶段 24B-1",
    "管理员端订单 / 审核 / 售后 / 评价治理二级页面 UI 收口",
    "不修改云函数",
    "不修改 `miniprogram/services/*`",
    "不修改 schema",
    "不修改订单状态机",
    "mock",
    "人工审核",
    "内部模拟",
    "24B-2 服务 / 分类 / 区域 / 派单页面",
  ]) {
    assert.match(record, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(phase, /阶段 24B-1/);
  assert.match(status, /阶段 24B-1/);
});
