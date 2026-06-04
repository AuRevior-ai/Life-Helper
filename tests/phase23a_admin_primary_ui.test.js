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
  ["dashboard", "pages/admin/dashboard/dashboard"],
  ["order", "pages/admin/order-list/order-list"],
  ["review", "pages/admin/review-center/review-center"],
  ["operation", "pages/admin/operation-center/operation-center"],
  ["profile", "pages/admin/profile/profile"],
];

test("phase 23A admin primary pages are registered from app.json", () => {
  const app = JSON.parse(read("miniprogram/app.json"));

  for (const [, route] of primaryPages) {
    assert.ok(app.pages.includes(route), `${route} should be registered`);
  }
});

test("admin role has its own fixed five-item tab bar component", () => {
  assert.equal(exists("miniprogram/components/admin-tab-bar/index.js"), true);
  assert.equal(exists("miniprogram/components/admin-tab-bar/index.wxml"), true);
  assert.equal(exists("miniprogram/components/admin-tab-bar/index.wxss"), true);
  assert.equal(exists("miniprogram/components/admin-tab-bar/index.json"), true);

  const js = read("miniprogram/components/admin-tab-bar/index.js");
  const wxml = read("miniprogram/components/admin-tab-bar/index.wxml");
  const wxss = read("miniprogram/components/admin-tab-bar/index.wxss");

  for (const text of ["工作台", "订单", "审核", "运营", "我的"]) {
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

test("admin primary pages use admin theme and admin tab bar", () => {
  assert.equal(exists("miniprogram/styles/admin-theme.wxss"), true);

  for (const [active, route] of primaryPages) {
    const pagePath = `miniprogram/${route}`;
    const json = read(`${pagePath}.json`);
    const wxml = read(`${pagePath}.wxml`);
    const wxss = read(`${pagePath}.wxss`);

    assert.match(json, /admin-tab-bar/);
    assert.match(wxml, /<admin-tab-bar/);
    assert.match(wxml, new RegExp(`active="${active}"`));
    assert.match(wxss, /admin-theme\.wxss/);
    assert.doesNotMatch(`${wxml}\n${wxss}`, /vConsole/);
  }
});

test("phase 23A typography avoids extra-heavy black text weights", () => {
  const styleFiles = [
    "miniprogram/styles/admin-theme.wxss",
    "miniprogram/components/admin-tab-bar/index.wxss",
    "miniprogram/pages/admin/dashboard/dashboard.wxss",
    "miniprogram/pages/admin/order-list/order-list.wxss",
    "miniprogram/pages/admin/review-center/review-center.wxss",
    "miniprogram/pages/admin/operation-center/operation-center.wxss",
    "miniprogram/pages/admin/profile/profile.wxss",
  ];

  for (const file of styleFiles) {
    const wxss = read(file);
    assert.doesNotMatch(wxss, /font-weight:\s*900\b/, `${file} is too heavy`);
  }
});

test("admin dashboard matches the approved low-density workbench structure", () => {
  const js = read("miniprogram/pages/admin/dashboard/dashboard.js");
  const wxml = read("miniprogram/pages/admin/dashboard/dashboard.wxml");
  const wxss = read("miniprogram/pages/admin/dashboard/dashboard.wxss");

  for (const text of [
    "工作台",
    "查看今日概览与待处理事项",
    "管理员 · 正常",
    "今日订单",
    "待审核",
    "风险提醒",
    "待办中心",
    "师傅审核",
    "商家审核",
    "售后处理",
    "资质审核",
    "快捷入口",
    "订单中心",
    "审核中心",
    "运营中心",
    "财务流水",
  ]) {
    assert.match(wxml, new RegExp(text), `dashboard should include ${text}`);
  }

  assert.match(wxml, /admin-hero-card/);
  assert.match(wxml, /admin-kpi-grid/);
  assert.match(wxml, /admin-section-card/);
  assert.match(wxml, /admin-quick-grid/);
  assert.match(js, /getDashboard/);
  assert.match(js, /goEntry/);
  assert.match(wxss, /border-radius:\s*32rpx/);
});

test("admin dashboard hero uses the exact provided background and avatar assets", () => {
  assert.equal(
    exists("miniprogram/assets/profile/profile-card-bg-placeholder.png"),
    true,
  );
  assert.equal(exists("miniprogram/assets/admin/管理员端头像.png"), true);

  const wxml = read("miniprogram/pages/admin/dashboard/dashboard.wxml");
  const wxss = read("miniprogram/pages/admin/dashboard/dashboard.wxss");

  assert.match(wxml, /src="\/assets\/profile\/profile-card-bg-placeholder\.png"/);
  assert.match(wxml, /mode="widthFix"/);
  assert.match(wxml, /src="\/assets\/admin\/管理员端头像\.png"/);
  assert.match(wxml, /mode="aspectFill"/);
  assert.doesNotMatch(wxml, /dashboard-illustration|hill-a|hill-b|building-a|building-b|house/);
  assert.match(wxss, /width:\s*100%/);
  assert.match(wxss, /position:\s*absolute/);
});

test("admin dashboard layout prevents native title duplication and horizontal clipping", () => {
  const json = JSON.parse(
    read("miniprogram/pages/admin/dashboard/dashboard.json"),
  );
  const wxml = read("miniprogram/pages/admin/dashboard/dashboard.wxml");
  const wxss = read("miniprogram/pages/admin/dashboard/dashboard.wxss");
  const sharedWxss = read("miniprogram/styles/admin-theme.wxss");

  assert.equal(json.navigationStyle, "custom");
  assert.match(wxml, /class="admin-title">工作台/);
  assert.match(wxss, /padding-top:\s*calc\(112rpx \+ env\(safe-area-inset-top\)\)/);
  assert.match(wxss, /\.dashboard-kpi-grid/);
  assert.match(wxss, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(wxss, /\.dashboard-quick-card \.admin-quick-grid/);
  assert.match(wxss, /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(wxss, /\.dashboard-todo-card \.admin-badge[\s\S]*margin-left:\s*auto/);
  assert.match(wxss, /\.dashboard-page[\s\S]*overflow-x:\s*hidden/);
  assert.doesNotMatch(`${wxss}\n${sharedWxss}`, /100vw|min-width:\s*(?:[1-9]\d{2,}|100%)/);
  assert.doesNotMatch(`${wxss}\n${sharedWxss}`, /scroll-view|overflow-x:\s*(?:scroll|auto)/);
});

test("admin order page keeps order fulfillment actions and low-density list cards", () => {
  const js = read("miniprogram/pages/admin/order-list/order-list.js");
  const wxml = read("miniprogram/pages/admin/order-list/order-list.wxml");
  const wxss = read("miniprogram/pages/admin/order-list/order-list.wxss");

  for (const text of [
    "订单",
    "查看履约进度与处理售后",
    "待接单",
    "服务中",
    "售后中",
    "全部",
    "今天",
    "服务区域",
    "支付状态",
    "金额",
    "查看详情",
    "指派师傅",
    "售后详情",
    "指派记录",
    "售后列表",
    "财务明细",
  ]) {
    assert.match(wxml, new RegExp(text), `order page should include ${text}`);
  }

  assert.match(wxml, /admin-order-card/);
  assert.match(wxml, /displayOrders/);
  assert.match(wxml, /bindtap="goAssignWorker"/);
  assert.match(wxml, /bindtap="goAfterSaleList"/);
  assert.match(js, /getAllOrders/);
  assert.match(js, /goDetail/);
  assert.match(js, /goAssignWorker/);
  assert.match(js, /goAfterSaleList/);
  assert.doesNotMatch(js, /adminUpdateOrderStatus/);
  assert.match(wxss, /border-radius:\s*32rpx/);
});

test("admin review center exposes audit, risk, and appeal primary entries", () => {
  const js = read("miniprogram/pages/admin/review-center/review-center.js");
  const wxml = read("miniprogram/pages/admin/review-center/review-center.wxml");

  for (const text of [
    "审核",
    "处理师傅、商家与资质事项",
    "师傅待审",
    "商家待审",
    "资质待审",
    "待审核",
    "师傅入驻审核",
    "商家入驻审核",
    "资质审核",
    "保证金处理",
    "风险与申诉",
    "风险商家",
    "评价申诉",
    "师傅审核",
    "商家列表",
    "风控",
  ]) {
    assert.match(wxml, new RegExp(text), `review center should include ${text}`);
  }

  assert.match(wxml, /admin-list-row/);
  assert.match(wxml, /admin-quick-grid/);
  assert.match(js, /getDashboard/);
  assert.match(js, /goEntry/);
});

test("admin operation center exposes service, area, content, and finance entries", () => {
  const js = read(
    "miniprogram/pages/admin/operation-center/operation-center.js",
  );
  const wxml = read(
    "miniprogram/pages/admin/operation-center/operation-center.wxml",
  );

  for (const text of [
    "运营",
    "管理服务、区域与平台内容",
    "服务数",
    "区域数",
    "今日评价",
    "运营管理",
    "服务分类",
    "服务管理",
    "区域配置",
    "会员方案",
    "优惠券",
    "用户管理",
    "内容与财务",
    "评价管理",
    "打赏记录",
    "财务流水",
    "师傅收益",
    "今日提示",
  ]) {
    assert.match(wxml, new RegExp(text), `operation center should include ${text}`);
  }

  assert.match(wxml, /admin-feature-grid/);
  assert.match(wxml, /admin-list-row/);
  assert.match(js, /getServiceStats/);
  assert.match(js, /goEntry/);
});

test("admin profile keeps account, logout, identity switch, and mock boundaries clear", () => {
  const js = read("miniprogram/pages/admin/profile/profile.js");
  const wxml = read("miniprogram/pages/admin/profile/profile.wxml");
  const wxss = read("miniprogram/pages/admin/profile/profile.wxss");

  for (const text of [
    "我的",
    "查看管理员资料并切换管理身份",
    "管理员 · 正常",
    "最后登录",
    "超管账号",
    "退出登录",
    "账号资料",
    "选择登录身份",
    "完善资料",
    "消息中心",
    "系统状态",
    "切换到用户端",
    "系统边界说明",
    "支付：mock",
    "退款：mock",
    "财务：内部模拟",
  ]) {
    assert.match(wxml, new RegExp(text), `admin profile should include ${text}`);
  }

  assert.match(wxml, /admin-profile-card/);
  assert.match(wxml, /src="\/assets\/profile\/profile-card-bg-placeholder\.png"/);
  assert.match(wxml, /src="\/assets\/admin\/管理员端头像\.png"/);
  assert.match(wxml, /mode="widthFix"/);
  assert.match(wxml, /mode="aspectFill"/);
  assert.doesNotMatch(wxml, /profile-illustration|profile-hill|profile-building|profile-house/);
  assert.match(wxss, /width:\s*100%/);
  assert.match(js, /clearCurrentUser/);
  assert.match(js, /goRoleSelect/);
  assert.match(js, /goUserHome/);
  assert.match(js, /switchTab/);
});

test("phase 23A UI avoids misleading real-capability wording", () => {
  const uiFiles = [
    "miniprogram/components/admin-tab-bar/index.js",
    "miniprogram/components/admin-tab-bar/index.wxml",
    "miniprogram/pages/admin/dashboard/dashboard.wxml",
    "miniprogram/pages/admin/order-list/order-list.wxml",
    "miniprogram/pages/admin/review-center/review-center.wxml",
    "miniprogram/pages/admin/operation-center/operation-center.wxml",
    "miniprogram/pages/admin/profile/profile.wxml",
  ];
  const forbidden =
    /vConsole|真实到账|微信提现已开通|自动结算|真实认证已完成|OCR 已接入|自动风控已上线|AI 派单已上线/;

  for (const file of uiFiles) {
    assert.doesNotMatch(read(file), forbidden, `${file} has forbidden wording`);
  }
});

test("phase 23A docs record scope, validation, and mock boundaries", () => {
  assert.equal(exists("docs/dev-records/23a-admin-primary-ui.md"), true);

  const phase = read("docs/PHASE_CURRENT.md");
  const status = read("docs/PROJECT_STATUS.md");
  const record = read("docs/dev-records/23a-admin-primary-ui.md");

  assert.match(phase, /阶段 23A：管理员端一级导航与工作台 UI 重构/);
  assert.match(phase, /管理员端一级导航与五个一级页面/);
  assert.match(phase, /mock\/真实能力边界/);
  assert.match(phase, /npm run check:cloudfunction-deps/);
  assert.match(status, /阶段 23A/);
  assert.match(status, /管理员端一级导航/);
  assert.doesNotMatch(status, /C:\\\\Users\\\\/);
  assert.match(record, /阶段名称/);
  assert.match(record, /完成页面/);
  assert.match(record, /新增组件/);
  assert.match(record, /数据库变化：无/);
  assert.match(record, /云函数变化：无/);
  assert.match(record, /service 变化：无/);
  assert.match(record, /内部模拟/);
});
