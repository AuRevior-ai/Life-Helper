function createOrderReadRepository(db) {
  const orders = db.collection("orders");

  return {
    async findByStatus(status) {
      const result = await orders
        .where({ status })
        .orderBy("created_at", "desc")
        .get();
      return result.data || [];
    },

    async findByWorkerId(workerId) {
      const result = await orders
        .where({ worker_id: workerId })
        .orderBy("created_at", "desc")
        .get();
      return result.data || [];
    },
  };
}

module.exports = {
  createOrderReadRepository,
};
