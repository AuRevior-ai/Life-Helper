function createWorkerRepository(db) {
  const workers = db.collection('workers')

  return {
    async findAll() {
      const result = await workers.get()
      return result.data || []
    },

    async findById(id) {
      try {
        const result = await workers.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    }
  }
}

module.exports = {
  createWorkerRepository
}
