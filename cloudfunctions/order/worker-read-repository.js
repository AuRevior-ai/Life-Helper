function createWorkerReadRepository(db) {
  const workers = db.collection('workers')

  return {
    async findByUserId(userId) {
      const result = await workers.where({ user_id: userId }).limit(1).get()
      return result.data[0] || null
    }
  }
}

module.exports = {
  createWorkerReadRepository
}
