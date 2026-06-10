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

function createAfterSaleRepository(db) {
  const afterSales = db.collection("after_sales");

  return {
    async create(data) {
      const result = await afterSales.add({ data });
      return {
        ...data,
        _id: result._id,
      };
    },

    async findById(id) {
      try {
        const result = await afterSales.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },

    async findActiveByOrderId(orderId) {
      const result = await afterSales
        .where({
          order_id: orderId,
          status: db.command.in(["pending", "approved"]),
        })
        .limit(1)
        .get();
      return result.data[0] || null;
    },

    async findByUserId(userId) {
      const result = await afterSales
        .where({ user_id: userId })
        .orderBy("created_at", "desc")
        .get();
      return result.data || [];
    },

    async findAll() {
      const result = await afterSales.orderBy("created_at", "desc").get();
      return result.data || [];
    },

    async queryPage(filters = {}, pageInfo = {}) {
      const where = {};
      if (filters.user_id) where.user_id = filters.user_id;
      if (filters.status) where.status = filters.status;
      if (filters.order_id) where.order_id = filters.order_id;
      return queryCollectionPage(afterSales, where, pageInfo);
    },

    async updateById(id, data) {
      await afterSales.doc(id).update({ data });
      return this.findById(id);
    },
  };
}

module.exports = {
  createAfterSaleRepository,
};
