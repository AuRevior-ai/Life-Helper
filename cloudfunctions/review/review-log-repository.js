function createReviewActionLogRepository(db) {
  const logs = db.collection('review_action_logs')

  return {
    async create(data) {
      const result = await logs.add({ data })
      return { ...data, _id: result._id }
    },

    async findByReviewId(reviewId) {
      const result = await logs
        .where({ review_id: reviewId })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    }
  }
}

module.exports = {
  createReviewActionLogRepository
}
