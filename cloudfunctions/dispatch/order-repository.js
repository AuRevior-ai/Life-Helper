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

    async acceptPendingOrder(id, workerId, data) {
      const dbCommand = db.command;
      const result = await orders
        .where({
          _id: id,
          status: "pending_accept",
          worker_id: dbCommand.in(["", null]),
        })
        .update({
          data: {
            ...data,
            worker_id: workerId,
          },
        });
      if (!result.stats || result.stats.updated === 0) return null;
      const orderResult = await orders.doc(id).get();
      return orderResult.data || null;
    },
  };
}

module.exports = {
  createOrderRepository,
};
