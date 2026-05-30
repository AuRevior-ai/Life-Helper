function createReviewReadRepository(db) {
  const reviews = db.collection('reviews')

  return {
    async findByWorkerId(workerId) {
      const result = await reviews
        .where({ worker_id: workerId })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    }
  }
}

module.exports = {
  createReviewReadRepository
}
