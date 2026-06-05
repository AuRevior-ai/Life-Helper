const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const phaseDoc = path.join(
  root,
  "docs/dev-records/24b3-admin-finance-merchant-risk-ui.md",
);

const pages = [
  "miniprogram/pages/admin/finance-log-list/finance-log-list",
  "miniprogram/pages/admin/worker-earning-list/worker-earning-list",
  "miniprogram/pages/admin/order-finance-detail/order-finance-detail",
  "miniprogram/pages/admin/tip-log-list/tip-log-list",
  "miniprogram/pages/admin/merchant-list/merchant-list",
  "miniprogram/pages/admin/merchant-detail/merchant-detail",
  "miniprogram/pages/admin/qualification-review/qualification-review",
  "miniprogram/pages/admin/deposit-review/deposit-review",
  "miniprogram/pages/admin/risk-control/risk-control",
  "miniprogram/pages/admin/user-list/user-list",
];

const listPages = new Set([
  "miniprogram/pages/admin/finance-log-list/finance-log-list",
  "miniprogram/pages/admin/worker-earning-list/worker-earning-list",
  "miniprogram/pages/admin/tip-log-list/tip-log-list",
  "miniprogram/pages/admin/merchant-list/merchant-list",
  "miniprogram/pages/admin/qualification-review/qualification-review",
  "miniprogram/pages/admin/deposit-review/deposit-review",
  "miniprogram/pages/admin/risk-control/risk-control",
  "miniprogram/pages/admin/user-list/user-list",
]);

const actionPages = new Set([
  "miniprogram/pages/admin/merchant-detail/merchant-detail",
  "miniprogram/pages/admin/qualification-review/qualification-review",
  "miniprogram/pages/admin/deposit-review/deposit-review",
  "miniprogram/pages/admin/risk-control/risk-control",
  "miniprogram/pages/admin/user-list/user-list",
]);

const boundaryPages = new Set([
  "miniprogram/pages/admin/finance-log-list/finance-log-list",
  "miniprogram/pages/admin/worker-earning-list/worker-earning-list",
  "miniprogram/pages/admin/order-finance-detail/order-finance-detail",
  "miniprogram/pages/admin/tip-log-list/tip-log-list",
  "miniprogram/pages/admin/qualification-review/qualification-review",
  "miniprogram/pages/admin/deposit-review/deposit-review",
  "miniprogram/pages/admin/risk-control/risk-control",
]);

const serviceExpectations = {
  "miniprogram/pages/admin/finance-log-list/finance-log-list": [
    "financeService.adminGetFinanceLogs",
  ],
  "miniprogram/pages/admin/worker-earning-list/worker-earning-list": [
    "financeService.adminGetWorkerEarnings",
  ],
  "miniprogram/pages/admin/order-finance-detail/order-finance-detail": [
    "financeService.adminGetOrderFinanceDetail",
  ],
  "miniprogram/pages/admin/tip-log-list/tip-log-list": [
    "tipService.adminGetTipLogs",
  ],
  "miniprogram/pages/admin/merchant-list/merchant-list": [
    "merchantService.adminGetMerchantList",
  ],
  "miniprogram/pages/admin/merchant-detail/merchant-detail": [
    "merchantService.adminGetMerchantDetail",
    "merchantService.adminApproveMerchant",
    "merchantService.adminRejectMerchant",
    "merchantService.adminEnableMerchant",
    "merchantService.adminDisableMerchant",
  ],
  "miniprogram/pages/admin/qualification-review/qualification-review": [
    "qualificationService.adminListQualifications",
    "qualificationService.adminReviewQualification",
  ],
  "miniprogram/pages/admin/deposit-review/deposit-review": [
    "qualificationService.adminListDeposits",
    "qualificationService.adminFreezeDeposit",
    "qualificationService.adminReviewDepositRefund",
  ],
  "miniprogram/pages/admin/risk-control/risk-control": [
    "qualificationService.adminListRiskRecords",
    "qualificationService.adminSetRiskLevel",
  ],
  "miniprogram/pages/admin/user-list/user-list": [
    "adminService.getAllUsers",
    "adminService.disableUser",
  ],
};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fileFor(page, ext) {
  return path.join(root, `${page}.${ext}`);
}

test("phase 24B-3 development record exists and names the scoped phase", () => {
  assert.equal(fs.existsSync(phaseDoc), true);
  const doc = fs.readFileSync(phaseDoc, "utf8");
  assert.match(doc, /阶段 24B-3：管理员端财务 \/ 商家 \/ 资质 \/ 保证金 \/ 风控 \/ 用户管理页面 UI 收口/);
  assert.match(doc, /mock \/ 真实能力边界/);
  assert.match(doc, /不修改业务逻辑/);
  assert.match(doc, /24B-4/);
});

test("phase 24B-3 admin pages are registered and keep page files", () => {
  const app = JSON.parse(read("miniprogram/app.json"));
  for (const page of pages) {
    const registeredPath = page.replace(/^miniprogram\//, "");
    assert.ok(app.pages.includes(registeredPath), `${page} should be registered`);
    for (const ext of ["js", "wxml", "wxss"]) {
      assert.equal(fs.existsSync(fileFor(page, ext)), true, `${page}.${ext}`);
    }
  }
});

test("phase 24B-3 pages use admin theme and secondary admin structure", () => {
  for (const page of pages) {
    const wxml = fs.readFileSync(fileFor(page, "wxml"), "utf8");
    const wxss = fs.readFileSync(fileFor(page, "wxss"), "utf8");
    assert.match(wxss, /@import\s+["']\.\.\/\.\.\/\.\.\/styles\/admin-theme\.wxss["'];/);
    for (const className of [
      "admin-page",
      "admin-header",
      "admin-section-card",
      "admin-status-card",
      "admin-action-card",
    ]) {
      assert.ok(wxml.includes(className), `${page} missing ${className}`);
    }
    assert.doesNotMatch(wxml, /class=["'][^"']*\bpage-shell\b/);
    assert.doesNotMatch(wxml, /class=["']panel["']/);
    assert.doesNotMatch(wxml, /class=["']page["']/);
  }
});

test("phase 24B-3 boundary pages include explicit boundary cards", () => {
  for (const page of boundaryPages) {
    const wxml = fs.readFileSync(fileFor(page, "wxml"), "utf8");
    assert.ok(wxml.includes("admin-boundary-card"), `${page} missing boundary card`);
  }
});

test("phase 24B-3 list pages include filters, loading, empty and error states", () => {
  for (const page of listPages) {
    const wxml = fs.readFileSync(fileFor(page, "wxml"), "utf8");
    const js = fs.readFileSync(fileFor(page, "js"), "utf8");
    assert.ok(wxml.includes("admin-filter-card"), `${page} missing filter card`);
    assert.ok(wxml.includes("admin-list-card"), `${page} missing list card`);
    assert.ok(wxml.includes("loading-view"), `${page} missing loading view`);
    assert.ok(wxml.includes("empty-state"), `${page} missing empty state`);
    assert.ok(wxml.includes("errorText"), `${page} missing error binding`);
    assert.ok(js.includes("errorText"), `${page} missing error state data`);
  }
});

test("phase 24B-3 action pages manage submitting state", () => {
  for (const page of actionPages) {
    const js = fs.readFileSync(fileFor(page, "js"), "utf8");
    const wxml = fs.readFileSync(fileFor(page, "wxml"), "utf8");
    assert.ok(js.includes("submitting"), `${page} missing submitting state`);
    assert.ok(wxml.includes("submitting"), `${page} missing submitting binding`);
  }
});

test("phase 24B-3 detail pages group information and boundaries", () => {
  for (const page of [
    "miniprogram/pages/admin/order-finance-detail/order-finance-detail",
    "miniprogram/pages/admin/merchant-detail/merchant-detail",
  ]) {
    const wxml = fs.readFileSync(fileFor(page, "wxml"), "utf8");
    for (const text of ["基础信息", "状态信息", "操作记录", "管理操作", "边界说明"]) {
      assert.ok(wxml.includes(text), `${page} missing ${text}`);
    }
  }
});

test("phase 24B-3 pages preserve service calls and avoid direct cloud calls", () => {
  for (const page of pages) {
    const js = fs.readFileSync(fileFor(page, "js"), "utf8");
    for (const call of serviceExpectations[page]) {
      assert.ok(js.includes(call), `${page} missing ${call}`);
    }
    assert.doesNotMatch(js, /wx\.cloud\.callFunction/);
  }
});

test("phase 24B-3 pages avoid misleading real capability wording", () => {
  const forbidden = [
    "真实支付已接入",
    "真实退款已完成",
    "真实分账已上线",
    "真实提现已上线",
    "真实资金流水",
    "真实认证已接入",
    "OCR 已上线",
    "真实保证金已接入",
    "自动风控已上线",
    "AI 裁决已上线",
    "自动审核已上线",
    "真实商家分账已上线",
  ];
  for (const page of pages) {
    const combined = ["js", "wxml", "wxss"]
      .map((ext) => fs.readFileSync(fileFor(page, ext), "utf8"))
      .join("\n");
    for (const text of forbidden) {
      assert.ok(!combined.includes(text), `${page} includes ${text}`);
    }
  }
});

test("phase 24B-3 pages keep backend authority for high-risk operations", () => {
  const pageText = pages
    .map((page) => fs.readFileSync(fileFor(page, "wxml"), "utf8"))
    .join("\n");

  for (const text of [
    "内部模拟流水",
    "无真实清算",
    "无真实分账",
    "无真实提现",
    "mock 保证金",
    "资料留档",
    "人工审核",
    "非自动风控",
    "后端为准",
  ]) {
    assert.ok(pageText.includes(text), `missing boundary text ${text}`);
  }

  const jsText = pages
    .map((page) => fs.readFileSync(fileFor(page, "js"), "utf8"))
    .join("\n");
  assert.doesNotMatch(jsText, /\.finance_status\s*=\s*["']settled["']/);
  assert.doesNotMatch(jsText, /\.earning_status\s*=\s*["']withdrawn["']/);
  assert.doesNotMatch(jsText, /\.deposit_status\s*=\s*["']paid["']/);
  assert.doesNotMatch(jsText, /\.qualification_status\s*=\s*["']approved["']/);
  assert.doesNotMatch(jsText, /\.risk_level\s*=\s*["']LOW["']/);
  assert.doesNotMatch(jsText, /\.role\s*=\s*["']admin["']/);
});
