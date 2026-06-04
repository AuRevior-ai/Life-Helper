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

test("phase 22D worker secondary routes are registered from the real app.json", () => {
  const app = JSON.parse(read("miniprogram/app.json"));

  for (const route of [
    "pages/worker/order-detail/order-detail",
    "pages/worker/income/income",
    "pages/worker/review-list/review-list",
    "pages/worker/review-detail/review-detail",
    "pages/worker/apply/apply",
    "pages/worker/audit-status/audit-status",
    "pages/provider/service-range/service-range",
    "pages/message-list/message-list",
  ]) {
    assert.ok(app.pages.includes(route), `${route} should be registered`);
  }
});

test("worker order detail has unified detail, status, service, customer, amount, and action sections", () => {
  const js = read("miniprogram/pages/worker/order-detail/order-detail.js");
  const wxml = read("miniprogram/pages/worker/order-detail/order-detail.wxml");
  const wxss = read("miniprogram/pages/worker/order-detail/order-detail.wxss");
  const json = read("miniprogram/pages/worker/order-detail/order-detail.json");

  for (const text of [
    "师傅订单详情",
    "服务进度",
    "当前状态",
    "下一步",
    "服务信息",
    "用户与地址",
    "金额信息",
    "操作区",
    "联系电话",
  ]) {
    assert.match(wxml, new RegExp(text), `order detail should include ${text}`);
  }

  for (const className of [
    "worker-detail-page",
    "detail-status-card",
    "detail-service-card",
    "detail-customer-card",
    "detail-amount-card",
    "detail-action-card",
    "detail-empty",
  ]) {
    assert.match(wxml, new RegExp(className));
  }

  assert.match(json, /status-tag/);
  assert.match(wxml, /<status-tag/);
  assert.match(wxml, /loading && !order/);
  assert.match(wxml, /maskedPhone/);
  assert.match(wxml, /amountRows/);
  assert.match(js, /getStatusView/);
  assert.match(js, /normalizeOrderForDetail/);
  assert.match(js, /maskPhone/);
  assert.match(js, /nextStepText/);
  assert.match(js, /amountRows/);
  assert.match(js, /startService/);
  assert.match(js, /finishService/);
  assert.doesNotMatch(js, /wx\.cloud\.database/);
  assert.match(wxss, /border-radius:\s*28rpx/);
  assert.match(wxss, /#16a34a/);
  assert.match(wxss, /#ff6a00/);
});

test("worker income page keeps finance display as internal simulated records", () => {
  const js = read("miniprogram/pages/worker/income/income.js");
  const wxml = read("miniprogram/pages/worker/income/income.wxml");
  const wxss = read("miniprogram/pages/worker/income/income.wxss");

  for (const text of [
    "我的收益",
    "收益概览",
    "本月收益",
    "累计收益",
    "待结算",
    "已结算",
    "收益明细",
    "内部模拟流水",
    "不代表真实提现或清结算",
  ]) {
    assert.match(wxml, new RegExp(text), `income page should include ${text}`);
  }

  assert.match(wxml, /income-page/);
  assert.match(wxml, /income-hero-card/);
  assert.match(wxml, /income-boundary-card/);
  assert.match(wxml, /income-stat-grid/);
  assert.match(wxml, /earning-card/);
  assert.match(js, /financeService/);
  assert.match(js, /getWorkerIncomeSummary/);
  assert.match(js, /getWorkerEarningList/);
  assert.match(js, /monthAmountText/);
  assert.match(js, /getStatusView/);
  assert.doesNotMatch(`${wxml}\n${js}`, /微信提现已开通|自动结算|真实到账|真实财务流水|可自动打款/);
  assert.match(wxss, /border-radius:\s*28rpx/);
  assert.match(wxss, /#16a34a/);
  assert.match(wxss, /#ff6a00/);
});

test("worker review list and detail expose summary, list cards, reply, appeal, and empty states", () => {
  const listJs = read("miniprogram/pages/worker/review-list/review-list.js");
  const listWxml = read("miniprogram/pages/worker/review-list/review-list.wxml");
  const listWxss = read("miniprogram/pages/worker/review-list/review-list.wxss");
  const detailJs = read("miniprogram/pages/worker/review-detail/review-detail.js");
  const detailWxml = read("miniprogram/pages/worker/review-detail/review-detail.wxml");
  const detailWxss = read("miniprogram/pages/worker/review-detail/review-detail.wxss");
  const detailJson = read("miniprogram/pages/worker/review-detail/review-detail.json");

  for (const text of ["评分概览", "评价数量", "好评率", "评价列表", "查看详情"]) {
    assert.match(listWxml, new RegExp(text), `review list should include ${text}`);
  }
  assert.match(listWxml, /review-summary-card/);
  assert.match(listWxml, /review-card/);
  assert.match(listWxml, /empty-state/);
  assert.match(listJs, /normalizeReview/);
  assert.match(listJs, /ratingOverview/);
  assert.match(listJs, /replyStatusText/);
  assert.match(listWxss, /border-radius:\s*28rpx/);

  for (const text of [
    "评价详情",
    "用户评价",
    "师傅回复",
    "差评申诉",
    "人工审核",
    "查看原订单",
  ]) {
    assert.match(detailWxml, new RegExp(text), `review detail should include ${text}`);
  }
  assert.match(detailJson, /empty-state/);
  assert.match(detailJson, /loading-view/);
  assert.match(detailWxml, /review-overview-card/);
  assert.match(detailWxml, /review-reply-card/);
  assert.match(detailWxml, /review-appeal-card/);
  assert.match(detailWxml, /goOrderDetail/);
  assert.match(detailJs, /normalizeReviewDetail/);
  assert.match(detailJs, /goOrderDetail/);
  assert.match(detailJs, /workerReplyReview/);
  assert.match(detailJs, /workerCreateReviewAppeal/);
  assert.doesNotMatch(detailJs, /wx\.cloud\.database/);
  assert.match(detailWxss, /border-radius:\s*28rpx/);
});

test("worker profile related secondary pages keep manual audit and service range boundaries clear", () => {
  const applyWxml = read("miniprogram/pages/worker/apply/apply.wxml");
  const applyWxss = read("miniprogram/pages/worker/apply/apply.wxss");
  const auditWxml = read("miniprogram/pages/worker/audit-status/audit-status.wxml");
  const rangeJs = read("miniprogram/pages/provider/service-range/service-range.js");
  const rangeWxml = read("miniprogram/pages/provider/service-range/service-range.wxml");
  const rangeWxss = read("miniprogram/pages/provider/service-range/service-range.wxss");
  const profileWxml = read("miniprogram/pages/worker/profile/profile.wxml");

  for (const text of [
    "基础资料",
    "服务范围",
    "人工审核",
    "当前仅作展示",
    "不接入真实身份证认证",
  ]) {
    assert.match(applyWxml, new RegExp(text), `worker apply should include ${text}`);
  }
  assert.match(applyWxml, /worker-apply-page/);
  assert.match(applyWxml, /apply-boundary-card/);
  assert.match(applyWxss, /border-radius:\s*28rpx/);

  for (const text of ["审核状态", "当前状态", "资料概览", "人工审核"]) {
    assert.match(auditWxml, new RegExp(text), `audit status should include ${text}`);
  }
  assert.match(auditWxml, /audit-status-card/);
  assert.match(auditWxml, /audit-profile-card/);

  for (const text of [
    "服务范围",
    "接单范围配置",
    "行政区服务范围",
    "半径服务范围",
    "不包含路径规划、实时轨迹或 ETA",
  ]) {
    assert.match(rangeWxml, new RegExp(text), `service range should include ${text}`);
  }
  assert.match(rangeWxml, /service-range-page/);
  assert.match(rangeWxml, /service-range-mode-card/);
  assert.match(rangeWxml, /range-boundary-card/);
  assert.match(rangeJs, /updateWorkerServiceRange/);
  assert.doesNotMatch(`${rangeWxml}\n${rangeJs}`, /AI 派单|自动派单已上线|路径规划已上线|实时轨迹已上线/);
  assert.match(rangeWxss, /border-radius:\s*28rpx/);
  assert.match(profileWxml, /data-url="\/pages\/message-list\/message-list"/);
  assert.match(profileWxml, /data-url="\/pages\/worker\/income\/income"/);
});

test("phase 22D docs record scope, validation, and mock boundaries", () => {
  assert.equal(exists("docs/dev-records/22d-worker-secondary-ui.md"), true);

  const phase = read("docs/PHASE_CURRENT.md");
  const status = read("docs/PROJECT_STATUS.md");
  const record = read("docs/dev-records/22d-worker-secondary-ui.md");

  assert.match(phase, /阶段 22D：师傅端次级页面 UI 收口/);
  assert.match(phase, /mock\/真实能力边界/);
  assert.match(phase, /npm run check:cloudfunction-deps/);
  assert.match(status, /阶段 22D/);
  assert.doesNotMatch(status, /C:\\\\Users\\\\/);
  assert.match(record, /阶段目标/);
  assert.match(record, /页面清单/);
  assert.match(record, /数据库变化\s*\n\s*无/);
  assert.match(record, /云函数变化\s*\n\s*无/);
  assert.match(record, /内部模拟/);
});
