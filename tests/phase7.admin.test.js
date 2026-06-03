const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function fixedNow() {
  return new Date("2026-05-30T15:30:00.000Z");
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

    async findAll() {
      return records.map((user) => ({ ...user }));
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

    async findAll() {
      return records.map((order) => ({ ...order }));
    },

    async findById(id) {
      const order = records.find((item) => item._id === id);
      return order ? { ...order } : null;
    },

    async updateById(id, data) {
      const record = records.find((order) => order._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
  };
}

function createMemoryWorkers(initialWorkers = []) {
  const records = initialWorkers.map((worker) => ({ ...worker }));

  return {
    records,

    async findAll() {
      return records.map((worker) => ({ ...worker }));
    },

    async findByAuditStatus(status) {
      return records
        .filter((worker) => worker.audit_status === status)
        .map((worker) => ({ ...worker }));
    },
  };
}

function createMemoryCollection(initialRecords = []) {
  const records = initialRecords.map((record) => ({ ...record }));

  return {
    records,

    async findAll() {
      return records.map((record) => ({ ...record }));
    },

    async findById(id) {
      const record = records.find((item) => item._id === id);
      return record ? { ...record } : null;
    },

    async create(data) {
      const record = {
        ...data,
        _id: data._id || `record_${records.length + 1}`,
      };
      records.push(record);
      return { ...record };
    },

    async upsert(data) {
      const existing = records.find((record) => record._id === data._id);
      if (existing) {
        Object.assign(existing, data);
        return { ...existing };
      }
      records.push({ ...data });
      return { ...data };
    },

    async updateById(id, data) {
      const record = records.find((item) => item._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },

    async deleteById(id) {
      const index = records.findIndex((item) => item._id === id);
      if (index < 0) return false;
      records.splice(index, 1);
      return true;
    },
  };
}

function createMemoryLogs() {
  const records = [];

  return {
    records,

    async create(data) {
      const record = {
        ...data,
        _id: `log_${records.length + 1}`,
      };
      records.push(record);
      return { ...record };
    },
  };
}

function createAdminEnv() {
  return {
    openid: "openid_admin",
    users: createMemoryUsers([
      {
        _id: "admin_1",
        openid: "openid_admin",
        role: "admin",
        status: "normal",
      },
      { _id: "user_1", openid: "openid_user", role: "user", status: "normal" },
      {
        _id: "worker_user",
        openid: "openid_worker",
        role: "worker",
        status: "normal",
      },
    ]),
    orders: createMemoryOrders([
      {
        _id: "order_1",
        status: "completed",
        price: 9900,
        service_name: "日常保洁",
      },
      {
        _id: "order_2",
        status: "pending_review",
        price: 6900,
        service_name: "水电检修",
      },
    ]),
    workers: createMemoryWorkers([
      { _id: "worker_1", audit_status: "pending" },
      { _id: "worker_2", audit_status: "approved" },
    ]),
    categories: createMemoryCollection([
      { _id: "cat_custom", name: "自定义分类", status: "enabled", sort: 1 },
    ]),
    services: createMemoryCollection([
      { _id: "svc_custom", name: "自定义服务", status: "on", price: 1000 },
    ]),
    adminOperationLogs: createMemoryLogs(),
    now: fixedNow,
  };
}

test("admin getDashboard returns MVP management stats", async () => {
  const { handleAdmin } = require("../cloudfunctions/admin/handler");
  const result = await handleAdmin(
    { action: "getDashboard" },
    createAdminEnv(),
  );

  assert.equal(result.success, true);
  assert.equal(result.data.stats.user_count, 3);
  assert.equal(result.data.stats.order_count, 2);
  assert.equal(result.data.stats.pending_worker_count, 1);
  assert.equal(result.data.stats.completed_order_amount, 9900);
});

test("admin APIs reject non-admin users", async () => {
  const { handleAdmin } = require("../cloudfunctions/admin/handler");
  const env = createAdminEnv();
  env.openid = "openid_user";

  const result = await handleAdmin({ action: "getDashboard" }, env);

  assert.equal(result.success, false);
  assert.equal(result.errorCode, "PERMISSION_DENIED");
});

test("admin can list and disable users", async () => {
  const { handleAdmin } = require("../cloudfunctions/admin/handler");
  const env = createAdminEnv();

  const listResult = await handleAdmin({ action: "getAllUsers" }, env);
  assert.equal(listResult.success, true);
  assert.deepEqual(
    listResult.data.users.map((user) => user._id),
    ["admin_1", "user_1", "worker_user"],
  );

  const disableResult = await handleAdmin(
    {
      action: "disableUser",
      userId: "user_1",
    },
    env,
  );
  assert.equal(disableResult.success, true);
  assert.equal(disableResult.data.user.status, "disabled");
  assert.equal(
    env.users.records.find((user) => user._id === "user_1").status,
    "disabled",
  );
});

test("admin can list orders and manually update order status", async () => {
  const { handleAdmin } = require("../cloudfunctions/admin/handler");
  const env = createAdminEnv();

  const listResult = await handleAdmin({ action: "getAllOrders" }, env);
  assert.equal(listResult.success, true);
  assert.equal(listResult.data.orders.length, 2);

  const updateResult = await handleAdmin(
    {
      action: "adminUpdateOrderStatus",
      orderId: "order_2",
      status: "completed",
    },
    env,
  );

  assert.equal(updateResult.success, true);
  assert.equal(updateResult.data.order.status, "completed");
  assert.equal(
    env.orders.records
      .find((order) => order._id === "order_2")
      .updated_at.toISOString(),
    "2026-05-30T15:30:00.000Z",
  );
});

test("service seed migration upserts seed categories and services into repositories", async () => {
  const { handleService } = require("../cloudfunctions/service/handler");
  const env = {
    openid: "openid_admin",
    users: createMemoryUsers([
      {
        _id: "admin_1",
        openid: "openid_admin",
        role: "admin",
        status: "normal",
      },
    ]),
    categories: createMemoryCollection(),
    services: createMemoryCollection(),
    now: fixedNow,
  };

  const result = await handleService({ action: "seedServiceData" }, env);

  assert.equal(result.success, true);
  assert.equal(result.data.category_count, 3);
  assert.equal(result.data.service_count, 7);
  assert.equal(
    env.categories.records.some(
      (category) => category._id === "cat_housekeeping",
    ),
    true,
  );
  assert.equal(
    env.services.records.some(
      (service) => service._id === "svc_home_daily_clean",
    ),
    true,
  );
});

test("service browsing reads repository data before seed fallback and admin updates status", async () => {
  const { handleService } = require("../cloudfunctions/service/handler");
  const env = {
    openid: "openid_admin",
    users: createMemoryUsers([
      {
        _id: "admin_1",
        openid: "openid_admin",
        role: "admin",
        status: "normal",
      },
    ]),
    categories: createMemoryCollection([
      { _id: "cat_db", name: "数据库分类", status: "enabled", sort: 1 },
    ]),
    services: createMemoryCollection([
      {
        _id: "svc_db",
        category_id: "cat_db",
        category_name: "数据库分类",
        name: "数据库服务",
        status: "on",
        price: 8800,
        sort: 1,
      },
    ]),
    now: fixedNow,
  };

  const listResult = await handleService({ action: "getServiceList" }, env);
  assert.equal(listResult.success, true);
  assert.deepEqual(
    listResult.data.services.map((service) => service.name),
    ["数据库服务"],
  );

  const statusResult = await handleService(
    {
      action: "updateServiceStatus",
      serviceId: "svc_db",
      status: "off",
    },
    env,
  );
  assert.equal(statusResult.success, true);
  assert.equal(statusResult.data.service.status, "off");
});

test("admin pages are wired to dashboard, orders, users, and service management APIs", () => {
  const dashboardJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/admin/dashboard/dashboard.js"),
    "utf8",
  );
  const orderListJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/admin/order-list/order-list.js"),
    "utf8",
  );
  const orderDetailJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/admin/order-detail/order-detail.js"),
    "utf8",
  );
  const userListJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/admin/user-list/user-list.js"),
    "utf8",
  );
  const serviceListJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/admin/service-list/service-list.js"),
    "utf8",
  );
  const categoryListJs = fs.readFileSync(
    path.join(
      rootDir,
      "miniprogram/pages/admin/category-list/category-list.js",
    ),
    "utf8",
  );
  const dashboardWxml = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/admin/dashboard/dashboard.wxml"),
    "utf8",
  );
  const serviceListWxml = fs.readFileSync(
    path.join(
      rootDir,
      "miniprogram/pages/admin/service-list/service-list.wxml",
    ),
    "utf8",
  );

  assert.match(dashboardJs, /getDashboard/);
  assert.match(dashboardWxml, /完成订单金额/);
  assert.match(orderListJs, /getAllOrders/);
  assert.match(orderDetailJs, /adminUpdateOrderStatus/);
  assert.match(userListJs, /getAllUsers/);
  assert.match(userListJs, /disableUser/);
  assert.match(serviceListJs, /seedServiceData/);
  assert.match(serviceListJs, /updateServiceStatus/);
  assert.match(serviceListWxml, /同步种子服务/);
  assert.match(categoryListJs, /getCategoryList/);
});
