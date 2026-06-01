function createReviewAppealRepository(db) {
  const appeals = db.collection('review_appeals')

  return {
    async create(data) {
      const result = await appeals.add({ data })
      return { ...data, _id: result._id }
    },

    async findById(id) {
      try {
        const result = await appeals.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },

    async findAll() {
      const result = await appeals.orderBy('created_at', 'desc').get()
      return result.data || []
    },

    async findByReviewId(reviewId) {
      const result = await appeals
        .where({ review_id: reviewId })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    },

    async findByWorkerId(workerId) {
      const result = await appeals
        .where({ worker_id: workerId })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    },

    async findPendingByReviewId(reviewId) {
      const result = await appeals
        .where({ review_id: reviewId, status: 'pending' })
        .limit(1)
        .get()
      return result.data && result.data[0] ? result.data[0] : null
    },

    async updateById(id, data) {
      await appeals.doc(id).update({ data })
      const result = await appeals.doc(id).get()
      return result.data || null
    }
  }
}

module.exports = {
  createReviewAppealRepository
}
