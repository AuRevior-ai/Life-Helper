const assert = require("node:assert/strict");
const test = require("node:test");

function createUsers() {
  return {
    async findByOpenid(openid) {
      if (openid === "openid_admin") {
        return { _id: "admin_1", openid, role: "admin", status: "normal" };
      }
      if (openid === "openid_disabled") {
        return { _id: "user_disabled", openid, role: "user", status: "disabled" };
      }
      if (!openid) return null;
      return { _id: openid, openid, role: "user", status: "normal" };
    },
  };
}

function createApprovedWorkers() {
  return {
    async findByUserId(userId) {
      if (userId !== "openid_worker") return null;
      return {
        _id: "worker_1",
        user_id: userId,
        audit_status: "approved",
        status: "enabled",
        online_status: "available",
      };
    },
  };
}

function paged(list, pageInfo, total = list.length) {
  return {
    list,
    total,
    page: pageInfo.page,
    pageSize: pageInfo.pageSize,
  };
}

test("order.getUserOrderList uses repository-side pagination and keeps orders alias", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const calls = [];
  const env = {
    openid: "openid_user",
    orders: {
      async findAll() {
        throw new Error("orders.findAll should not be used");
      },
      async findByUserId() {
        throw new Error("orders.findByUserId should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ filters, pageInfo });
        return paged(
          [
            {
              _id: "order_own_1",
              user_id: filters.user_id,
              status: filters.status,
            },
          ],
          pageInfo,
          51,
        );
      },
    },
  };

  const result = await handleOrder(
    {
      action: "getUserOrderList",
      userId: "openid_other",
      status: "completed",
      page: 1,
      pageSize: 100,
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.page, 1);
  assert.equal(result.data.pageSize, 50);
  assert.equal(result.data.total, 51);
  assert.equal(result.data.hasMore, true);
  assert.equal(result.data.orders.length, 1);
  assert.equal(result.data.list, result.data.orders);
  assert.equal(result.data.orders[0].user_id, "openid_user");
  assert.deepEqual(calls, [
    {
      filters: { user_id: "openid_user", status: "completed" },
      pageInfo: { page: 1, pageSize: 50 },
    },
  ]);
});

test("order.getWorkerOrderList validates worker identity and uses repository-side pagination", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const calls = [];
  const env = {
    openid: "openid_worker",
    workers: createApprovedWorkers(),
    orders: {
      async findAll() {
        throw new Error("orders.findAll should not be used");
      },
      async findByWorkerId() {
        throw new Error("orders.findByWorkerId should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ filters, pageInfo });
        return paged(
          [
            {
              _id: "order_worker_1",
              worker_id: filters.worker_id,
              status: filters.status,
            },
          ],
          pageInfo,
        );
      },
    },
  };

  const result = await handleOrder(
    {
      action: "getWorkerOrderList",
      workerId: "openid_other_worker",
      status: "serving",
      page: 2,
      pageSize: 10,
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.page, 2);
  assert.equal(result.data.pageSize, 10);
  assert.equal(result.data.total, 1);
  assert.equal(result.data.hasMore, false);
  assert.equal(result.data.orders.length, 1);
  assert.equal(result.data.list, result.data.orders);
  assert.equal(result.data.orders[0].worker_id, "openid_worker");
  assert.deepEqual(calls, [
    {
      filters: { worker_id: "openid_worker", status: "serving" },
      pageInfo: { page: 2, pageSize: 10 },
    },
  ]);

  const denied = await handleOrder(
    { action: "getWorkerOrderList" },
    {
      ...env,
      openid: "openid_user",
    },
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "WORKER_NOT_APPROVED");
});

test("qualification.adminListQualifications uses queryPage and rejects non-admin callers", async () => {
  const { handleQualification } = require("../cloudfunctions/qualification/handler");
  const calls = [];
  const env = {
    openid: "openid_admin",
    users: createUsers(),
    qualifications: {
      async findAll() {
        throw new Error("qualifications.findAll should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ filters, pageInfo });
        return paged(
          [
            {
              _id: "qualification_1",
              qualification_status: filters.qualification_status,
            },
          ],
          pageInfo,
          2,
        );
      },
    },
  };

  const result = await handleQualification(
    {
      action: "adminListQualifications",
      status: "pending_review",
      page: 1,
      pageSize: 100,
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.page, 1);
  assert.equal(result.data.pageSize, 50);
  assert.equal(result.data.total, 2);
  assert.equal(result.data.hasMore, false);
  assert.equal(result.data.qualifications.length, 1);
  assert.equal(result.data.list, result.data.qualifications);
  assert.deepEqual(calls, [
    {
      filters: { qualification_status: "pending_review" },
      pageInfo: { page: 1, pageSize: 50 },
    },
  ]);

  const denied = await handleQualification(
    { action: "adminListQualifications" },
    { ...env, openid: "openid_user" },
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");
});

test("qualification.adminListDeposits uses queryPage and keeps empty list compatibility", async () => {
  const { handleQualification } = require("../cloudfunctions/qualification/handler");
  const calls = [];
  const env = {
    openid: "openid_admin",
    users: createUsers(),
    deposits: {
      async findAll() {
        throw new Error("deposits.findAll should not be used");
      },
      async queryPage(filters, pageInfo) {
        calls.push({ filters, pageInfo });
        return paged([], pageInfo, 0);
      },
    },
  };

  const result = await handleQualification(
    {
      action: "adminListDeposits",
      status: "mock_paid",
      page: 0,
      pageSize: 5,
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.page, 1);
  assert.equal(result.data.pageSize, 5);
  assert.equal(result.data.total, 0);
  assert.equal(result.data.hasMore, false);
  assert.deepEqual(result.data.deposits, []);
  assert.equal(result.data.list, result.data.deposits);
  assert.deepEqual(calls, [
    {
      filters: { deposit_status: "mock_paid" },
      pageInfo: { page: 1, pageSize: 5 },
    },
  ]);

  const denied = await handleQualification(
    { action: "adminListDeposits" },
    { ...env, openid: "openid_user" },
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");
});
