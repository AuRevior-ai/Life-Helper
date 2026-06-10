const assert = require("node:assert/strict");
const test = require("node:test");

function createUsers() {
  return {
    async findByOpenid(openid) {
      if (openid === "openid_admin") {
        return { _id: "admin_1", openid, role: "admin", status: "normal" };
      }
      if (!openid) return null;
      return { _id: openid, openid, role: "user", status: "normal" };
    },
  };
}

function paged(list, pageInfo) {
  return {
    list,
    total: list.length,
    page: pageInfo.page,
    pageSize: pageInfo.pageSize,
  };
}

test("dispatch.getDispatchLogs uses repository-side pagination and keeps logs alias", async () => {
  const { handleDispatch } = require("../cloudfunctions/dispatch/handler");
  const calls = [];
  const env = {
    openid: "openid_admin",
    users: createUsers(),
    dispatchLogs: {
      async findAll() {
        throw new Error("dispatchLogs.findAll should not be used");
      },
      async findByOrderId() {
        throw new Error("dispatchLogs.findByOrderId should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ filters, pageInfo });
        return paged([{ _id: "dispatch_log_1", order_id: filters.order_id }], pageInfo);
      },
    },
  };

  const result = await handleDispatch(
    {
      action: "getDispatchLogs",
      orderId: "order_1",
      page: 2,
      pageSize: 100,
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.pageSize, 50);
  assert.equal(result.data.logs.length, 1);
  assert.equal(result.data.list, result.data.logs);
  assert.deepEqual(calls, [
    {
      filters: { order_id: "order_1" },
      pageInfo: { page: 2, pageSize: 50 },
    },
  ]);

  const denied = await handleDispatch(
    { action: "getDispatchLogs" },
    { ...env, openid: "openid_user" },
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");
});

test("message.getMessageList uses repository-side pagination and keeps messages alias", async () => {
  const { handleMessage } = require("../cloudfunctions/message/handler");
  const calls = [];
  const env = {
    openid: "openid_user",
    messages: {
      async findAll() {
        throw new Error("messages.findAll should not be used");
      },
      async findByUserId() {
        throw new Error("messages.findByUserId should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ type: "queryPage", filters, pageInfo });
        return paged(
          [
            {
              _id: "message_1",
              user_id: filters.user_id,
              role: filters.role,
              is_read: false,
            },
          ],
          pageInfo,
        );
      },
      async countUnread(filters) {
        calls.push({ type: "countUnread", filters });
        return 3;
      },
    },
  };

  const result = await handleMessage(
    {
      action: "getMessageList",
      role: "user",
      isRead: false,
      page: 1,
      pageSize: 100,
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.pageSize, 50);
  assert.equal(result.data.messages.length, 1);
  assert.equal(result.data.list, result.data.messages);
  assert.equal(result.data.unread_count, 3);
  assert.deepEqual(calls, [
    {
      type: "queryPage",
      filters: { user_id: "openid_user", role: "user", is_read: false },
      pageInfo: { page: 1, pageSize: 50 },
    },
    {
      type: "countUnread",
      filters: { user_id: "openid_user", role: "user", is_read: false },
    },
  ]);

  const denied = await handleMessage(
    { action: "getMessageList" },
    { messages: env.messages },
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "OPENID_MISSING");
});

test("refund after-sale lists use repository-side pagination and keep afterSales alias", async () => {
  const { handleRefund } = require("../cloudfunctions/refund/handler");
  const calls = [];
  const env = {
    openid: "openid_user",
    users: createUsers(),
    afterSales: {
      async findAll() {
        throw new Error("afterSales.findAll should not be used");
      },
      async findByUserId() {
        throw new Error("afterSales.findByUserId should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ filters, pageInfo });
        return paged(
          [{ _id: "after_sale_1", user_id: filters.user_id, status: filters.status }],
          pageInfo,
        );
      },
    },
  };

  const userResult = await handleRefund(
    {
      action: "getUserAfterSaleList",
      status: "pending",
      page: 3,
      pageSize: 100,
    },
    env,
  );
  assert.equal(userResult.success, true);
  assert.equal(userResult.data.pageSize, 50);
  assert.equal(userResult.data.afterSales.length, 1);
  assert.equal(userResult.data.list, userResult.data.afterSales);

  const adminResult = await handleRefund(
    {
      action: "adminGetAfterSaleList",
      status: "approved",
      page: 1,
      pageSize: 10,
    },
    { ...env, openid: "openid_admin" },
  );
  assert.equal(adminResult.success, true);
  assert.equal(adminResult.data.afterSales.length, 1);

  assert.deepEqual(calls, [
    {
      filters: { user_id: "openid_user", status: "pending" },
      pageInfo: { page: 3, pageSize: 50 },
    },
    {
      filters: { status: "approved" },
      pageInfo: { page: 1, pageSize: 10 },
    },
  ]);

  const denied = await handleRefund(
    { action: "adminGetAfterSaleList" },
    env,
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");
});

test("merchant order and action-log lists use repository-side pagination", async () => {
  const { handleMerchant } = require("../cloudfunctions/merchant/handler");
  const calls = [];
  const env = {
    openid: "openid_merchant",
    users: createUsers(),
    merchants: {
      async findByUserId(userId) {
        if (userId !== "openid_merchant") return null;
        return {
          _id: "merchant_1",
          user_id: userId,
          audit_status: "approved",
          status: "normal",
        };
      },
    },
    orders: {
      async findAll() {
        throw new Error("orders.findAll should not be used");
      },
      async findByMerchantId() {
        throw new Error("orders.findByMerchantId should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ type: "orders", filters, pageInfo });
        return paged(
          [{ _id: "order_1", merchant_id: filters.merchant_id }],
          pageInfo,
        );
      },
    },
    merchantLogs: {
      async findAll() {
        throw new Error("merchantLogs.findAll should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ type: "merchantLogs", filters, pageInfo });
        return paged(
          [{ _id: "merchant_log_1", merchant_id: filters.merchant_id }],
          pageInfo,
        );
      },
    },
  };

  const merchantOrders = await handleMerchant(
    {
      action: "getMerchantOrderList",
      status: "pending_accept",
      page: 1,
      pageSize: 100,
    },
    env,
  );
  assert.equal(merchantOrders.success, true);
  assert.equal(merchantOrders.data.pageSize, 50);
  assert.equal(merchantOrders.data.orders.length, 1);
  assert.equal(merchantOrders.data.list, merchantOrders.data.orders);

  const otherMerchant = await handleMerchant(
    { action: "getMerchantOrderList" },
    { ...env, openid: "openid_other" },
  );
  assert.equal(otherMerchant.success, false);
  assert.equal(otherMerchant.errorCode, "MERCHANT_NOT_FOUND");

  const adminOrders = await handleMerchant(
    {
      action: "adminGetMerchantOrders",
      merchantId: "merchant_1",
      status: "serving",
      page: 2,
      pageSize: 5,
    },
    { ...env, openid: "openid_admin" },
  );
  assert.equal(adminOrders.success, true);
  assert.equal(adminOrders.data.orders.length, 1);

  const adminLogs = await handleMerchant(
    {
      action: "adminGetMerchantActionLogs",
      merchantId: "merchant_1",
      page: 1,
      pageSize: 10,
    },
    { ...env, openid: "openid_admin" },
  );
  assert.equal(adminLogs.success, true);
  assert.equal(adminLogs.data.logs.length, 1);
  assert.equal(adminLogs.data.list, adminLogs.data.logs);

  assert.deepEqual(calls, [
    {
      type: "orders",
      filters: {
        merchant_id: "merchant_1",
        provider_type: "merchant",
        status: "pending_accept",
      },
      pageInfo: { page: 1, pageSize: 50 },
    },
    {
      type: "orders",
      filters: {
        merchant_id: "merchant_1",
        provider_type: "merchant",
        status: "serving",
      },
      pageInfo: { page: 2, pageSize: 5 },
    },
    {
      type: "merchantLogs",
      filters: { merchant_id: "merchant_1" },
      pageInfo: { page: 1, pageSize: 10 },
    },
  ]);

  const denied = await handleMerchant(
    { action: "adminGetMerchantActionLogs" },
    env,
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");
});

test("review list actions use repository-side pagination and keep reviews alias", async () => {
  const { handleReview } = require("../cloudfunctions/review/handler");
  const calls = [];
  const env = {
    openid: "openid_worker",
    users: createUsers(),
    reviews: {
      async findAll() {
        throw new Error("reviews.findAll should not be used");
      },
      async findByWorkerId() {
        throw new Error("reviews.findByWorkerId should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ filters, pageInfo });
        return paged(
          [{ _id: "review_1", worker_id: filters.worker_id, status: filters.status }],
          pageInfo,
        );
      },
    },
  };

  const ownWorkerList = await handleReview(
    {
      action: "getWorkerReviewList",
      workerId: "openid_other_worker",
      page: 1,
      pageSize: 100,
    },
    env,
  );
  assert.equal(ownWorkerList.success, true);
  assert.equal(ownWorkerList.data.pageSize, 50);
  assert.equal(ownWorkerList.data.reviews.length, 1);
  assert.equal(ownWorkerList.data.list, ownWorkerList.data.reviews);

  const publicWorkerList = await handleReview(
    {
      action: "getWorkerReviews",
      workerId: "openid_public_worker",
      page: 2,
      pageSize: 5,
    },
    { ...env, openid: "" },
  );
  assert.equal(publicWorkerList.success, true);
  assert.equal(publicWorkerList.data.reviews.length, 1);

  const adminReviews = await handleReview(
    {
      action: "adminGetReviewList",
      status: "visible",
      ratingLevel: "bad",
      badOnly: true,
      page: 1,
      pageSize: 10,
    },
    { ...env, openid: "openid_admin" },
  );
  assert.equal(adminReviews.success, true);
  assert.equal(adminReviews.data.reviews.length, 1);

  assert.deepEqual(calls, [
    {
      filters: { worker_id: "openid_worker" },
      pageInfo: { page: 1, pageSize: 50 },
    },
    {
      filters: { worker_id: "openid_public_worker" },
      pageInfo: { page: 2, pageSize: 5 },
    },
    {
      filters: { status: "visible", rating_level: "bad", bad_only: true },
      pageInfo: { page: 1, pageSize: 10 },
    },
  ]);

  const denied = await handleReview(
    { action: "adminGetReviewList" },
    env,
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");
});

test("tip list actions use repository-side pagination and keep tips alias", async () => {
  const { handleTip } = require("../cloudfunctions/tip/handler");
  const calls = [];
  const env = {
    openid: "openid_user",
    users: createUsers(),
    tipLogs: {
      async findAll() {
        throw new Error("tipLogs.findAll should not be used");
      },
      async findByUserId() {
        throw new Error("tipLogs.findByUserId should not be used");
      },
      async findByWorkerId() {
        throw new Error("tipLogs.findByWorkerId should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ filters, pageInfo });
        return paged(
          [{ _id: "tip_1", user_id: filters.user_id, worker_id: filters.worker_id }],
          pageInfo,
        );
      },
    },
  };

  const userTips = await handleTip(
    {
      action: "getUserTipList",
      status: "mock_success",
      page: 1,
      pageSize: 100,
    },
    env,
  );
  assert.equal(userTips.success, true);
  assert.equal(userTips.data.pageSize, 50);
  assert.equal(userTips.data.tips.length, 1);
  assert.equal(userTips.data.list, userTips.data.tips);

  const workerTips = await handleTip(
    {
      action: "getWorkerTipList",
      status: "mock_success",
      page: 2,
      pageSize: 5,
    },
    { ...env, openid: "openid_worker" },
  );
  assert.equal(workerTips.success, true);
  assert.equal(workerTips.data.tips.length, 1);

  const adminTips = await handleTip(
    {
      action: "adminGetTipLogs",
      userId: "openid_user",
      workerId: "openid_worker",
      status: "mock_success",
      channel: "mock",
      page: 1,
      pageSize: 10,
    },
    { ...env, openid: "openid_admin" },
  );
  assert.equal(adminTips.success, true);
  assert.equal(adminTips.data.tips.length, 1);

  assert.deepEqual(calls, [
    {
      filters: { user_id: "openid_user", status: "mock_success" },
      pageInfo: { page: 1, pageSize: 50 },
    },
    {
      filters: { worker_id: "openid_worker", status: "mock_success" },
      pageInfo: { page: 2, pageSize: 5 },
    },
    {
      filters: {
        user_id: "openid_user",
        worker_id: "openid_worker",
        status: "mock_success",
        channel: "mock",
      },
      pageInfo: { page: 1, pageSize: 10 },
    },
  ]);

  const denied = await handleTip(
    { action: "adminGetTipLogs" },
    env,
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");
});
