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
      const reviewData = {
        _id: data.order_id,
        ...data
      }

      try {
        const result = await reviews.add({ data: reviewData })
        return {
          ...reviewData,
          _id: result._id || reviewData._id
        }
      } catch (error) {
        if (/duplicate|exist|already/i.test(error.message || '')) {
          return null
        }
        throw error
      }
    },

    async deleteById(id) {
      await reviews.doc(id).remove()
      return true
    }
  }
}

module.exports = {
  createReviewRepository
}
