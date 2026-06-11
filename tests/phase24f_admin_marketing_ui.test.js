const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

const pages = [
  "miniprogram/pages/admin/member-plan-list/member-plan-list",
  "miniprogram/pages/admin/coupon-template-list/coupon-template-list",
  "miniprogram/pages/admin/coupon-template-edit/coupon-template-edit",
];

const listPages = pages.slice(0, 2);

const serviceExpectations = {
  "miniprogram/pages/admin/member-plan-list/member-plan-list": [
    "promotionService.adminGetMemberPlans",
  ],
  "miniprogram/pages/admin/coupon-template-list/coupon-template-list": [
    "promotionService.adminGetCouponTemplates",
    "promotionService.adminEnableCouponTemplate",
    "promotionService.adminDisableCouponTemplate",
  ],
  "miniprogram/pages/admin/coupon-template-edit/coupon-template-edit": [
    "promotionService.adminCreateCouponTemplate",
    "promotionService.adminUpdateCouponTemplate",
  ],
};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fileFor(page, ext) {
  return path.join(root, `${page}.${ext}`);
}

test("phase 24F development record exists and documents the scoped UI closeout", () => {
  const recordPath = path.join(root, "docs/dev-records/24f-admin-marketing-ui.md");
  assert.equal(fs.existsSync(recordPath), true);
  const record = fs.readFileSync(recordPath, "utf8");
  for (const text of [
    "阶段 24F",
    "管理员端会员 / 优惠券 / 营销配置页面 UI 收口",
    "不修改云函数",
    "不修改 `miniprogram/services/*`",
    "mock 会员",
    "mock 优惠券",
    "mock 支付",
    "未接入真实支付",
    "未接入真实营销结算",
  ]) {
    assert.ok(record.includes(text), `record missing ${text}`);
  }
});

test("phase 24F admin marketing pages are registered and keep page files", () => {
  const app = JSON.parse(read("miniprogram/app.json"));
  for (const page of pages) {
    const registeredPath = page.replace(/^miniprogram\//, "");
    assert.ok(app.pages.includes(registeredPath), `${page} should be registered`);
    for (const ext of ["js", "wxml", "wxss"]) {
      assert.equal(fs.existsSync(fileFor(page, ext)), true, `${page}.${ext}`);
    }
  }
});

test("phase 24F pages use admin theme, shared structure, and boundary cards", () => {
  for (const page of pages) {
    const wxml = fs.readFileSync(fileFor(page, "wxml"), "utf8");
    const wxss = fs.readFileSync(fileFor(page, "wxss"), "utf8");
    assert.match(wxss, /@import\s+["']\.\.\/\.\.\/\.\.\/styles\/admin-theme\.wxss["'];/);
    for (const className of [
      "admin-page",
      "admin-header",
      "admin-section-card",
      "admin-status-card",
      "admin-boundary-card",
      "admin-action-card",
    ]) {
      assert.ok(wxml.includes(className), `${page} missing ${className}`);
    }
    assert.doesNotMatch(wxml, /class=["'][^"']*\bpage-shell\b/);
    assert.doesNotMatch(wxml, /class=["']panel["']/);
  }
});

test("phase 24F list pages include loading, empty, error, filters, and list cards", () => {
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

test("phase 24F coupon edit page includes form states and clear action hierarchy", () => {
  const page = "miniprogram/pages/admin/coupon-template-edit/coupon-template-edit";
  const wxml = fs.readFileSync(fileFor(page, "wxml"), "utf8");
  const js = fs.readFileSync(fileFor(page, "js"), "utf8");
  for (const text of ["名称", "优惠金额", "满减门槛", "总量", "单人限制", "有效天数"]) {
    assert.ok(wxml.includes(text), `edit page missing ${text}`);
  }
  assert.ok(wxml.includes("admin-action-button"), "edit page missing primary action");
  assert.ok(wxml.includes("admin-outline-button"), "edit page missing secondary action");
  assert.ok(wxml.includes("submitting"), "edit page missing submitting binding");
  assert.ok(wxml.includes("errorText"), "edit page missing error binding");
  assert.ok(js.includes("submitting"), "edit page missing submitting state");
  assert.ok(js.includes("showSuccess"), "edit page missing success feedback");
});

test("phase 24F pages preserve promotion service actions and avoid direct cloud calls", () => {
  for (const page of pages) {
    const js = fs.readFileSync(fileFor(page, "js"), "utf8");
    for (const call of serviceExpectations[page]) {
      assert.ok(js.includes(call), `${page} missing ${call}`);
    }
    assert.doesNotMatch(js, /wx\.cloud\.callFunction/);
  }
});

test("phase 24F pages keep mock and real capability boundaries clear", () => {
  const combined = pages
    .flatMap((page) => ["js", "wxml", "wxss"].map((ext) => fs.readFileSync(fileFor(page, ext), "utf8")))
    .join("\n");

  for (const text of [
    "mock 会员",
    "mock 优惠券",
    "mock 支付",
    "无真实会员扣款",
    "无真实营销结算",
  ]) {
    assert.ok(combined.includes(text), `missing boundary text ${text}`);
  }

  for (const text of [
    "真实支付已接入",
    "真实退款已完成",
    "真实会员扣款已接入",
    "真实营销结算已上线",
    "真实分账已上线",
    "真实提现已上线",
  ]) {
    assert.ok(!combined.includes(text), `forbidden wording ${text}`);
  }
});

test("phase 24F status docs point at admin marketing UI closeout", () => {
  const phase = read("docs/PHASE_CURRENT.md");
  const status = read("docs/PROJECT_STATUS.md");
  const index = read("docs/dev-records/index.md");

  for (const content of [phase, status, index]) {
    assert.match(content, /阶段 24F/);
    assert.match(content, /管理员端会员 \/ 优惠券 \/ 营销配置页面 UI 收口/);
    assert.match(content, /mock 支付/);
  }
});
