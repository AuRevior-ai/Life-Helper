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

function createReviewRepository(db) {
  const reviews = db.collection("reviews");

  return {
    async findByOrderId(orderId) {
      const result = await reviews.where({ order_id: orderId }).limit(1).get();
      return result.data[0] || null;
    },

    async findById(id) {
      try {
        const result = await reviews.doc(id).get();
        return result.data || null;
      } catch (error) {
        return null;
      }
    },

    async findByWorkerId(workerId) {
      const result = await reviews
        .where({ worker_id: workerId })
        .orderBy("created_at", "desc")
        .get();
      return result.data || [];
    },

    async findAll() {
      const result = await reviews.orderBy("created_at", "desc").get();
      return result.data || [];
    },

    async queryPage(filters = {}, pageInfo = {}) {
      const where = {};
      if (filters.worker_id) where.worker_id = filters.worker_id;
      if (filters.status) where.status = filters.status;
      if (filters.rating_level) where.rating_level = filters.rating_level;
      if (filters.bad_only && !where.rating_level) {
        where.rating_level = "bad";
      }
      return queryCollectionPage(reviews, where, pageInfo);
    },

    async updateById(id, data) {
      await reviews.doc(id).update({ data });
      const result = await reviews.doc(id).get();
      return result.data || null;
    },

    async create(data) {
      const reviewData = {
        _id: data.order_id,
        ...data,
      };

      try {
        const result = await reviews.add({ data: reviewData });
        return {
          ...reviewData,
          _id: result._id || reviewData._id,
        };
      } catch (error) {
        if (/duplicate|exist|already/i.test(error.message || "")) {
          return null;
        }
        throw error;
      }
    },

    async deleteById(id) {
      await reviews.doc(id).remove();
      return true;
    },
  };
}

module.exports = {
  createReviewRepository,
};
