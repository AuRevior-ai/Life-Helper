const test = require("node:test");
const assert = require("node:assert/strict");

function fixedNow() {
  return new Date("2026-06-01T08:00:00.000Z");
}

function createMemoryOrders(initialOrders = []) {
  const records = initialOrders.map((order) => ({ ...order }));
  return {
    records,
    async findById(id) {
      const order = records.find((item) => item._id === id);
      return order ? { ...order } : null;
    },
    async acceptPendingOrder(id, workerId, data) {
      const order = records.find((item) => item._id === id);
      if (!order || order.status !== "pending_accept" || order.worker_id)
        return null;
      Object.assign(order, data, { worker_id: workerId });
      return { ...order };
    },
  };
}

function createMemoryWorkers() {
  return {
    async findByUserId(userId) {
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

test("worker accept returns after order update even when message and dispatch log writes hang", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const orders = createMemoryOrders([
    {
      _id: "order_1",
      user_id: "openid_user",
      worker_id: "",
      status: "pending_accept",
      pay_status: "paid",
    },
  ]);
  const never = () => new Promise(() => {});
  const startedAt = Date.now();

  const result = await handleOrder(
    { action: "acceptOrder", orderId: "order_1" },
    {
      openid: "openid_worker",
      workers: createMemoryWorkers(),
      orders,
      messages: { create: never },
      dispatchLogs: { create: never },
      sideEffectTimeoutMs: 10,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.order.worker_id, "openid_worker");
  assert.equal(result.data.order.status, "accepted");
  assert.equal(Date.now() - startedAt < 200, true);
});
