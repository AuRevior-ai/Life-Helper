const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function createAdminUsers() {
  return {
    async findByOpenid(openid) {
      return { openid, role: "admin", status: "normal" };
    },
  };
}

function createMissingCollectionRepository() {
  const error = new Error(
    "collection.get:fail -502005 database collection not exists",
  );
  error.errCode = -502005;
  return {
    async findAll() {
      throw error;
    },
    async findEnabled() {
      throw error;
    },
    async findByOrderId() {
      throw error;
    },
    async queryPage() {
      throw error;
    },
  };
}

test("tip success feedback stays visible before navigating back", () => {
  const tipCreate = read("miniprogram/pages/tip/create/create.js");

  assert.match(
    tipCreate,
    /hideLoading\(\)[\s\S]*showSuccess\(["']模拟打赏成功["']\)/,
  );
  assert.match(tipCreate, /setTimeout\([\s\S]*wx\.navigateBack/);
});

test("worker order detail loads and renders user review followup content", () => {
  const workerOrderJs = read(
    "miniprogram/pages/worker/order-detail/order-detail.js",
  );
  const workerOrderWxml = read(
    "miniprogram/pages/worker/order-detail/order-detail.wxml",
  );

  assert.match(workerOrderJs, /reviewService/);
  assert.match(workerOrderJs, /getOrderReview/);
  assert.match(workerOrderJs, /review:/);
  assert.match(workerOrderWxml, /用户评价/);
  assert.match(workerOrderWxml, /review\.followup_content/);
});

test("admin area and dispatch lists tolerate missing real-env collections", async () => {
  const { handleArea } = require("../cloudfunctions/area/handler");
  const { handleDispatch } = require("../cloudfunctions/dispatch/handler");

  const areaResult = await handleArea(
    { action: "getServiceAreaList", includeDisabled: true },
    {
      openid: "openid_admin",
      users: createAdminUsers(),
      areas: createMissingCollectionRepository(),
    },
  );
  assert.equal(areaResult.success, true);
  assert.deepEqual(areaResult.data.areas, []);
  assert.equal(areaResult.data.collection_missing, true);

  const dispatchResult = await handleDispatch(
    { action: "getDispatchLogs" },
    {
      openid: "openid_admin",
      users: createAdminUsers(),
      dispatchLogs: createMissingCollectionRepository(),
    },
  );
  assert.equal(dispatchResult.success, true);
  assert.deepEqual(dispatchResult.data.logs, []);
  assert.equal(dispatchResult.data.collection_missing, true);
});

test("admin review and appeal lists group records by worker", () => {
  const reviewListJs = read(
    "miniprogram/pages/admin/review-list/review-list.js",
  );
  const reviewListWxml = read(
    "miniprogram/pages/admin/review-list/review-list.wxml",
  );
  const appealListJs = read(
    "miniprogram/pages/admin/review-appeal-list/review-appeal-list.js",
  );
  const appealListWxml = read(
    "miniprogram/pages/admin/review-appeal-list/review-appeal-list.wxml",
  );

  assert.match(reviewListJs, /groupReviewsByWorker/);
  assert.match(reviewListJs, /groupedReviews/);
  assert.match(reviewListWxml, /groupedReviews/);
  assert.match(reviewListWxml, /师傅：/);

  assert.match(appealListJs, /groupAppealsByWorker/);
  assert.match(appealListJs, /groupedAppeals/);
  assert.match(appealListWxml, /groupedAppeals/);
  assert.match(appealListWxml, /师傅：/);
});

test("admin appeal review returns to previous page after successful processing", () => {
  const appealDetailJs = read(
    "miniprogram/pages/admin/review-appeal-detail/review-appeal-detail.js",
  );

  assert.match(appealDetailJs, /showSuccess\(["']申诉审核已通过["']\)/);
  assert.match(appealDetailJs, /showSuccess\(["']申诉审核已拒绝["']\)/);
  assert.match(appealDetailJs, /setTimeout\([\s\S]*wx\.navigateBack/);
});

test("merchant audit status page uses action-service data and shows next actions", () => {
  const auditStatusJs = read(
    "miniprogram/pages/merchant/audit-status/audit-status.js",
  );
  const auditStatusWxml = read(
    "miniprogram/pages/merchant/audit-status/audit-status.wxml",
  );

  assert.doesNotMatch(auditStatusJs, /result\.success/);
  assert.doesNotMatch(auditStatusJs, /result\.data/);
  assert.match(auditStatusJs, /statusText/);
  assert.match(auditStatusJs, /goApply/);
  assert.match(auditStatusJs, /goProfile/);
  assert.match(auditStatusWxml, /商家入驻状态/);
  assert.match(auditStatusWxml, /进入商家工作台/);
  assert.match(auditStatusWxml, /申请商家入驻/);
});
