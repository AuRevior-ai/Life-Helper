function createWorkerRepository(db) {
  const workers = db.collection('workers')

  return {
    async findByUserId(userId) {
      const result = await workers.where({ user_id: userId }).limit(1).get()
      return result.data[0] || null
    },

    async findById(id) {
      try {
        const result = await workers.doc(id).get()
        return result.data || null
      } catch (error) {
        return null
      }
    },

    async findByAuditStatus(status) {
      const result = await workers
        .where({ audit_status: status })
        .orderBy('updated_at', 'desc')
        .get()
      return result.data || []
    },

    async create(data) {
      const result = await workers.add({ data })
      return {
        ...data,
        _id: result._id
      }
    },

    async updateById(id, data) {
      await workers.doc(id).update({ data })
      const result = await workers.doc(id).get()
      return result.data || null
    }
  }
}

module.exports = {
  createWorkerRepository
}
