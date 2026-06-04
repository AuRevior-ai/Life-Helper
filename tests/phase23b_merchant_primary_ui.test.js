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

const primaryPages = [
  ["profile", "pages/merchant/profile/profile"],
  ["orders", "pages/merchant/order-list/order-list"],
  ["services", "pages/merchant/service-list/service-list"],
  ["income", "pages/merchant/income/income"],
  ["status", "pages/merchant/audit-status/audit-status"],
];

test("phase 23B merchant primary pages remain registered from app.json", () => {
  const app = JSON.parse(read("miniprogram/app.json"));

  for (const [, route] of primaryPages) {
    assert.ok(app.pages.includes(route), `${route} should be registered`);
  }
});

test("merchant role has its own five-item primary tab bar component", () => {
  assert.equal(exists("miniprogram/components/merchant-tab-bar/index.js"), true);
  assert.equal(exists("miniprogram/components/merchant-tab-bar/index.wxml"), true);
  assert.equal(exists("miniprogram/components/merchant-tab-bar/index.wxss"), true);
  assert.equal(exists("miniprogram/components/merchant-tab-bar/index.json"), true);

  const js = read("miniprogram/components/merchant-tab-bar/index.js");
  const wxml = read("miniprogram/components/merchant-tab-bar/index.wxml");
  const wxss = read("miniprogram/components/merchant-tab-bar/index.wxss");

  for (const text of ["我的", "订单", "服务", "收益", "入驻"]) {
    assert.match(`${js}\n${wxml}`, new RegExp(text));
  }

  for (const target of primaryPages.map(([, route]) => `/${route}`)) {
    assert.match(js, new RegExp(target.replaceAll("/", "\\/")));
  }

  assert.match(js, /active/);
  assert.match(js, /redirectTo/);
  assert.doesNotMatch(js, /switchTab/);
  assert.match(wxss, /position:\s*fixed/);
  assert.match(wxss, /env\(safe-area-inset-bottom\)/);
});

test("merchant primary pages use merchant theme and merchant tab bar", () => {
  assert.equal(exists("miniprogram/styles/merchant-theme.wxss"), true);

  for (const [active, route] of primaryPages) {
    const pagePath = `miniprogram/${route}`;
    const json = read(`${pagePath}.json`);
    const wxml = read(`${pagePath}.wxml`);
    const wxss = read(`${pagePath}.wxss`);

    assert.match(json, /merchant-tab-bar/);
    assert.match(wxml, /<merchant-tab-bar/);
    assert.match(wxml, new RegExp(`active="${active}"`));
    assert.match(wxss, /@import\s+["']\/styles\/merchant-theme\.wxss["']/);
    assert.doesNotMatch(`${wxml}\n${wxss}`, /vConsole/);
  }
});

test("merchant profile becomes a low-density operating overview without changing service calls", () => {
  const js = read("miniprogram/pages/merchant/profile/profile.js");
  const wxml = read("miniprogram/pages/merchant/profile/profile.wxml");

  for (const text of [
    "我的",
    "查看店铺资料与经营入口",
    "经营概览",
    "当前统计",
    "服务项目",
    "商家订单",
    "商家收益",
    "准入状态",
    "系统边界说明",
    "资质：人工审核",
    "保证金：mock",
    "风控：内部模拟",
    "财务：内部模拟",
  ]) {
    assert.match(wxml, new RegExp(text), `merchant profile should include ${text}`);
  }

  assert.match(wxml, /merchant-hero-card/);
  assert.match(wxml, /merchant-kpi-grid/);
  assert.match(wxml, /merchant-section-card/);
  assert.match(js, /getMyMerchantInfo/);
  assert.match(js, /goServices/);
  assert.match(js, /goOrders/);
  assert.match(js, /goIncome/);
  assert.doesNotMatch(js, /mockPay|approve|settle|admin|refund/);
});

test("merchant order and service primary pages keep existing business navigation", () => {
  const orderJs = read("miniprogram/pages/merchant/order-list/order-list.js");
  const orderWxml = read("miniprogram/pages/merchant/order-list/order-list.wxml");
  const serviceJs = read("miniprogram/pages/merchant/service-list/service-list.js");
  const serviceWxml = read("miniprogram/pages/merchant/service-list/service-list.wxml");

  for (const text of ["订单", "查看商家订单与履约进度", "全部订单", "查看详情"]) {
    assert.match(orderWxml, new RegExp(text));
  }
  assert.match(orderWxml, /merchant-order-card/);
  assert.match(orderJs, /getMerchantOrderList/);
  assert.match(orderJs, /goDetail/);
  assert.match(orderJs, /order-detail/);
  assert.doesNotMatch(orderJs, /merchantAcceptOrder|merchantStartService|merchantFinishService/);

  for (const text of ["服务", "管理店铺可预约服务", "新增服务", "当前服务"]) {
    assert.match(serviceWxml, new RegExp(text));
  }
  assert.match(serviceWxml, /merchant-service-card/);
  assert.match(serviceJs, /getMerchantServiceList/);
  assert.match(serviceJs, /goCreate/);
  assert.match(serviceJs, /service-edit/);
  assert.doesNotMatch(serviceJs, /enableMerchantService|disableMerchantService/);
});

test("merchant income and status pages state mock and manual-review boundaries", () => {
  const incomeWxml = read("miniprogram/pages/merchant/income/income.wxml");
  const statusJs = read("miniprogram/pages/merchant/audit-status/audit-status.js");
  const statusWxml = read("miniprogram/pages/merchant/audit-status/audit-status.wxml");

  for (const text of [
    "收益",
    "查看内部模拟收益口径",
    "内部模拟流水",
    "不支持真实提现、分账或自动结算",
  ]) {
    assert.match(incomeWxml, new RegExp(text));
  }

  for (const text of [
    "入驻",
    "查看入驻审核与经营准入",
    "人工审核",
    "资质、保证金、风控仍为 mock 或内部模拟能力",
  ]) {
    assert.match(statusWxml, new RegExp(text));
  }

  assert.match(statusJs, /getMerchantAuditStatus/);
  assert.match(statusJs, /goProfile/);
});

test("phase 23B merchant UI avoids misleading real-capability wording", () => {
  const uiFiles = [
    "miniprogram/components/merchant-tab-bar/index.js",
    "miniprogram/components/merchant-tab-bar/index.wxml",
    "miniprogram/pages/merchant/profile/profile.wxml",
    "miniprogram/pages/merchant/order-list/order-list.wxml",
    "miniprogram/pages/merchant/service-list/service-list.wxml",
    "miniprogram/pages/merchant/income/income.wxml",
    "miniprogram/pages/merchant/audit-status/audit-status.wxml",
  ];
  const forbidden =
    /真实到账|微信提现已开通|自动结算已开通|自动结算已上线|真实认证已完成|OCR 已接入|自动风控已上线|保证金已真实缴纳|分账已开通|较昨日|昨日|↑|↓|环比|同比/;

  for (const file of uiFiles) {
    assert.doesNotMatch(read(file), forbidden, `${file} has forbidden wording`);
  }
});

test("phase 23B docs record scope, validation, and unchanged core logic", () => {
  assert.equal(exists("docs/dev-records/23b-merchant-primary-ui.md"), true);

  const phase = read("docs/PHASE_CURRENT.md");
  const status = read("docs/PROJECT_STATUS.md");
  const record = read("docs/dev-records/23b-merchant-primary-ui.md");

  assert.match(phase, /阶段 23B：商家端一级页面 UI 统一/);
  assert.match(phase, /不修改云函数/);
  assert.match(phase, /不修改 services/);
  assert.match(phase, /mock\/真实能力边界/);
  assert.match(status, /阶段 23B/);
  assert.match(status, /商家端一级页面 UI 统一/);
  assert.match(record, /新增组件/);
  assert.match(record, /新增共享样式/);
  assert.match(record, /数据库变化：无/);
  assert.match(record, /云函数变化：无/);
  assert.match(record, /service 变化：无/);
});
