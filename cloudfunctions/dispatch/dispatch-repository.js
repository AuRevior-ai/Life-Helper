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

function createDispatchLogRepository(db) {
  const logs = db.collection("dispatch_logs");

  return {
    async create(data) {
      const result = await logs.add({ data });
      return { ...data, _id: result._id };
    },

    async findByOrderId(orderId) {
      const result = await logs
        .where({ order_id: orderId })
        .orderBy("created_at", "desc")
        .get();
      return result.data || [];
    },

    async findAll() {
      const result = await logs.orderBy("created_at", "desc").get();
      return result.data || [];
    },

    async queryPage(filters = {}, pageInfo = {}) {
      const where = {};
      if (filters.order_id) where.order_id = filters.order_id;
      return queryCollectionPage(logs, where, pageInfo);
    },
  };
}

module.exports = {
  createDispatchLogRepository,
};
