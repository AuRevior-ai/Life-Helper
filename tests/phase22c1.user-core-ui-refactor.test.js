const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

const refactoredPages = [
  "miniprogram/pages/service-list/service-list",
  "miniprogram/pages/service-detail/service-detail",
  "miniprogram/pages/order-submit/order-submit",
  "miniprogram/pages/order-detail/order-detail",
  "miniprogram/pages/pay-result/pay-result",
  "miniprogram/pages/address-list/address-list",
  "miniprogram/pages/address-edit/address-edit",
  "miniprogram/pages/message-list/message-list",
  "miniprogram/pages/coupon/list/list",
  "miniprogram/pages/coupon/receive/receive",
  "miniprogram/pages/member/center/center",
  "miniprogram/pages/profile-edit/profile-edit",
  "miniprogram/pages/after-sale/apply/apply",
  "miniprogram/pages/after-sale/detail/detail",
  "miniprogram/pages/review/review",
  "miniprogram/pages/worker-detail/worker-detail",
  "miniprogram/pages/tip/create/create",
  "miniprogram/pages/map/pick-location/pick-location",
];

test("phase 22C-1 keeps UI guide and imports ui kit on actual refactored pages", () => {
  assert.equal(exists("docs/ui-style-guide.md"), true);
  assert.equal(exists("miniprogram/styles/ui-kit.wxss"), true);

  for (const page of refactoredPages) {
    assert.equal(exists(`${page}.wxml`), true, `${page}.wxml should exist`);
    assert.equal(exists(`${page}.wxss`), true, `${page}.wxss should exist`);
    assert.match(
      read(`${page}.wxss`),
      /@import ["'][.\/]+styles\/ui-kit\.wxss["'];/,
      `${page}.wxss should import ui-kit`,
    );
    assert.match(
      read(`${page}.wxml`),
      /ui-page|ui-card|ui-primary-button|ui-feature-card/,
      `${page}.wxml should use shared ui classes`,
    );
  }
});

test("phase 22C-1 uses status-view and status-tag for core user states", () => {
  const checks = [
    "miniprogram/pages/order-detail/order-detail",
    "miniprogram/pages/coupon/list/list",
    "miniprogram/pages/member/center/center",
    "miniprogram/pages/after-sale/detail/detail",
  ];

  for (const page of checks) {
    assert.match(read(`${page}.js`), /getStatusView/);
    assert.match(read(`${page}.json`), /status-tag/);
    assert.match(read(`${page}.wxml`), /<status-tag/);
  }
});

test("phase 22C-1 keeps empty and loading components on list and detail pages", () => {
  for (const page of [
    "miniprogram/pages/service-list/service-list",
    "miniprogram/pages/order-detail/order-detail",
    "miniprogram/pages/address-list/address-list",
    "miniprogram/pages/message-list/message-list",
    "miniprogram/pages/after-sale/detail/detail",
    "miniprogram/pages/worker-detail/worker-detail",
  ]) {
    const wxml = read(`${page}.wxml`);
    assert.match(wxml, /empty-state/);
    assert.match(wxml, /loading-view/);
  }
});

test("phase 22C-1 documents scope, missing paths, and business boundaries", () => {
  const record = read("docs/dev-records/22c1-user-core-ui-refactor.md");
  const index = read("docs/dev-records/index.md");

  assert.match(record, /阶段 22C-1/);
  assert.match(record, /miniprogram\/pages\/service-list\/service-list/);
  assert.match(record, /miniprogram\/pages\/map\/pick-location\/pick-location/);
  assert.match(record, /miniprogram\/pages\/coupon\/coupon/);
  assert.match(record, /miniprogram\/pages\/after-sale\/after-sale/);
  assert.match(record, /未修改 `cloudfunctions\/\*\*`/);
  assert.match(record, /未修改 `miniprogram\/services\/\*\*`/);
  assert.match(record, /不新增真实支付/);
  assert.match(record, /不新增真实退款/);
  assert.match(record, /不新增真实提现/);
  assert.match(record, /不新增自动派单/);
  assert.match(record, /不新增 AI 派单/);

  assert.match(index, /22c1-user-core-ui-refactor\.md/);
  assert.match(index, /阶段 22C-1：用户端核心页面 UI 重构/);
  assert.match(index, /阶段 22C-2/);
});

test("phase 22C-1 does not create nonexistent prompt paths", () => {
  assert.equal(exists("miniprogram/pages/coupon/coupon.wxml"), false);
  assert.equal(exists("miniprogram/pages/after-sale/after-sale.wxml"), false);
});

test("phase 22C-1 removes the global green native navigation bar", () => {
  const appJson = JSON.parse(read("miniprogram/app.json"));

  assert.equal(appJson.window.navigationBarBackgroundColor, "#ffffff");
  assert.equal(appJson.window.navigationBarTextStyle, "black");
  assert.notEqual(appJson.window.navigationBarBackgroundColor, "#1f4d45");
});
