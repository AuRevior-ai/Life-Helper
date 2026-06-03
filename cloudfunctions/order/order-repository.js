function createOrderRepository(db) {
  const orders = db.collection("orders");

  return {
    async findByUserId(userId) {
      const result = await orders
        .where({ user_id: userId })
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

    async findById(id) {
      try {
        const result = await orders.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },

    async create(data) {
      const result = await orders.add({ data });
      return {
        ...data,
        _id: result._id,
      };
    },

    async updateById(id, data) {
      await orders.doc(id).update({ data });
      const result = await orders.doc(id).get();
      return result.data || null;
    },

    async acceptPendingOrder(id, workerId, data) {
      const result = await orders
        .where({
          _id: id,
          status: "pending_accept",
          worker_id: "",
        })
        .update({
          data: {
            ...data,
            worker_id: workerId,
          },
        });

      if (!result.stats || result.stats.updated !== 1) {
        return null;
      }

      return this.findById(id);
    },
  };
}

function createAddressReadRepository(db) {
  const addresses = db.collection("addresses");

  return {
    async findById(id) {
      try {
        const result = await addresses.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },
  };
}

module.exports = {
  createOrderRepository,
  createAddressReadRepository,
};
