const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function fixedNow() {
  return new Date("2026-06-01T09:00:00.000Z");
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function createMemoryUsers(initial = []) {
  const records = initial.map((item) => ({ ...item }));
  return {
    async findByOpenid(openid) {
      const user = records.find((item) => item.openid === openid);
      return user ? { ...user } : null;
    },
  };
}

function createMemoryOrders(initial = []) {
  const records = initial.map((item) => ({ ...item }));
  return {
    records,
    async findById(id) {
      const order = records.find((item) => item._id === id);
      return order ? { ...order } : null;
    },
    async updateById(id, data) {
      const order = records.find((item) => item._id === id);
      if (!order) return null;
      Object.assign(order, data);
      return { ...order };
    },
    async completePendingReviewOrder(id, data) {
      const order = records.find(
        (item) => item._id === id && item.status === "pending_review",
      );
      if (!order) return null;
      Object.assign(order, data);
      return { ...order };
    },
  };
}

function createMemoryReviews(initial = []) {
  const records = initial.map((item) => ({ ...item }));
  return {
    records,
    async create(data) {
      if (records.some((item) => item.order_id === data.order_id)) return null;
      const record = {
        ...data,
        _id: data._id || `review_${records.length + 1}`,
      };
      records.push(record);
      return { ...record };
    },
    async findById(id) {
      const review = records.find((item) => item._id === id);
      return review ? { ...review } : null;
    },
    async findByOrderId(orderId) {
      const review = records.find((item) => item.order_id === orderId);
      return review ? { ...review } : null;
    },
    async findByWorkerId(workerId) {
      return records
        .filter((item) => item.worker_id === workerId)
        .map((item) => ({ ...item }));
    },
    async findAll() {
      return records.map((item) => ({ ...item }));
    },
    async updateById(id, data) {
      const review = records.find((item) => item._id === id);
      if (!review) return null;
      Object.assign(review, data);
      return { ...review };
    },
    async deleteById(id) {
      const index = records.findIndex((item) => item._id === id);
      if (index >= 0) records.splice(index, 1);
    },
  };
}

function createMemoryCollection(prefix, initial = []) {
  const records = initial.map((item) => ({ ...item }));
  return {
    records,
    async create(data) {
      const record = {
        ...data,
        _id: data._id || `${prefix}_${records.length + 1}`,
      };
      records.push(record);
      return { ...record };
    },
    async findById(id) {
      const record = records.find((item) => item._id === id);
      return record ? { ...record } : null;
    },
    async findAll() {
      return records.map((item) => ({ ...item }));
    },
    async updateById(id, data) {
      const record = records.find((item) => item._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
  };
}

function createMemoryAppeals(initial = []) {
  const base = createMemoryCollection("appeal", initial);
  return {
    ...base,
    async findPendingByReviewId(reviewId) {
      const appeal = base.records.find(
        (item) => item.review_id === reviewId && item.status === "pending",
      );
      return appeal ? { ...appeal } : null;
    },
    async findByReviewId(reviewId) {
      return base.records
        .filter((item) => item.review_id === reviewId)
        .map((item) => ({ ...item }));
    },
    async findByWorkerId(workerId) {
      return base.records
        .filter((item) => item.worker_id === workerId)
        .map((item) => ({ ...item }));
    },
  };
}

function createMemoryTipLogs(initial = []) {
  const base = createMemoryCollection("tip", initial);
  return {
    ...base,
    async findByOrderId(orderId) {
      return base.records
        .filter((item) => item.order_id === orderId)
        .map((item) => ({ ...item }));
    },
    async findByUserId(userId) {
      return base.records
        .filter((item) => item.user_id === userId)
        .map((item) => ({ ...item }));
    },
    async findByWorkerId(workerId) {
      return base.records
        .filter((item) => item.worker_id === workerId)
        .map((item) => ({ ...item }));
    },
  };
}

function createReviewEnv(openid = "openid_user") {
  return {
    openid,
    now: fixedNow,
    users: createMemoryUsers([
      { openid: "openid_user", role: "user", status: "normal" },
      { openid: "openid_worker", role: "worker", status: "normal" },
      { openid: "openid_merchant", role: "user", status: "normal" },
      { openid: "openid_admin", role: "admin", status: "normal" },
    ]),
    orders: createMemoryOrders([
      {
        _id: "order_pending_review",
        order_no: "OD18001",
        user_id: "openid_user",
        worker_id: "openid_worker",
        service_id: "svc_clean",
        service_name: "日常保洁",
        status: "pending_review",
        pay_status: "paid",
        price: 10000,
        pay_amount: 10000,
      },
      {
        _id: "order_completed",
        order_no: "OD18002",
        user_id: "openid_user",
        worker_id: "openid_worker",
        service_id: "svc_clean",
        service_name: "日常保洁",
        status: "completed",
        pay_status: "paid",
        price: 10000,
        pay_amount: 10000,
        refund_status: "none",
        after_sale_status: "none",
      },
      {
        _id: "order_other",
        order_no: "OD18003",
        user_id: "openid_other",
        worker_id: "openid_worker",
        status: "completed",
        pay_status: "paid",
        price: 10000,
        pay_amount: 10000,
      },
      {
        _id: "order_refunded",
        order_no: "OD18004",
        user_id: "openid_user",
        worker_id: "openid_worker",
        status: "completed",
        pay_status: "paid",
        refund_status: "mock_success",
        after_sale_status: "refunded",
        price: 10000,
        pay_amount: 10000,
      },
    ]),
    reviews: createMemoryReviews([
      {
        _id: "review_good",
        order_id: "order_completed",
        order_no: "OD18002",
        user_id: "openid_user",
        worker_id: "openid_worker",
        service_id: "svc_clean",
        service_name: "日常保洁",
        rating: 5,
        rating_level: "good",
        content: "很好",
        status: "visible",
        appeal_status: "none",
      },
      {
        _id: "review_bad",
        order_id: "order_bad",
        order_no: "OD18005",
        user_id: "openid_user",
        worker_id: "openid_worker",
        service_id: "svc_clean",
        service_name: "日常保洁",
        rating: 2,
        rating_level: "bad",
        content: "不满意",
        status: "visible",
        appeal_status: "none",
      },
    ]),
    reviewAppeals: createMemoryAppeals(),
    reviewActionLogs: createMemoryCollection("review_action_log"),
    messages: createMemoryCollection("message"),
    finance: {
      async generateOrderFinance() {
        return { success: true };
      },
    },
    appealNoFactory: () => "RA202606010001",
  };
}

function createTipEnv(openid = "openid_user") {
  const reviewEnv = createReviewEnv(openid);
  return {
    ...reviewEnv,
    tipLogs: createMemoryTipLogs(),
    financeLogs: createMemoryCollection("finance_log"),
    workerEarnings: {
      ...createMemoryCollection("earning"),
      async findActiveByTipId(tipId) {
        const earning = this.records.find(
          (item) => item.tip_id === tipId && item.status !== "reversed",
        );
        return earning ? { ...earning } : null;
      },
      async findByWorkerId(workerId) {
        return this.records
          .filter((item) => item.worker_id === workerId)
          .map((item) => ({ ...item }));
      },
    },
    tipNoFactory: () => "TP202606010001",
    financeNoFactory: () => "FN202606010001",
    earningNoFactory: () => "EN202606010001",
  };
}

test("user creates enhanced review with tags, images, anonymity, bad level, message, and log", async () => {
  const { handleReview } = require("../cloudfunctions/review/handler");
  const env = createReviewEnv();

  const result = await handleReview(
    {
      action: "createReview",
      orderId: "order_pending_review",
      rating: 2,
      tags: ["迟到", "效果不满意"],
      images: ["cloud://review-1.png"],
      is_anonymous: true,
      content: "服务结果不满意",
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.review.rating_level, "bad");
  assert.deepEqual(result.data.review.tags, ["迟到", "效果不满意"]);
  assert.deepEqual(result.data.review.images, ["cloud://review-1.png"]);
  assert.equal(result.data.review.is_anonymous, true);
  assert.equal(result.data.review.status, "visible");
  assert.equal(result.data.review.appeal_status, "none");
  assert.equal(result.data.order.status, "completed");
  assert.equal(
    env.messages.records.some((item) => item.type === "review_created"),
    true,
  );
  assert.equal(
    env.reviewActionLogs.records.some(
      (item) => item.action === "create_review",
    ),
    true,
  );

  const duplicate = await handleReview(
    {
      action: "createReview",
      orderId: "order_pending_review",
      rating: 5,
      content: "重复",
    },
    env,
  );
  assert.equal(duplicate.success, false);

  const other = await handleReview(
    {
      action: "createReview",
      orderId: "order_other",
      rating: 5,
      content: "他人订单",
    },
    env,
  );
  assert.equal(other.success, false);
  assert.equal(other.errorCode, "PERMISSION_DENIED");
});

test("user can add one followup to own completed review", async () => {
  const { handleReview } = require("../cloudfunctions/review/handler");
  const env = createReviewEnv();

  const result = await handleReview(
    {
      action: "addReviewFollowup",
      reviewId: "review_good",
      content: "后来又补做了一次，体验不错",
      images: ["cloud://followup.png"],
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(
    result.data.review.followup_content,
    "后来又补做了一次，体验不错",
  );
  assert.deepEqual(result.data.review.followup_images, [
    "cloud://followup.png",
  ]);
  assert.equal(
    env.messages.records.some((item) => item.type === "review_followup_added"),
    true,
  );
  assert.equal(
    env.reviewActionLogs.records.some((item) => item.action === "add_followup"),
    true,
  );

  const duplicate = await handleReview(
    {
      action: "addReviewFollowup",
      reviewId: "review_good",
      content: "再次追评",
    },
    env,
  );
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.errorCode, "REVIEW_FOLLOWUP_EXISTS");
});

test("worker can reply own visible review but not another worker review", async () => {
  const { handleReview } = require("../cloudfunctions/review/handler");
  const env = createReviewEnv("openid_worker");

  const result = await handleReview(
    {
      action: "workerReplyReview",
      reviewId: "review_good",
      content: "感谢认可，我们会继续保持",
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(
    result.data.review.worker_reply_content,
    "感谢认可，我们会继续保持",
  );
  assert.equal(
    env.messages.records.some((item) => item.type === "worker_review_reply"),
    true,
  );
  assert.equal(
    env.messages.records.find((item) => item.type === "worker_review_reply")
      .role,
    "user",
  );
  assert.equal(
    env.reviewActionLogs.records.some((item) => item.action === "worker_reply"),
    true,
  );

  const otherEnv = createReviewEnv("openid_other_worker");
  const denied = await handleReview(
    {
      action: "workerReplyReview",
      reviewId: "review_good",
      content: "不是我的评价",
    },
    otherEnv,
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");
});

test("merchant-compatible reviews and tips are not exposed through worker-only actions", async () => {
  const { handleReview } = require("../cloudfunctions/review/handler");
  const { handleTip } = require("../cloudfunctions/tip/handler");
  const reviewEnv = createReviewEnv("openid_merchant");
  reviewEnv.reviews.records.push({
    _id: "review_merchant",
    order_id: "order_merchant",
    order_no: "ODM001",
    user_id: "openid_user",
    worker_id: "",
    provider_type: "merchant",
    provider_id: "merchant_1",
    merchant_id: "merchant_1",
    rating: 2,
    rating_level: "bad",
    content: "商家订单评价",
    status: "visible",
    appeal_status: "none",
  });

  const reply = await handleReview(
    {
      action: "workerReplyReview",
      reviewId: "review_merchant",
      content: "商家暂不能走师傅回复入口",
    },
    reviewEnv,
  );
  assert.equal(reply.success, false);
  assert.equal(reply.errorCode, "PERMISSION_DENIED");

  const appeal = await handleReview(
    {
      action: "workerCreateReviewAppeal",
      reviewId: "review_merchant",
      reason: "商家暂不能走师傅申诉入口",
    },
    reviewEnv,
  );
  assert.equal(appeal.success, false);
  assert.equal(appeal.errorCode, "PERMISSION_DENIED");

  const tipEnv = createTipEnv("openid_merchant");
  tipEnv.tipLogs.records.push({
    _id: "tip_merchant",
    order_id: "order_merchant",
    user_id: "openid_user",
    worker_id: "",
    provider_type: "merchant",
    provider_id: "merchant_1",
    merchant_id: "merchant_1",
    amount: 1000,
    status: "mock_success",
  });

  const tips = await handleTip({ action: "getWorkerTipList" }, tipEnv);
  assert.equal(tips.success, true);
  assert.deepEqual(tips.data.tips, []);

  const detail = await handleTip(
    { action: "getTipDetail", tipId: "tip_merchant" },
    tipEnv,
  );
  assert.equal(detail.success, false);
  assert.equal(detail.errorCode, "PERMISSION_DENIED");
});

test("worker appeals bad review and admin approves or rejects appeal with logs", async () => {
  const { handleReview } = require("../cloudfunctions/review/handler");
  const env = createReviewEnv("openid_worker");

  const goodAppeal = await handleReview(
    {
      action: "workerCreateReviewAppeal",
      reviewId: "review_good",
      reason: "想申诉好评",
      description: "不应允许",
    },
    env,
  );
  assert.equal(goodAppeal.success, false);
  assert.equal(goodAppeal.errorCode, "REVIEW_APPEAL_NOT_ALLOWED");

  const appeal = await handleReview(
    {
      action: "workerCreateReviewAppeal",
      reviewId: "review_bad",
      reason: "用户描述不实",
      description: "现场已完成服务",
      images: ["cloud://appeal.png"],
    },
    env,
  );
  assert.equal(appeal.success, true);
  assert.equal(appeal.data.appeal.status, "pending");
  assert.equal(appeal.data.review.appeal_status, "pending");
  assert.equal(
    env.reviewActionLogs.records.some(
      (item) => item.action === "appeal_create",
    ),
    true,
  );

  const duplicate = await handleReview(
    {
      action: "workerCreateReviewAppeal",
      reviewId: "review_bad",
      reason: "重复申诉",
    },
    env,
  );
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.errorCode, "REVIEW_APPEAL_PENDING");

  const approved = await handleReview(
    {
      action: "adminReviewAppeal",
      appealId: appeal.data.appeal._id,
      result: "approved",
      adminRemark: "评价内容存在争议，先隐藏",
    },
    { ...env, openid: "openid_admin" },
  );
  assert.equal(approved.success, true);
  assert.equal(approved.data.appeal.status, "approved");
  assert.equal(approved.data.review.status, "hidden");
  assert.equal(approved.data.review.appeal_status, "approved");
  assert.equal(
    env.reviewActionLogs.records.some(
      (item) => item.action === "appeal_approve",
    ),
    true,
  );

  const rejectEnv = createReviewEnv("openid_worker");
  const rejectAppeal = await handleReview(
    {
      action: "workerCreateReviewAppeal",
      reviewId: "review_bad",
      reason: "用户描述不实",
    },
    rejectEnv,
  );
  const rejected = await handleReview(
    {
      action: "adminReviewAppeal",
      appealId: rejectAppeal.data.appeal._id,
      result: "rejected",
      adminRemark: "证据不足",
    },
    { ...rejectEnv, openid: "openid_admin" },
  );
  assert.equal(rejected.success, true);
  assert.equal(rejected.data.appeal.status, "rejected");
  assert.equal(rejected.data.review.status, "visible");
  assert.equal(rejected.data.review.appeal_status, "rejected");
});

test("admin manages review visibility and normal user cannot hide reviews", async () => {
  const { handleReview } = require("../cloudfunctions/review/handler");
  const env = createReviewEnv("openid_admin");

  const hidden = await handleReview(
    {
      action: "adminHideReview",
      reviewId: "review_good",
      reason: "包含不适当内容",
    },
    env,
  );
  assert.equal(hidden.success, true);
  assert.equal(hidden.data.review.status, "hidden");
  assert.equal(
    env.reviewActionLogs.records.some((item) => item.action === "hide_review"),
    true,
  );

  const restored = await handleReview(
    {
      action: "adminRestoreReview",
      reviewId: "review_good",
      reason: "复核后恢复",
    },
    env,
  );
  assert.equal(restored.success, true);
  assert.equal(restored.data.review.status, "visible");
  assert.equal(
    env.reviewActionLogs.records.some(
      (item) => item.action === "restore_review",
    ),
    true,
  );

  const denied = await handleReview(
    {
      action: "adminHideReview",
      reviewId: "review_good",
      reason: "普通用户操作",
    },
    { ...env, openid: "openid_user" },
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");
});

test("user creates one mock tip for completed own order and generates finance records", async () => {
  const { handleTip } = require("../cloudfunctions/tip/handler");
  const env = createTipEnv();

  const result = await handleTip(
    {
      action: "createMockTip",
      orderId: "order_completed",
      amount: 1000,
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.tip.amount, 1000);
  assert.equal(result.data.tip.platform_tip_commission, 150);
  assert.equal(result.data.tip.worker_tip_income, 850);
  assert.equal(result.data.tip.status, "mock_success");
  assert.equal(result.data.tip.channel, "mock");
  assert.equal(result.data.workerEarning.earning_type, "tip");
  assert.equal(env.tipLogs.records.length, 1);
  assert.equal(env.financeLogs.records.length, 2);
  assert.equal(env.workerEarnings.records.length, 1);
  assert.equal(
    env.messages.records.some((item) => item.type === "tip_created"),
    true,
  );

  const duplicate = await handleTip(
    {
      action: "createMockTip",
      orderId: "order_completed",
      amount: 500,
    },
    env,
  );
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.errorCode, "TIP_ALREADY_EXISTS");

  const otherOrder = await handleTip(
    {
      action: "createMockTip",
      orderId: "order_other",
      amount: 1000,
    },
    env,
  );
  assert.equal(otherOrder.success, false);
  assert.equal(otherOrder.errorCode, "PERMISSION_DENIED");

  const refunded = await handleTip(
    {
      action: "createMockTip",
      orderId: "order_refunded",
      amount: 1000,
    },
    env,
  );
  assert.equal(refunded.success, false);
  assert.equal(refunded.errorCode, "ORDER_AFTER_SALE_INVALID");
});

test("tip permissions isolate worker list and allow admin all logs", async () => {
  const { handleTip } = require("../cloudfunctions/tip/handler");
  const env = createTipEnv();
  await handleTip(
    { action: "createMockTip", orderId: "order_completed", amount: 1000 },
    env,
  );
  env.tipLogs.records.push({
    _id: "tip_other",
    order_id: "order_x",
    user_id: "openid_other",
    worker_id: "openid_other_worker",
    amount: 2000,
    status: "mock_success",
  });

  const workerList = await handleTip(
    { action: "getWorkerTipList" },
    { ...env, openid: "openid_worker" },
  );
  assert.equal(workerList.success, true);
  assert.deepEqual(
    workerList.data.tips.map((item) => item.worker_id),
    ["openid_worker"],
  );

  const adminList = await handleTip(
    { action: "adminGetTipLogs" },
    { ...env, openid: "openid_admin" },
  );
  assert.equal(adminList.success, true);
  assert.equal(adminList.data.tips.length, 2);

  const denied = await handleTip(
    { action: "adminGetTipLogs" },
    { ...env, openid: "openid_user" },
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");
});

test("phase 18 routes, constants, services, docs, and reports are wired", () => {
  const app = JSON.parse(read("miniprogram/app.json"));
  const constants = read("miniprogram/config/constants.js");
  const status = read("miniprogram/config/status.js");
  const reviewService = read("miniprogram/services/review.service.js");
  const tipServiceExists = exists("miniprogram/services/tip.service.js");
  const dashboard = read("miniprogram/pages/admin/dashboard/dashboard.wxml");
  const orderDetailJs = read("miniprogram/pages/order-detail/order-detail.js");
  const orderDetail = read("miniprogram/pages/order-detail/order-detail.wxml");
  const index = read("docs/dev-records/index.md");

  for (const route of [
    "pages/review/detail/detail",
    "pages/review/followup/followup",
    "pages/tip/create/create",
    "pages/worker/review-list/review-list",
    "pages/worker/review-detail/review-detail",
    "pages/worker/tip-list/tip-list",
    "pages/admin/review-list/review-list",
    "pages/admin/review-detail/review-detail",
    "pages/admin/review-appeal-list/review-appeal-list",
    "pages/admin/review-appeal-detail/review-appeal-detail",
    "pages/admin/tip-log-list/tip-log-list",
  ]) {
    assert.ok(app.pages.includes(route), `${route} should be registered`);
  }

  assert.match(constants, /TIP: ["']tip["']/);
  assert.match(constants, /REVIEW_APPEALS: ["']review_appeals["']/);
  assert.match(constants, /TIP_LOGS: ["']tip_logs["']/);
  assert.match(status, /REVIEW_STATUS/);
  assert.match(status, /TIP_STATUS/);
  assert.match(reviewService, /addReviewFollowup/);
  assert.match(orderDetailJs, /getOrderReview/);
  assert.match(orderDetailJs, /goReviewDetail/);
  assert.equal(tipServiceExists, true);
  const dashboardJs = read("miniprogram/pages/admin/dashboard/dashboard.js");
  assert.match(dashboardJs, /评价管理/);
  assert.match(dashboardJs, /review-list\/review-list/);
  assert.match(orderDetail, /打赏师傅/);
  assert.match(orderDetail, /查看评价 \/ 追加评价/);
  assert.equal(exists("cloudfunctions/tip/package.json"), true);
  assert.equal(exists("docs/dev-records/18_review-tip-appeal.md"), true);
  assert.match(index, /18_review-tip-appeal/);
});
