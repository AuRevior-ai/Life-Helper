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
  };
}

module.exports = {
  createDispatchLogRepository,
};
