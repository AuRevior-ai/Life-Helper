function createReviewRepository(db) {
  const reviews = db.collection('reviews')

  return {
    async findByOrderId(orderId) {
      const result = await reviews.where({ order_id: orderId }).limit(1).get()
      return result.data[0] || null
    },

    async findByWorkerId(workerId) {
      const result = await reviews
        .where({ worker_id: workerId })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    },

    async create(data) {
      const result = await reviews.add({ data })
      return {
        ...data,
        _id: result._id
      }
    }
  }
}

module.exports = {
  createReviewRepository
}
