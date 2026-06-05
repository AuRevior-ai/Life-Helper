const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

const phaseDoc = path.join(
  root,
  "docs/dev-records/24b2-admin-service-area-dispatch-ui.md",
);

const pages = [
  "miniprogram/pages/admin/category-list/category-list",
  "miniprogram/pages/admin/category-edit/category-edit",
  "miniprogram/pages/admin/service-list/service-list",
  "miniprogram/pages/admin/service-edit/service-edit",
  "miniprogram/pages/admin/area-list/area-list",
  "miniprogram/pages/admin/area-edit/area-edit",
  "miniprogram/pages/admin/assign-worker/assign-worker",
  "miniprogram/pages/admin/dispatch-logs/dispatch-logs",
];

const listPages = new Set([
  "miniprogram/pages/admin/category-list/category-list",
  "miniprogram/pages/admin/service-list/service-list",
  "miniprogram/pages/admin/area-list/area-list",
  "miniprogram/pages/admin/assign-worker/assign-worker",
  "miniprogram/pages/admin/dispatch-logs/dispatch-logs",
]);

const formPages = new Set([
  "miniprogram/pages/admin/category-edit/category-edit",
  "miniprogram/pages/admin/service-edit/service-edit",
  "miniprogram/pages/admin/area-edit/area-edit",
]);

const serviceExpectations = {
  "miniprogram/pages/admin/category-list/category-list": [
    "serviceService.getCategoryList",
    "serviceService.seedServiceData",
  ],
  "miniprogram/pages/admin/category-edit/category-edit": [
    "serviceService.updateCategory",
    "serviceService.createCategory",
  ],
  "miniprogram/pages/admin/service-list/service-list": [
    "serviceService.getServiceList",
    "serviceService.updateServiceStatus",
    "serviceService.seedServiceData",
  ],
  "miniprogram/pages/admin/service-edit/service-edit": [
    "serviceService.getCategoryList",
    "serviceService.getServiceDetail",
    "serviceService.updateService",
    "serviceService.createService",
  ],
  "miniprogram/pages/admin/area-list/area-list": [
    "areaService.getServiceAreaList",
    "areaService.adminDisableServiceArea",
    "areaService.adminEnableServiceArea",
  ],
  "miniprogram/pages/admin/area-edit/area-edit": [
    "areaService.getServiceAreaList",
    "areaService.adminUpdateServiceArea",
    "areaService.adminCreateServiceArea",
  ],
  "miniprogram/pages/admin/assign-worker/assign-worker": [
    "dispatchService.getAssignableWorkers",
    "dispatchService.adminAssignOrder",
  ],
  "miniprogram/pages/admin/dispatch-logs/dispatch-logs": [
    "dispatchService.getDispatchLogs",
  ],
};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fileFor(page, ext) {
  return path.join(root, `${page}.${ext}`);
}

test("phase 24B-2 development record exists and names the scoped phase", () => {
  assert.equal(fs.existsSync(phaseDoc), true);
  const doc = fs.readFileSync(phaseDoc, "utf8");
  assert.match(doc, /阶段 24B-2：管理员端服务 \/ 分类 \/ 区域 \/ 派单页面 UI 收口/);
  assert.match(doc, /24B-3/);
  assert.match(doc, /不修改业务逻辑/);
  assert.match(doc, /mock \/ 真实能力边界/);
});

test("phase 24B-2 admin pages are registered in app.json", () => {
  const app = JSON.parse(read("miniprogram/app.json"));
  for (const page of pages) {
    const registeredPath = page.replace(/^miniprogram\//, "");
    assert.ok(app.pages.includes(registeredPath), `${page} should be registered`);
  }
});

test("phase 24B-2 admin pages keep page files and import admin theme", () => {
  for (const page of pages) {
    for (const ext of ["js", "wxml", "wxss"]) {
      assert.equal(fs.existsSync(fileFor(page, ext)), true, `${page}.${ext}`);
    }
    const wxss = fs.readFileSync(fileFor(page, "wxss"), "utf8");
    assert.match(wxss, /@import\s+["']\.\.\/\.\.\/\.\.\/styles\/admin-theme\.wxss["'];/);
  }
});

test("phase 24B-2 admin pages use secondary admin page structure", () => {
  for (const page of pages) {
    const wxml = fs.readFileSync(fileFor(page, "wxml"), "utf8");
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
  }
});

test("phase 24B-2 list pages include filters, loading, empty and error states", () => {
  for (const page of listPages) {
    const wxml = fs.readFileSync(fileFor(page, "wxml"), "utf8");
    const js = fs.readFileSync(fileFor(page, "js"), "utf8");
    assert.ok(wxml.includes("admin-filter-card"), `${page} missing filter card`);
    assert.ok(wxml.includes("admin-list-card"), `${page} missing list card`);
    assert.ok(wxml.includes("loading-view"), `${page} missing loading view`);
    assert.ok(wxml.includes("empty-state"), `${page} missing empty state`);
    assert.ok(wxml.includes("errorText"), `${page} missing error state binding`);
    assert.ok(js.includes("errorText"), `${page} missing error state data`);
  }
});

test("phase 24B-2 form pages include grouped information and submitting state", () => {
  for (const page of formPages) {
    const wxml = fs.readFileSync(fileFor(page, "wxml"), "utf8");
    const js = fs.readFileSync(fileFor(page, "js"), "utf8");
    for (const text of ["基础信息", "配置说明", "边界说明", "管理操作"]) {
      assert.ok(wxml.includes(text), `${page} missing ${text}`);
    }
    assert.ok(/submitting|saving/.test(js), `${page} missing submit state`);
  }
});

test("phase 24B-2 pages preserve service layer calls and avoid direct cloud calls", () => {
  for (const page of pages) {
    const js = fs.readFileSync(fileFor(page, "js"), "utf8");
    for (const call of serviceExpectations[page]) {
      assert.ok(js.includes(call), `${page} missing ${call}`);
    }
    assert.doesNotMatch(js, /wx\.cloud\.callFunction/);
  }
});

test("phase 24B-2 pages do not claim unavailable real capabilities", () => {
  const forbidden = [
    "真实支付已接入",
    "真实退款已完成",
    "自动风控已上线",
    "真实认证已接入",
    "自动派单已上线",
    "AI 派单已上线",
    "路径规划已上线",
    "实时轨迹已上线",
    "ETA 已上线",
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

test("service, area and dispatch pages keep backend authority boundaries", () => {
  const pageText = pages
    .map((page) => fs.readFileSync(fileFor(page, "wxml"), "utf8"))
    .join("\n");

  assert.match(pageText, /后端为准|云函数为准|服务层为准/);
  assert.match(pageText, /手动配置/);
  assert.match(pageText, /非自动派单/);
  assert.match(pageText, /非实时轨迹/);
  assert.match(pageText, /非 ETA/);

  const jsText = pages
    .map((page) => fs.readFileSync(fileFor(page, "js"), "utf8"))
    .join("\n");
  assert.doesNotMatch(jsText, /\.status\s*=\s*["']completed["']/);
  assert.doesNotMatch(jsText, /\.refund_status\s*=\s*["']success["']/);
  assert.doesNotMatch(jsText, /\.payment_status\s*=\s*["']paid["']/);
  assert.doesNotMatch(jsText, /\.finance_status\s*=\s*["']settled["']/);
});
