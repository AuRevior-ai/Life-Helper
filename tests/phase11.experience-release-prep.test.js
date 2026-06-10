const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function fixedNow() {
  return new Date("2026-05-30T08:00:00.000Z");
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function getEffectiveMessageRole(message = {}) {
  if (message.type === "worker_review_reply") return "user";
  return message.role || "";
}

function messageMatchesFilters(message = {}, filters = {}) {
  if (filters.user_id && message.user_id !== filters.user_id) return false;
  if (filters.role) {
    const role = getEffectiveMessageRole(message);
    if (role && role !== filters.role) return false;
  }
  if (filters.is_read !== undefined && message.is_read !== filters.is_read) {
    return false;
  }
  return true;
}

function createMemoryUsers(initialUsers = []) {
  const records = initialUsers.map((user) => ({ ...user }));
  return {
    records,
    async findByOpenid(openid) {
      const user = records.find((item) => item.openid === openid);
      return user ? { ...user } : null;
    },
  };
}

function createMemoryWorkers(initialWorkers = []) {
  const records = initialWorkers.map((worker) => ({ ...worker }));
  return {
    records,
    async findByUserId(userId) {
      const worker = records.find((item) => item.user_id === userId);
      return worker ? { ...worker } : null;
    },
    async findById(id) {
      const worker = records.find((item) => item._id === id);
      return worker ? { ...worker } : null;
    },
    async updateById(id, data) {
      const record = records.find((worker) => worker._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
  };
}

function createMemoryOrders(initialOrders = []) {
  const records = initialOrders.map((order) => ({ ...order }));
  return {
    records,
    async findByUserId(userId) {
      return records
        .filter((order) => order.user_id === userId)
        .map((order) => ({ ...order }));
    },
    async findByWorkerId(workerId) {
      return records
        .filter((order) => order.worker_id === workerId)
        .map((order) => ({ ...order }));
    },
    async findAll() {
      return records.map((order) => ({ ...order }));
    },
    async queryPage(filters = {}, pageInfo = {}) {
      const page = Number(pageInfo.page || 1);
      const pageSize = Math.min(Number(pageInfo.pageSize || 20), 50);
      const start = (page - 1) * pageSize;
      const list = records.filter((order) => {
        if (filters.status && order.status !== filters.status) return false;
        if (filters.category_id && order.category_id !== filters.category_id)
          return false;
        return true;
      });
      return {
        list: list.slice(start, start + pageSize).map((order) => ({ ...order })),
        total: list.length,
        page,
        pageSize,
      };
    },
    async findById(id) {
      const order = records.find((item) => item._id === id);
      return order ? { ...order } : null;
    },
    async create(data) {
      const record = { ...data, _id: `order_${records.length + 1}` };
      records.push(record);
      return { ...record };
    },
    async updateById(id, data) {
      const record = records.find((order) => order._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
    async acceptPendingOrder(id, workerId, data) {
      const record = records.find((order) => order._id === id);
      if (!record || record.status !== "pending_accept" || record.worker_id)
        return null;
      Object.assign(record, data, { worker_id: workerId });
      return { ...record };
    },
    async completePendingReviewOrder(id, data) {
      const record = records.find((order) => order._id === id);
      if (!record || record.status !== "pending_review") return null;
      Object.assign(record, data);
      return { ...record };
    },
  };
}

function createMemoryMessages(initialMessages = []) {
  const records = initialMessages.map((message) => ({ ...message }));
  return {
    records,
    async create(data) {
      const record = { ...data, _id: `message_${records.length + 1}` };
      records.push(record);
      return { ...record };
    },
    async findByUserId(userId) {
      return records
        .filter((message) => message.user_id === userId)
        .map((message) => ({ ...message }));
    },
    async queryPage(filters = {}, pageInfo = {}) {
      const page = Number(pageInfo.page || 1);
      const pageSize = Number(pageInfo.pageSize || 20);
      const list = records.filter((message) =>
        messageMatchesFilters(message, filters),
      );
      return {
        list: list
          .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
          .map((message) => ({ ...message })),
        total: list.length,
        page,
        pageSize,
      };
    },
    async countUnread(filters = {}) {
      return records.filter((message) =>
        messageMatchesFilters(message, { ...filters, is_read: false }),
      ).length;
    },
    async findById(id) {
      const message = records.find((item) => item._id === id);
      return message ? { ...message } : null;
    },
    async updateById(id, data) {
      const record = records.find((message) => message._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
    async markAllRead(userId, data) {
      records.forEach((message) => {
        if (message.user_id === userId) Object.assign(message, data);
      });
      return true;
    },
  };
}

function createMemoryReviews(initialReviews = []) {
  const records = initialReviews.map((review) => ({ ...review }));
  return {
    records,
    async findByOrderId(orderId) {
      const review = records.find((item) => item.order_id === orderId);
      return review ? { ...review } : null;
    },
    async findByWorkerId(workerId) {
      return records
        .filter((review) => review.worker_id === workerId)
        .map((review) => ({ ...review }));
    },
    async create(data) {
      const record = { ...data, _id: data.order_id };
      records.push(record);
      return { ...record };
    },
    async deleteById(id) {
      const index = records.findIndex((review) => review._id === id);
      if (index < 0) return false;
      records.splice(index, 1);
      return true;
    },
  };
}

test("createOrder requires future appointment date and slot, then stores normalized fields", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const baseEnv = {
    openid: "openid_user",
    orders: createMemoryOrders(),
    addresses: {
      async findById() {
        return {
          _id: "addr_1",
          user_id: "openid_user",
          contact_name: "李雷",
          phone: "13800138000",
          city: "杭州",
          community: "未来小区",
          detail_address: "1 幢 101",
        };
      },
    },
    services: {
      async findById() {
        return {
          _id: "svc_1",
          name: "日常保洁",
          category_id: "cat_housekeeping",
          category_name: "家政保洁",
          price: 9900,
          duration: "2小时",
        };
      },
    },
    now: fixedNow,
  };

  const missingResult = await handleOrder(
    {
      action: "createOrder",
      serviceId: "svc_1",
      addressId: "addr_1",
      appointmentDate: "",
      appointmentSlot: "",
    },
    baseEnv,
  );
  assert.equal(missingResult.success, false);
  assert.equal(missingResult.errorCode, "APPOINTMENT_TIME_MISSING");

  const pastResult = await handleOrder(
    {
      action: "createOrder",
      serviceId: "svc_1",
      addressId: "addr_1",
      appointmentDate: "2026-05-29",
      appointmentSlot: "09:00-11:00",
    },
    baseEnv,
  );
  assert.equal(pastResult.success, false);
  assert.equal(pastResult.errorCode, "APPOINTMENT_TIME_INVALID");

  const result = await handleOrder(
    {
      action: "createOrder",
      serviceId: "svc_1",
      addressId: "addr_1",
      appointmentDate: "2026-05-31",
      appointmentSlot: "09:00-11:00",
    },
    baseEnv,
  );
  assert.equal(result.success, true);
  assert.equal(result.data.order.appointment_date, "2026-05-31");
  assert.equal(result.data.order.appointment_slot, "09:00-11:00");
  assert.equal(result.data.order.appointment_time, "2026-05-31 09:00-11:00");
});

test("finishService saves required finish remark and up to three finish images", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const orders = createMemoryOrders([
    {
      _id: "order_1",
      user_id: "openid_user",
      worker_id: "openid_worker",
      status: "serving",
      pay_status: "paid",
    },
  ]);
  const env = {
    openid: "openid_worker",
    workers: createMemoryWorkers([
      { user_id: "openid_worker", audit_status: "approved" },
    ]),
    orders,
    messages: createMemoryMessages(),
    now: fixedNow,
  };

  const missingRemark = await handleOrder(
    { action: "finishService", orderId: "order_1" },
    env,
  );
  assert.equal(missingRemark.success, false);
  assert.equal(missingRemark.errorCode, "FINISH_REMARK_MISSING");

  const tooManyImages = await handleOrder(
    {
      action: "finishService",
      orderId: "order_1",
      finishRemark: "已完成深度清洁",
      finishImages: ["a", "b", "c", "d"],
    },
    env,
  );
  assert.equal(tooManyImages.success, false);
  assert.equal(tooManyImages.errorCode, "FINISH_IMAGES_INVALID");

  const result = await handleOrder(
    {
      action: "finishService",
      orderId: "order_1",
      finishRemark: "已完成深度清洁",
      finishImages: ["cloud://finish-1", "cloud://finish-2"],
    },
    env,
  );
  assert.equal(result.success, true);
  assert.equal(result.data.order.status, "pending_review");
  assert.equal(result.data.order.finish_remark, "已完成深度清洁");
  assert.deepEqual(result.data.order.finish_images, [
    "cloud://finish-1",
    "cloud://finish-2",
  ]);
});

test("order and review status changes create in-app messages without breaking flow", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const { handleReview } = require("../cloudfunctions/review/handler");
  const messages = createMemoryMessages();
  const orders = createMemoryOrders([
    {
      _id: "order_1",
      user_id: "openid_user",
      worker_id: "",
      status: "pending_pay",
      pay_status: "unpaid",
    },
    {
      _id: "order_2",
      user_id: "openid_user",
      worker_id: "openid_worker",
      status: "pending_review",
      pay_status: "paid",
      service_id: "svc_1",
      service_name: "日常保洁",
    },
  ]);

  await handleOrder(
    { action: "mockPayOrder", orderId: "order_1" },
    { openid: "openid_user", orders, messages, now: fixedNow },
  );
  await handleOrder(
    { action: "acceptOrder", orderId: "order_1" },
    {
      openid: "openid_worker",
      workers: createMemoryWorkers([
        { user_id: "openid_worker", audit_status: "approved" },
      ]),
      orders,
      messages,
      now: fixedNow,
    },
  );
  await handleReview(
    { action: "createReview", orderId: "order_2", rating: 5, content: "很好" },
    {
      openid: "openid_user",
      orders,
      reviews: createMemoryReviews(),
      messages,
      now: fixedNow,
    },
  );

  assert.deepEqual(
    messages.records.map((message) => message.type),
    ["order_created", "order_accepted", "review_created"],
  );
  assert.equal(messages.records[0].user_id, "openid_user");
  assert.equal(messages.records[2].user_id, "openid_worker");
});

test("worker audit approval and rejection create in-app messages for worker", async () => {
  const { handleWorker } = require("../cloudfunctions/worker/handler");
  const messages = createMemoryMessages();
  const users = {
    async findByOpenid(openid) {
      if (openid === "openid_admin")
        return { _id: "admin_1", openid, role: "admin", status: "normal" };
      if (openid === "openid_worker")
        return { _id: "user_worker", openid, role: "user", status: "normal" };
      return null;
    },
    async updateById() {
      return {};
    },
  };

  await handleWorker(
    { action: "approveWorker", workerId: "worker_1" },
    {
      openid: "openid_admin",
      users,
      workers: createMemoryWorkers([
        { _id: "worker_1", user_id: "openid_worker", audit_status: "pending" },
      ]),
      messages,
      now: fixedNow,
    },
  );
  await handleWorker(
    { action: "rejectWorker", workerId: "worker_2", reason: "资料不完整" },
    {
      openid: "openid_admin",
      users,
      workers: createMemoryWorkers([
        { _id: "worker_2", user_id: "openid_worker", audit_status: "pending" },
      ]),
      messages,
      now: fixedNow,
    },
  );

  assert.deepEqual(
    messages.records.map((message) => message.type),
    ["worker_approved", "worker_rejected"],
  );
  assert.equal(
    messages.records.every((message) => message.user_id === "openid_worker"),
    true,
  );
});

test("message center lists only current user messages and marks messages read", async () => {
  const { handleMessage } = require("../cloudfunctions/message/handler");
  const messages = createMemoryMessages([
    {
      _id: "message_1",
      user_id: "openid_user",
      title: "订单消息",
      is_read: false,
      created_at: new Date("2026-05-30T08:00:00.000Z"),
    },
    {
      _id: "message_2",
      user_id: "openid_other",
      title: "其他消息",
      is_read: false,
      created_at: new Date("2026-05-30T08:00:00.000Z"),
    },
  ]);

  const listResult = await handleMessage(
    { action: "getMessageList" },
    { openid: "openid_user", messages, now: fixedNow },
  );
  assert.equal(listResult.success, true);
  assert.deepEqual(
    listResult.data.list.map((message) => message._id),
    ["message_1"],
  );
  assert.equal(listResult.data.unread_count, 1);

  const readResult = await handleMessage(
    { action: "markMessageRead", messageId: "message_1" },
    { openid: "openid_user", messages, now: fixedNow },
  );
  assert.equal(readResult.success, true);
  assert.equal(messages.records[0].is_read, true);
});

test("worker detail accepts order worker_id and returns stats and reviews", async () => {
  const { handleWorker } = require("../cloudfunctions/worker/handler");
  const result = await handleWorker(
    { action: "getWorkerDetail", workerId: "openid_worker" },
    {
      openid: "openid_user",
      workers: createMemoryWorkers([
        {
          _id: "worker_1",
          user_id: "openid_worker",
          name: "王师傅",
          audit_status: "approved",
        },
      ]),
      orders: createMemoryOrders([
        { _id: "order_1", worker_id: "openid_worker", status: "completed" },
        { _id: "order_2", worker_id: "openid_worker", status: "completed" },
        { _id: "order_3", worker_id: "openid_worker", status: "serving" },
      ]),
      reviews: createMemoryReviews([
        {
          _id: "review_1",
          worker_id: "openid_worker",
          rating: 5,
          content: "很好",
        },
        {
          _id: "review_2",
          worker_id: "openid_worker",
          rating: 3,
          content: "准时",
        },
      ]),
      users: createMemoryUsers(),
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.worker.name, "王师傅");
  assert.equal(result.data.completed_count, 2);
  assert.equal(result.data.average_rating, 4);
  assert.equal(result.data.reviews.length, 2);
});

test("order list actions paginate and preserve user worker admin permissions", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const { handleAdmin } = require("../cloudfunctions/admin/handler");
  const orders = createMemoryOrders([
    {
      _id: "order_1",
      user_id: "openid_user",
      worker_id: "openid_worker",
      status: "completed",
      category_id: "cat_housekeeping",
      service_name: "日常保洁",
    },
    {
      _id: "order_2",
      user_id: "openid_user",
      worker_id: "openid_worker",
      status: "serving",
      category_id: "cat_repair",
      service_name: "水电检修",
    },
    {
      _id: "order_3",
      user_id: "openid_other",
      worker_id: "openid_other_worker",
      status: "completed",
      category_id: "cat_housekeeping",
      service_name: "玻璃清洁",
    },
  ]);

  const userResult = await handleOrder(
    { action: "getUserOrderList", status: "completed", page: 1, pageSize: 1 },
    { openid: "openid_user", orders, now: fixedNow },
  );
  assert.equal(userResult.success, true);
  assert.deepEqual(
    userResult.data.list.map((order) => order._id),
    ["order_1"],
  );
  assert.equal(userResult.data.total, 1);
  assert.equal(userResult.data.hasMore, false);

  const workerResult = await handleOrder(
    { action: "getWorkerOrderList", page: 1, pageSize: 5 },
    {
      openid: "openid_worker",
      workers: createMemoryWorkers([
        { user_id: "openid_worker", audit_status: "approved" },
      ]),
      orders,
      now: fixedNow,
    },
  );
  assert.deepEqual(
    workerResult.data.list.map((order) => order._id),
    ["order_1", "order_2"],
  );

  const adminResult = await handleAdmin(
    {
      action: "getAllOrders",
      category_id: "cat_housekeeping",
      page: 1,
      pageSize: 10,
    },
    {
      openid: "openid_admin",
      users: createMemoryUsers([
        {
          _id: "admin_1",
          openid: "openid_admin",
          role: "admin",
          status: "normal",
        },
      ]),
      orders,
      workers: {
        async findByAuditStatus() {
          return [];
        },
      },
      now: fixedNow,
    },
  );
  assert.deepEqual(
    adminResult.data.list.map((order) => order._id),
    ["order_1", "order_3"],
  );
});

test("phase eleven pages and services are wired", () => {
  const appJson = read("miniprogram/app.json");
  const constants = read("miniprogram/config/constants.js");
  const status = read("miniprogram/config/status.js");
  const orderSubmit = read("miniprogram/pages/order-submit/order-submit.wxml");
  const workerDetail = read(
    "miniprogram/pages/worker/order-detail/order-detail.wxml",
  );
  const userOrderDetail = read(
    "miniprogram/pages/order-detail/order-detail.js",
  );
  const messageService = read("miniprogram/services/message.service.js");
  const workerService = read("miniprogram/services/worker.service.js");

  assert.match(appJson, /pages\/message-list\/message-list/);
  assert.match(appJson, /pages\/worker-detail\/worker-detail/);
  assert.match(constants, /APPOINTMENT_TIME_SLOTS/);
  assert.match(constants, /MESSAGE/);
  assert.match(status, /MESSAGE_TYPE/);
  assert.match(orderSubmit, /picker/);
  assert.match(workerDetail, /finishRemark/);
  assert.match(userOrderDetail, /goWorkerDetail/);
  assert.match(messageService, /getMessageList/);
  assert.match(messageService, /markMessageRead/);
  assert.match(workerService, /getWorkerDetail/);
});
