function createReviewRepository(db) {
  const reviews = db.collection('reviews')

  return {
    async findByOrderId(orderId) {
      const result = await reviews.where({ order_id: orderId }).limit(1).get()
      return result.data[0] || null
    },

    async findById(id) {
      try {
        const result = await reviews.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },

    async findByWorkerId(workerId) {
      const result = await reviews
        .where({ worker_id: workerId })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    },

    async findAll() {
      const result = await reviews.orderBy('created_at', 'desc').get()
      return result.data || []
    },

    async updateById(id, data) {
      await reviews.doc(id).update({ data })
      const result = await reviews.doc(id).get()
      return result.data || null
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
