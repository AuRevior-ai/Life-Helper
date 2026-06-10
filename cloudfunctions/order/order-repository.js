function createOrderRepository(db) {
  const orders = db.collection("orders");

  return {
    async queryPage(filters = {}, pageInfo = {}) {
      const page = Number(pageInfo.page || 1);
      const pageSize = Number(pageInfo.pageSize || 20);
      const where = Object.keys(filters).reduce((result, key) => {
        if (filters[key]) result[key] = filters[key];
        return result;
      }, {});
      const query =
        Object.keys(where).length > 0 ? orders.where(where) : orders;
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
    },

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
