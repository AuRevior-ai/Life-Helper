async function queryCollectionPage(collection, where, pageInfo) {
  const page = Number(pageInfo.page || 1);
  const pageSize = Number(pageInfo.pageSize || 20);
  const query =
    where && Object.keys(where).length > 0 ? collection.where(where) : collection;
  const countResult = await query.count();
  const result = await query
    .orderBy("created_at", "desc")
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();
  return {
    list: result.data || [],
    total: countResult.total || 0,
    page,
    pageSize,
  };
}

function createFinanceLogRepository(db) {
  const financeLogs = db.collection("finance_logs");

  return {
    async create(data) {
      const result = await financeLogs.add({ data });
      return {
        ...data,
        _id: result._id,
      };
    },

    async findAll() {
      const result = await financeLogs.orderBy("created_at", "desc").get();
      return result.data || [];
    },

    async queryPage(filters = {}, pageInfo = {}) {
      const where = {};
      if (filters.order_id) where.order_id = filters.order_id;
      if (filters.worker_id) where.worker_id = filters.worker_id;
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      return queryCollectionPage(financeLogs, where, pageInfo);
    },

    async findByOrderId(orderId) {
      const result = await financeLogs
        .where({ order_id: orderId })
        .orderBy("created_at", "desc")
        .get();
      return result.data || [];
    },
  };
}

function createWorkerEarningRepository(db) {
  const workerEarnings = db.collection("worker_earnings");

  return {
    async create(data) {
      const result = await workerEarnings.add({ data });
      return {
        ...data,
        _id: result._id,
      };
    },

    async findAll() {
      const result = await workerEarnings.orderBy("created_at", "desc").get();
      return result.data || [];
    },

    async queryPage(filters = {}, pageInfo = {}) {
      const where = {};
      if (filters.worker_id) where.worker_id = filters.worker_id;
      if (filters.status) where.status = filters.status;
      if (filters.provider_type) where.provider_type = filters.provider_type;
      if (filters.merchant_id) where.merchant_id = filters.merchant_id;
      return queryCollectionPage(workerEarnings, where, pageInfo);
    },

    async queryPageByWorkerId(workerId, filters = {}, pageInfo = {}) {
      return this.queryPage({ ...filters, worker_id: workerId }, pageInfo);
    },

    async findByWorkerId(workerId) {
      const result = await workerEarnings
        .where({ worker_id: workerId })
        .orderBy("created_at", "desc")
        .get();
      return result.data || [];
    },

    async findByOrderId(orderId) {
      const result = await workerEarnings
        .where({ order_id: orderId })
        .orderBy("created_at", "desc")
        .get();
      return result.data || [];
    },

    async findActiveByOrderId(orderId) {
      const result = await workerEarnings
        .where({ order_id: orderId })
        .orderBy("created_at", "desc")
        .get();
      const records = result.data || [];
      return records.find((item) => item.status !== "reversed") || null;
    },

    async updateById(id, data) {
      await workerEarnings.doc(id).update({ data });
      const result = await workerEarnings.doc(id).get();
      return result.data || null;
    },
  };
}

function createOrderRepository(db) {
  const orders = db.collection("orders");

  return {
    async findById(id) {
      try {
        const result = await orders.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },

    async updateById(id, data) {
      await orders.doc(id).update({ data });
      const result = await orders.doc(id).get();
      return result.data || null;
    },
  };
}

function createUserRepository(db) {
  const users = db.collection("users");

  return {
    async findByOpenid(openid) {
      const result = await users.where({ openid }).limit(1).get();
      return result.data && result.data[0] ? result.data[0] : null;
    },
  };
}

module.exports = {
  createFinanceLogRepository,
  createWorkerEarningRepository,
  createOrderRepository,
  createUserRepository,
};
