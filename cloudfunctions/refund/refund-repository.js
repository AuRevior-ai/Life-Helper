function createRefundLogRepository(db) {
  const refundLogs = db.collection('refund_logs')

  return {
    async create(data) {
      const result = await refundLogs.add({ data })
      return {
        ...data,
        _id: result._id
      }
    },

    async findByAfterSaleId(afterSaleId) {
      const result = await refundLogs
        .where({ after_sale_id: afterSaleId })
        .orderBy('created_at', 'desc')
        .get()
      return result.data || []
    }
  }
}

module.exports = {
  createRefundLogRepository
}
