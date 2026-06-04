const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

const expectedPages = [
  "pages/index/index",
  "pages/service-list/service-list",
  "pages/service-detail/service-detail",
  "pages/order-submit/order-submit",
  "pages/order-list/order-list",
  "pages/order-detail/order-detail",
  "pages/pay-result/pay-result",
  "pages/message-list/message-list",
  "pages/after-sale/apply/apply",
  "pages/after-sale/detail/detail",
  "pages/member/center/center",
  "pages/coupon/list/list",
  "pages/coupon/receive/receive",
  "pages/worker-detail/worker-detail",
  "pages/review/review",
  "pages/merchant/store-list/store-list",
  "pages/merchant/store-detail/store-detail",
  "pages/map/pick-location/pick-location",
  "pages/address-list/address-list",
  "pages/address-edit/address-edit",
  "pages/provider/service-range/service-range",
  "pages/profile/profile",
  "pages/role-select/role-select",
  "pages/profile-edit/profile-edit",
  "pages/worker/apply/apply",
  "pages/worker/audit-status/audit-status",
  "pages/worker/order-hall/order-hall",
  "pages/worker/order-list/order-list",
  "pages/worker/order-detail/order-detail",
  "pages/worker/income/income",
  "pages/worker/review-list/review-list",
  "pages/worker/review-detail/review-detail",
  "pages/worker/tip-list/tip-list",
  "pages/worker/profile/profile",
  "pages/merchant/apply/apply",
  "pages/merchant/audit-status/audit-status",
  "pages/merchant/profile/profile",
  "pages/merchant/service-list/service-list",
  "pages/merchant/service-edit/service-edit",
  "pages/merchant/order-list/order-list",
  "pages/merchant/order-detail/order-detail",
  "pages/merchant/income/income",
  "pages/merchant/qualification/qualification",
  "pages/merchant/deposit/deposit",
  "pages/merchant/risk-status/risk-status",
  "pages/admin/dashboard/dashboard",
  "pages/admin/review-center/review-center",
  "pages/admin/operation-center/operation-center",
  "pages/admin/profile/profile",
  "pages/admin/category-list/category-list",
  "pages/admin/category-edit/category-edit",
  "pages/admin/service-list/service-list",
  "pages/admin/service-edit/service-edit",
  "pages/admin/worker-audit/worker-audit",
  "pages/admin/after-sale-list/after-sale-list",
  "pages/admin/after-sale-detail/after-sale-detail",
  "pages/admin/area-list/area-list",
  "pages/admin/area-edit/area-edit",
  "pages/admin/assign-worker/assign-worker",
  "pages/admin/dispatch-logs/dispatch-logs",
  "pages/admin/finance-log-list/finance-log-list",
  "pages/admin/worker-earning-list/worker-earning-list",
  "pages/admin/order-finance-detail/order-finance-detail",
  "pages/admin/member-plan-list/member-plan-list",
  "pages/admin/coupon-template-list/coupon-template-list",
  "pages/admin/coupon-template-edit/coupon-template-edit",
  "pages/admin/review-list/review-list",
  "pages/admin/review-detail/review-detail",
  "pages/admin/review-appeal-list/review-appeal-list",
  "pages/admin/review-appeal-detail/review-appeal-detail",
  "pages/admin/tip-log-list/tip-log-list",
  "pages/admin/merchant-list/merchant-list",
  "pages/admin/merchant-detail/merchant-detail",
  "pages/admin/qualification-review/qualification-review",
  "pages/admin/deposit-review/deposit-review",
  "pages/admin/risk-control/risk-control",
  "pages/admin/order-list/order-list",
  "pages/admin/order-detail/order-detail",
  "pages/admin/user-list/user-list",
  "pages/review/detail/detail",
  "pages/review/followup/followup",
  "pages/tip/create/create",
];

function absolute(relativePath) {
  return path.join(rootDir, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

test("app.json declares expected routes and tabBar", () => {
  const appConfig = readJson("miniprogram/app.json");

  assert.deepEqual(appConfig.pages, expectedPages);
  assert.deepEqual(
    appConfig.tabBar.list.map((item) => item.pagePath),
    [
      "pages/index/index",
      "pages/order-list/order-list",
      "pages/profile/profile",
    ],
  );
});

test("every declared page has js, json, wxml, and wxss files", () => {
  const appConfig = readJson("miniprogram/app.json");

  for (const page of appConfig.pages) {
    for (const ext of ["js", "json", "wxml", "wxss"]) {
      assert.equal(fs.existsSync(absolute(`miniprogram/${page}.${ext}`)), true);
    }
  }
});

test("core constants define stable order, pay, and role enums", () => {
  const { ORDER_STATUS, PAY_STATUS } = require("../miniprogram/config/status");
  const { USER_ROLE } = require("../miniprogram/config/roles");

  assert.equal(ORDER_STATUS.PENDING_PAY, "pending_pay");
  assert.equal(ORDER_STATUS.PENDING_ACCEPT, "pending_accept");
  assert.equal(ORDER_STATUS.ACCEPTED, "accepted");
  assert.equal(ORDER_STATUS.SERVING, "serving");
  assert.equal(ORDER_STATUS.PENDING_REVIEW, "pending_review");
  assert.equal(ORDER_STATUS.COMPLETED, "completed");
  assert.equal(ORDER_STATUS.CANCELED, "canceled");
  assert.equal(PAY_STATUS.UNPAID, "unpaid");
  assert.equal(PAY_STATUS.PAID, "paid");
  assert.equal(USER_ROLE.USER, "user");
  assert.equal(USER_ROLE.WORKER, "worker");
  assert.equal(USER_ROLE.ADMIN, "admin");
});

test("format helpers keep money and addresses consistent", () => {
  const {
    formatPrice,
    buildFullAddress,
  } = require("../miniprogram/utils/format");

  assert.equal(formatPrice(9900), "¥99.00");
  assert.equal(formatPrice(0), "¥0.00");
  assert.equal(
    buildFullAddress({
      city: "杭州",
      community: "未来小区",
      detail_address: "1 幢 101",
    }),
    "杭州 未来小区 1 幢 101",
  );
});

test("cloud function folders expose index.js and package.json", () => {
  for (const name of [
    "login",
    "user",
    "service",
    "address",
    "order",
    "worker",
    "review",
    "admin",
  ]) {
    assert.equal(
      fs.existsSync(absolute(`cloudfunctions/${name}/index.js`)),
      true,
    );
    assert.equal(
      fs.existsSync(absolute(`cloudfunctions/${name}/package.json`)),
      true,
    );
  }
});
