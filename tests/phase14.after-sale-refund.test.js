const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function fixedNow() {
  return new Date("2026-05-31T14:00:00.000Z");
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function createMemoryUsers(initialUsers = []) {
  const records = initialUsers.map((record) => ({ ...record }));
  return {
    records,
    async findByOpenid(openid) {
      const user = records.find((record) => record.openid === openid);
      return user ? { ...user } : null;
    },
  };
}

function createMemoryOrders(initialOrders = []) {
  const records = initialOrders.map((record) => ({ ...record }));
  return {
    records,
    async findById(id) {
      const order = records.find((record) => record._id === id);
      return order ? { ...order } : null;
    },
    async updateById(id, data) {
      const order = records.find((record) => record._id === id);
      if (!order) return null;
      Object.assign(order, data);
      return { ...order };
    },
  };
}

function createMemoryAfterSales(initialAfterSales = []) {
  const records = initialAfterSales.map((record) => ({ ...record }));
  return {
    records,
    async create(data) {
      const record = {
        ...data,
        _id: data._id || `after_sale_${records.length + 1}`,
      };
      records.push(record);
      return { ...record };
    },
    async findById(id) {
      const record = records.find((item) => item._id === id);
      return record ? { ...record } : null;
    },
    async findActiveByOrderId(orderId) {
      const record = records.find(
        (item) =>
          item.order_id === orderId &&
          ["pending", "approved"].includes(item.status),
      );
      return record ? { ...record } : null;
    },
    async findByUserId(userId) {
      return records
        .filter((record) => record.user_id === userId)
        .map((record) => ({ ...record }));
    },
    async findAll() {
      return records.map((record) => ({ ...record }));
    },
    async updateById(id, data) {
      const record = records.find((item) => item._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
  };
}

function createMemoryRefundLogs(initialLogs = []) {
  const records = initialLogs.map((record) => ({ ...record }));
  return {
    records,
    async create(data) {
      const record = { ...data, _id: `refund_log_${records.length + 1}` };
      records.push(record);
      return { ...record };
    },
    async findByAfterSaleId(afterSaleId) {
      return records
        .filter((record) => record.after_sale_id === afterSaleId)
        .map((record) => ({ ...record }));
    },
  };
}

function createMemoryMessages() {
  const records = [];
  return {
    records,
    async create(data) {
      const record = { ...data, _id: `message_${records.length + 1}` };
      records.push(record);
      return { ...record };
    },
  };
}

function createBaseEnv(openid = "openid_user") {
  return {
    openid,
    now: fixedNow,
    users: createMemoryUsers([
      { _id: "user_1", openid: "openid_user", role: "user", status: "normal" },
      {
        _id: "admin_1",
        openid: "openid_admin",
        role: "admin",
        status: "normal",
      },
    ]),
    orders: createMemoryOrders([
      {
        _id: "order_paid",
        order_no: "OD001",
        user_id: "openid_user",
        worker_id: "openid_worker",
        status: "pending_accept",
        pay_status: "paid",
        price: 1200,
        pay_amount: 1200,
        out_trade_no: "OD001",
        transaction_id: "tx_001",
        after_sale_status: "none",
        refund_status: "none",
      },
      {
        _id: "order_pending_pay",
        order_no: "OD002",
        user_id: "openid_user",
        status: "pending_pay",
        pay_status: "unpaid",
        price: 1200,
        after_sale_status: "none",
        refund_status: "none",
      },
      {
        _id: "order_canceled",
        order_no: "OD003",
        user_id: "openid_user",
        status: "canceled",
        pay_status: "paid",
        price: 1200,
        after_sale_status: "none",
        refund_status: "none",
      },
      {
        _id: "order_other",
        order_no: "OD004",
        user_id: "openid_other",
        status: "pending_accept",
        pay_status: "paid",
        price: 1200,
        after_sale_status: "none",
        refund_status: "none",
      },
    ]),
    afterSales: createMemoryAfterSales(),
    refundLogs: createMemoryRefundLogs(),
    messages: createMemoryMessages(),
    afterSaleNoFactory: () => "AS202605310001",
    refundNoFactory: () => "RF202605310001",
  };
}

test("user can create after sale for own paid order with backend amount and message", async () => {
  const { handleRefund } = require("../cloudfunctions/refund/handler");
  const env = createBaseEnv();

  const result = await handleRefund(
    {
      action: "createAfterSale",
      orderId: "order_paid",
      type: "refund_only",
      reason: "服务时间无法配合",
      description: "希望退款",
      amount: 1,
      images: ["cloud://proof-1", "cloud://proof-2"],
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.afterSale.amount, 1200);
  assert.equal(result.data.afterSale.status, "pending");
  assert.equal(env.orders.records[0].after_sale_status, "pending");
  assert.equal(env.orders.records[0].after_sale_id, result.data.afterSale._id);
  assert.equal(
    env.messages.records.some(
      (message) => message.type === "after_sale_created",
    ),
    true,
  );

  const duplicateResult = await handleRefund(
    {
      action: "createAfterSale",
      orderId: "order_paid",
      reason: "重复申请",
    },
    env,
  );
  assert.equal(duplicateResult.success, false);
  assert.equal(duplicateResult.errorCode, "AFTER_SALE_EXISTS");
});

test("after sale creation rejects unauthorized, pending-pay, and canceled orders", async () => {
  const { handleRefund } = require("../cloudfunctions/refund/handler");
  const env = createBaseEnv();

  const otherResult = await handleRefund(
    {
      action: "createAfterSale",
      orderId: "order_other",
      reason: "不是我的订单",
    },
    env,
  );
  assert.equal(otherResult.success, false);
  assert.equal(otherResult.errorCode, "PERMISSION_DENIED");

  const pendingPayResult = await handleRefund(
    {
      action: "createAfterSale",
      orderId: "order_pending_pay",
      reason: "未付款",
    },
    env,
  );
  assert.equal(pendingPayResult.success, false);
  assert.equal(pendingPayResult.errorCode, "ORDER_AFTER_SALE_NOT_ALLOWED");

  const canceledResult = await handleRefund(
    {
      action: "createAfterSale",
      orderId: "order_canceled",
      reason: "已取消",
    },
    env,
  );
  assert.equal(canceledResult.success, false);
  assert.equal(canceledResult.errorCode, "ORDER_AFTER_SALE_NOT_ALLOWED");
});

test("admin approval performs mock refund, logs it, updates order, and blocks duplicate review", async () => {
  const { handleRefund } = require("../cloudfunctions/refund/handler");
  const env = createBaseEnv();
  const createResult = await handleRefund(
    {
      action: "createAfterSale",
      orderId: "order_paid",
      reason: "申请退款",
    },
    env,
  );
  const afterSaleId = createResult.data.afterSale._id;

  env.openid = "openid_user";
  const nonAdminResult = await handleRefund(
    {
      action: "adminReviewAfterSale",
      afterSaleId,
      reviewStatus: "approved",
    },
    env,
  );
  assert.equal(nonAdminResult.success, false);
  assert.equal(nonAdminResult.errorCode, "PERMISSION_DENIED");

  env.openid = "openid_admin";
  const approveResult = await handleRefund(
    {
      action: "adminReviewAfterSale",
      afterSaleId,
      reviewStatus: "approved",
      adminRemark: "同意退款",
    },
    env,
  );
  assert.equal(approveResult.success, true);
  assert.equal(approveResult.data.afterSale.status, "refunded");
  assert.equal(approveResult.data.refundLog.refund_status, "mock_success");
  assert.equal(env.orders.records[0].after_sale_status, "refunded");
  assert.equal(env.orders.records[0].refund_status, "mock_success");
  assert.equal(env.orders.records[0].refund_amount, 1200);
  assert.equal(
    env.refundLogs.records.some((log) => log.refund_status === "mock_success"),
    true,
  );
  assert.equal(
    env.messages.records.some((message) => message.type === "refund_success"),
    true,
  );

  const duplicateResult = await handleRefund(
    {
      action: "adminReviewAfterSale",
      afterSaleId,
      reviewStatus: "approved",
    },
    env,
  );
  assert.equal(duplicateResult.success, false);
  assert.equal(duplicateResult.errorCode, "AFTER_SALE_REVIEWED");
});

test("admin rejection does not create successful refund and direct duplicate refund is blocked", async () => {
  const { handleRefund } = require("../cloudfunctions/refund/handler");
  const env = createBaseEnv();
  const createResult = await handleRefund(
    {
      action: "createAfterSale",
      orderId: "order_paid",
      reason: "申请退款",
    },
    env,
  );
  const afterSaleId = createResult.data.afterSale._id;

  env.openid = "openid_admin";
  const rejectResult = await handleRefund(
    {
      action: "adminReviewAfterSale",
      afterSaleId,
      reviewStatus: "rejected",
      adminRemark: "不符合退款条件",
    },
    env,
  );
  assert.equal(rejectResult.success, true);
  assert.equal(rejectResult.data.afterSale.status, "rejected");
  assert.equal(env.orders.records[0].after_sale_status, "rejected");
  assert.equal(
    env.refundLogs.records.some((log) => log.refund_status === "mock_success"),
    false,
  );
  assert.equal(
    env.messages.records.some(
      (message) => message.type === "after_sale_rejected",
    ),
    true,
  );

  const refundedEnv = createBaseEnv("openid_admin");
  refundedEnv.afterSales = createMemoryAfterSales([
    {
      _id: "after_sale_refunded",
      order_id: "order_paid",
      order_no: "OD001",
      user_id: "openid_user",
      amount: 1200,
      status: "refunded",
      refund_no: "RF_DONE",
    },
  ]);
  refundedEnv.orders.records[0].refund_status = "mock_success";
  const duplicateRefundResult = await handleRefund(
    {
      action: "mockRefund",
      afterSaleId: "after_sale_refunded",
    },
    refundedEnv,
  );
  assert.equal(duplicateRefundResult.success, false);
  assert.equal(duplicateRefundResult.errorCode, "REFUND_ALREADY_PROCESSED");
  assert.equal(
    refundedEnv.refundLogs.records.some(
      (log) => log.type === "duplicate_refund",
    ),
    true,
  );
});

test("after sale pages, constants, collections, and services are wired", () => {
  const status = read("miniprogram/config/status.js");
  const constants = read("miniprogram/config/constants.js");
  const appJson = read("miniprogram/app.json");
  const orderDetailJs = read("miniprogram/pages/order-detail/order-detail.js");
  const orderDetailWxml = read(
    "miniprogram/pages/order-detail/order-detail.wxml",
  );
  const refundService = read("miniprogram/services/refund.service.js");
  const readme = read("README.md");

  assert.match(status, /AFTER_SALE_STATUS/);
  assert.match(status, /REFUND_STATUS/);
  assert.match(status, /AFTER_SALE_CREATED/);
  assert.match(constants, /AFTER_SALES/);
  assert.match(constants, /REFUND_LOGS/);
  assert.match(constants, /REFUND/);
  assert.match(appJson, /pages\/after-sale\/apply\/apply/);
  assert.match(appJson, /pages\/after-sale\/detail\/detail/);
  assert.match(appJson, /pages\/admin\/after-sale-list\/after-sale-list/);
  assert.match(appJson, /pages\/admin\/after-sale-detail\/after-sale-detail/);
  assert.equal(exists("miniprogram/pages/after-sale/apply/apply.js"), true);
  assert.equal(
    exists("miniprogram/pages/admin/after-sale-detail/after-sale-detail.js"),
    true,
  );
  assert.match(orderDetailJs, /goAfterSaleApply/);
  assert.match(orderDetailWxml, /申请售后/);
  assert.match(refundService, /createAfterSale/);
  assert.match(refundService, /adminReviewAfterSale/);
  assert.match(readme, /模拟退款/);
});

test("refund logs and frontend do not contain payment or refund secrets", () => {
  const refundAdapter = read("cloudfunctions/refund/refund-adapter.js");
  const releaseChecklist = read("docs/release-package-checklist.md");

  assert.match(releaseChecklist, /refund_logs/);
  assert.doesNotMatch(refundAdapter, /BEGIN (RSA )?PRIVATE KEY/);
  assert.doesNotMatch(refundAdapter, /api[_-]?v3[_-]?key\s*[:=]\s*['"][^'"]+/i);
  assert.doesNotMatch(refundAdapter, /mchid\s*[:=]\s*['"]\d{8,}/i);
});
