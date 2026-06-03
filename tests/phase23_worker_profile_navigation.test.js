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

test("worker role has its own fixed three-item tab bar component", () => {
  assert.equal(
    exists("miniprogram/components/worker-tab-bar/worker-tab-bar.js"),
    true,
  );
  assert.equal(
    exists("miniprogram/components/worker-tab-bar/worker-tab-bar.wxml"),
    true,
  );
  assert.equal(
    exists("miniprogram/components/worker-tab-bar/worker-tab-bar.wxss"),
    true,
  );
  assert.equal(
    exists("miniprogram/components/worker-tab-bar/worker-tab-bar.json"),
    true,
  );

  const js = read("miniprogram/components/worker-tab-bar/worker-tab-bar.js");
  const wxml = read("miniprogram/components/worker-tab-bar/worker-tab-bar.wxml");
  const wxss = read("miniprogram/components/worker-tab-bar/worker-tab-bar.wxss");

  for (const text of ["进入接单大厅", "我的订单", "我的"]) {
    assert.match(`${js}\n${wxml}`, new RegExp(text));
  }

  for (const target of [
    "/pages/worker/order-hall/order-hall",
    "/pages/worker/order-list/order-list",
    "/pages/worker/profile/profile",
  ]) {
    assert.match(js, new RegExp(target.replaceAll("/", "\\/")));
  }

  assert.match(js, /active/);
  assert.match(js, /redirectTo/);
  assert.doesNotMatch(js, /switchTab/);
  assert.match(wxss, /position:\s*fixed/);
  assert.match(wxss, /env\(safe-area-inset-bottom\)/);
});

test("worker primary pages use the worker tab bar instead of user tabbar semantics", () => {
  for (const page of [
    ["order-hall", "hall"],
    ["order-list", "orders"],
    ["profile", "profile"],
  ]) {
    const [name, active] = page;
    const json = read(`miniprogram/pages/worker/${name}/${name}.json`);
    const wxml = read(`miniprogram/pages/worker/${name}/${name}.wxml`);

    assert.match(json, /worker-tab-bar/);
    assert.match(wxml, /<worker-tab-bar/);
    assert.match(wxml, new RegExp(`active="${active}"`));
  }

  const hallJs = read("miniprogram/pages/worker/order-hall/order-hall.js");
  const listJs = read("miniprogram/pages/worker/order-list/order-list.js");

  assert.match(hallJs, /redirectTo/);
  assert.match(listJs, /redirectTo/);
  assert.doesNotMatch(hallJs, /switchTab/);
  assert.doesNotMatch(listJs, /switchTab/);
  assert.doesNotMatch(hallJs, /\/pages\/order-list\/order-list/);
  assert.doesNotMatch(listJs, /\/pages\/index\/index/);
});

test("worker order hall renders the approved visual workbench structure", () => {
  const js = read("miniprogram/pages/worker/order-hall/order-hall.js");
  const wxml = read("miniprogram/pages/worker/order-hall/order-hall.wxml");
  const wxss = read("miniprogram/pages/worker/order-hall/order-hall.wxss");

  for (const text of [
    "接单大厅",
    "只展示已支付且等待师傅接单的订单",
    "当前接单状态",
    "在线接单",
    "今日可接单",
    "服务区域",
    "全部分类",
    "距离优先",
    "3km以内",
    "可上门优先",
    "预计收入",
    "距离你",
  ]) {
    assert.match(wxml, new RegExp(text), `order hall should include ${text}`);
  }

  assert.match(wxml, /hall-status-card/);
  assert.match(wxml, /hall-filter-bar/);
  assert.match(wxml, /<scroll-view[^>]+class="hall-filter-bar"[^>]+scroll-x/);
  assert.match(wxml, /bindtap="onFilterTap"/);
  assert.match(wxml, /order-visual-placeholder/);
  assert.match(wxml, /bindchange="onOnlineSwitchChange"/);
  assert.match(js, /updateWorkerOnlineStatus/);
  assert.match(js, /formatHallPrice/);
  assert.match(js, /maskPhone/);
  assert.match(js, /onFilterTap/);
  assert.match(js, /availableCountText/);
  assert.match(wxss, /border-radius:\s*28rpx/);
  assert.match(wxss, /#16a34a/);
});

test("worker order list renders the approved order management structure", () => {
  const js = read("miniprogram/pages/worker/order-list/order-list.js");
  const wxml = read("miniprogram/pages/worker/order-list/order-list.wxml");
  const wxss = read("miniprogram/pages/worker/order-list/order-list.wxss");

  for (const text of [
    "我的订单",
    "查看已经由你接下的服务订单",
    "全部",
    "待上门",
    "服务中",
    "待完成",
    "已完成",
    "状态",
    "时间范围",
    "本周",
    "订单金额",
    "查看详情",
  ]) {
    assert.match(wxml, new RegExp(text), `worker order list should include ${text}`);
  }

  assert.match(wxml, /worker-order-tabs/);
  assert.match(wxml, /worker-order-filter-panel/);
  assert.match(wxml, /worker-order-card/);
  assert.match(wxml, /worker-order-visual-placeholder/);
  assert.match(wxml, /bindtap="onStatusTabTap"/);
  assert.match(wxml, /bindtap="onTimeRangeTap"/);
  assert.match(wxml, /bindtap="goOrderDetail"/);
  assert.doesNotMatch(wxml, /<order-card/);
  assert.match(js, /WORKER_STATUS_TABS/);
  assert.match(js, /normalizeWorkerOrder/);
  assert.match(js, /formatWorkerOrderPrice/);
  assert.match(js, /maskWorkerOrderPhone/);
  assert.match(js, /onStatusTabTap/);
  assert.match(js, /onTimeRangeTap/);
  assert.match(wxss, /border-radius:\s*28rpx/);
  assert.match(wxss, /grid-template-columns/);
  assert.match(wxss, /#16a34a/);
});

test("worker profile matches approved mine page structure and safe navigation", () => {
  const js = read("miniprogram/pages/worker/profile/profile.js");
  const wxml = read("miniprogram/pages/worker/profile/profile.wxml");
  const wxss = read("miniprogram/pages/worker/profile/profile.wxss");
  const json = read("miniprogram/pages/worker/profile/profile.json");

  for (const text of [
    "管理接单状态、服务范围与个人工作信息",
    "认证师傅",
    "暂停接单不会影响已有订单",
    "服务小区 / 服务范围",
    "本月收益",
    "待处理评价",
    "消息提醒",
    "服务评分",
    "用户评价",
    "消息中心",
    "我的收益",
    "身份与资料",
    "切换身份",
    "退出登录",
  ]) {
    assert.match(wxml, new RegExp(text));
  }

  assert.match(json, /worker-tab-bar/);
  assert.match(wxml, /active="profile"/);
  assert.equal(exists("miniprogram/assets/worker/师傅默认头像.png"), true);
  assert.match(js, /\/assets\/worker\/师傅默认头像\.png/);
  assert.match(js, /clearCurrentUser/);
  assert.match(js, /reLaunch/);
  assert.match(js, /\/pages\/profile\/profile/);
  assert.match(js, /\/pages\/role-select\/role-select/);
  assert.match(js, /updateWorkerOnlineStatus/);
  assert.match(js, /safeStats/);
  assert.match(js, /formatWorkerDashboardPrice/);
  assert.doesNotMatch(js, /wx\.switchTab/);
  assert.match(wxss, /border-radius:\s*28rpx/);
  assert.match(wxss, /#16a34a/);
  const statValueBlock = wxss.match(/\.stat-value\s*\{[^}]+\}/)[0];
  assert.doesNotMatch(statValueBlock, /text-overflow:\s*ellipsis/);
});

test("selecting worker identity enters audit status before worker pages", () => {
  const roleJs = read("miniprogram/pages/role-select/role-select.js");
  const roleWxml = read("miniprogram/pages/role-select/role-select.wxml");
  const profileJs = read("miniprogram/pages/profile/profile.js");
  const auditStatusJs = read(
    "miniprogram/pages/worker/audit-status/audit-status.js",
  );
  const auditStatusWxml = read(
    "miniprogram/pages/worker/audit-status/audit-status.wxml",
  );
  const appJson = JSON.parse(read("miniprogram/app.json"));

  assert.match(roleJs, /setCurrentIdentityRole\(USER_ROLE\.WORKER\)/);
  assert.match(roleJs, /\/pages\/worker\/audit-status\/audit-status/);
  assert.match(roleJs, /enterWorkerRole[\s\S]*wx\.redirectTo/);
  assert.match(roleWxml, /进入个人师傅端/);
  assert.match(profileJs, /goWorkerCenter[\s\S]*\/pages\/worker\/audit-status\/audit-status/);
  assert.match(auditStatusJs, /您已通过审核，即将跳转到接单大厅/);
  assert.match(auditStatusJs, /APPROVED_REDIRECT_DELAY\s*=\s*3000/);
  assert.match(auditStatusJs, /setTimeout/);
  assert.match(auditStatusJs, /wx\.redirectTo[\s\S]*\/pages\/worker\/order-hall\/order-hall/);
  assert.match(auditStatusWxml, /未通过审核，请联系管理员/);
  assert.doesNotMatch(auditStatusWxml, /进入接单大厅/);
  assert.doesNotMatch(auditStatusWxml, /我的师傅订单/);
  assert.doesNotMatch(
    roleJs,
    /enterWorkerRole[\s\S]*wx\.switchTab[\s\S]*\/pages\/index\/index/,
  );

  assert.deepEqual(
    appJson.tabBar.list.map((item) => item.pagePath),
    ["pages/index/index", "pages/order-list/order-list", "pages/profile/profile"],
  );
});
