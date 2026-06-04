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

const firstBatchPages = [
  ["apply", "pages/merchant/apply/apply"],
  ["service edit", "pages/merchant/service-edit/service-edit"],
];

const secondBatchPages = [["order detail", "pages/merchant/order-detail/order-detail"]];

const thirdBatchPages = [
  ["qualification", "pages/merchant/qualification/qualification"],
  ["deposit", "pages/merchant/deposit/deposit"],
  ["risk status", "pages/merchant/risk-status/risk-status"],
];

const protectedPages = [...firstBatchPages, ...secondBatchPages, ...thirdBatchPages];

test("phase 23C record exists and first batches merchant secondary pages are registered", () => {
  assert.equal(exists("docs/dev-records/23c-merchant-secondary-ui.md"), true);

  const app = JSON.parse(read("miniprogram/app.json"));
  for (const [, route] of protectedPages) {
    assert.ok(app.pages.includes(route), `${route} should be registered`);
    assert.equal(exists(`miniprogram/${route}.js`), true);
    assert.equal(exists(`miniprogram/${route}.wxml`), true);
    assert.equal(exists(`miniprogram/${route}.wxss`), true);
  }
});

test("first batch pages use merchant theme and low-density merchant page structure", () => {
  for (const [, route] of firstBatchPages) {
    const wxml = read(`miniprogram/${route}.wxml`);
    const wxss = read(`miniprogram/${route}.wxss`);

    assert.match(wxss, /@import\s+["']\/styles\/merchant-theme\.wxss["']/);
    assert.match(wxml, /merchant-page/);
    assert.match(wxml, /merchant-header/);
    assert.match(wxml, /merchant-section-card/);
    assert.match(wxml, /merchant-form-item/);
    assert.match(wxml, /merchant-sticky-actions/);
  }
});

test("merchant apply page keeps submit service call and explains manual review boundary", () => {
  const js = read("miniprogram/pages/merchant/apply/apply.js");
  const wxml = read("miniprogram/pages/merchant/apply/apply.wxml");

  for (const text of [
    "商家入驻申请",
    "联系方式",
    "店铺资料",
    "服务说明",
    "人工审核",
    "资料留档",
    "不接入真实营业执照认证或 OCR",
  ]) {
    assert.match(wxml, new RegExp(text), `apply page should include ${text}`);
  }

  assert.match(js, /submit\s*\(/);
  assert.match(js, /applyMerchant\(this\.data\.form\)/);
  assert.match(js, /submitting/);
  assert.doesNotMatch(js, /wx\.cloud\.callFunction/);
});

test("merchant service edit page keeps create service call and price unit boundary", () => {
  const js = read("miniprogram/pages/merchant/service-edit/service-edit.js");
  const wxml = read("miniprogram/pages/merchant/service-edit/service-edit.wxml");

  for (const text of [
    "配置服务",
    "服务信息",
    "平台服务 ID",
    "价格",
    "单位：分",
    "保存服务",
    "不新增自动审核、真实库存或智能定价",
  ]) {
    assert.match(wxml, new RegExp(text), `service edit page should include ${text}`);
  }

  assert.match(js, /submit\s*\(/);
  assert.match(js, /createMerchantService\(this\.data\.form\)/);
  assert.match(js, /submitting/);
  assert.doesNotMatch(js, /wx\.cloud\.callFunction/);
  assert.doesNotMatch(js, /enableMerchantService|disableMerchantService|updateMerchantService/);
});

test("merchant order detail page keeps order service calls while using merchant detail cards", () => {
  const js = read("miniprogram/pages/merchant/order-detail/order-detail.js");
  const wxml = read("miniprogram/pages/merchant/order-detail/order-detail.wxml");
  const wxss = read("miniprogram/pages/merchant/order-detail/order-detail.wxss");

  assert.match(wxss, /@import\s+["']\/styles\/merchant-theme\.wxss["']/);
  assert.match(wxml, /merchant-page/);
  assert.match(wxml, /merchant-header/);

  for (const text of [
    "商家订单详情",
    "订单状态",
    "服务信息",
    "客户与地址",
    "金额信息",
    "订单操作",
    "完工说明",
    "订单状态以后端流转为准",
  ]) {
    assert.match(wxml, new RegExp(text), `order detail page should include ${text}`);
  }

  for (const className of [
    "merchant-order-status-card",
    "merchant-order-info-card",
    "merchant-order-customer-card",
    "merchant-order-amount-card",
    "merchant-order-action-card",
  ]) {
    assert.match(wxml, new RegExp(className), `order detail page should include ${className}`);
  }

  assert.match(js, /getMerchantOrderDetail/);
  assert.match(js, /merchantAcceptOrder\(\{\s*orderId:\s*this\.data\.orderId\s*\}\)/);
  assert.match(js, /merchantStartService\(\{\s*orderId:\s*this\.data\.orderId\s*\}\)/);
  assert.match(js, /merchantFinishService\(\{\s*orderId:\s*this\.data\.orderId,\s*finishRemark:\s*this\.data\.finishRemark[\s\S]*\}\)/);
  assert.match(js, /accept\s*\(/);
  assert.match(js, /start\s*\(/);
  assert.match(js, /finish\s*\(/);
  assert.match(js, /loading/);
  assert.match(js, /errorText/);
  assert.doesNotMatch(js, /wx\.cloud\.callFunction/);
  assert.doesNotMatch(js, /status\s*:\s*["'](?:accepted|serving|pending_review|completed)["']/);
});

test("merchant high-risk boundary pages use merchant theme and keep mock/manual wording", () => {
  for (const [, route] of thirdBatchPages) {
    const wxml = read(`miniprogram/${route}.wxml`);
    const wxss = read(`miniprogram/${route}.wxss`);

    assert.match(wxss, /@import\s+["']\/styles\/merchant-theme\.wxss["']/);
    assert.match(wxml, /merchant-page/);
    assert.match(wxml, /merchant-header/);
    assert.match(wxml, /merchant-section-card/);
    assert.match(wxml, /merchant-boundary-card/);
  }

  const qualificationJs = read("miniprogram/pages/merchant/qualification/qualification.js");
  const qualificationWxml = read("miniprogram/pages/merchant/qualification/qualification.wxml");
  assert.match(qualificationJs, /getMyQualification/);
  assert.match(qualificationJs, /saveQualificationDraft\(this\.data\.form\)/);
  assert.match(qualificationJs, /submitQualification\(this\.data\.form\)/);
  assert.match(qualificationWxml, /资质认证/);
  assert.match(qualificationWxml, /资料留档/);
  assert.match(qualificationWxml, /人工审核/);
  assert.match(qualificationWxml, /不接入真实身份证认证、营业执照认证或 OCR/);
  assert.doesNotMatch(qualificationJs, /wx\.cloud\.callFunction/);

  const depositJs = read("miniprogram/pages/merchant/deposit/deposit.js");
  const depositWxml = read("miniprogram/pages/merchant/deposit/deposit.wxml");
  assert.match(depositJs, /getMyDeposit/);
  assert.match(depositJs, /mockPayDeposit/);
  assert.match(depositJs, /applyDepositRefund/);
  assert.match(depositWxml, /保证金/);
  assert.match(depositWxml, /mock 保证金/);
  assert.match(depositWxml, /不产生真实扣款、退款或冻结/);
  assert.doesNotMatch(depositJs, /wx\.cloud\.callFunction/);

  const riskJs = read("miniprogram/pages/merchant/risk-status/risk-status.js");
  const riskWxml = read("miniprogram/pages/merchant/risk-status/risk-status.wxml");
  assert.match(riskJs, /getMyRiskStatus/);
  assert.match(riskJs, /ONBOARDING_STATUS_TEXT/);
  assert.match(riskWxml, /风控状态/);
  assert.match(riskWxml, /内部模拟/);
  assert.match(riskWxml, /不代表真实合规审核或自动风控/);
  assert.doesNotMatch(riskJs, /wx\.cloud\.callFunction/);
});

test("phase 23C protected pages avoid misleading real capability wording", () => {
  const forbidden =
    /真实认证已接入|OCR 已上线|OCR已上线|真实支付已接入|真实保证金已接入|自动风控已上线|自动风控已接入|自动审核已上线|智能定价已上线|真实库存已接入|真实营业执照认证已接入|前端已完成订单|前端结算收益/;

  for (const [, route] of protectedPages) {
    const content = `${read(`miniprogram/${route}.js`)}\n${read(
      `miniprogram/${route}.wxml`,
    )}\n${read(`miniprogram/${route}.wxss`)}`;
    assert.doesNotMatch(content, forbidden, `${route} has forbidden wording`);
  }
});

test("phase 23C record states unchanged core files and mock/manual boundaries", () => {
  const record = read("docs/dev-records/23c-merchant-secondary-ui.md");

  for (const text of [
    "不修改云函数",
    "不修改 `miniprogram/services/*`",
    "不修改 schema",
    "不修改订单状态机",
    "人工审核",
    "资料留档",
    "内部模拟",
    "mock",
      "真实微信支付",
      "真实风控",
      "阶段 23C 已启动，第一批低风险页面",
      "第二批",
      "订单详情",
      "保留既有接单、开始服务和完成服务事件",
      "第三批",
      "资质认证、保证金、风控状态",
      "阶段 23C 已启动，第一批低风险页面、第二批订单详情页和第三批高风险边界页",
    ]) {
    assert.match(record, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
