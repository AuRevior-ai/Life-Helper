const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function fixedNow() {
  return new Date("2026-05-30T09:30:00.000Z");
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

    async findByAuditStatus(status) {
      return records
        .filter((worker) => worker.audit_status === status)
        .map((worker) => ({ ...worker }));
    },

    async create(data) {
      const record = {
        ...data,
        _id: `worker_${records.length + 1}`,
      };
      records.push(record);
      return { ...record };
    },

    async updateById(id, data) {
      const record = records.find((worker) => worker._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
  };
}

function createMemoryUsers(initialUsers = []) {
  const records = initialUsers.map((user) => ({ ...user }));

  return {
    records,

    async findByOpenid(openid) {
      const user = records.find((item) => item.openid === openid);
      return user ? { ...user } : null;
    },

    async findById(id) {
      const user = records.find((item) => item._id === id);
      return user ? { ...user } : null;
    },

    async updateById(id, data) {
      const record = records.find((user) => user._id === id);
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

    async findByStatus(status) {
      return records
        .filter((order) => order.status === status)
        .map((order) => ({ ...order }));
    },

    async findById(id) {
      const order = records.find((item) => item._id === id);
      return order ? { ...order } : null;
    },

    async create(data) {
      const record = {
        ...data,
        _id: `order_${records.length + 1}`,
      };
      records.push(record);
      return { ...record };
    },

    async updateById(id, data) {
      const record = records.find((order) => order._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
  };
}

test("applyWorker creates a pending worker profile for current user", async () => {
  const { handleWorker } = require("../cloudfunctions/worker/handler");
  const workers = createMemoryWorkers();

  const result = await handleWorker(
    {
      action: "applyWorker",
      name: "王师傅",
      phone: "13800138000",
      service_category: "维修服务",
      service_area: "未来小区",
      intro: "十年维修经验",
    },
    {
      openid: "openid_worker",
      workers,
      users: createMemoryUsers(),
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.worker._id, "worker_1");
  assert.equal(result.data.worker.user_id, "openid_worker");
  assert.equal(result.data.worker.name, "王师傅");
  assert.equal(result.data.worker.phone, "13800138000");
  assert.equal(result.data.worker.service_category, "维修服务");
  assert.equal(result.data.worker.service_area, "未来小区");
  assert.equal(result.data.worker.audit_status, "pending");
  assert.equal(result.data.worker.status, "disabled");
  assert.equal(
    result.data.worker.created_at.toISOString(),
    "2026-05-30T09:30:00.000Z",
  );
});

test("getAuditStatus returns not applied and existing status", async () => {
  const { handleWorker } = require("../cloudfunctions/worker/handler");
  const workers = createMemoryWorkers([
    {
      _id: "worker_approved",
      user_id: "openid_worker",
      name: "王师傅",
      audit_status: "approved",
      status: "enabled",
    },
  ]);

  const existingResult = await handleWorker(
    { action: "getAuditStatus" },
    {
      openid: "openid_worker",
      workers,
      users: createMemoryUsers(),
      now: fixedNow,
    },
  );
  assert.equal(existingResult.success, true);
  assert.equal(existingResult.data.audit_status, "approved");
  assert.equal(existingResult.data.worker._id, "worker_approved");

  const missingResult = await handleWorker(
    { action: "getAuditStatus" },
    {
      openid: "openid_missing",
      workers,
      users: createMemoryUsers(),
      now: fixedNow,
    },
  );
  assert.equal(missingResult.success, true);
  assert.equal(missingResult.data.audit_status, "not_applied");
  assert.equal(missingResult.data.worker, null);
});

test("admin approves a pending worker and promotes user role", async () => {
  const { handleWorker } = require("../cloudfunctions/worker/handler");
  const workers = createMemoryWorkers([
    {
      _id: "worker_pending",
      user_id: "openid_worker",
      name: "王师傅",
      audit_status: "pending",
      status: "disabled",
    },
  ]);
  const users = createMemoryUsers([
    {
      _id: "admin_1",
      openid: "openid_admin",
      role: "admin",
      status: "normal",
    },
    {
      _id: "user_worker",
      openid: "openid_worker",
      role: "user",
      status: "normal",
    },
  ]);

  const result = await handleWorker(
    {
      action: "approveWorker",
      workerId: "worker_pending",
    },
    {
      openid: "openid_admin",
      workers,
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.worker.audit_status, "approved");
  assert.equal(result.data.worker.status, "enabled");
  assert.equal(result.data.worker.reviewer_id, "openid_admin");
  assert.equal(
    users.records.find((user) => user._id === "user_worker").role,
    "worker",
  );
});

test("admin rejects a pending worker with reason", async () => {
  const { handleWorker } = require("../cloudfunctions/worker/handler");
  const workers = createMemoryWorkers([
    {
      _id: "worker_pending",
      user_id: "openid_worker",
      name: "王师傅",
      audit_status: "pending",
      status: "disabled",
    },
  ]);
  const users = createMemoryUsers([
    {
      _id: "admin_1",
      openid: "openid_admin",
      role: "admin",
      status: "normal",
    },
  ]);

  const result = await handleWorker(
    {
      action: "rejectWorker",
      workerId: "worker_pending",
      reason: "服务区域暂未开放",
    },
    {
      openid: "openid_admin",
      workers,
      users,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.worker.audit_status, "rejected");
  assert.equal(result.data.worker.status, "disabled");
  assert.equal(result.data.worker.reject_reason, "服务区域暂未开放");
});

test("approved worker sees only pending accept orders in order hall", async () => {
  const { handleWorker } = require("../cloudfunctions/worker/handler");
  const workers = createMemoryWorkers([
    {
      _id: "worker_approved",
      user_id: "openid_worker",
      audit_status: "approved",
      status: "enabled",
      service_category: "家政保洁",
      service_area: "未来小区",
    },
  ]);
  const orders = createMemoryOrders([
    {
      _id: "order_pending",
      service_name: "日常保洁",
      status: "pending_accept",
      pay_status: "paid",
      worker_id: "",
      category_name: "家政保洁",
      community: "未来小区",
    },
    {
      _id: "order_accepted",
      service_name: "水电检修",
      status: "accepted",
      pay_status: "paid",
      worker_id: "openid_other",
    },
  ]);

  const result = await handleWorker(
    { action: "getOrderHallList" },
    {
      openid: "openid_worker",
      workers,
      orders,
      users: createMemoryUsers(),
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.deepEqual(
    result.data.orders.map((order) => order._id),
    ["order_pending"],
  );
});

test("approved worker accepts pending order and owns worker order list and detail", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const workers = createMemoryWorkers([
    {
      _id: "worker_approved",
      user_id: "openid_worker",
      audit_status: "approved",
      status: "enabled",
    },
  ]);
  const orders = createMemoryOrders([
    {
      _id: "order_pending",
      user_id: "openid_user",
      worker_id: "",
      service_name: "日常保洁",
      price: 9900,
      status: "pending_accept",
      pay_status: "paid",
      created_at: new Date("2026-05-30T09:00:00.000Z"),
    },
  ]);

  const acceptResult = await handleOrder(
    {
      action: "acceptOrder",
      orderId: "order_pending",
    },
    {
      openid: "openid_worker",
      workers,
      orders,
      now: fixedNow,
    },
  );

  assert.equal(acceptResult.success, true);
  assert.equal(acceptResult.data.order.status, "accepted");
  assert.equal(acceptResult.data.order.worker_id, "openid_worker");
  assert.equal(
    acceptResult.data.order.accepted_at.toISOString(),
    "2026-05-30T09:30:00.000Z",
  );

  const listResult = await handleOrder(
    { action: "getWorkerOrderList" },
    {
      openid: "openid_worker",
      workers,
      orders,
      now: fixedNow,
    },
  );
  assert.equal(listResult.success, true);
  assert.deepEqual(
    listResult.data.orders.map((order) => order._id),
    ["order_pending"],
  );

  const detailResult = await handleOrder(
    {
      action: "getOrderDetail",
      orderId: "order_pending",
    },
    {
      openid: "openid_worker",
      workers,
      orders,
      now: fixedNow,
    },
  );
  assert.equal(detailResult.success, true);
  assert.equal(detailResult.data.order._id, "order_pending");
});

test("worker and admin pages are wired to phase five services", () => {
  const workerApplyJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/worker/apply/apply.js"),
    "utf8",
  );
  const auditStatusJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/worker/audit-status/audit-status.js"),
    "utf8",
  );
  const adminAuditJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/admin/worker-audit/worker-audit.js"),
    "utf8",
  );
  const orderHallJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/worker/order-hall/order-hall.js"),
    "utf8",
  );
  const workerOrderListJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/worker/order-list/order-list.js"),
    "utf8",
  );
  const workerOrderDetailJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/worker/order-detail/order-detail.js"),
    "utf8",
  );
  const workerApplyWxml = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/worker/apply/apply.wxml"),
    "utf8",
  );
  const orderHallWxml = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/worker/order-hall/order-hall.wxml"),
    "utf8",
  );

  assert.match(workerApplyJs, /applyWorker/);
  assert.match(workerApplyWxml, /服务分类/);
  assert.match(auditStatusJs, /getAuditStatus/);
  assert.match(adminAuditJs, /getWorkerApplyList/);
  assert.match(adminAuditJs, /approveWorker/);
  assert.match(adminAuditJs, /rejectWorker/);
  assert.match(orderHallJs, /getOrderHallList/);
  assert.match(orderHallJs, /acceptOrder/);
  assert.match(orderHallWxml, /接单/);
  assert.match(workerOrderListJs, /getWorkerOrderList/);
  assert.match(workerOrderDetailJs, /getOrderDetail/);
});
