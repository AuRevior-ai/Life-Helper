function createAdminLogRepository(db) {
  const logs = db.collection('admin_operation_logs')

  return {
    async create(data) {
      const result = await logs.add({ data })
      return { ...data, _id: result._id }
    }
  }
}

module.exports = {
  createAdminLogRepository
}
